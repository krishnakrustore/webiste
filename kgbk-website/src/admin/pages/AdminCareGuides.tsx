import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { CareGuidesApi } from "../../api/content";
import { useCareGuides } from "../../hooks/useContent";

const emptyForm = { title: "", matchTerm: "", content: "" };

export default function AdminCareGuides() {
  const { careGuides, reload } = useCareGuides();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Care Guides | Admin";
  }, []);

  function set<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.matchTerm.trim() || !form.content.trim()) return;
    setBusy(true);
    try {
      await CareGuidesApi.create({ ...form, position: careGuides.length });
      setForm(emptyForm);
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    await CareGuidesApi.remove(id);
    reload();
  }

  const inputClass = "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Care Guides</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Shown as a tab on the product page. Each guide is matched to a product automatically -- if the product&rsquo;s
        material contains the <strong>match term</strong> (e.g. &ldquo;Silk&rdquo; matches &ldquo;Banarasi Silk&rdquo;, &ldquo;Kanchipuram Silk&rdquo;), that guide&rsquo;s content is shown.
      </p>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Current Guides</h2>
        <div className="divide-y divide-charcoal/5">
          {careGuides.map((g) => (
            <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-medium">{g.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-beige/60 text-charcoal/55">matches &ldquo;{g.matchTerm}&rdquo;</span>
                </div>
                <p className="text-xs text-charcoal/55 whitespace-pre-line line-clamp-3">{g.content}</p>
              </div>
              <button onClick={() => handleRemove(g.id)} className="p-2 rounded-lg text-charcoal/35 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0" aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
          {careGuides.length === 0 && <p className="text-sm text-charcoal/40 py-3">None yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6">
        <h2 className="text-sm font-semibold mb-4">Add Care Guide</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input required className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Silk Care" />
            </div>
            <div>
              <label className={labelClass}>Match Term</label>
              <input required className={inputClass} value={form.matchTerm} onChange={(e) => set("matchTerm", e.target.value)} placeholder="e.g. silk" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Instructions (one per line)</label>
            <textarea required rows={5} className={inputClass} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder={"Dry clean only.\nStore away from direct sunlight."} />
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40">
            <Plus size={15} /> Add Care Guide
          </button>
        </form>
      </div>
    </div>
  );
}
