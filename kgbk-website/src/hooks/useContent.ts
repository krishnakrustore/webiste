import { useEffect, useState, useCallback } from "react";
import { TestimonialsApi, BannersApi, CareGuidesApi, PoliciesApi, type CareGuide, type Policy } from "../api/content";
import { SettingsRepository } from "../storage/SettingsRepository";
import type { Testimonial, Banner, SiteSettings } from "../types/product";

export function useTestimonials(featuredOnly = false) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await TestimonialsApi.list(featuredOnly);
    setTestimonials(data);
    setLoading(false);
  }, [featuredOnly]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { testimonials, loading, reload };
}

export function useBanners(activeOnly = false) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await BannersApi.list(activeOnly);
    setBanners(data);
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { banners, loading, reload };
}

export function useCareGuides() {
  const [careGuides, setCareGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await CareGuidesApi.list();
    setCareGuides(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { careGuides, loading, reload };
}

export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await PoliciesApi.list();
    setPolicies(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { policies, loading, reload };
}

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await SettingsRepository.get();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { settings, loading, reload };
}
