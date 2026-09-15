import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { ProductRepository } from "../../storage/ProductRepository";
import type { Availability, Product, ProductImage } from "../../types/product";
import { useCategories, useFabricTypes, useOccasions } from "../../hooks/useTaxonomy";
import ImageUploader from "../components/ImageUploader";

const AVAILABILITY_OPTIONS: Availability[] = ["Available", "Made to Order", "Sold Out"];

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  subcategory: "",
  price: "",
  priceUnit: "per metre",
  material: "",
  color: "",
  pattern: "",
  occasion: "",
  availability: "Available" as Availability,
  shortDescription: "",
  description: "",
  featured: false,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { fabricTypes } = useFabricTypes();
  const { occasions } = useOccasions();

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${isEdit ? "Edit" : "New"} Product | Admin`;
    if (!id) return;
    ProductRepository.getProduct(id).then((p) => {
      if (p) {
        setForm({
          name: p.name,
          sku: p.sku ?? "",
          category: p.category,
          subcategory: p.subcategory,
          price: String(p.price),
          priceUnit: p.priceUnit,
          material: p.material,
          color: p.color,
          pattern: p.pattern,
          occasion: p.occasion,
          availability: p.availability,
          shortDescription: p.shortDescription,
          description: p.description,
          featured: p.featured,
        });
        setImages(p.images);
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  // Default the two dropdowns to the first taxonomy entry once it loads
  // (categories/occasions now load async from IndexedDB, not a static list).
  useEffect(() => {
    if (isEdit) return;
    setForm((f) => (f.category || !categories[0] ? f : { ...f, category: categories[0].name }));
  }, [categories, isEdit]);
  useEffect(() => {
    if (isEdit) return;
    setForm((f) => (f.occasion || !occasions[0] ? f : { ...f, occasion: occasions[0].name }));
  }, [occasions, isEdit]);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price || Number.isNaN(Number(form.price))) { setError("A valid price is required."); return; }
    if (images.length === 0) { setError("Please add at least one product image."); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        category: form.category,
        subcategory: form.subcategory.trim(),
        price: Number(form.price),
        priceUnit: form.priceUnit.trim() || "per metre",
        material: form.material.trim(),
        color: form.color.trim(),
        pattern: form.pattern.trim(),
        occasion: form.occasion,
        availability: form.availability,
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        featured: form.featured,
        images,
      };

      if (isEdit && id) {
        const existing = await ProductRepository.getProduct(id);
        const updated: Product = { ...(existing as Product), ...payload, id };
        await ProductRepository.updateProduct(updated);
      } else {
        await ProductRepository.createProduct(payload);
      }
      navigate("/admin/products");
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-charcoal/40 text-sm">Loading product...</div>;
  }

  const inputClass =
    "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-medium text-charcoal/55 mb-1.5 block";

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm text-charcoal/55 hover:text-wine mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Products
      </Link>

      <h1 className="text-2xl font-semibold mb-8">{isEdit ? "Edit Product" : "Add Product"}</h1>

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-xl border border-charcoal/5 p-6">
          <h2 className="text-sm font-semibold mb-5">Images</h2>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        <section className="bg-white rounded-xl border border-charcoal/5 p-6 grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Product Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Royal Banarasi Silk Fabric" />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input className={inputClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. KGBK-SAR-0142" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Subcategory</label>
            <select className={inputClass} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
              <option value="">Select</option>
              {fabricTypes.map((f) => <option key={f.slug} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Price (&#8377;)</label>
            <input type="number" min="0" className={inputClass} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="2450" />
          </div>
          <div>
            <label className={labelClass}>Price Unit</label>
            <input className={inputClass} value={form.priceUnit} onChange={(e) => set("priceUnit", e.target.value)} placeholder="per metre / per piece" />
          </div>
          <div>
            <label className={labelClass}>Material</label>
            <input className={inputClass} value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="Banarasi Silk" />
          </div>
          <div>
            <label className={labelClass}>Colour</label>
            <input className={inputClass} value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Wine" />
          </div>
          <div>
            <label className={labelClass}>Pattern</label>
            <input className={inputClass} value={form.pattern} onChange={(e) => set("pattern", e.target.value)} placeholder="Traditional Woven" />
          </div>
          <div>
            <label className={labelClass}>Occasion</label>
            <select className={inputClass} value={form.occasion} onChange={(e) => set("occasion", e.target.value)}>
              {occasions.map((o) => <option key={o.slug} value={o.name}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Availability</label>
            <select className={inputClass} value={form.availability} onChange={(e) => set("availability", e.target.value as Availability)}>
              {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2.5 pt-6">
            <input id="featured" type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 accent-[#5c1626]" />
            <label htmlFor="featured" className="text-sm">Feature on homepage</label>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-charcoal/5 p-6 space-y-5">
          <div>
            <label className={labelClass}>Short Description</label>
            <input className={inputClass} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line summary shown on product cards" />
          </div>
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea rows={5} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed product description..." />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-6 py-3 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-60">
            <Save size={15} /> {saving ? "Saving..." : "Save Product"}
          </button>
          <Link to="/admin/products" className="inline-flex items-center rounded-lg border border-charcoal/15 px-6 py-3 text-sm">
            Cancel
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
