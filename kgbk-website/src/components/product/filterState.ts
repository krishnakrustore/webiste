export interface FilterState {
  price: string | null;
  category: string | null;
  fabric: string | null;
  occasion: string | null;
}

export const EMPTY_FILTERS: FilterState = { price: null, category: null, fabric: null, occasion: null };

export const PRICE_RANGES = [
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
  { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { label: "₹10,000 – ₹20,000", min: 10000, max: 20000 },
  { label: "Above ₹20,000", min: 20000, max: Infinity },
];

export function inPriceRange(price: number, label: string | null) {
  const range = PRICE_RANGES.find((r) => r.label === label);
  return !range || (price >= range.min && price < range.max);
}
