/** Canonical CSS custom property names for the embed widget theme layer. */
export const cssVars = {
  colorPrimary: '--nc-color-primary',
  colorSurface: '--nc-color-surface',
  colorText: '--nc-color-text',
  fontFamily: '--nc-font-family',
  fontSizeBase: '--nc-font-size-base',
  spacingMd: '--nc-spacing-md',
  radiusMd: '--nc-radius-md',
  radiusPanel: '--nc-radius-panel',
  radiusControl: '--nc-radius-control',
  heroGapAfter: '--nc-hero-gap-after',
  heroPaddingBottom: '--nc-hero-padding-bottom',
  maxWidth: '--nc-max-width',
  maxHeight: '--nc-max-height',
  offsetX: '--nc-offset-x',
  offsetY: '--nc-offset-y',
} as const;

export type CssVarName = (typeof cssVars)[keyof typeof cssVars];
