'use client';

import { M3eFormField } from '@m3e/react/form-field';
import { M3eCheckbox } from '@m3e/react/checkbox';
import { M3eSwitch } from '@m3e/react/switch';
import { M3eRadio, M3eRadioGroup } from '@m3e/react/radio-group';
import { M3eSelect } from '@m3e/react/select';
import { M3eOption } from '@m3e/react/option';
import { M3eSlider, M3eSliderThumb } from '@m3e/react/slider';
import { useEffect, useEffectEvent, useId, useRef, useState, type ComponentProps, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './actions';

// M3E's label mixin applies these styles when the element upgrades, before React hydrates.
const labelStyle = { userSelect: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' } as const;

function useFormReset<T extends HTMLElement>(ref: RefObject<T | null>, restore: (control: T) => void) {
  const restoreValue = useEffectEvent(restore);
  useEffect(() => {
    const control = ref.current;
    const form = control?.closest('form');
    if (!control || !form) return;
    const reset = (event: Event) => {
      // Native form-associated elements reset after the event. Then reconcile React state.
      queueMicrotask(() => { if (!event.defaultPrevented && control.isConnected) restoreValue(control); });
    };
    form.addEventListener('reset', reset);
    return () => { form.removeEventListener('reset', reset); };
  }, [ref]);
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  variant?: 'outlined' | 'filled';
  className?: string;
  tone?: 'primary' | 'secondary' | 'tertiary';
}

function Field({ id, label, hint, error, variant = 'outlined', className, tone = 'primary', children, nativeLabel = true }: FieldProps & { id: string; children: ReactNode; nativeLabel?: boolean }) {
  const ref = useRef<ComponentRef<typeof M3eFormField>>(null);
  useFormReset(ref, control => { if (error) control.notifyControlStateChange(true); });
  return <div data-tone={tone} className={cn('docs-mdx-field not-prose', className)}>
    <M3eFormField ref={ref} variant={variant} error={Boolean(error)} hideSubscript={error ? 'never' : 'always'}>
      {nativeLabel ? <label slot="label" htmlFor={id} style={labelStyle}>{label}</label> : <span slot="label" id={`${id}-label`}>{label}</span>}
      {children}
      {error && <span slot="error">{error}</span>}
    </M3eFormField>
    {/* Own the hint association so SSR and hydration use the same stable ID. */}
    {hint && !error && <p className="docs-mdx-field-hint" id={`${id}-hint`}>{hint}</p>}
  </div>;
}

export function TextField({ label, hint, error, variant, className, tone, id: suppliedId, onValueChange, onChange, ...props }: Omit<ComponentProps<'input'>, 'size'> & FieldProps & { onValueChange?: (value: string) => void }) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return <Field {...{ id, label, hint, error, variant, className, tone }}>
    <input type="text" {...props} id={id} aria-describedby={hint && !error ? `${id}-hint` : props['aria-describedby']} onChange={event => { onChange?.(event); onValueChange?.(event.target.value); }} />
  </Field>;
}

export function TextArea({ label, hint, error, variant, className, tone, id: suppliedId, onValueChange, onChange, ...props }: ComponentProps<'textarea'> & FieldProps & { onValueChange?: (value: string) => void }) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return <Field {...{ id, label, hint, error, variant, className, tone }}>
    <textarea rows={3} {...props} id={id} aria-describedby={hint && !error ? `${id}-hint` : props['aria-describedby']} onChange={event => { onChange?.(event); onValueChange?.(event.target.value); }} />
  </Field>;
}

interface ToggleProps {
  label: string;
  description?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ label, description, checked, defaultChecked = false, onCheckedChange, ...props }: ToggleProps & { required?: boolean; indeterminate?: boolean }) {
  const [local, setLocal] = useState(defaultChecked);
  const ref = useRef<ComponentRef<typeof M3eCheckbox>>(null);
  useFormReset(ref, control => { setLocal(defaultChecked); control.checked = checked ?? defaultChecked; control.indeterminate = props.indeterminate ?? false; });
  const id = useId();
  return <label className="docs-mdx-check-row not-prose" style={labelStyle}>
    <M3eCheckbox {...props} ref={ref} checked={checked ?? local} aria-label={label} aria-describedby={description ? id : undefined} onChange={event => {
      const control = event.currentTarget as ComponentRef<typeof M3eCheckbox>;
      const next = control.checked;
      if (checked === undefined) setLocal(next); else control.checked = checked;
      onCheckedChange?.(next);
    }} />
    <span><span>{label}</span>{description && <span id={id} className="docs-mdx-control-description">{description}</span>}</span>
  </label>;
}

