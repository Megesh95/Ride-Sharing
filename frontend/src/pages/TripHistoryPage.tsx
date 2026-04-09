import { useEffect, useState } from "react";
import { api } from "../apiClient";
import type { RideHistoryItem } from "../types";
import { GradientHeader } from "../components/GradientHeader";
import { Card } from "../components/Card";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/ToastProvider";
import { formatCurrency } from "../utils/fare";

export function TripHistoryPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<RideHistoryItem[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await api.get("/rides");
        if (!alive) return;
        setRides(r.data.rides as RideHistoryItem[]);
      } catch (err: any) {
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load trip history" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [toast]);

  function formatDuration(seconds: number) {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    return `${m}m ${sec}s`;
  }

  return (
    <div className="sbs-page">
      <GradientHeader title="Trip History" subtitle="Duration, fare, and ride dates" />
      <div style={{ height: 14 }} />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <Spinner />
        </div>
      ) : rides.length === 0 ? (
        <Card>
          <div style={{ fontWeight: 900 }}>No rides yet.</div>
          <div style={{ marginTop: 12, opacity: 0.9 }}>Start a ride to see it here.</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rides.map((r) => (
            <Card key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900 }}>{r.cycle_name}</div>
                  <div style={{ opacity: 0.9 }}>
                    Date:{" "}
                    <b>
                      {new Date(r.start_time).toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </b>
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    Duration: <b>{formatDuration(r.duration_seconds)}</b>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ opacity: 0.9 }}>Fare</div>
                  <div style={{ fontWeight: 950, fontSize: 20 }}>{formatCurrency(r.fare)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

