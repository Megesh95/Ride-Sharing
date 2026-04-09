import { useEffect, useMemo, useState } from "react";
import { api } from "../apiClient";
import type { Booking, Cycle } from "../types";
import { useToast } from "../components/ToastProvider";
import { GradientHeader } from "../components/GradientHeader";
import { Card } from "../components/Card";
import { Spinner } from "../components/Spinner";

type Summary = { total_users: number; total_rides: number; revenue: number; avg_duration_seconds: number };

export function AdminDashboardPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<{ mostUsedCycles: any[]; peakUsageTimes: any[] } | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"overview" | "cycles" | "bookings">("overview");

  // Cycle add form
  const [addName, setAddName] = useState("");
  const [addLat, setAddLat] = useState(12.9716);
  const [addLng, setAddLng] = useState(77.5946);
  const [addType, setAddType] = useState("standard");
  const [addRate, setAddRate] = useState<number>(2.0);
  const [addStatus, setAddStatus] = useState<Cycle["status"]>("available");
  const [adding, setAdding] = useState(false);

  // Cycle edit form
  const [editingId, setEditingId] = useState<number | null>(null);
  const editing = useMemo(() => cycles.find((c) => c.id === editingId) ?? null, [cycles, editingId]);
  const [editName, setEditName] = useState("");
  const [editLat, setEditLat] = useState(0);
  const [editLng, setEditLng] = useState(0);
  const [editType, setEditType] = useState("standard");
  const [editRate, setEditRate] = useState<number>(2.0);
  const [editStatus, setEditStatus] = useState<Cycle["status"]>("available");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [dashR, anR, cyclesR, bookingsR] = await Promise.all([
          api.get("/users/admin/dashboard"),
          api.get("/users/admin/analytics"),
          api.get("/cycles/admin"),
          api.get("/bookings/all"),
        ]);
        if (!alive) return;
        setSummary(dashR.data as Summary);
        setAnalytics(anR.data);
        setCycles(cyclesR.data.cycles as Cycle[]);
        setBookings(bookingsR.data.bookings as Booking[]);
      } catch (err: any) {
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load admin dashboard" });
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
    if (!editing) return;
    setEditName(editing.name);
    setEditLat(editing.location.lat);
    setEditLng(editing.location.lng);
    setEditType(editing.location.type);
    setEditRate(editing.location.ratePerMinute ?? 2.0);
    setEditStatus(editing.status);
  }, [editing]);

  async function refreshCyclesAndBookings() {
    try {
      const [cyclesR, bookingsR] = await Promise.all([api.get("/cycles/admin"), api.get("/bookings/all")]);
      setCycles(cyclesR.data.cycles as Cycle[]);
      setBookings(bookingsR.data.bookings as Booking[]);
    } catch {
      // keep stale data if refresh fails
    }
  }

  async function addCycle() {
    setAdding(true);
    try {
      const payload = {
        name: addName,
        status: addStatus,
        location: {
          lat: addLat,
          lng: addLng,
          type: addType,
          ratePerMinute: addRate,
        },
      };
      await api.post("/cycles", payload);
      toast.pushToast({ type: "success", message: "Cycle added." });
      setAddName("");
      await refreshCyclesAndBookings();
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to add cycle" });
    } finally {
      setAdding(false);
    }
  }

  async function updateCycle() {
    if (!editingId) return;
    try {
      const payload = {
        name: editName,
        status: editStatus,
        location: { lat: editLat, lng: editLng, type: editType, ratePerMinute: editRate },
      };
      await api.put(`/cycles/${editingId}`, payload);
      toast.pushToast({ type: "success", message: "Cycle updated." });
      setEditingId(null);
      await refreshCyclesAndBookings();
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to update cycle" });
    }
  }

  async function deleteCycle(cycleId: number) {
    if (!window.confirm("Delete this cycle?")) return;
    try {
      await api.delete(`/cycles/${cycleId}`);
      toast.pushToast({ type: "success", message: "Cycle deleted." });
      setEditingId(null);
      await refreshCyclesAndBookings();
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to delete cycle" });
    }
  }

  async function setCycleStatus(cycleId: number, status: Cycle["status"]) {
    try {
      await api.patch(`/cycles/${cycleId}/status`, { status });
      toast.pushToast({ type: "success", message: `Cycle status set to ${status}` });
      await refreshCyclesAndBookings();
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to update status" });
    }
  }

  if (loading) {
    return (
      <div className="sbs-page">
        <Spinner />
      </div>
    );
  }

  if (!summary || !analytics) return null;

  return (
    <div className="sbs-page">
      <GradientHeader title="Admin Dashboard" subtitle="Users, rides, revenue, cycle management, and analytics" />
      <div style={{ height: 14 }} />

      <div className="sbs-row" style={{ marginBottom: 12 }}>
        <button className="sbs-btn sbs-btn-secondary" style={{ width: "auto" }} type="button" onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className="sbs-btn sbs-btn-secondary" style={{ width: "auto" }} type="button" onClick={() => setTab("cycles")}>
          Cycle Management
        </button>
        <button className="sbs-btn sbs-btn-secondary" style={{ width: "auto" }} type="button" onClick={() => setTab("bookings")}>
          Booking Management
        </button>
      </div>

      {tab === "overview" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Platform KPIs</div>
            <div className="sbs-row">
              <div className="sbs-col">
                <div style={{ opacity: 0.9 }}>Total users</div>
                <div style={{ fontWeight: 950, fontSize: 24 }}>{summary.total_users}</div>
              </div>
              <div className="sbs-col">
                <div style={{ opacity: 0.9 }}>Total rides</div>
                <div style={{ fontWeight: 950, fontSize: 24 }}>{summary.total_rides}</div>
              </div>
            </div>
            <div style={{ height: 8 }} />
            <div className="sbs-row">
              <div className="sbs-col">
                <div style={{ opacity: 0.9 }}>Revenue</div>
                <div style={{ fontWeight: 950, fontSize: 24 }}>${Number(summary.revenue).toFixed(2)}</div>
              </div>
              <div className="sbs-col">
                <div style={{ opacity: 0.9 }}>Avg duration</div>
                <div style={{ fontWeight: 950, fontSize: 24 }}>
                  {Math.round(summary.avg_duration_seconds / 60)} min
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Analytics</div>
            <div style={{ opacity: 0.9, marginBottom: 8 }}>Most used cycles</div>
            <div style={{ display: "grid", gap: 8 }}>
              {(analytics.mostUsedCycles as any[]).map((c) => (
                <div key={c.cycle_id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>{c.cycle_name}</div>
                  <div style={{ fontWeight: 900 }}>{c.usage_count} rides</div>
                </div>
              ))}
              {(analytics.mostUsedCycles as any[]).length === 0 ? <div style={{ opacity: 0.85 }}>No ride data yet.</div> : null}
            </div>

            <div style={{ height: 14 }} />
            <div style={{ opacity: 0.9, marginBottom: 8 }}>Peak usage times (hour of day)</div>
            <div style={{ display: "grid", gap: 8 }}>
              {(analytics.peakUsageTimes as any[]).map((p) => (
                <div key={p.hour_of_day} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>{String(p.hour_of_day).padStart(2, "0")}:00</div>
                  <div style={{ fontWeight: 900 }}>{p.rides_count} rides</div>
                </div>
              ))}
              {(analytics.peakUsageTimes as any[]).length === 0 ? <div style={{ opacity: 0.85 }}>No ride data yet.</div> : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "cycles" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Add Cycle</div>
            <div style={{ display: "grid", gap: 10 }}>
              <input className="sbs-input" placeholder="Cycle name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <div className="sbs-row">
                <input className="sbs-input" type="number" step="0.0001" value={addLat} onChange={(e) => setAddLat(Number(e.target.value))} placeholder="lat" />
                <input className="sbs-input" type="number" step="0.0001" value={addLng} onChange={(e) => setAddLng(Number(e.target.value))} placeholder="lng" />
              </div>
              <div className="sbs-row">
                <select className="sbs-select" value={addType} onChange={(e) => setAddType(e.target.value)}>
                  <option value="standard">standard</option>
                  <option value="premium">premium</option>
                  <option value="electric">electric</option>
                </select>
                <input className="sbs-input" type="number" step="0.1" value={addRate} onChange={(e) => setAddRate(Number(e.target.value))} placeholder="ratePerMinute" />
              </div>
              <select className="sbs-select" value={addStatus} onChange={(e) => setAddStatus(e.target.value as Cycle["status"])}>
                <option value="available">available</option>
                <option value="reserved">reserved</option>
                <option value="active">active</option>
                <option value="unavailable">unavailable</option>
              </select>
              <button className="sbs-btn" type="button" onClick={addCycle} disabled={adding || !addName.trim()}>
                {adding ? "Adding..." : "Add Cycle"}
              </button>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Manage Cycles</div>
            <div style={{ display: "grid", gap: 12 }}>
              {cycles.map((c) => (
                <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 950 }}>{c.name}</div>
                      <div style={{ opacity: 0.9, fontSize: 13, marginTop: 4 }}>
                        {c.location.lat.toFixed(3)}, {c.location.lng.toFixed(3)} • {c.location.type}
                      </div>
                      <div style={{ opacity: 0.9, fontSize: 13, marginTop: 4 }}>
                        Rate: {c.location.ratePerMinute ?? 0}/min • Status: <b>{c.status}</b>
                      </div>
                    </div>
                    <div style={{ width: 190, display: "grid", gap: 8 }}>
                      <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => setEditingId(c.id)}>
                        Edit
                      </button>
                      <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => setCycleStatus(c.id, c.status === "available" ? "unavailable" : "available")}>
                        Toggle availability
                      </button>
                      <button className="sbs-btn" type="button" onClick={() => deleteCycle(c.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cycles.length === 0 ? <div style={{ opacity: 0.9 }}>No cycles yet.</div> : null}
            </div>
          </Card>

          {editingId ? (
            <Card>
              <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Update Cycle #{editingId}</div>
              <div style={{ display: "grid", gap: 10 }}>
                <input className="sbs-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Cycle name" />
                <div className="sbs-row">
                  <input className="sbs-input" type="number" step="0.0001" value={editLat} onChange={(e) => setEditLat(Number(e.target.value))} placeholder="lat" />
                  <input className="sbs-input" type="number" step="0.0001" value={editLng} onChange={(e) => setEditLng(Number(e.target.value))} placeholder="lng" />
                </div>
                <div className="sbs-row">
                  <select className="sbs-select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                    <option value="standard">standard</option>
                    <option value="premium">premium</option>
                    <option value="electric">electric</option>
                  </select>
                  <input className="sbs-input" type="number" step="0.1" value={editRate} onChange={(e) => setEditRate(Number(e.target.value))} placeholder="ratePerMinute" />
                </div>
                <select className="sbs-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value as Cycle["status"])}>
                  <option value="available">available</option>
                  <option value="reserved">reserved</option>
                  <option value="active">active</option>
                  <option value="unavailable">unavailable</option>
                </select>
                <button className="sbs-btn" type="button" onClick={updateCycle}>
                  Save Updates
                </button>
                <button className="sbs-btn sbs-btn-secondary" type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "bookings" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>All Bookings</div>
            {bookings.length === 0 ? (
              <div style={{ opacity: 0.9 }}>No bookings yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bookings.slice(0, 50).map((b: any) => (
                  <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
                    <div style={{ fontWeight: 950 }}>
                      {b.cycle_name ?? `Cycle #${b.cycle_id}`} • {b.user_name ?? `User #${b.user_id}`}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 13, marginTop: 4 }}>
                      Start: {new Date(b.start_time).toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 13, marginTop: 4 }}>
                      Status: <b>{b.status}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

