"use client";

import { useState, ReactNode, ReactElement } from "react";
import SliderNavigation from "./SliderNavigation";

interface HorizontalFormSliderProps {
  steps: ReactNode[];          // forms / sections
  onSubmit: () => Promise<void> | void;
  /** Fixed pixel width. Omit for a fluid slider that fills its container. */
  width?: number;
  /** Text shown on the action button while a step is being persisted. */
  busyLabel?: string;
  /** called with current step -> should return whether Next is enabled */
  canProceed?: (step: number) => boolean;
  /** called with current step -> should return whether Submit is enabled */
  canSubmit?: (step: number) => boolean;
  step?: number;
  setStep?: (step: number) => void;
  /** optional callback invoked before moving to next step - can be async.
   *  Throwing from it keeps the slider on the current step. */
  onNext?: (step: number) => Promise<void> | void;
}

export default function HorizontalFormSlider({
  steps,
  onSubmit,
  width,
  busyLabel,
  canProceed,
  canSubmit,
  step: controlledStep,
  setStep: controlledSetStep,
  onNext,
}: HorizontalFormSliderProps): ReactElement {
  const [internalStep, internalSetStep] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);
  const step = controlledStep !== undefined ? controlledStep : internalStep;
  const setStep = controlledSetStep || internalSetStep;
  const totalSteps = steps.length;

  async function next(): Promise<void> {
    setBusy(true);
    try {
      if (onNext) {
        await onNext(step);
      }
      if (step < totalSteps - 1) setStep(step + 1);
    } catch {
      // onNext rejected (e.g. the save failed) - stay put and let the caller
      // surface the reason.
    } finally {
      setBusy(false);
    }
  }

  function back(): void {
    if (step > 0) setStep(step - 1);
  }

  async function submit(): Promise<void> {
    setBusy(true);
    try {
      await onSubmit();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={width ? { width, overflow: "hidden" } : { width: "100%", overflow: "hidden" }}>
      {/* Sliding container */}
      <div
        style={{
          display: "flex",
          width: `${totalSteps * 100}%`,
          transform: `translateX(-${step * (100 / totalSteps)}%)`,
          transition: "transform 0.4s ease",
        }}
      >
        {steps.map((content, index) => (
          <div
            key={index}
            style={width ? { width } : { width: `${100 / totalSteps}%` }}
            aria-hidden={index !== step}
          >
            {content}
          </div>
        ))}
      </div>

      <SliderNavigation
        step={step}
        total={totalSteps}
        onNext={next}
        onBack={back}
        onSubmit={submit}
        busy={busy}
        busyLabel={busyLabel}
        nextEnabled={canProceed ? canProceed(step) : true}
        submitEnabled={canSubmit ? canSubmit(step) : (step === totalSteps - 1)}
      />
    </div>
  );
}
