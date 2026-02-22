import { Router, Request, Response } from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import Stripe from "stripe";

const router = Router();

/**
 * POST /api/webhooks/stripe
 * Must receive raw body — configured in index.ts before json middleware
 */
router.post(
  "/api/webhooks/stripe",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const object = event.data.object as Stripe.Subscription | Stripe.Invoice;

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const dbSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: sub.status,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const stripeSub = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: "active",
            currentPeriodEnd: stripeSub.current_period_end
              ? new Date(stripeSub.current_period_end * 1000)
              : null,
          },
        });

        // Reward referrer when trial converts to paid
        const referral = await prisma.referral.findUnique({
          where: { refereeId: dbSub.userId },
        });
        if (referral && !referral.rewardGiven) {
          await prisma.referral.update({
            where: { id: referral.id },
            data: { rewardGiven: true },
          });
          // TODO: credit referrer account / extend their plan
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: { status: "past_due" },
        });
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  }
);

export default router;
