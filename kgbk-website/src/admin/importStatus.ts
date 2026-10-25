import type { BatchStatus, GroupStatus } from "../api/import";

export const BATCH_STATUS_LABEL: Record<BatchStatus, { label: string; cls: string }> = {
  uploading: { label: "Uploading", cls: "bg-charcoal/10 text-charcoal/70" },
  grouping: { label: "Finding sarees", cls: "bg-blue-100 text-blue-800" },
  review: { label: "Ready to review", cls: "bg-amber-100 text-amber-800" },
  running: { label: "Generating", cls: "bg-blue-100 text-blue-800" },
  paused: { label: "Paused", cls: "bg-orange-100 text-orange-800" },
  done: { label: "Finished", cls: "bg-green-100 text-green-800" },
};

export const GROUP_STATUS_LABEL: Record<GroupStatus, { label: string; cls: string }> = {
  pending: { label: "Not generated", cls: "bg-charcoal/10 text-charcoal/60" },
  queued: { label: "Waiting", cls: "bg-blue-50 text-blue-700" },
  processing: { label: "Generating...", cls: "bg-blue-100 text-blue-800" },
  done: { label: "Draft created", cls: "bg-green-100 text-green-800" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
  skipped: { label: "Skipped", cls: "bg-charcoal/5 text-charcoal/40" },
};
