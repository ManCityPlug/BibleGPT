import { Router } from "express";
import { prisma } from "../lib/prisma";
import { stripe, PRICES, TRIAL_PERIOD_DAYS } from "../lib/stripe";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/subscription
router.get("/api/subscription", requireAuth, async (req, res) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId: req.user!.id },
    select: { status: true, trialEndsAt: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
  res.json(sub ?? { status: null, trialEndsAt: null, currentPeriodEnd: null });
});

// POST /api/subscription — create subscription with Stripe
router.post("/api/subscription", requireAuth, async (req, res) => {
  const { priceId } = req.body as { priceId: string };
  if (!priceId || (priceId !== PRICES.monthly && priceId !== PRICES.yearly)) {
    res.status(400).json({ error: "Invalid priceId" }); return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let sub = await prisma.subscription.findUnique({ where: { userId: user.id } });

  // Create or retrieve Stripe customer
  let customerId = sub?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  // Create a SetupIntent for collecting payment method, then create subscription
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { userId: user.id, priceId },
  });

  // Create subscription with trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: TRIAL_PERIOD_DAYS,
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });

  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      trialEndsAt,
    },
    create: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      trialEndsAt,
    },
  });

  res.json({
    setupIntentClientSecret: setupIntent.client_secret,
    customerId,
    subscriptionId: subscription.id,
  });
});

// DELETE /api/subscription — cancel at period end
router.delete("/api/subscription", requireAuth, async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
  if (!sub?.stripeSubscriptionId) {
    res.status(404).json({ error: "No active subscription" }); return;
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { userId: req.user!.id },
    data: { cancelAtPeriodEnd: true },
  });

  res.json({ success: true });
});

export default router;
