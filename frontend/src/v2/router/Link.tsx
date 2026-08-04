/**
 * Link — mode-aware anchor component (#289)
 *
 * Renders an <a> tag whose href is prefixed with installBase[/orgSlug] based
 * on the current tenant_resolution_mode.  Intercepts clicks to use pushState
 * instead of a full navigation.
 */
import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useRouter } from './Router';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Internal route, must start with '/', e.g. '/dashboard' */
  to: string;
}

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { mode, orgSlug, installBase, navigate } = useRouter();

  const normalized = to.startsWith('/') ? to : '/' + to;
  const href =
    mode === 'path'
      ? installBase + '/admin/' + orgSlug + normalized
      : installBase + '/admin' + normalized;

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Allow modifier-key clicks to open in new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
    onClick?.(e);
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
