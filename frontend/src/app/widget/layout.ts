import { cssVars, nc } from '@/shared/config/widget-tokens';
import type { WidgetLayout, WidgetPosition } from '@/shared/api/types';
import { DEFAULT_WIDGET_LAYOUT } from '@/shared/api/types';

const POSITION_CLASSES: Record<WidgetPosition, string | null> = {
  inline: null,
  bottom_right: nc.widgetBottomRight,
  bottom_left: nc.widgetBottomLeft,
  top_right: nc.widgetTopRight,
  top_left: nc.widgetTopLeft,
};

const ALL_POSITION_CLASSES = Object.values(POSITION_CLASSES).filter(
  (value): value is string => value !== null,
);

export function isFixedLayout(layout: WidgetLayout): boolean {
  return layout.position !== 'inline';
}

export function applyWidgetLayout(root: HTMLElement, layout: WidgetLayout): void {
  root.style.setProperty(cssVars.maxHeight, layout.max_height);
  root.style.setProperty(cssVars.offsetX, `${layout.offset_x}px`);
  root.style.setProperty(cssVars.offsetY, `${layout.offset_y}px`);

  root.classList.remove(nc.widgetFixed, ...ALL_POSITION_CLASSES);

  if (!isFixedLayout(layout)) {
    return;
  }

  root.classList.add(nc.widgetFixed);

  const positionClass = POSITION_CLASSES[layout.position];

  if (positionClass !== null) {
    root.classList.add(positionClass);
  }
}

export function readPreviewLayoutFromSearchParams(): WidgetLayout | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const keys = ['layout_max_height', 'layout_position', 'layout_offset_x', 'layout_offset_y', 'layout_floating_launcher'] as const;
  const hasOverride = keys.some((key) => params.get(key) !== null);

  if (!hasOverride) {
    return null;
  }

  const position = params.get('layout_position');
  const normalizedPosition =
    position === 'inline' ||
    position === 'bottom_right' ||
    position === 'bottom_left' ||
    position === 'top_right' ||
    position === 'top_left'
      ? position
      : DEFAULT_WIDGET_LAYOUT.position;

  const offsetX = Number.parseInt(params.get('layout_offset_x') ?? String(DEFAULT_WIDGET_LAYOUT.offset_x), 10);
  const offsetY = Number.parseInt(params.get('layout_offset_y') ?? String(DEFAULT_WIDGET_LAYOUT.offset_y), 10);
  const floating = params.get('layout_floating_launcher');

  return {
    max_height: params.get('layout_max_height') ?? DEFAULT_WIDGET_LAYOUT.max_height,
    position: normalizedPosition,
    offset_x: Number.isFinite(offsetX) ? Math.max(0, Math.min(256, offsetX)) : DEFAULT_WIDGET_LAYOUT.offset_x,
    offset_y: Number.isFinite(offsetY) ? Math.max(0, Math.min(256, offsetY)) : DEFAULT_WIDGET_LAYOUT.offset_y,
    floating_launcher:
      floating === null ? DEFAULT_WIDGET_LAYOUT.floating_launcher : floating === '1' || floating === 'true',
  };
}