export function Switch({ label, description, checked, defaultChecked = false, onCheckedChange, ...props }: ToggleProps) {
  const [local, setLocal] = useState(defaultChecked);
  const ref = useRef<ComponentRef<typeof M3eSwitch>>(null);
  useFormReset(ref, control => { setLocal(defaultChecked); control.checked = checked ?? defaultChecked; });
  const id = useId();
  return <label className="docs-mdx-check-row not-prose" style={labelStyle}>
    <M3eSwitch {...props} ref={ref} checked={checked ?? local} icons="selected" aria-label={label} aria-describedby={description ? id : undefined} onChange={event => {
      const control = event.currentTarget as ComponentRef<typeof M3eSwitch>;
      const next = control.checked;
      if (checked === undefined) setLocal(next); else control.checked = checked;
      onCheckedChange?.(next);
    }} />
    <span><span>{label}</span>{description && <span id={id} className="docs-mdx-control-description">{description}</span>}</span>
  </label>;
}

export interface ChoiceOption { value: string; label: string; disabled?: boolean }
interface ChoiceProps {
  label: string;
  options: readonly ChoiceOption[];
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
}

export function RadioGroup({ label, options, value, defaultValue = '', onValueChange, ...props }: ChoiceProps) {
  const [local, setLocal] = useState(defaultValue);
  const ref = useRef<ComponentRef<typeof M3eRadioGroup>>(null);
  useFormReset(ref, control => { setLocal(defaultValue); control.radios.forEach(radio => { radio.checked = radio.value === (value ?? defaultValue); }); });
  const id = useId();
  const current = value ?? local;
  return <div className="docs-mdx-radio-field not-prose">
    <p id={id} className="docs-mdx-field-label">{label}</p>
    <M3eRadioGroup {...props} ref={ref} aria-labelledby={id} onChange={event => {
      const control = event.currentTarget as ComponentRef<typeof M3eRadioGroup>;
      const next = control.value ?? '';
      if (value === undefined) setLocal(next); else control.radios.forEach(radio => { radio.checked = radio.value === value; });
      onValueChange?.(next);
    }}>
      {options.map(option => <label key={option.value} className="docs-mdx-check-row" style={labelStyle}><M3eRadio value={option.value} checked={current === option.value} disabled={props.disabled || option.disabled} aria-label={option.label} /><span>{option.label}</span></label>)}
    </M3eRadioGroup>
  </div>;
}

export function Select({ label, options, hint, error, variant, className, tone = 'primary', value, defaultValue = '', onValueChange, ...props }: ChoiceProps & FieldProps) {
  const [local, setLocal] = useState(defaultValue);
  const ref = useRef<ComponentRef<typeof M3eSelect>>(null);
  useFormReset(ref, control => { setLocal(defaultValue); control.value = value ?? defaultValue; });
  const id = useId();
  return <Field {...{ id, label, hint, error, variant, tone }} className={cn('docs-select-field', className)} nativeLabel={false}>
    <M3eSelect {...props} ref={ref} id={id} value={value ?? local} aria-labelledby={`${id}-label`} aria-describedby={hint && !error ? `${id}-hint` : undefined} onChange={event => {
      const control = event.currentTarget as ComponentRef<typeof M3eSelect>;
      const next = typeof control.value === 'string' ? control.value : '';
      if (value === undefined) setLocal(next); else control.value = value;
      onValueChange?.(next);
    }}>
      <Icon name="ChevronDown" slot="arrow" />
      {options.map(option => <M3eOption key={option.value} value={option.value} disabled={option.disabled}>{option.label}</M3eOption>)}
    </M3eSelect>
  </Field>;
}

export function Slider({ label, name, value, defaultValue = 0, min = 0, max = 100, step = 1, disabled, onValueChange }: { label: string; name?: string; value?: number; defaultValue?: number; min?: number; max?: number; step?: number; disabled?: boolean; onValueChange?: (value: number) => void }) {
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) && max >= lower ? max : lower + 100;
  const clamp = (amount: number) => Math.max(lower, Math.min(upper, Number.isFinite(amount) ? amount : lower));
  const [local, setLocal] = useState(defaultValue);
  const ref = useRef<ComponentRef<typeof M3eSliderThumb>>(null);
  useFormReset(ref, control => { setLocal(defaultValue); control.value = clamp(value ?? defaultValue); });
  const current = clamp(value ?? local);
  const id = useId();
  return <div className="docs-mdx-slider not-prose">
    <div className="docs-mdx-progress-label"><span id={id}>{label}</span><output aria-hidden="true">{current}</output></div>
    <M3eSlider size="small" min={lower} max={upper} step={Number.isFinite(step) && step > 0 ? step : 1} disabled={disabled} labelled>
      <M3eSliderThumb ref={ref} name={name} value={current} aria-labelledby={id} onInput={event => {
        const control = event.currentTarget as ComponentRef<typeof M3eSliderThumb>;
        const next = control.value ?? min;
        if (value === undefined) setLocal(next); else control.value = current;
        onValueChange?.(next);
      }} />
    </M3eSlider>
  </div>;
}
