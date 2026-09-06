"use client";

import { useState, useEffect, useRef, ReactNode, ReactElement } from "react";
import SliderNavigation from "./SliderNavigation";

interface HorizontalFormSliderProps {
  steps: ReactNode[];          // forms / sections
  onSubmit: () => Promise<void> | void;
  /** Fixed pixel width. Omit for a fluid slider that fills its container. */
  width?: number;
  /** Text shown on the action button while a step is being persisted. */
  busyLabel?: string;
  /** Rendered between the step content and the navigation row - the natural
   *  place for a save status, so it sits with the button that triggered it. */
  statusSlot?: ReactNode;
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
  statusSlot,
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

  /**
   * The viewport takes its height from the step being shown, not from the
   * tallest one.
   *
   * All the steps sit side by side in one flex row so they can slide, which
   * normally means the row - and therefore the viewport - is as tall as the
   * longest step. A short step then renders with a screenful of dead space
   * under it. Measuring the active step and setting an explicit height on the
   * clipping viewport lets the container follow the content instead.
   *
   * The observer matters as much as the initial measurement: steps grow and
   * shrink while you are on them (adding an education entry, a conditional
   * field appearing), and a fixed height taken once would clip the new content.
   */
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = stepRefs.current[step];
    if (!el) return;

    const measure = () => setViewportHeight(el.offsetHeight);
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [step, steps]);

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
    /* Only the track wrapper below clips and animates on height; this outer
       element owns width alone, so the nav row that follows is never inside
       the clipped box (it previously was, and Back / step count / Continue
       were invisible on any step shorter than the tallest one). */
    <div style={width ? { width } : { width: "100%" }}>
      <div
        className="hfs-viewport"
        /* Height is undefined until the first measurement lands, so the initial
           paint is auto-height rather than zero. `auto` is not interpolable, so
           that first jump to a pixel height is instant - only step-to-step
           changes animate, which is what we want. */
        style={{ height: viewportHeight }}
      >
        {/* Sliding container */}
        <div
          className="hfs-track"
          style={{
            width: `${totalSteps * 100}%`,
            transform: `translateX(-${step * (100 / totalSteps)}%)`,
          }}
        >
          {steps.map((content, index) => (
            <div
              key={index}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              /* The viewport is overflow:hidden so the track can slide; the
                 padding keeps focus rings and shadows on the outermost fields off
                 that edge. */
              style={{
                ...(width ? { width } : { width: `${100 / totalSteps}%` }),
                padding: "6px 4px",
              }}
              aria-hidden={index !== step}
              /* Off-screen steps are clipped out of view, but their inputs stayed
                 in the tab order - so tabbing off the last field jumped into a
                 step nobody could see. */
              inert={index !== step}
            >
              {content}
            </div>
          ))}
        </div>
      </div>

      {statusSlot}

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
