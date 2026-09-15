import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, PhoneCall } from "lucide-react";
import { ScheduleCallApi, type ScheduleCallRequest } from "../../api/content";

export default function AdminScheduleCalls() {
  const [requests, setRequests] = useState<ScheduleCallRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Schedule Requests | Admin";
    reload();
  }, []);

  async function reload() {
    setLoading(true);
    const data = await ScheduleCallApi.list();
    setRequests(data);
    setLoading(false);
  }

  async function handleRemove(id: string) {
    await ScheduleCallApi.remove(id);
    reload();
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold mb-2">Schedule Call Requests</h1>
      <p className="text-sm text-charcoal/50 mb-8">Submitted from the &ldquo;Schedule a Call&rdquo; button on the site.</p>

      <div className="bg-white rounded-xl border border-charcoal/5 overflow-hidden">
        {loading && <p className="text-sm text-charcoal/40 p-6">Loading...</p>}
        {!loading && requests.length === 0 && <p className="text-sm text-charcoal/40 p-6">No requests yet.</p>}
        <div className="divide-y divide-charcoal/5">
          {requests.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 p-5">
              <div className="w-9 h-9 rounded-full bg-wine/10 text-wine flex items-center justify-center shrink-0">
                <PhoneCall size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.name} &middot; {r.phone}</p>
                <p className="text-xs text-charcoal/50 mt-0.5">Preferred: {r.preferredTime}</p>
                {r.notes && <p className="text-xs text-charcoal/45 mt-1">{r.notes}</p>}
                <p className="text-[11px] text-charcoal/35 mt-1.5">{new Date(r.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <a href={`tel:${r.phone}`} className="text-xs px-3 py-1.5 rounded-full border border-wine text-wine hover:bg-wine hover:text-ivory transition-colors shrink-0">Call</a>
              <button onClick={() => handleRemove(r.id)} className="p-2 rounded-lg text-charcoal/35 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0" aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
