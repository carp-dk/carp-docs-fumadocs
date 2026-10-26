'use client';

import { M3eStep, M3eStepPanel, M3eStepper, M3eStepperNext, M3eStepperPrevious, M3eStepperReset } from '@m3e/react/stepper';
import { Children, isValidElement, useEffect, useId, useRef, type ComponentRef, type ReactNode } from 'react';
import { Button } from './actions';

interface StepProps { title?: string; children: ReactNode; optional?: boolean; completed?: boolean }
export function Step({ title, children }: StepProps) { return <li className="docs-static-step"><div className="docs-mdx-body">{title && <h3>{title}</h3>}{children}</div></li>; }

export function Stepper({ children, label = 'Guide steps', defaultIndex = 0 }: { children: ReactNode; label?: string; defaultIndex?: number }) {
  const id = useId();
  const stepper = useRef<ComponentRef<typeof M3eStepper>>(null);
  const steps = Children.toArray(children).filter(isValidElement<StepProps>).filter(child => child.type === Step);
  const count = steps.length;

  useEffect(() => {
    let current = true;
    const element = stepper.current;
    if (!element) return;
    void (async () => {
      await element.updateComplete;
      await Promise.all([...element.querySelectorAll('m3e-step, m3e-step-panel')].map(child => (child as ComponentRef<typeof M3eStep>).updateComplete));
      if (current && count) element.moveTo(Math.max(0, Math.min(defaultIndex, count - 1)));
    })();
    return () => { current = false; };
  }, [defaultIndex, count]);

  return <M3eStepper ref={stepper} orientation="vertical" role="group" aria-label={label} className="docs-mdx-stepper not-prose">
    {/* The slotted hint replaces M3E's parenthesised "(Optional)" with a plain body-small hint. */}
    {steps.map((step, index) => <M3eStep key={`${id}-step-${index}`} id={`${id}-step-${index}`} slot="step" htmlFor={`${id}-panel-${index}`} optional={step.props.optional} completed={step.props.completed}>{step.props.title ?? `Step ${index + 1}`}{step.props.optional && <span slot="hint">Optional</span>}</M3eStep>)}
    {steps.map((step, index) => <M3eStepPanel key={`${id}-panel-${index}`} id={`${id}-panel-${index}`} aria-labelledby={`${id}-step-${index}`} slot="panel">
      <div className="docs-mdx-body prose m3-prose">{step.props.children}</div>
      <div slot="actions" className="docs-mdx-step-actions">
        {index > 0 && <Button><M3eStepperPrevious>Back</M3eStepperPrevious></Button>}
        {index < count - 1 ? <Button variant="filled"><M3eStepperNext>Continue</M3eStepperNext></Button> : <Button variant="tonal"><M3eStepperReset>Start again</M3eStepperReset></Button>}
      </div>
    </M3eStepPanel>)}
  </M3eStepper>;
}
