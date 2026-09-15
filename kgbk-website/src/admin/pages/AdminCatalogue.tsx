import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { CategoryRepository, OccasionRepository, FabricTypeRepository } from "../../storage/TaxonomyRepository";
import { useCategories, useOccasions, useFabricTypes } from "../../hooks/useTaxonomy";
import type { CategoryDef, FabricTypeDef } from "../../types/product";

const inputClass = "w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold transition-colors";

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-charcoal/5 p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-charcoal/50 mt-1 mb-5">{description}</p>
      {children}
    </motion.section>
  );
}

/** Add/remove manager for the two image-backed lists: categories and occasions. */
function CategoryListManager({
  title,
  description,
  repo,
  items,
  reload,
}: {
  title: string;
  description: string;
  repo: typeof CategoryRepository;
  items: CategoryDef[];
  reload: () => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await repo.create({ name: form.name.trim(), description: form.description.trim(), image: form.image.trim() });
      setForm({ name: "", description: "", image: "" });
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(slug: string) {
    await repo.remove(slug);
    reload();
  }

  return (
    <Card title={title} description={description}>
      <div className="divide-y divide-charcoal/5 mb-5">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center gap-3 py-2.5">
            {item.image && <img src={item.image} alt="" className="w-9 h-11 object-cover rounded shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.description && <p className="text-xs text-charcoal/45 truncate">{item.description}</p>}
            </div>
            <button onClick={() => handleRemove(item.slug)} aria-label={`Remove ${item.name}`} className="text-charcoal/35 hover:text-red-600 transition-colors shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-charcoal/40 py-3">None yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="grid sm:grid-cols-3 gap-3">
        <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input className={inputClass} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <input className={inputClass} placeholder="Image URL (optional)" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
        <button type="submit" disabled={busy || !form.name.trim()} className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-lg border border-wine text-wine px-4 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40">
          <Plus size={15} /> Add
        </button>
      </form>
    </Card>
  );
}

/** Add/remove manager for fabric types -- just a name, no image/description. */
function FabricTypeManager({ items, reload }: { items: FabricTypeDef[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await FabricTypeRepository.create({ name: name.trim() });
      setName("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(slug: string) {
    await FabricTypeRepository.remove(slug);
    reload();
  }

  return (
    <Card title="Fabric Types" description="Shown as filter chips on the site and as the Subcategory dropdown when adding a product.">
      <div className="flex flex-wrap gap-2 mb-5">
        {items.map((item) => (
          <span key={item.slug} className="group inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-beige/25 pl-3.5 pr-2 py-1.5 text-xs text-charcoal/75">
            {item.name}
            <button onClick={() => handleRemove(item.slug)} aria-label={`Remove ${item.name}`} className="text-charcoal/35 group-hover:text-red-600 transition-colors">
              <Trash2 size={12} />
            </button>
          </span>
        ))}
        {items.length === 0 && <p className="text-sm text-charcoal/40 py-1">None yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="flex gap-3">
        <input className={inputClass} placeholder="e.g. Banarasi, Mangalgiri Cotton, Chikankari" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" disabled={busy || !name.trim()} className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-4 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40 shrink-0">
          <Plus size={15} /> Add
        </button>
      </form>
    </Card>
  );
}

export default function AdminCatalogue() {
  const { categories, reload: reloadCategories } = useCategories();
  const { occasions, reload: reloadOccasions } = useOccasions();
  const { fabricTypes, reload: reloadFabricTypes } = useFabricTypes();

  useEffect(() => {
    document.title = "Catalogue | Admin";
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Catalogue</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Manage the categories, occasions and fabric types used across the site and the product form. Changes apply immediately &mdash; no code edits needed.
      </p>

      <div className="space-y-6">
        <CategoryListManager
          title="Categories"
          description="Shown on the homepage category grid, collection pages, and the Category dropdown on the product form."
          repo={CategoryRepository}
          items={categories}
          reload={reloadCategories}
        />
        <CategoryListManager
          title="Occasions"
          description="Shown on the homepage occasion strip and the Occasion dropdown on the product form."
          repo={OccasionRepository}
          items={occasions}
          reload={reloadOccasions}
        />
        <FabricTypeManager items={fabricTypes} reload={reloadFabricTypes} />
      </div>
    </div>
  );
}
