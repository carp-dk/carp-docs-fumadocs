import { M3eButton } from '@m3e/react/button';
import { M3eIconButton } from '@m3e/react/icon-button';
import type { ComponentProps } from 'react';

// M3E switches a link button to role="link" only when href is an attribute, but React sets it
// as a property. Without this, a button role would wrap M3E's internal link. Pass role only
// for links: an undefined role would clear the button role M3E sets.
export const linkRole = (href?: string) => href ? { role: 'link' } : {};

export function Button(props: ComponentProps<typeof M3eButton>) {
  return <M3eButton size="small" shape="rounded" variant="text" type="button" {...linkRole(props.href)} {...props} />;
}

export function IconButton(props: ComponentProps<typeof M3eIconButton>) {
  return <M3eIconButton size="small" shape="rounded" variant="standard" type="button" {...linkRole(props.href)} {...props} />;
}
