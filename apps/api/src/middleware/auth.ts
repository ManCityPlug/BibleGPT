import { Request, Response, NextFunction } from "express";
import { getUserFromRequest } from "../lib/supabase";
import { prisma } from "../lib/prisma";

// Extend Express Request to carry the authed user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      subscription?: { status: string } | null;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = user;
  next();
}

export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: req.user.id },
    select: { status: true },
  });

  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) {
    res.status(403).json({ error: "Active subscription required" });
    return;
  }

  req.subscription = sub;
  next();
}
