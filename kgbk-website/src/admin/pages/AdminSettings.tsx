import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2 } from "lucide-react";
import { SettingsRepository } from "../../storage/SettingsRepository";
import type { SiteSettings } from "../../types/product";

export default function AdminSettings() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = "Settings | Admin";
    SettingsRepository.get().then(setForm);
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    await SettingsRepository.save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!form) return <div className="p-10 text-charcoal/40 text-sm">Loading...</div>;

  const inputClass = "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Business details shown across the site. Note: the WhatsApp deep-links used by buttons still read the number from
        the code-level <code className="bg-beige/60 px-1.5 py-0.5 rounded text-xs">src/config/business.ts</code> --
        update it there too if you change the WhatsApp number here.
      </p>

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-xl border border-charcoal/5 p-6 space-y-5">
        <div>
          <label className={labelClass}>Business Name</label>
          <input className={inputClass} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp Number</label>
            <input className={inputClass} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="91XXXXXXXXXX" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <textarea rows={2} className={inputClass} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Google Maps URL</label>
          <input className={inputClass} value={form.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Instagram URL</label>
            <input className={inputClass} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Facebook URL</label>
            <input className={inputClass} value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
          </div>
        </div>

        <div className="pt-3 border-t border-charcoal/10">
          <p className="text-sm font-semibold mb-1">Google Reviews Badge</p>
          <p className="text-xs text-charcoal/50 mb-4">
            Shown on the homepage. Enter your <strong>real</strong> Google Business Profile rating and review count --
            leave review count at 0 to hide the badge instead of displaying a placeholder number.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Rating (0&ndash;5)</label>
              <input type="number" min="0" max="5" step="0.1" className={inputClass} value={form.googleRating} onChange={(e) => set("googleRating", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Review Count</label>
              <input type="number" min="0" className={inputClass} value={form.googleReviewCount} onChange={(e) => set("googleReviewCount", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Google Review Link</label>
              <input className={inputClass} value={form.googleReviewUrl} onChange={(e) => set("googleReviewUrl", e.target.value)} placeholder="https://g.page/r/.../review" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-6 py-3 text-sm font-medium hover:bg-wine-dark transition-colors">
            <Save size={15} /> Save Settings
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 size={15} /> Saved
            </motion.span>
          )}
        </div>
      </motion.form>
    </div>
  );
}
