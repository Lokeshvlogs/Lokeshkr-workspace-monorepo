"use client";

import { useState, ReactNode, ReactElement } from "react";
import SliderNavigation from "./SliderNavigation";

interface HorizontalFormSliderProps {
  steps: ReactNode[];          // forms / sections
  onSubmit: () => Promise<void> | void;
  width?: number;              // optional customization
  height?: number;             // optional customization
  /** called with current step -> should return whether Next is enabled */
  canProceed?: (step: number) => boolean;
  /** called with current step -> should return whether Submit is enabled */
  canSubmit?: (step: number) => boolean;
  step?: number;
  setStep?: (step: number) => void;
  /** optional callback invoked before moving to next step - can be async */
  onNext?: (step: number) => Promise<void> | void;
}

export default function HorizontalFormSlider({
  steps,
  onSubmit,
  width = 700,
  height = 800,
  canProceed,
  canSubmit,
  step: controlledStep,
  setStep: controlledSetStep,
  onNext,
}: HorizontalFormSliderProps): ReactElement {
  const [internalStep, internalSetStep] = useState<number>(0);
  const step = controlledStep !== undefined ? controlledStep : internalStep;
  const setStep = controlledSetStep || internalSetStep;
  const totalSteps = steps.length;

  async function next(): Promise<void> {
    try {
      if (onNext) {
        await onNext(step);
      }
      if (step < totalSteps - 1) setStep(step + 1);
    } catch (err) {
      console.error('Failed to run onNext handler:', err);
      // swallow error so the UI can decide what to do - do not advance
    }
  }

  function back(): void {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div style={{ width, overflow: "hidden" }}>
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
          <div key={index} style={{ width }}>
            {content}
          </div>
        ))}
      </div>

      <SliderNavigation
        step={step}
        total={totalSteps}
        onNext={next}
        onBack={back}
        onSubmit={onSubmit}
        nextEnabled={canProceed ? canProceed(step) : true}
        submitEnabled={canSubmit ? canSubmit(step) : (step === totalSteps - 1)}
      />
    </div>
  );
}
