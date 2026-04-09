import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import type { ActiveRide } from "../types";
import { GradientHeader } from "../components/GradientHeader";
import { Card } from "../components/Card";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/ToastProvider";
import { calculateFare, formatCurrency } from "../utils/fare";

type ActiveRideResponse = { activeRide: ActiveRide | null };

function formatDuration(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export function EndRidePage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fareSoFar, setFareSoFar] = useState(0);
  const [ending, setEnding] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [completed, setCompleted] = useState<{ fare: number; durationSeconds: number } | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await api.get("/rides/active");
        if (!alive) return;
        setActiveRide((r.data as ActiveRideResponse).activeRide);
      } catch (err: any) {
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
    let alive = true;
    async function loadWallet() {
      try {
        const r = await api.get("/wallet/balance");
        if (!alive) return;
        setWalletBalance(Number(r.data.balance));
      } catch {
        // Non-blocking for end ride screen.
      }
    }
    loadWallet();
    return () => {
      alive = false;
    };
  }, []);

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

  async function endRide() {
    setEnding(true);
    try {
      const r = await api.post("/rides/end");
      const fare = Number(r.data?.fare ?? fareSoFar);
      const durationSeconds = Number(r.data?.durationSeconds ?? elapsedSeconds);
      setCompleted({ fare, durationSeconds });
      const walletR = await api.get("/wallet/balance");
      setWalletBalance(Number(walletR.data.balance));
      toast.pushToast({ type: "success", message: "Ride ended. Fare deducted from wallet." });
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Could not end ride" });
    } finally {
      setEnding(false);
    }
  }

  if (loading) {
    return (
      <div className="sbs-page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="sbs-page">
      <GradientHeader title="End Ride" subtitle="Review fare and confirm" />
      <div style={{ height: 14 }} />

      {!activeRide ? (
        <Card>
          <div style={{ fontWeight: 900 }}>No active ride found.</div>
          <div style={{ marginTop: 10 }}>
            <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => navigate("/map")}>
              Browse cycles
            </button>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {!completed ? (
            <>
              <Card>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{activeRide.cycleName}</div>
                <div style={{ marginTop: 8, opacity: 0.95 }}>
                  Duration: <b>{formatDuration(elapsedSeconds)}</b>
                </div>
                <div style={{ marginTop: 8, opacity: 0.95 }}>
                  Rate: {activeRide.ratePerMinute.toFixed(2)} / min
                </div>
                <div style={{ marginTop: 8 }}>
                  Estimated fare: <b style={{ fontSize: 20 }}>{formatCurrency(fareSoFar)}</b>
                </div>
              </Card>

              <Card>
                <button className="sbs-btn" type="button" onClick={endRide} disabled={ending}>
                  {ending ? "Ending..." : "Confirm & End Ride"}
                </button>
                <div style={{ height: 10 }} />
                <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => navigate("/active-ride")} disabled={ending}>
                  Back to Live Ride
                </button>
              </Card>
            </>
          ) : (
            <Card style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Ride Completed</div>
                <div style={{ fontWeight: 700, color: "#64748b" }}>{new Date().toLocaleDateString()}</div>
              </div>
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                <div
                  style={{
                    minHeight: 90,
                    background:
                      "linear-gradient(120deg, rgba(59,130,246,.2) 0%, rgba(99,102,241,.24) 50%, rgba(14,165,233,.22) 100%)",
                    display: "grid",
                    placeItems: "center",
                    color: "#1e3a8a",
                    fontWeight: 800,
                  }}
                >
                  Thanks for riding {activeRide.cycleName}
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Time</span>
                  <b>{formatDuration(completed.durationSeconds)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Rate</span>
                  <b>{formatCurrency(activeRide.ratePerMinute)}/min</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Distance (est.)</span>
                  <b>{(completed.durationSeconds / 60 * 0.35).toFixed(1)} km</b>
                </div>
              </div>

              <div style={{ height: 12 }} />
              <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 10 }}>
                <div style={{ fontWeight: 900, marginBottom: 8, color: "#334155" }}>Billing</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Charge</span>
                  <b>{formatCurrency(completed.fare)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ color: "#64748b" }}>Discount</span>
                  <b>NIL</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ color: "#1e40af", fontWeight: 800 }}>Total Ride Cost</span>
                  <b style={{ color: "#1e40af" }}>{formatCurrency(completed.fare)}</b>
                </div>
              </div>

              <div style={{ height: 12 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748b" }}>Wallet Balance</span>
                <b>{formatCurrency(walletBalance ?? 0)}</b>
              </div>

              <div style={{ height: 12 }} />
              <div className="sbs-row">
                <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => navigate("/wallet")}>
                  Wallet
                </button>
                <button className="sbs-btn" type="button" onClick={() => navigate("/trip-history")}>
                  View History
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

