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
  /** Whole days left in the paid year or trial; null once it has lapsed. */
  daysRemaining: number | null;
  /** True inside the renewal notice window before the year ends, or during trial. */
  expiringSoon: boolean;
  /** paid | trial | admin when entitled */
  accessSource?: string | null;
  /** True while the 30-day free trial is active. */
  isTrial?: boolean;
  subscription: CurrentSubscription | null;
};

export type CheckoutSession = {
  orderId: string;
  amount: number;
  currency: string;
  /** @deprecated Orders checkout — kept for older clients */
  subscriptionId?: string;
};

export type VerifySubscriptionInput = {
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  razorpaySignature: string;
};
