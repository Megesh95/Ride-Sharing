import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import type { ActiveRide } from "../types";
import { GradientHeader } from "../components/GradientHeader";
import { Card } from "../components/Card";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/ToastProvider";
import { calculateFare, formatCurrency } from "../utils/fare";

type ActiveRideResponse = {
  activeRide: ActiveRide | null;
};

function formatDuration(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export function ActiveRidePage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fareSoFar, setFareSoFar] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await api.get("/rides/active");
        if (!alive) return;
        const ar = (r.data as ActiveRideResponse).activeRide;
        setActiveRide(ar);
      } catch (err: any) {
        if (!alive) return;
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load active ride" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!activeRide) return;

    const start = new Date(activeRide.startTime).getTime();
    const tick = () => {
      const now = Date.now();
      const seconds = Math.max(0, Math.floor((now - start) / 1000));
      const fare = calculateFare({
        durationSeconds: seconds,
        ratePerMinute: activeRide.ratePerMinute,
        baseFare: activeRide.baseFare,
      });
      setElapsedSeconds(seconds);
      setFareSoFar(fare);
    };

    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [activeRide]);

  const title = useMemo(() => (activeRide ? `Live Ride: ${activeRide.cycleName}` : "Live Ride"), [activeRide]);

  if (loading) {
    return (
      <div className="sbs-page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="sbs-page">
      <GradientHeader title={title} subtitle="Timer updates every second (persistent via backend start_time)" />
      <div style={{ height: 14 }} />

      {!activeRide ? (
        <Card>
          <div style={{ fontWeight: 900 }}>No active ride.</div>
          <div style={{ marginTop: 10, opacity: 0.9 }}>Start a ride from the Nearby Cycles map.</div>
          <div style={{ marginTop: 12 }}>
            <button className="sbs-btn" type="button" onClick={() => navigate("/map")}>
              Browse cycles
            </button>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Ride Status</div>
            <div style={{ marginTop: 10, opacity: 0.95 }}>
              Start:{" "}
              {new Date(activeRide.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ marginTop: 8 }}>
              Elapsed: <b style={{ fontSize: 20 }}>{formatDuration(elapsedSeconds)}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              Rate: {activeRide.ratePerMinute.toFixed(2)} / min
            </div>
            <div style={{ marginTop: 8 }}>
              Fare so far: <b style={{ fontSize: 20 }}>{formatCurrency(fareSoFar)}</b>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => navigate("/end-ride")}>
                End Ride
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

