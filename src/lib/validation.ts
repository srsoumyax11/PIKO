import type { PrintSettings } from "./layoutEngine";

export const LAYOUT_CONSTRAINTS = {
  marginMm: { min: 0, max: 50 },
  gapMm: { min: 0, max: 50 },
  borderMm: { min: 0, max: 10 },
  printCopies: { min: 0, max: 100 },
};

export function validatePrintSettings(settings: Partial<PrintSettings>): PrintSettings | null {
  const validated: any = {};

  for (const key of Object.keys(settings)) {
    const value = (settings as any)[key];
    const constraint = (LAYOUT_CONSTRAINTS as any)[key];

    if (constraint && typeof value === 'number') {
      if (!Number.isFinite(value) || value < constraint.min || value > constraint.max) {
        console.error(`Invalid value for ${key}: ${value}. Expected range: [${constraint.min}, ${constraint.max}]`);
        return null;
      }
      validated[key] = value;
    } else {
      validated[key] = value;
    }
  }

  return validated as PrintSettings;
}
