'use client';

import { useState } from 'react';
import { Progress } from './content';
import { Slider, Switch } from './forms';

/** A working version of the controlled React example in the component guide. */
export function ProgressExample() {
  const [progress, setProgress] = useState(40);
  const [wavy, setWavy] = useState(true);
  return <div className="docs-component-preview not-prose">
    <Switch label="Expressive progress" checked={wavy} onCheckedChange={setWavy} />
    <Slider label="Progress" value={progress} onValueChange={setProgress} />
    <Progress label="Preview" value={progress} variant={wavy ? 'wavy' : 'flat'} />
  </div>;
}
