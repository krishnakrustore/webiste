import type { SiteSettings } from "../types/product";
import { api } from "../api/client";

export const SettingsRepository = {
  async get(): Promise<SiteSettings> {
    return api.get<SiteSettings>("/settings");
  },
  async save(value: SiteSettings): Promise<SiteSettings> {
    return api.put<SiteSettings>("/settings", value, true);
  },
};
