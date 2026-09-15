/** Shared payment-method icon — replaces the 💳 emoji on the payment-stripe step's
 *  collected-method summary row (`.fk-loc-ic`). */
export function PaymentCardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.4" y="6" width="17.2" height="12" rx="2.2" />
      <path d="M3.4 10.4h17.2" />
    </svg>
  )
}
