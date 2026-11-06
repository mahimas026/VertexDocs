import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Crown, X } from "lucide-react";
import "./PremiumPlansModal.css";

interface PremiumPlansModalProps {
  onClose: () => void;
}

const premiumFeatures = [
  "Document Upload",
  "PDF Studio",
  "File Conversion",
  "File Compression",
  "Language Bridge",
  "AI Documents",
  "Document Templates",
  "Cloud Storage",
];

const closeAnimationDuration = 180;

export default function PremiumPlansModal({
  onClose,
}: PremiumPlansModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;

    closingRef.current = true;
    setIsClosing(true);
    closeTimer.current = setTimeout(onClose, closeAnimationDuration);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, [handleClose]);

  return (
    <div
      className={`premium-modal-overlay${isClosing ? " is-closing" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        className="premium-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-modal-title"
        aria-describedby="premium-modal-description"
      >
        <button
          ref={closeButtonRef}
          className="premium-modal-close"
          type="button"
          aria-label="Close premium plans"
          onClick={handleClose}
        >
          <X size={20} />
        </button>

        <header className="premium-modal-header">
          <div className="premium-modal-crown">
            <Crown size={28} />
          </div>
          <p className="premium-eyebrow">MORE FROM VERTEX DOCS</p>
          <h2 id="premium-modal-title">Vertex Premium</h2>
          <p id="premium-modal-description">
            Unlock advanced document productivity and exclusive premium
            features. Explore the upcoming plans below.
          </p>
        </header>

        <p className="premium-demo-notice">
          Premium access and billing are not configured yet. This is a
          demonstration preview.
        </p>

        <section className="premium-comparison" aria-labelledby="premium-features-title">
          <h3 id="premium-features-title">Compare access</h3>
          <div className="premium-table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Features</th>
                  <th scope="col">Free</th>
                  <th scope="col">Premium</th>
                </tr>
              </thead>
              <tbody>
                {premiumFeatures.map((feature) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td>
                      <span className="premium-access-label">
                        <Check size={15} aria-hidden="true" />
                        Current
                      </span>
                    </td>
                    <td>
                      <span className="premium-coming-label">
                        <Clock3 size={15} aria-hidden="true" />
                        Coming soon
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="premium-plans" aria-labelledby="premium-plans-title">
          <h3 id="premium-plans-title">Subscription plans</h3>
          <div className="premium-plan-grid">
            {["Monthly Plan", "Yearly Plan"].map((plan) => (
              <article className="premium-plan-card" key={plan}>
                <h4>{plan}</h4>
                <p className="premium-plan-price">Pricing not configured</p>
                <p className="premium-plan-caption">
                  {plan === "Monthly Plan"
                    ? "Monthly billing option"
                    : "Annual billing option"}
                </p>
                <button
                  type="button"
                  className="premium-upgrade-button"
                  onClick={() =>
                    setCheckoutMessage(
                      "Checkout isn't connected yet. No payment or subscription was started.",
                    )
                  }
                >
                  Upgrade to Premium
                </button>
              </article>
            ))}
          </div>
          {checkoutMessage && (
            <p className="premium-checkout-message" role="status">
              {checkoutMessage}
            </p>
          )}
        </section>
      </section>
    </div>
  );
}
