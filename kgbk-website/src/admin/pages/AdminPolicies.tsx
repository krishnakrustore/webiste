import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";
import { PoliciesApi, type Policy, type PolicySection } from "../../api/content";
import { usePolicies } from "../../hooks/useContent";
import { fileToDataUrl } from "../../utils/image";

const inputClass = "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

function SectionsEditor({ sections, onChange }: { sections: PolicySection[]; onChange: (s: PolicySection[]) => void }) {
  function update(i: number, key: keyof PolicySection, value: string) {
    onChange(sections.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  }
  function remove(i: number) {
    onChange(sections.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={i} className="border border-charcoal/10 rounded-lg p-3 bg-beige/20">
          <div className="flex items-start gap-2 mb-2">
            <input
              className={inputClass}
              value={s.heading}
              onChange={(e) => update(i, "heading", e.target.value)}
              placeholder="Section heading, e.g. Refunds"
            />
            <button type="button" onClick={() => remove(i)} className="p-2.5 rounded-lg text-charcoal/35 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0" aria-label="Remove section">
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            className={inputClass}
            rows={3}
            value={s.body}
            onChange={(e) => update(i, "body", e.target.value)}
            placeholder="Section body text"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...sections, { heading: "", body: "" }])}
        className="inline-flex items-center gap-2 text-xs font-medium text-wine hover:underline"
      >
        <Plus size={13} /> Add section
      </button>
    </div>
  );
}

function PolicyEditor({ policy, onSaved, onDeleted }: { policy: Policy; onSaved: () => void; onDeleted: () => void }) {
  const [title, setTitle] = useState(policy.title);
  const [image, setImage] = useState(policy.image);
  const [sections, setSections] = useState<PolicySection[]>(policy.sections);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setImage(await fileToDataUrl(file));
  }

  async function handleSave() {
    setBusy(true);
    try {
      await PoliciesApi.update(policy.id, {
        slug: policy.slug,
        title,
        image,
        sections,
        position: policy.position,
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${policy.title}"? This removes it from the site immediately.`)) return;
    await PoliciesApi.remove(policy.id);
    onDeleted();
  }

  return (
    <div className="border border-charcoal/10 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          {policy.image && <img src={policy.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
          <div className="text-left min-w-0">
            <p className="text-sm font-medium truncate">{policy.title}</p>
            <p className="text-xs text-charcoal/40">/policies/{policy.slug} &middot; {policy.sections.length} section{policy.sections.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-charcoal/40 shrink-0" /> : <ChevronDown size={16} className="text-charcoal/40 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-charcoal/8 pt-4">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Split-screen Image</label>
            <div className="flex items-center gap-3">
              {image && <img src={image} alt="" className="w-20 h-20 rounded-lg object-cover border border-charcoal/10" />}
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm hover:border-gold transition-colors">
                <ImagePlus size={15} />
                {image ? "Replace image" : "Upload image"}
                <input type="file" accept="image/*" hidden onChange={(e) => handleImage(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Sections (shown as an FAQ accordion)</label>
            <SectionsEditor sections={sections} onChange={setSections} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-40"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg text-red-600 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Delete Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPolicies() {
  const { policies, reload } = usePolicies();
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Policies | Admin";
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      await PoliciesApi.create({
        slug: "",
        title: newTitle.trim(),
        image: "",
        sections: [{ heading: "Overview", body: "" }],
        position: policies.length,
      });
      setNewTitle("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Policies</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        These appear on the public <strong>Store Policies</strong> page (linked from the footer) as a category dropdown
        with a split-screen image and FAQ-style accordion. Edit sections, swap the image, or add a new policy category
        (e.g. Cancellation Policy) below.
      </p>

      <div className="space-y-3 mb-6">
        {policies.map((p) => (
          <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PolicyEditor policy={p} onSaved={reload} onDeleted={reload} />
          </motion.div>
        ))}
        {policies.length === 0 && <p className="text-sm text-charcoal/40 py-3">None yet.</p>}
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6">
        <h2 className="text-sm font-semibold mb-4">Add a New Policy Category</h2>
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex-1">
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Cancellation Policy"
            />
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40 shrink-0">
            <Plus size={15} /> Add Policy
          </button>
        </form>
      </div>
    </div>
  );
}
