import { useRef, useState, type DragEvent } from "react";
import { motion, Reorder } from "framer-motion";
import { UploadCloud, X, GripVertical } from "lucide-react";
import { IMAGE_LABELS, type ImageLabel, type ProductImage } from "../../types/product";
import { compressImage } from "../../utils/image";

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  max?: number;
}

export default function ImageUploader({ images, onChange, max = 12 }: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      const items: ProductImage[] = [];
      for (const file of Array.from(files).slice(0, Math.max(0, max - images.length))) {
        if (!file.type.startsWith("image/")) continue;
        const src = await compressImage(file);
        items.push({ id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, src, alt: "", label: "" });
      }
      onChange([...images, ...items]);
    } finally {
      setBusy(false);
    }
  }

  function setLabel(id: string, label: ImageLabel) {
    onChange(images.map((img) => (img.id === id ? { ...img, label } : img)));
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-250 ${
          dragging ? "border-gold bg-champagne/20" : "border-charcoal/15 hover:border-gold/60"
        }`}
      >
        <UploadCloud size={22} className="mx-auto mb-3 text-charcoal/40" />
        <p className="text-sm text-charcoal/60">{busy ? "Optimising photos..." : "Drag & drop images, or click to browse"}</p>
        <p className="text-xs text-charcoal/35 mt-1">JPG, PNG or WebP -- up to {max} images, resized automatically</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <>
          <p className="text-xs text-charcoal/45 mt-4 mb-2">
            Drag to reorder -- the first image is the main one shown in listings. Label each shot so it shows a badge on the product page.
          </p>
          <Reorder.Group axis="x" values={images} onReorder={onChange} className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <Reorder.Item
                key={img.id}
                value={img}
                className="relative w-28 rounded-lg overflow-hidden bg-white border border-charcoal/10 group cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
              >
                <div className="relative h-32 bg-beige">
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" draggable={false} />
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] font-semibold uppercase tracking-wide bg-wine text-ivory px-1.5 py-0.5 rounded">Main</span>}
                  <div className="absolute top-1 left-1 bg-charcoal/50 rounded p-0.5">
                    <GripVertical size={12} className="text-ivory" />
                  </div>
                  <motion.button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal/70 text-ivory flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} />
                  </motion.button>
                </div>
                <select
                  value={img.label ?? ""}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => setLabel(img.id, e.target.value as ImageLabel)}
                  className="w-full text-[11px] px-1.5 py-1.5 bg-white border-t border-charcoal/10 outline-none cursor-pointer"
                  aria-label="Image label"
                >
                  <option value="">No label</option>
                  {IMAGE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </>
      )}
    </div>
  );
}
