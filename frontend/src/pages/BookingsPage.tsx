import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3 } from "lucide-react";
import { api } from "../apiClient";
import type { Booking, Cycle } from "../types";
import { useToast } from "../components/ToastProvider";
import { MobilePage } from "../components/MobilePage";
import { UIBadge, UIButton, UICard, UISkeleton } from "../components/ui";

export function BookingsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState("09:00");
  const [creating, setCreating] = useState(false);
  const slots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  async function refresh() {
    const [r, c] = await Promise.all([api.get("/bookings"), api.get("/cycles", { params: { distanceKm: 10 } })]);
    setBookings(r.data.bookings as Booking[]);
    const cycleList = c.data.cycles as Cycle[];
    setCycles(cycleList);
    if (cycleList.length > 0 && !selectedCycleId) setSelectedCycleId(cycleList[0].id);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err: any) {
        if (!alive) return;
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load bookings" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  async function createAdvanceBooking() {
    if (!selectedCycleId) return;
    setCreating(true);
    try {
      const startTime = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      await api.post("/bookings", { cycleId: selectedCycleId, startTime });
      await refresh();
      toast.pushToast({ type: "success", message: "Booking confirmed." });
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to create booking" });
    } finally {
      setCreating(false);
    }
  }

  async function startRide(cycleId: number) {
    try {
      await api.post("/rides/start", { cycleId });
      toast.pushToast({ type: "success", message: "Ride started." });
      navigate("/active-ride");
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Could not start ride" });
    }
  }

  const now = Date.now();

  if (loading) {
    return (
      <MobilePage>
        <UISkeleton className="h-28" />
        <UISkeleton className="mt-3 h-44" />
      </MobilePage>
    );
  }

  return (
    <MobilePage>
      <div className="gradient-primary rounded-2xl p-5 text-white shadow-lg">
        <div className="text-xl font-bold">Advance Booking</div>
        <div className="mt-1 text-sm opacity-90">Reserve your cycle by date and slot</div>
      </div>

      <UICard className="mt-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CalendarDays size={16} className="text-emerald-600" /> Select Date
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </UICard>

      <UICard className="mt-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Clock3 size={16} className="text-emerald-600" /> Select Time Slot
        </div>
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <button key={slot} onClick={() => setSelectedSlot(slot)} className={`rounded-xl border px-2 py-2 text-xs font-semibold ${selectedSlot === slot ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-slate-600"}`}>
              {slot}
            </button>
          ))}
        </div>
      </UICard>

      <UICard className="mt-3">
        <div className="mb-3 text-sm font-semibold">Select Cycle</div>
        <div className="grid gap-2">
          {cycles.slice(0, 6).map((cycle) => (
            <button key={cycle.id} onClick={() => setSelectedCycleId(cycle.id)} className={`rounded-2xl border p-3 text-left ${selectedCycleId === cycle.id ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-white"}`}>
              <div className="text-sm font-semibold">{cycle.name}</div>
              <div className="mt-1 text-xs text-slate-500">{cycle.location.type} • {cycle.status}</div>
            </button>
          ))}
        </div>
        <UIButton className="mt-3 w-full" onClick={createAdvanceBooking} disabled={!selectedCycleId || creating}>
          {creating ? "Booking..." : "Confirm Booking"}
        </UIButton>
      </UICard>

      <UICard className="mt-3 border border-emerald-100 bg-emerald-50">
        <div className="text-sm text-emerald-800">No charges for booking. Payment only when you start the ride.</div>
      </UICard>

      <div className="mt-4 text-sm font-semibold text-slate-700">My Bookings</div>
      <div className="mt-2 grid gap-2">
        {bookings.map((b) => {
          const startMs = new Date(b.start_time).getTime();
          const canStart = b.status === "confirmed" && startMs <= now + 30 * 60 * 1000 && startMs >= now - 120 * 60 * 1000;
          return (
            <UICard key={b.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{b.cycle_name ?? `Cycle #${b.cycle_id}`}</div>
                  <div className="text-xs text-slate-500">{new Date(b.start_time).toLocaleString()}</div>
                </div>
                <UIBadge tone={b.status === "confirmed" ? "success" : "neutral"}>{b.status}</UIBadge>
              </div>
              <div className="mt-2 flex gap-2">
                <UIButton variant="secondary" className="flex-1" onClick={() => navigate(`/cycles/${b.cycle_id}`)}>
                  Details
                </UIButton>
                <UIButton className="flex-1" onClick={() => startRide(b.cycle_id)} disabled={!canStart}>
                  Start Ride
                </UIButton>
              </div>
            </UICard>
          );
        })}
      </div>
    </MobilePage>
  );
}

