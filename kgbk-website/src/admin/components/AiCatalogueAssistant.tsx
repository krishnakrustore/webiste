import { useEffect, useRef, useState } from "react";
import { Sparkles, UploadCloud, X, RefreshCw, Check, Copy, ChevronDown, Loader2 } from "lucide-react";
import { AiApi, type AiListing, type AiShot, type AiStatus } from "../../api/admin";
import { ApiError } from "../../api/client";
import type { ProductImage } from "../../types/product";
import { compressImage } from "../../utils/image";

const SHOTS: AiShot[] = ["Catalogue", "Blouse", "Pallu"];
const SHOT_HINT: Record<AiShot, string> = {
  Catalogue: "Model wearing the saree",
  Blouse: "Blouse piece, folded flat",
  Pallu: "Pallu spread flat",
};
const MAX_PHOTOS = 10;

// Used in manual mode, when the team generates the listing text in ChatGPT themselves.
const LISTING_PROMPT = `I'm attaching phone photos of one saree from our store, Krishna Gari Battala Kottu (Hyderabad). Write an e-commerce listing. Describe only what you can see -- no invented claims about purity, handloom, weight or length, and no price.
Reply with exactly these lines:
Name: (3-7 words, e.g. "Black Tussar Silk Saree with Floral Zari Border")
Short description: (one sentence, under 140 characters)
Description: (2 short paragraphs, 90-160 words)
Material:
Colour:
Pattern:
SEO title: (under 60 characters, main search phrase first)
SEO description: (140-155 characters)`;

type ShotState = { src?: string; loading: boolean; error?: string; include: boolean };
const emptyShots = (): Record<AiShot, ShotState> => ({
  Catalogue: { loading: false, include: true },
  Blouse: { loading: false, include: true },
  Pallu: { loading: false, include: true },
});

const errorText = (err: unknown) => (err instanceof ApiError ? err.message : "Request failed. Check your connection and try again.");

interface Props {
  onApply: (result: { images: ProductImage[]; listing: AiListing | null }) => void;
  defaultOpen?: boolean;
}

