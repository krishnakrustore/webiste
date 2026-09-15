import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, UploadCloud, GripVertical, Eye, EyeOff } from "lucide-react";
import { BannersApi } from "../../api/content";
import { useBanners } from "../../hooks/useContent";
import { fileToDataUrl } from "../../utils/image";

export default function AdminBanners() {
  const { banners, reload } = useBanners();
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [alt, setAlt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Banners | Admin";
  }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImage(await fileToDataUrl(file));
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!image) return;
    setBusy(true);
    try {
      await BannersApi.create({ image, link: link.trim() || null, alt: alt.trim(), position: banners.length, active: true });
      setImage("");
      setLink("");
      setAlt("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, banner: (typeof banners)[number]) {
    await BannersApi.update(id, { image: banner.image, link: banner.link, alt: banner.alt, position: banner.position, active: !banner.active });
    reload();
  }

  async function handleRemove(id: string) {
    await BannersApi.remove(id);
    reload();
  }

  const inputClass = "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Banners</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Manage the hero banner images shown on the homepage. Only <strong>active</strong> banners appear on the live site.
      </p>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Current Banners</h2>
        <div className="space-y-3">
          {banners.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 border border-charcoal/8 rounded-lg p-3">
              <GripVertical size={14} className="text-charcoal/25 shrink-0" />
              <img src={b.image} alt={b.alt} className="w-20 h-10 object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{b.alt || "Untitled banner"}</p>
                <p className="text-xs text-charcoal/40 truncate">{b.link || "No link"}</p>
              </div>
              <button onClick={() => toggleActive(b.id, b)} className={`p-2 rounded-lg transition-colors ${b.active ? "text-green-700 hover:bg-green-50" : "text-charcoal/35 hover:bg-beige/40"}`} aria-label={b.active ? "Deactivate" : "Activate"}>
                {b.active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => handleRemove(b.id)} className="p-2 rounded-lg text-charcoal/35 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
          {banners.length === 0 && <p className="text-sm text-charcoal/40 py-3">No banners yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6">
        <h2 className="text-sm font-semibold mb-4">Add Banner</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          {image ? (
            <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-beige">
              <img src={image} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImage("")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-charcoal/70 text-ivory flex items-center justify-center">
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-250 ${dragging ? "border-gold bg-champagne/20" : "border-charcoal/15 hover:border-gold/60"}`}
            >
              <UploadCloud size={22} className="mx-auto mb-3 text-charcoal/40" />
              <p className="text-sm text-charcoal/60">Drag &amp; drop a banner image, or click to browse</p>
              <p className="text-xs text-charcoal/35 mt-1">Use the same 2:1 landscape ratio as your existing banners</p>
              <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Alt Text / Label</label>
              <input className={inputClass} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Wedding Collection banner" />
            </div>
            <div>
              <label className={labelClass}>Links to (optional)</label>
              <input className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/collection/wedding-collection" />
            </div>
          </div>
          <button type="submit" disabled={!image || busy} className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40">
            <Plus size={15} /> Add Banner
          </button>
        </form>
      </div>
    </div>
  );
}
