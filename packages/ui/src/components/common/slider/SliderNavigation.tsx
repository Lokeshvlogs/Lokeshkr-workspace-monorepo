import { ReactElement } from "react";

interface Props {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  nextEnabled?: boolean;
  submitEnabled?: boolean;
  /** Disables the controls while a step is being persisted. */
  busy?: boolean;
  /** Text shown on the action button while busy. */
  busyLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
}

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function SliderNavigation({
  step,
  total,
  onNext,
  onBack,
  onSubmit,
  nextEnabled = true,
  submitEnabled = true,
  busy = false,
  busyLabel = "Saving…",
  nextLabel = "Continue",
  submitLabel = "Finish",
}: Props): ReactElement {
  const isLast = step === total - 1;

  return (
    <div className="wiz-nav">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0 || busy}
        className="wiz-btn wiz-btn-ghost"
      >
        <ChevronLeft />
        Back
      </button>

      <span className="wiz-nav-count" aria-live="polite">
        Step {step + 1} of {total}
      </span>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!submitEnabled || busy}
          className="wiz-btn wiz-btn-primary"
        >
          {busy ? busyLabel : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!nextEnabled || busy}
          className="wiz-btn wiz-btn-primary"
        >
          {busy ? busyLabel : nextLabel}
          {!busy && <ChevronRight />}
        </button>
      )}
    </div>
  );
}
