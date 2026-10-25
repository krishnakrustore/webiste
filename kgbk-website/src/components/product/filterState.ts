export interface FilterState {
  category: string | null;
  fabric: string | null;
  occasion: string | null;
}

export const EMPTY_FILTERS: FilterState = { category: null, fabric: null, occasion: null };
