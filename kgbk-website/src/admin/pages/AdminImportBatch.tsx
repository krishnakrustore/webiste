import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderOpen, Images, Loader2, Scissors, X, Merge, EyeOff, Eye, RefreshCw, Pause, Play, Trash2, Wand2, ExternalLink, MoveRight } from "lucide-react";
import { ImportApi, type ImportBatchDetail, type ImportGroupView, type GroupingMode, type GroupStatus } from "../../api/import";
import { ApiError } from "../../api/client";
import { compressImage } from "../../utils/image";
import { isSupportedPhoto, readTakenAt, toBrowserImage } from "../../utils/photoFile";
import { BATCH_STATUS_LABEL, GROUP_STATUS_LABEL } from "../importStatus";

const UPLOAD_CHUNK = 3;
const UPLOAD_CONCURRENCY = 3;
const PAGE = 40;

const errorText = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong. Check your connection and try again.");

function folderOf(file: File) {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
  return rel.split("/").slice(0, -1).join("/");
}

type UploadState = { total: number; done: number; failed: number; existing: number; unsupported: number; running: boolean; error?: string };

export default function AdminImportBatch() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<ImportBatchDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [filter, setFilter] = useState<GroupStatus | "all">("all");
  const [visible, setVisible] = useState(PAGE);
  const [notes, setNotes] = useState("");
  const cancelUpload = useRef(false);
  const progressStart = useRef<{ time: number; done: number } | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await ImportApi.get(id);
      setBatch(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [id]);

  useEffect(() => {
    document.title = "Bulk Import | Admin";
    load();
  }, [load]);

  useEffect(() => {
    if (batch) setNotes(batch.notes);
  }, [batch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll while the server is working in the background.
  const working = batch && (batch.status === "grouping" || batch.status === "running");
  useEffect(() => {
    if (!working) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [working, load]);

  useEffect(() => {
    folderInput.current?.setAttribute("webkitdirectory", "");
  }, [batch?.id]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(fileList: FileList) {
    const files = Array.from(fileList);
    const supported = files.filter(isSupportedPhoto);
    cancelUpload.current = false;
    setUpload({ total: 0, done: 0, failed: 0, existing: 0, unsupported: files.length - supported.length, running: true });

    let existing: Set<string>;
    try {
      existing = new Set(await ImportApi.keys(id));
    } catch (err) {
      setUpload((u) => u && { ...u, running: false, error: errorText(err) });
      return;
    }
    const todo = supported.map((file) => ({ file, folder: folderOf(file), name: file.name })).filter((f) => !existing.has(`${f.folder}/${f.name}`));
    setUpload((u) => u && { ...u, total: todo.length, existing: supported.length - todo.length });

    const chunks: (typeof todo)[] = [];
    for (let i = 0; i < todo.length; i += UPLOAD_CHUNK) chunks.push(todo.slice(i, i + UPLOAD_CHUNK));
    let next = 0;

    async function worker() {
      while (next < chunks.length && !cancelUpload.current) {
        const chunk = chunks[next++];
        try {
          const photos = [];
          for (const f of chunk) {
            const takenAt = await readTakenAt(f.file);
            const image = await toBrowserImage(f.file);
            photos.push({ name: f.name, folder: f.folder, takenAt, src: await compressImage(image, 1600, 0.85), thumb: await compressImage(image, 320, 0.72) });
          }
          try {
            await ImportApi.upload(id, photos);
          } catch {
            await new Promise((r) => setTimeout(r, 2000));
            await ImportApi.upload(id, photos); // one retry for flaky connections
          }
          setUpload((u) => u && { ...u, done: u.done + chunk.length });
        } catch {
          setUpload((u) => u && { ...u, failed: u.failed + chunk.length });
        }
      }
    }

    await Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, worker));
    setUpload((u) => u && { ...u, running: false });
    await load();
  }

  if (loadError && !batch) return <div className="p-10 text-sm text-red-600">{loadError}</div>;
  if (!batch) return <div className="p-10 text-sm text-charcoal/40">Loading import...</div>;

  const status = BATCH_STATUS_LABEL[batch.status];
  const canUpload = batch.status === "uploading" || batch.status === "review";
  const canRegroup = canUpload && !batch.groups.some((g) => g.product);
  const pending = batch.byStatus.pending ?? 0;
  const done = batch.byStatus.done ?? 0;
  const failed = batch.byStatus.failed ?? 0;
  const activeTotal = batch.groups.length - (batch.byStatus.skipped ?? 0);
  const groups = filter === "all" ? batch.groups : batch.groups.filter((g) => g.status === filter);
  const folderCount = new Set(batch.groups.flatMap((g) => g.photos.map((p) => p.folder))).size;

  // Time-left estimate from the speed observed while this page has been open.
  let eta = "";
  if (batch.status === "running") {
    progressStart.current ??= { time: Date.now(), done };
    const finished = done - progressStart.current.done;
    const remaining = activeTotal - done - failed;
    if (finished > 0 && remaining > 0) {
      const minutes = Math.ceil(((Date.now() - progressStart.current.time) / finished) * remaining / 60000);
      eta = minutes >= 90 ? `about ${Math.round(minutes / 60)} hours left` : `about ${minutes} min left`;
    }
  } else {
    progressStart.current = null;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <Link to="/admin/import" className="inline-flex items-center gap-2 text-sm text-charcoal/55 hover:text-wine mb-5">
        <ArrowLeft size={15} /> All imports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{batch.name}</h1>
            <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded ${status.cls}`}>{status.label}</span>
          </div>
          <p className="text-sm text-charcoal/50 mt-1">
            {batch.photos} photos &middot; {batch.groups.length ? `${batch.groups.length} sarees` : "not grouped yet"}
          </p>
        </div>
        <button
          disabled={busy || batch.status === "running"}
          onClick={() => {
            if (confirm("Delete this import and its uploaded photos? Products already created are kept.")) {
              act(async () => {
                await ImportApi.remove(id);
                navigate("/admin/import");
              });
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline disabled:opacity-40"
        >
          <Trash2 size={14} /> Delete import
        </button>
      </div>

      {batch.error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-4 mb-5">{batch.error}</div>}
      {actionError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-4 mb-5">{actionError}</div>}

      {/* Step 1: upload */}
      {canUpload && (
        <section className="bg-white rounded-xl border border-charcoal/5 p-6 mb-5">
          <h2 className="text-sm font-semibold mb-1">1. Upload photos</h2>
          <p className="text-xs text-charcoal/50 mb-4">
            Choose the whole folder from the pendrive -- photos can be mixed up in any folders. iPhone (HEIC) photos are converted automatically.
            You can upload in several rounds; photos already uploaded are skipped.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={upload?.running}
              onClick={() => folderInput.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark disabled:opacity-40"
            >
              <FolderOpen size={15} /> Choose folder
            </button>
            <button
              type="button"
              disabled={upload?.running}
              onClick={() => filesInput.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-charcoal/15 px-5 py-2.5 text-sm hover:border-gold disabled:opacity-40"
            >
              <Images size={15} /> Choose photos
            </button>
            <input ref={folderInput} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }} />
            <input ref={filesInput} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }} />
          </div>

          {upload && (
            <div className="mt-5">
              {upload.total > 0 && (
                <>
                  <div className="h-2 rounded-full bg-charcoal/10 overflow-hidden">
                    <div className="h-full bg-wine transition-all" style={{ width: `${((upload.done + upload.failed) / upload.total) * 100}%` }} />
                  </div>
                  <p className="text-xs text-charcoal/60 mt-2">
                    {upload.running ? "Uploading" : "Uploaded"} {upload.done} of {upload.total}
                    {upload.failed > 0 && <span className="text-red-600"> &middot; {upload.failed} failed (choose the folder again to retry them)</span>}
                  </p>
                </>
              )}
              {upload.existing > 0 && <p className="text-xs text-charcoal/45 mt-1">{upload.existing} already uploaded, skipped.</p>}
              {upload.unsupported > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  {upload.unsupported} file{upload.unsupported !== 1 ? "s were" : " was"} skipped because they aren&rsquo;t photos (e.g. videos or documents).
                </p>
              )}
              {upload.error && <p className="text-xs text-red-600 mt-1">{upload.error}</p>}
              {upload.running && (
                <button type="button" onClick={() => { cancelUpload.current = true; }} className="text-xs text-charcoal/55 underline mt-2">
                  Stop uploading
                </button>
              )}
            </div>
          )}

          <div className="mt-5">
            <label className="text-xs font-medium text-charcoal/55 mb-1.5 block">Facts that apply to every saree in this import (optional)</label>
            <div className="flex gap-2">
              <input
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. All pure Kanchipuram silk, 6.3m with blouse"
                className="flex-1 bg-white border border-charcoal/12 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold"
              />
              {notes !== batch.notes && (
                <button type="button" disabled={busy} onClick={() => act(() => ImportApi.update(id, { notes }))} className="rounded-lg border border-wine text-wine px-4 text-sm hover:bg-wine hover:text-ivory">
                  Save
                </button>
              )}
            </div>
            <p className="text-[11px] text-charcoal/40 mt-1">The AI only claims things like &ldquo;pure silk&rdquo; or &ldquo;handloom&rdquo; if they&rsquo;re written here.</p>
          </div>
        </section>
      )}

      {/* Step 2: grouping */}
      {canRegroup && batch.photos > 0 && !upload?.running && (
        <section className="bg-white rounded-xl border border-charcoal/5 p-6 mb-5">
          <h2 className="text-sm font-semibold mb-3">2. Group photos into sarees</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {([
              ["folders", "One folder per saree", "Each saree's photos are in their own folder. 100% accurate and free."],
              ["ai", "AI finds the sarees", "For mixed-up photos. They're put in the order they were taken (from the camera's own timestamp), then the AI spots where each new saree starts. You check the result."],
            ] as [GroupingMode, string, string][]).map(([mode, title, body]) => (
              <label key={mode} className={`rounded-lg border p-4 cursor-pointer transition-colors ${batch.mode === mode ? "border-wine bg-champagne/15" : "border-charcoal/10 hover:border-gold"}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={batch.mode === mode} onChange={() => act(() => ImportApi.update(id, { mode }))} className="accent-[#5c1626]" />
                  <span className="text-sm font-medium">{title}</span>
                </div>
                <p className="text-xs text-charcoal/55 mt-1.5 ml-5">{body}</p>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => ImportApi.group(id))}
            className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark disabled:opacity-40"
          >
            <Wand2 size={15} /> {batch.groups.length ? "Regroup from scratch" : "Find the sarees"}
          </button>
          {batch.groups.length > 0 && <p className="text-xs text-charcoal/45 mt-2">Regrouping discards the manual corrections below.</p>}
          {batch.mode === "folders" && batch.groups.length > 0 && folderCount <= 1 && (
            <p className="text-xs text-amber-700 mt-2">All photos are in one folder, so folder grouping made a single saree. Switch to &ldquo;AI finds the sarees&rdquo;.</p>
          )}
        </section>
      )}

      {batch.status === "grouping" && (
        <section className="bg-white rounded-xl border border-charcoal/5 p-6 mb-5 flex items-center gap-3 text-sm text-charcoal/65">
          <Loader2 size={18} className="animate-spin text-wine" />
          Finding the sarees in {batch.photos} photos... about a minute per few hundred photos. You can leave this page.
        </section>
      )}

      {/* Step 3: generate */}
      {batch.groups.length > 0 && batch.status !== "grouping" && (
        <section className="bg-white rounded-xl border border-charcoal/5 p-6 mb-5">
          <h2 className="text-sm font-semibold mb-1">3. Generate</h2>
          <p className="text-xs text-charcoal/50 mb-4">
            Check the groups below first -- each group becomes one product. Generation creates 3 images and the full listing per saree, saved as hidden drafts.
            Start with a small test run to check quality and cost before doing everything.
          </p>
          {activeTotal > 0 && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-charcoal/10 overflow-hidden">
                <div className="h-full bg-wine transition-all" style={{ width: `${(done / activeTotal) * 100}%` }} />
              </div>
              <p className="text-xs text-charcoal/60 mt-2">
                {done} of {activeTotal} sarees generated
                {(batch.byStatus.processing ?? 0) + (batch.byStatus.queued ?? 0) > 0 && ` · ${(batch.byStatus.processing ?? 0) + (batch.byStatus.queued ?? 0)} in queue`}
                {failed > 0 && <span className="text-red-600"> · {failed} failed</span>}
                {eta && ` · ${eta}`}
              </p>
              {batch.status === "running" && <p className="text-[11px] text-charcoal/40 mt-1">Runs on the server -- you can close this page or turn off this computer.</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {pending > 0 && batch.status !== "running" && (
              <>
                <button type="button" disabled={busy} onClick={() => act(() => ImportApi.generate(id, 3))} className="rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory disabled:opacity-40">
                  Test run: next {Math.min(3, pending)}
                </button>
                <button type="button" disabled={busy} onClick={() => act(() => ImportApi.generate(id))} className="rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark disabled:opacity-40">
                  Generate all {pending} remaining
                </button>
              </>
            )}
            {batch.status === "running" && (
              <button type="button" disabled={busy} onClick={() => act(() => ImportApi.pause(id))} className="inline-flex items-center gap-2 rounded-lg border border-charcoal/15 px-5 py-2.5 text-sm hover:border-gold">
                <Pause size={14} /> Pause after current sarees
              </button>
            )}
            {batch.status === "paused" && (
              <button type="button" disabled={busy} onClick={() => act(() => ImportApi.resume(id))} className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark">
                <Play size={14} /> Resume
              </button>
            )}
            {done > 0 && (
              <Link to="/admin/products?status=draft" className="inline-flex items-center gap-2 rounded-lg border border-charcoal/15 px-5 py-2.5 text-sm hover:border-gold">
                Review drafts <ExternalLink size={13} />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Groups */}
      {batch.groups.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(["all", "pending", "done", "failed", "skipped"] as const).map((f) => {
              const count = f === "all" ? batch.groups.length : batch.byStatus[f] ?? 0;
              if (f !== "all" && !count) return null;
              return (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setVisible(PAGE); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs border ${filter === f ? "bg-wine text-ivory border-wine" : "border-charcoal/15 text-charcoal/65 hover:border-gold"}`}
                >
                  {f === "all" ? "All" : GROUP_STATUS_LABEL[f].label} ({count})
                </button>
              );
            })}
          </div>
          <div className="space-y-3">
            {groups.slice(0, visible).map((g) => (
              <GroupCard key={g.id} group={g} isFirst={g.position === 0} busy={busy} act={act} />
            ))}
          </div>
          {groups.length > visible && (
            <button onClick={() => setVisible((v) => v + PAGE)} className="mt-4 w-full rounded-lg border border-charcoal/15 py-2.5 text-sm hover:border-gold">
              Show more ({groups.length - visible} left)
            </button>
          )}
        </>
      )}
    </div>
  );
}

function GroupCard({ group: g, isFirst, busy, act }: { group: ImportGroupView; isFirst: boolean; busy: boolean; act: (fn: () => Promise<unknown>) => void }) {
  const editable = ["pending", "skipped", "failed"].includes(g.status) && !g.product;
  const label = GROUP_STATUS_LABEL[g.status];
  return (
    <div className={`bg-white rounded-xl border p-4 ${g.status === "skipped" ? "border-charcoal/5 opacity-60" : "border-charcoal/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold">Saree {g.position + 1}</span>
          <span className="text-xs text-charcoal/45">{g.photos.length} photo{g.photos.length !== 1 ? "s" : ""}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${label.cls}`}>
            {g.status === "processing" && <Loader2 size={10} className="inline animate-spin mr-1 -mt-0.5" />}
            {label.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {editable && !isFirst && (
            <button disabled={busy} onClick={() => act(() => ImportApi.mergePrevious(g.id))} className="inline-flex items-center gap-1 text-charcoal/60 hover:text-wine disabled:opacity-40" title="These photos belong to the saree above">
              <Merge size={12} /> Merge with saree above
            </button>
          )}
          {editable && (
            <button disabled={busy} onClick={() => act(() => ImportApi.skip(g.id, g.status !== "skipped"))} className="inline-flex items-center gap-1 text-charcoal/60 hover:text-wine disabled:opacity-40">
              {g.status === "skipped" ? <><Eye size={12} /> Include</> : <><EyeOff size={12} /> Skip</>}
            </button>
          )}
          {(g.status === "failed" || g.status === "done") && (
            <button disabled={busy} onClick={() => act(() => ImportApi.retry(g.id))} className="inline-flex items-center gap-1 text-wine hover:underline disabled:opacity-40">
              <RefreshCw size={12} /> {g.status === "done" ? "Regenerate images" : "Retry"}
            </button>
          )}
        </div>
      </div>

      {g.error && <p className="text-xs text-red-600 mb-3">{g.error}</p>}

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {g.photos.map((p, i) => (
            <div key={p.id} className="relative w-16 h-20 rounded-md overflow-hidden bg-beige group/photo">
              <a href={p.src} target="_blank" rel="noopener noreferrer" title={`${p.folder ? `${p.folder}/` : ""}${p.name}`}>
                <img src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
              </a>
              {editable && (
                <div className="absolute inset-x-0 top-0 flex justify-between p-0.5 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                  {i > 0 ? (
                    <button disabled={busy} onClick={() => act(() => ImportApi.split(g.id, p.id))} title="A new saree starts from this photo" className="w-5 h-5 rounded bg-charcoal/75 text-ivory flex items-center justify-center">
                      <Scissors size={11} />
                    </button>
                  ) : <span />}
                  <span className="flex gap-0.5">
                    <button
                      disabled={busy}
                      onClick={() => {
                        const n = window.prompt("This photo belongs to which saree? Enter the saree number:");
                        if (n && Number(n) > 0) act(() => ImportApi.movePhoto(p.id, Number(n)));
                      }}
                      title="Move to another saree"
                      className="w-5 h-5 rounded bg-charcoal/75 text-ivory flex items-center justify-center"
                    >
                      <MoveRight size={11} />
                    </button>
                    <button disabled={busy} onClick={() => act(() => ImportApi.removePhoto(p.id))} title="Remove this photo" className="w-5 h-5 rounded bg-charcoal/75 text-ivory flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {g.product && (
          <div className="flex items-center gap-3 pl-4 border-l border-charcoal/10">
            <div className="flex gap-1.5">
              {g.product.images.map((img) => (
                <img key={img.src} src={img.src} alt={img.label} title={img.label} className="w-16 h-24 rounded-md object-cover bg-beige" />
              ))}
            </div>
            <div className="max-w-[200px]">
              <p className="text-sm font-medium leading-snug">{g.product.name}</p>
              <Link to={`/admin/products/${g.product.id}/edit`} className="text-xs text-wine hover:underline">
                {g.product.status === "draft" ? "Review draft" : "Edit product"} &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
