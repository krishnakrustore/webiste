import { api } from "./client";
import type { Testimonial, TestimonialInput, Banner, BannerInput, SiteSettings } from "../types/product";

export const TestimonialsApi = {
  list: (featuredOnly = false) => api.get<Testimonial[]>(`/testimonials${featuredOnly ? "?featured=true" : ""}`),
  create: (input: TestimonialInput) => api.post<Testimonial>("/testimonials", input, true),
  update: (id: string, input: TestimonialInput) => api.put<Testimonial>(`/testimonials/${id}`, input, true),
  remove: (id: string) => api.delete(`/testimonials/${id}`, true),
};

export const BannersApi = {
  list: (activeOnly = false) => api.get<Banner[]>(`/banners${activeOnly ? "?active=true" : ""}`),
  create: (input: BannerInput) => api.post<Banner>("/banners", input, true),
  update: (id: string, input: BannerInput) => api.put<Banner>(`/banners/${id}`, input, true),
  remove: (id: string) => api.delete(`/banners/${id}`, true),
};

export interface ScheduleCallInput {
  name: string;
  phone: string;
  preferredTime: string;
  notes?: string;
}

export interface ScheduleCallRequest extends ScheduleCallInput {
  id: string;
  createdAt: string;
}

export const ScheduleCallApi = {
  create: (input: ScheduleCallInput) => api.post<ScheduleCallRequest>("/schedule-call", input),
  list: () => api.get<ScheduleCallRequest[]>("/schedule-call", true),
  remove: (id: string) => api.delete(`/schedule-call/${id}`, true),
};

export const SettingsApi = {
  get: () => api.get<SiteSettings>("/settings"),
};

export interface CareGuide {
  id: string;
  title: string;
  matchTerm: string;
  content: string;
  position: number;
  createdAt: string;
}

export type CareGuideInput = Omit<CareGuide, "id" | "createdAt">;

export const CareGuidesApi = {
  list: () => api.get<CareGuide[]>("/care-guides"),
  create: (input: CareGuideInput) => api.post<CareGuide>("/care-guides", input, true),
  update: (id: string, input: CareGuideInput) => api.put<CareGuide>(`/care-guides/${id}`, input, true),
  remove: (id: string) => api.delete(`/care-guides/${id}`, true),
};

export interface PolicySection {
  heading: string;
  body: string;
}

export interface Policy {
  id: string;
  slug: string;
  title: string;
  image: string;
  sections: PolicySection[];
  position: number;
  updatedAt: string;
}

export type PolicyInput = Omit<Policy, "id" | "updatedAt">;

export const PoliciesApi = {
  list: () => api.get<Policy[]>("/policies"),
  create: (input: PolicyInput) => api.post<Policy>("/policies", input, true),
  update: (id: string, input: PolicyInput) => api.put<Policy>(`/policies/${id}`, input, true),
  remove: (id: string) => api.delete(`/policies/${id}`, true),
};
