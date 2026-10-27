// An order row is created as 'pending' before the customer pays, so the
// Razorpay payment can be matched back to it. A successful payment moves it
// to 'paid' (checkout verification or webhook), a failed one to 'failed', and
// an abandoned checkout stays 'pending'.
//
// Only these statuses are real, paid orders. Filter by them anywhere orders
// are listed, counted, exported or shown to customers. ('packed' is a legacy
// alias of 'processing'.)
export const PAID_ORDER_STATUSES: string[] = [
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
];
