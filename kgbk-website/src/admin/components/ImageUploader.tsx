import { useRef, useState, type DragEvent } from "react";
import { motion, Reorder } from "framer-motion";
import { UploadCloud, X, GripVertical } from "lucide-react";
import type { ProductImage } from "../../types/product";
import { fileToDataUrl } from "../../utils/image";

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export default function ImageUploader({ images, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | File[]) {
    const items: ProductImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const src = await fileToDataUrl(file);
      items.push({ id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, src, alt: file.name });
    }
    onChange([...images, ...items]);
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
        <p className="text-sm text-charcoal/60">Drag &amp; drop images, or click to browse</p>
        <p className="text-xs text-charcoal/35 mt-1">JPG or PNG, multiple files supported</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <Reorder.Group axis="x" values={images} onReorder={onChange} className="flex flex-wrap gap-3 mt-4">
          {images.map((img) => (
            <Reorder.Item
              key={img.id}
              value={img}
              className="relative w-24 h-28 rounded-lg overflow-hidden bg-beige group cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
            >
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 bg-charcoal/50 rounded p-0.5">
                <GripVertical size={12} className="text-ivory" />
              </div>
              <motion.button
                type="button"
                onClick={() => onChange(images.filter((i) => i.id !== img.id))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal/70 text-ivory flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </motion.button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
