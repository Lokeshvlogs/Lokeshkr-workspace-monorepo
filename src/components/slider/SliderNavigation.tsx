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
      <button onClick={onBack} disabled={step === 0}>
        Back
      </button>

      {step === total - 1 ? (
        <button onClick={onSubmit}>Submit</button>
      ) : (
        <button onClick={onNext}>Next</button>
      )}
    </div>
  );
}