export default function AiCatalogueAssistant({ onApply, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [photos, setPhotos] = useState<{ id: string; src: string }[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [notes, setNotes] = useState("");
  const [shots, setShots] = useState(emptyShots);
  const [listing, setListing] = useState<{ data?: AiListing; loading: boolean; error?: string }>({ loading: false });
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AiApi.status().then(setStatus).catch((err) => setStatusError(errorText(err)));
  }, []);

  const photoSrcs = photos.map((p) => p.src);
  const busy = listing.loading || SHOTS.some((k) => shots[k].loading);
  const hasResults = Boolean(listing.data) || SHOTS.some((k) => shots[k].src);

  async function addPhotos(files: FileList) {
    setPreparing(true);
    try {
      const next: { id: string; src: string }[] = [];
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
        if (!file.type.startsWith("image/")) continue;
        next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src: await compressImage(file, 1600, 0.85) });
      }
      setPhotos((p) => [...p, ...next]);
    } finally {
      setPreparing(false);
    }
  }

  function patchShot(kind: AiShot, patch: Partial<ShotState>) {
    setShots((s) => ({ ...s, [kind]: { ...s[kind], ...patch } }));
  }

  async function generateShot(kind: AiShot) {
    patchShot(kind, { loading: true, error: undefined });
    try {
      const { src } = await AiApi.image(photoSrcs, kind, notes);
      patchShot(kind, { src, loading: false, include: true });
    } catch (err) {
      patchShot(kind, { loading: false, error: errorText(err) });
    }
  }

  async function generateListing() {
    setListing((l) => ({ ...l, loading: true, error: undefined }));
    try {
      setListing({ data: await AiApi.describe(photoSrcs, notes), loading: false });
    } catch (err) {
      setListing((l) => ({ ...l, loading: false, error: errorText(err) }));
    }
  }

  function generateAll() {
    setApplied(false);
    void generateListing();
    SHOTS.forEach((k) => void generateShot(k));
  }

  function apply() {
    const d = listing.data;
    const altFor: Record<AiShot, string | undefined> = { Catalogue: d?.altCatalogue, Blouse: d?.altBlouse, Pallu: d?.altPallu };
    const images: ProductImage[] = SHOTS.filter((k) => shots[k].src && shots[k].include).map((k) => ({
      id: `ai-${k}-${Date.now()}`,
      src: shots[k].src!,
      alt: altFor[k] || `${d?.name ?? "Saree"} -- ${k.toLowerCase()}`,
      label: k,
    }));
    onApply({ images, listing: d ?? null });
    setApplied(true);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <section className="bg-white rounded-xl border border-gold/30 overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 p-5 text-left bg-champagne/15">
        <span className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-wine text-ivory flex items-center justify-center"><Sparkles size={15} /></span>
          <span>
            <span className="block text-sm font-semibold">AI Catalogue Assistant</span>
            <span className="block text-xs text-charcoal/50">Phone photos in &rarr; model shot, blouse, pallu and a full SEO listing out</span>
          </span>
        </span>
        <ChevronDown size={16} className={`text-charcoal/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-5 space-y-6 border-t border-charcoal/5">
          {statusError && <p className="text-sm text-red-600">{statusError}</p>}

          {/* Step 1: photos */}
          <div>
            <p className="text-xs font-semibold text-charcoal/70 mb-1">1. Add phone photos of the saree ({photos.length}/{MAX_PHOTOS})</p>
            <p className="text-xs text-charcoal/45 mb-3">Include the full drape, the pallu, the blouse piece and a close-up of the border/weave in good daylight. More angles = more accurate results.</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative w-20 h-24 rounded-md overflow-hidden bg-beige group">
                  <img src={p.src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal/70 text-ivory flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-20 h-24 rounded-md border-2 border-dashed border-charcoal/15 hover:border-gold flex flex-col items-center justify-center text-charcoal/40 text-[10px] gap-1"
                >
                  {preparing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {preparing ? "Optimising" : "Add"}
                </button>
              )}
              <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addPhotos(e.target.files); e.target.value = ""; }} />
            </div>
          </div>

          {/* Step 2: facts the AI can't see */}
          <div>
            <label className="text-xs font-semibold text-charcoal/70 mb-1 block">2. Facts only you know (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="e.g. Pure Kanchipuram silk, 6.3m with blouse, handwoven in Kanchipuram"
              className="w-full bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold"
            />
            <p className="text-[11px] text-charcoal/40 mt-1">The AI only states claims like &ldquo;pure silk&rdquo; or &ldquo;handloom&rdquo; if you write them here.</p>
          </div>

          {status && !status.enabled ? (
            <ManualMode prompts={status.prompts} copied={copied} onCopy={copy} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!status || busy || photos.length === 0}
                  onClick={generateAll}
                  className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-40"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {busy ? "Generating..." : hasResults ? "Regenerate everything" : "3. Generate catalogue"}
                </button>
                {busy && <span className="text-xs text-charcoal/50">Images take about 1-2 minutes each; they generate in parallel.</span>}
              </div>

              {(hasResults || busy) && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {SHOTS.map((k) => {
                      const s = shots[k];
                      return (
                        <div key={k} className="rounded-lg border border-charcoal/10 overflow-hidden">
                          <div className="relative aspect-[2/3] bg-beige/60 flex items-center justify-center">
                            {s.src && <img src={s.src} alt={k} className={`absolute inset-0 w-full h-full object-cover ${s.include ? "" : "opacity-30"}`} />}
                            {s.loading && (
                              <div className="absolute inset-0 bg-ivory/70 flex flex-col items-center justify-center gap-2 text-xs text-charcoal/60">
                                <Loader2 size={20} className="animate-spin text-wine" /> Creating {k.toLowerCase()}...
                              </div>
                            )}
                            {!s.src && !s.loading && s.error && <p className="p-3 text-[11px] text-red-600 text-center">{s.error}</p>}
                            <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-charcoal/75 text-ivory px-1.5 py-0.5 rounded">{k}</span>
                          </div>
                          <div className="p-2 space-y-1.5">
                            <p className="text-[11px] text-charcoal/50">{SHOT_HINT[k]}</p>
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                <input type="checkbox" disabled={!s.src} checked={s.include} onChange={(e) => patchShot(k, { include: e.target.checked })} className="accent-[#5c1626]" />
                                Use
                              </label>
                              <button
                                type="button"
                                disabled={s.loading || photos.length === 0}
                                onClick={() => generateShot(k)}
                                className="inline-flex items-center gap-1 text-[11px] text-wine hover:underline disabled:opacity-40"
                              >
                                <RefreshCw size={11} /> Redo
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg border border-charcoal/10 p-4 text-sm">
                    {listing.loading && <p className="flex items-center gap-2 text-charcoal/55"><Loader2 size={14} className="animate-spin" /> Writing the listing...</p>}
                    {listing.error && (
                      <p className="text-red-600 text-xs">
                        {listing.error}{" "}
                        <button type="button" onClick={generateListing} className="underline">Retry</button>
                      </p>
                    )}
                    {listing.data && !listing.loading && (
                      <div className="space-y-1.5">
                        <p className="font-semibold">{listing.data.name}</p>
                        <p className="text-charcoal/60 text-xs">{listing.data.shortDescription}</p>
                        <p className="text-[11px] text-charcoal/45">
                          {listing.data.category} &middot; {listing.data.subcategory || "--"} &middot; {listing.data.occasion} &middot; {listing.data.color}
                        </p>
                        <p className="text-[11px] text-emerald-700">SEO: {listing.data.seoTitle}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={busy || !hasResults}
                      onClick={apply}
                      className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors disabled:opacity-40"
                    >
                      <Check size={15} /> Use in product form
                    </button>
                    <span className="text-xs text-charcoal/50">
                      {applied ? "Added below -- review, set the price and save." : "Fills the fields below; you can still edit everything before saving."}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function ManualMode({ prompts, copied, onCopy }: { prompts: Record<AiShot, string>; copied: string; onCopy: (text: string, key: string) => void }) {
  return (
    <div className="rounded-lg bg-beige/40 border border-gold/30 p-4 space-y-3">
      <p className="text-sm font-semibold">Automatic generation isn&rsquo;t switched on yet</p>
      <p className="text-xs text-charcoal/60 leading-relaxed">
        It needs an OpenAI <strong>API</strong> key on the server (<code>OPENAI_API_KEY</code>). A ChatGPT Plus/Pro subscription doesn&rsquo;t
        include API access -- that&rsquo;s billed separately at platform.openai.com. Until then, use ChatGPT directly: attach the same photos,
        paste each prompt below, download the result, then upload it in the Images section and set its label.
      </p>
      <div className="flex flex-wrap gap-2">
        {SHOTS.map((k) => (
          <button key={k} type="button" onClick={() => onCopy(prompts[k], k)} className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-3.5 py-1.5 text-xs hover:border-gold">
            {copied === k ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />} {k} image prompt
          </button>
        ))}
        <button type="button" onClick={() => onCopy(LISTING_PROMPT, "listing")} className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-3.5 py-1.5 text-xs hover:border-gold">
          {copied === "listing" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />} Listing text prompt
        </button>
      </div>
    </div>
  );
}
