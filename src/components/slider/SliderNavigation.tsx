interface Props {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function SliderNavigation({
  step,
  total,
  onNext,
  onBack,
  onSubmit,
}: Props): JSX.Element {
  return (
    <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
      <button
        onClick={onBack}
        disabled={step === 0}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-pink-200 text-pink-700 hover:bg-pink-50 disabled:opacity-50"
        aria-label="Back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="sr-only">Back</span>
      </button>

      {step === total - 1 ? (
        <button onClick={onSubmit}>Submit</button>
      ) : (
        <button onClick={onNext}>Continue</button>
      )}
    </div>
  );
}
