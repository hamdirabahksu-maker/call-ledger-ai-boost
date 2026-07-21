export const INDUSTRIES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Clinic / Dental / Medical office",
  "Auto repair",
  "Cleaning",
  "Beauty / Salon / Spa",
  "Legal / Consulting",
  "Real estate",
  "General SMB",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Ireland",
  "Australia",
  "New Zealand",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Portugal",
  "Belgium",
  "Switzerland",
  "Austria",
  "Poland",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "United Arab Emirates",
  "Saudi Arabia",
  "South Africa",
  "India",
  "Singapore",
  "Japan",
  "Other",
] as const;

export const isMedical = (industry: string | null | undefined) =>
  !!industry && industry.toLowerCase().includes("clinic");
