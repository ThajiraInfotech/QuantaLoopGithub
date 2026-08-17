export type SubscriptionStatus =
  | "active"
  | "pending"
  | "cancelled"
  | "halted"
  | "created"
  | "authenticated"
  | "paused"
  | "completed"
  | "expired"
  | (string & {});

export type SubscriptionPlan = {
  code: string;
  name: string;
  description?: string;
  amountInr: number;
  interval: string;
  intervalCount: number;
};

export type SubscriptionCatalog = {
  publicKey: string;
  plans: SubscriptionPlan[];
};

export type CurrentSubscription = {
  id: string;
  planCode: string;
  planName?: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtCycleEnd: boolean;
  razorpaySubscriptionId?: string;
};

export type SubscriptionAccessState = {
  entitled: boolean;
  status?: string;
  reason?: string;
  expiresAt?: string;
  currentEndAt?: string;
  /** Whole days left in the paid year; null once it has lapsed. */
  daysRemaining: number | null;
  /** True inside the renewal notice window before the year ends. */
  expiringSoon: boolean;
  subscription: CurrentSubscription | null;
};

export type CheckoutSession = {
  subscriptionId: string;
};

export type VerifySubscriptionInput = {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
};
