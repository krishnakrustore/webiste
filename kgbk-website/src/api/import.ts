import { api } from "./client";

export type BatchStatus = "uploading" | "grouping" | "review" | "running" | "paused" | "done";
export type GroupStatus = "pending" | "queued" | "processing" | "done" | "failed" | "skipped";
export type GroupingMode = "ai" | "folders";

export interface ImportBatchSummary {
  id: string;
  name: string;
  status: BatchStatus;
  mode: GroupingMode;
  notes: string;
  error: string;
  createdAt: string;
  photos: number;
  groups: number;
  byStatus: Partial<Record<GroupStatus, number>>;
}

export interface ImportPhotoView {
  id: string;
  name: string;
  folder: string;
  thumb: string;
  src: string;
}

export interface ImportGroupView {
  id: string;
  position: number;
  status: GroupStatus;
  error: string;
  product: { id: string; name: string; status: string; images: { src: string; label: string }[] } | null;
  photos: ImportPhotoView[];
}

export interface ImportBatchDetail extends Omit<ImportBatchSummary, "groups"> {
  groups: ImportGroupView[];
}

export interface UploadPhoto {
  name: string;
  folder: string;
  takenAt: string;
  src: string;
  thumb: string;
}

export const ImportApi = {
  list: () => api.get<ImportBatchSummary[]>("/import/batches", true),
  create: (input: { name: string; mode: GroupingMode; notes: string }) => api.post<ImportBatchSummary>("/import/batches", input, true),
  get: (id: string) => api.get<ImportBatchDetail>(`/import/batches/${id}`, true),
  update: (id: string, input: Partial<{ name: string; mode: GroupingMode; notes: string }>) => api.patch(`/import/batches/${id}`, input, true),
  keys: (id: string) => api.get<string[]>(`/import/batches/${id}/keys`, true),
  upload: (id: string, photos: UploadPhoto[]) => api.post<{ added: number }>(`/import/batches/${id}/photos`, { photos }, true),
  group: (id: string) => api.post(`/import/batches/${id}/group`, undefined, true),
  generate: (id: string, limit?: number) => api.post<{ queued: number }>(`/import/batches/${id}/generate`, limit ? { limit } : {}, true),
  pause: (id: string) => api.post(`/import/batches/${id}/pause`, undefined, true),
  resume: (id: string) => api.post(`/import/batches/${id}/resume`, undefined, true),
  remove: (id: string) => api.delete(`/import/batches/${id}`, true),
  split: (groupId: string, photoId: string) => api.post(`/import/groups/${groupId}/split`, { photoId }, true),
  mergePrevious: (groupId: string) => api.post(`/import/groups/${groupId}/merge-previous`, undefined, true),
  skip: (groupId: string, skipped: boolean) => api.post(`/import/groups/${groupId}/skip`, { skipped }, true),
  retry: (groupId: string) => api.post(`/import/groups/${groupId}/retry`, undefined, true),
  removePhoto: (photoId: string) => api.delete(`/import/photos/${photoId}`, true),
  movePhoto: (photoId: string, position: number) => api.post(`/import/photos/${photoId}/move`, { position }, true),
};
