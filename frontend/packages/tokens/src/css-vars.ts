/** Canonical CSS custom property names for the embed widget theme layer. */
export const cssVars = {
  colorPrimary: '--nc-color-primary',
  colorSurface: '--nc-color-surface',
  colorText: '--nc-color-text',
  fontFamily: '--nc-font-family',
  fontSizeBase: '--nc-font-size-base',
  spacingMd: '--nc-spacing-md',
  radiusMd: '--nc-radius-md',
  maxWidth: '--nc-max-width',
} as const;

export type CssVarName = (typeof cssVars)[keyof typeof cssVars];
