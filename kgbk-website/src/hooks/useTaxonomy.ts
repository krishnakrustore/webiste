import { useEffect, useState, useCallback } from "react";
import { CategoryRepository, OccasionRepository, FabricTypeRepository, subscribeToTaxonomyChanges } from "../storage/TaxonomyRepository";
import type { CategoryDef, FabricTypeDef } from "../types/product";

function makeListHook<T>(repo: { getAll: () => Promise<T[]> }) {
  return function useList() {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
      const data = await repo.getAll();
      setItems(data);
      setLoading(false);
    }, []);

    useEffect(() => {
      reload();
      const unsubscribe = subscribeToTaxonomyChanges(() => reload());
      return unsubscribe;
    }, [reload]);

    return { items, loading, reload };
  };
}

const useCategoryList = makeListHook<CategoryDef>(CategoryRepository);
const useOccasionList = makeListHook<CategoryDef>(OccasionRepository);
const useFabricTypeList = makeListHook<FabricTypeDef>(FabricTypeRepository);

export function useCategories() {
  const { items, loading, reload } = useCategoryList();
  return { categories: items, loading, reload };
}

export function useOccasions() {
  const { items, loading, reload } = useOccasionList();
  return { occasions: items, loading, reload };
}

export function useFabricTypes() {
  const { items, loading, reload } = useFabricTypeList();
  return { fabricTypes: items, loading, reload };
}
