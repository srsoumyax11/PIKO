export interface DocumentSpec {
  id: string;          // e.g., "us-passport" - unique key for routing/assets
  name: string;        // Human readable display name
  widthMm: number;
  heightMm: number;
  recommendedPx?: {    // Useful if your backend needs minimum resolution guidelines
    width: number;
    height: number;
  };
  notes?: string;      // Criteria like background color, glasses policy, etc.
}

export interface CountrySEOData {
  name: string;
  code: string;        // ISO 3166-1 alpha-2 standard (e.g., "us", "gb", "in")
  popular: boolean;    // Flag to pin to the top of your UI selection list
  documents: DocumentSpec[];
}

export const SEO_COUNTRIES: CountrySEOData[] = [
  {
    name: "United States",
    code: "us",
    popular: true,
    documents: [
      { id: "us-passport", name: "Passport", widthMm: 51, heightMm: 51, recommendedPx: { width: 600, height: 600 }, notes: "White background, no glasses" },
      { id: "us-visa", name: "Visa", widthMm: 51, heightMm: 51, recommendedPx: { width: 600, height: 600 }, notes: "White background" },
      { id: "us-dv-lottery", name: "Green Card / DV Lottery", widthMm: 51, heightMm: 51, recommendedPx: { width: 600, height: 600 } }
    ]
  },
  {
    name: "United Kingdom",
    code: "gb",
    popular: true,
    documents: [
      { id: "gb-passport", name: "Passport", widthMm: 35, heightMm: 45, recommendedPx: { width: 750, height: 1050 }, notes: "Light grey or cream background" },
      { id: "gb-driving-licence", name: "Driving Licence", widthMm: 35, heightMm: 45 }
    ]
  },
  {
    name: "India",
    code: "in",
    popular: true,
    documents: [
      { id: "in-passport", name: "Passport (Official Global Standard)", widthMm: 51, heightMm: 51, notes: "Plain white background, 2x2 inches" },
      { id: "in-passport-offline", name: "Passport (Local/Offline Alternative)", widthMm: 35, heightMm: 45, notes: "Used by specific regional seva kendras" },
      { id: "in-visa", name: "Visa", widthMm: 51, heightMm: 51 },
      { id: "in-pan", name: "PAN Card", widthMm: 25, heightMm: 35, notes: "Standard tax identity dimension" },
      { id: "in-oci", name: "OCI (Overseas Citizenship)", widthMm: 51, heightMm: 51 }
    ]
  },
  {
    name: "Schengen Area (Europe)",
    code: "eu",
    popular: true,
    documents: [
      { id: "eu-visa", name: "Schengen Visa", widthMm: 35, heightMm: 45, notes: "Light background, strict biometric positioning" },
      { id: "eu-passport", name: "Standard EU Passport", widthMm: 35, heightMm: 45 }
    ]
  },
  {
    name: "Japan",
    code: "jp",
    popular: false,
    documents: [
      { id: "jp-passport", name: "Passport", widthMm: 35, heightMm: 45 },
      { id: "jp-visa", name: "Visa", widthMm: 35, heightMm: 45, notes: "Standard tourist visa size" },
      { id: "jp-residence", name: "Zairyu (Residence Card)", widthMm: 30, heightMm: 40 }
    ]
  },
  {
    name: "China",
    code: "cn",
    popular: false,
    documents: [
      { id: "cn-passport", name: "Passport", widthMm: 33, heightMm: 48, notes: "White or light blue background" },
      { id: "cn-visa", name: "Visa", widthMm: 33, heightMm: 48 }
    ]
  },
  {
    name: "General Formats",
    code: "general",
    popular: false,
    documents: [
      { id: "gen-2x2", name: "Standard 2x2 inches", widthMm: 51, heightMm: 51 },
      { id: "gen-35x45", name: "Standard 35x45 mm (Biometric)", widthMm: 35, heightMm: 45 },
      { id: "gen-30x40", name: "Standard 30x40 mm", widthMm: 30, heightMm: 40 },
      { id: "gen-stamp", name: "Stamp Size", widthMm: 25, heightMm: 25, notes: "Small stamp size commonly used for forms" }
    ]
  }
];

export function generateSlug(docId: string): string {
  // Use the new explicit id (e.g. 'us-passport')
  return `${docId}-photo-maker`;
}

export function getSeoDataFromSlug(slug: string) {
  for (const country of SEO_COUNTRIES) {
    for (const doc of country.documents) {
      if (generateSlug(doc.id) === slug) {
        return { country, doc };
      }
    }
  }
  return null;
}

export function getPageTitle(country: CountrySEOData, doc: DocumentSpec): string {
  if (country.code === "general") {
    return `${doc.name} Photo Maker & Editor - Free Online Tool`;
  }
  return `${country.name} ${doc.name} Photo Maker - Free Online ${doc.widthMm}x${doc.heightMm}mm Crop`;
}

export function getPageDescription(country: CountrySEOData, doc: DocumentSpec): string {
  if (country.code === "general") {
    return `Create professional ${doc.name} photos for free. Our online tool automatically removes backgrounds and crops your photo to the exact required dimensions.`;
  }
  let desc = `Create a perfect ${country.name} ${doc.name} photo online for free. Automatically remove backgrounds and crop to the official ${doc.widthMm}x${doc.heightMm}mm requirements instantly.`;
  if (doc.notes) {
    desc += ` Adheres to rules: ${doc.notes}.`;
  }
  return desc;
}

export function getPageKeywords(country: CountrySEOData, doc: DocumentSpec): string {
  const baseKw = "passport photo maker, id photo editor, online crop tool, biometric photo, free background remover";
  if (country.code === "general") {
    return `${doc.name} maker, ${doc.widthMm}x${doc.heightMm}mm photo editor, standard photo size tool, ${baseKw}`;
  }
  return `${country.name} ${doc.name} maker, ${country.name} visa photo editor, ${doc.widthMm}x${doc.heightMm}mm crop, online ${doc.name} generator, ${baseKw}`;
}
