import type { CaptionPosition } from "../types/photo";

// Change this single variable when you move to a custom domain!
// e.g. "https://my-custom-domain.com"
export const APP_DOMAIN = "https://piko-photo.vercel.app";

export const TABS = [
  { id: "Import",     icon: "⇪" },
  { id: "Background", icon: "⚗" },
  { id: "Crop",       icon: "◩" },
  { id: "Adjust",     icon: "◑" },
  { id: "Caption",    icon: "T" },
  { id: "Layout",     icon: "⊞" },
];

export const PRESETS = [
  { name: "Passport", width: 35, height: 45 },
  { name: "Visa",     width: 51, height: 51 },
  { name: "Stamp",    width: 25, height: 25 },
  { name: "Custom",   width: 0,  height: 0  },
];

export const BACKGROUND_COLORS = [
  { name: "White",       value: "#ffffff"     },
  { name: "Blue",        value: "#e6f0fa"     },
  { name: "Grey",        value: "#f0f0f0"     },
  { name: "Red",         value: "#ffebe6"     },
  { name: "Black",       value: "#000000"     },
  { name: "Transparent", value: "transparent" },
];

export const FONT_FAMILIES = ["Arial", "Inter", "Georgia", "Courier New", "Times New Roman"];

export const CAPTION_POSITIONS: { value: CaptionPosition; label: string }[] = [
  { value: "overlay-bottom", label: "Overlay — Bottom" },
  { value: "overlay-top",    label: "Overlay — Top"    },
  { value: "below",          label: "Below Photo"       },
  { value: "above",          label: "Above Photo"       },
];

// Checkerboard CSS for transparent backgrounds
export const CHECKER = {
  backgroundImage: "linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0px",
};
