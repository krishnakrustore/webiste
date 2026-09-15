import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Star, Eye, EyeOff, UploadCloud, X } from "lucide-react";
import { TestimonialsApi } from "../../api/content";
import { useTestimonials } from "../../hooks/useContent";
import { fileToDataUrl } from "../../utils/image";

const emptyForm = { name: "", location: "", message: "", rating: 5, source: "Google" };

export default function AdminTestimonials() {
  const { testimonials, reload } = useTestimonials();
  const [form, setForm] = useState(emptyForm);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Testimonials | Admin";
  }, []);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setAvatar(await fileToDataUrl(file));
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setBusy(true);
    try {
      await TestimonialsApi.create({ ...form, avatar, featured: true, position: testimonials.length });
      setForm(emptyForm);
      setAvatar(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function toggleFeatured(t: (typeof testimonials)[number]) {
    await TestimonialsApi.update(t.id, { ...t, featured: !t.featured });
    reload();
  }

  async function handleRemove(id: string) {
    await TestimonialsApi.remove(id);
    reload();
  }

  const inputClass = "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Testimonials</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Shown in the Customer Testimonials section on the homepage. Only <strong>featured</strong> testimonials appear on the live site.
      </p>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Current Testimonials</h2>
        <div className="divide-y divide-charcoal/5">
          {testimonials.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 flex items-start gap-3">
              {t.avatar ? (
                <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-wine/10 text-wine flex items-center justify-center text-sm font-medium shrink-0">{t.name.charAt(0)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <span className="text-xs text-charcoal/40">{t.location}</span>
                  <div className="flex text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} fill={i < t.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-charcoal/55 line-clamp-2">{t.message}</p>
              </div>
              <button onClick={() => toggleFeatured(t)} className={`p-2 rounded-lg transition-colors shrink-0 ${t.featured ? "text-green-700 hover:bg-green-50" : "text-charcoal/35 hover:bg-beige/40"}`} aria-label={t.featured ? "Unfeature" : "Feature"}>
                {t.featured ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => handleRemove(t.id)} className="p-2 rounded-lg text-charcoal/35 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0" aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
          {testimonials.length === 0 && <p className="text-sm text-charcoal/40 py-3">None yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6">
        <h2 className="text-sm font-semibold mb-4">Add Testimonial</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className={labelClass}>Customer Photo (optional)</label>
            {avatar ? (
              <div className="flex items-center gap-3">
                <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                <button type="button" onClick={() => setAvatar(null)} className="inline-flex items-center gap-1.5 text-xs text-charcoal/50 hover:text-red-600">
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-5 py-4 text-center transition-colors duration-250 ${dragging ? "border-gold bg-champagne/20" : "border-charcoal/15 hover:border-gold/60"}`}
              >
                <UploadCloud size={18} className="mx-auto mb-2 text-charcoal/40" />
                <p className="text-xs text-charcoal/55">Drag &amp; drop a photo, or click to browse</p>
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Customer Name</label>
              <input required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Hyderabad" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea required rows={3} className={inputClass} value={form.message} onChange={(e) => set("message", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rating</label>
              <select className={inputClass} value={form.rating} onChange={(e) => set("rating", Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r !== 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select className={inputClass} value={form.source} onChange={(e) => set("source", e.target.value)}>
                <option value="Google">Google</option>
                <option value="Direct">Direct</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40">
            <Plus size={15} /> Add Testimonial
          </button>
        </form>
      </div>
    </div>
  );
}
