import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../apiClient";
import type { Cycle } from "../types";
import { GradientHeader } from "../components/GradientHeader";
import { Card } from "../components/Card";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/ToastProvider";
import { formatCurrency } from "../utils/fare";

type CycleResponse = { cycle: Cycle };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function nextHalfHour() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + (30 - (d.getMinutes() % 30)) % 30);
  d.setSeconds(0, 0);
  return d;
}

export function CycleDetailsPage() {
  const { id } = useParams();
  const cycleId = Number(id);
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<Cycle | null>(null);

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const nh = nextHalfHour();
  const defaultTime = `${pad2(nh.getHours())}:${pad2(nh.getMinutes())}`;

  const [dateStr, setDateStr] = useState(defaultDate);
  const [timeStr, setTimeStr] = useState(defaultTime);
  const [bookingLoading, setBookingLoading] = useState(false);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 9; h <= 20; h++) {
      slots.push(`${pad2(h)}:00`);
      slots.push(`${pad2(h)}:30`);
    }
    return slots;
  }, []);

  const bookingStartTimeISO = useMemo(() => {
    const [yy, mm, dd] = dateStr.split("-").map(Number);
    const [hh, min] = timeStr.split(":").map(Number);
    const dt = new Date(yy, mm - 1, dd, hh, min, 0, 0);
    return dt.toISOString();
  }, [dateStr, timeStr]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await api.get(`/cycles/${cycleId}`);
        if (!alive) return;
        setCycle(r.data.cycle as CycleResponse["cycle"]);
      } catch (err: any) {
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load cycle" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [cycleId, toast]);

  async function startRide() {
    try {
      await api.post("/rides/start", { cycleId });
      toast.pushToast({ type: "success", message: "Ride started. Unlock confirmed." });
      navigate("/active-ride");
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Could not start ride" });
    }
  }

  async function book() {
    if (!cycle) return;
    setBookingLoading(true);
    try {
      await api.post("/bookings", { cycleId, startTime: bookingStartTimeISO });
      toast.pushToast({ type: "success", message: "Booking saved." });
      navigate("/bookings");
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Booking failed" });
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading || !cycle) {
    return (
      <div className="sbs-page">
        <Spinner />
      </div>
    );
  }

  const rate = cycle.location.ratePerMinute ?? 0;
  const statusDisabled = cycle.status === "unavailable";

  return (
    <div className="sbs-page">
      <GradientHeader title={cycle.name} subtitle={`Type: ${cycle.location.type} • ${cycle.status}`} />
      <div style={{ height: 14 }} />

      <div style={{ display: "grid", gap: 12 }}>
        <Card>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <b>Location</b>: {cycle.location.lat.toFixed(4)}, {cycle.location.lng.toFixed(4)}
            </div>
            <div>
              <b>Rate</b>: {formatCurrency(rate)} / min
            </div>
            <div>
              <b>Status</b>: {cycle.status}
            </div>
          </div>
        </Card>

        <Card>
          <button className="sbs-btn" type="button" onClick={startRide} disabled={statusDisabled}>
            {statusDisabled ? "Cycle unavailable" : "Unlock & Start Ride"}
          </button>
          <div style={{ height: 10 }} />
          <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => navigate("/map")}>
            Back to Nearby Cycles
          </button>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Book in Advance</div>
          <div className="sbs-row">
            <div className="sbs-col">
              <div style={{ marginBottom: 6, opacity: 0.9 }}>Date</div>
              <input className="sbs-input" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>
            <div className="sbs-col">
              <div style={{ marginBottom: 6, opacity: 0.9 }}>Time slot</div>
              <select className="sbs-select" value={timeStr} onChange={(e) => setTimeStr(e.target.value)}>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ height: 12 }} />
          <button className="sbs-btn" type="button" onClick={book} disabled={statusDisabled || bookingLoading}>
            {bookingLoading ? "Saving..." : "Confirm Booking"}
          </button>
          <div style={{ marginTop: 8, opacity: 0.85, fontSize: 14 }}>
            Booking time: {new Date(bookingStartTimeISO).toLocaleString()}
          </div>
        </Card>
      </div>
    </div>
  );
}

