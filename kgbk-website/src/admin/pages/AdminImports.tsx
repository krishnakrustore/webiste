import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, FolderOpen, Layers, Wand2, CheckCircle2 } from "lucide-react";
import { ImportApi, type ImportBatchSummary } from "../../api/import";
import { BATCH_STATUS_LABEL } from "../importStatus";
import { ApiError } from "../../api/client";

const STEPS = [
  { icon: FolderOpen, title: "Upload", body: "Drop in all the photos from the pendrive. They're resized in your browser first." },
  { icon: Layers, title: "Group", body: "Photos are split into one group per saree -- by folder, or by AI in shooting order." },
  { icon: Wand2, title: "Generate", body: "For each saree: one mannequin photo, a zoomed crop of it, plus title, description and SEO." },
  { icon: CheckCircle2, title: "Review & publish", body: "Everything arrives as hidden drafts. Check, edit and publish in bulk." },
];

export default function AdminImports() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Bulk Import | Admin";
    ImportApi.list()
      .then(setBatches)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load imports."))
      .finally(() => setLoading(false));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const batch = await ImportApi.create({ name: name.trim(), mode: "ai", notes: "" });
      navigate(`/admin/import/${batch.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the import.");
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-9 h-9 rounded-lg bg-wine text-ivory flex items-center justify-center"><Sparkles size={17} /></span>
        <h1 className="text-2xl font-semibold">Bulk Import</h1>
      </div>
      <p className="text-sm text-charcoal/55 mb-8">Turn a folder of phone photos into ready-to-review saree listings.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.title} className="bg-white rounded-xl border border-charcoal/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={15} className="text-wine" />
              <p className="text-sm font-semibold">{i + 1}. {s.title}</p>
            </div>
            <p className="text-xs text-charcoal/55 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="bg-white rounded-xl border border-charcoal/5 p-5 mb-8 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-charcoal/55 mb-1.5 block">New import name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pendrive -- October silks"
            className="w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>
        <button disabled={busy || !name.trim()} className="rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark disabled:opacity-40">
          Start new import
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-charcoal/5 divide-y divide-charcoal/5">
        {loading && <p className="p-6 text-sm text-charcoal/40">Loading...</p>}
        {!loading && batches.length === 0 && <p className="p-6 text-sm text-charcoal/40">No imports yet.</p>}
        {batches.map((b) => {
          const done = b.byStatus.done ?? 0;
          const total = b.groups - (b.byStatus.skipped ?? 0);
          const status = BATCH_STATUS_LABEL[b.status];
          return (
            <Link key={b.id} to={`/admin/import/${b.id}`} className="flex flex-wrap items-center gap-4 p-5 hover:bg-beige/15 transition-colors">
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-charcoal/45 mt-0.5">
                  {b.photos} photos &middot; {b.groups ? `${b.groups} sarees` : "not grouped yet"} &middot; {new Date(b.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              {total > 0 && (
                <div className="w-40">
                  <div className="h-1.5 rounded-full bg-charcoal/10 overflow-hidden">
                    <div className="h-full bg-wine" style={{ width: `${(done / total) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-charcoal/45 mt-1">{done}/{total} generated</p>
                </div>
              )}
              <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded ${status.cls}`}>{status.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
