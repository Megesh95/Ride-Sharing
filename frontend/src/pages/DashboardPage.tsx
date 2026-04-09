import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bike, BookMarked, Clock3, Wallet } from "lucide-react";
import { api } from "../apiClient";
import { useToast } from "../components/ToastProvider";
import { formatCurrency } from "../utils/fare";
import { MobilePage } from "../components/MobilePage";
import { UIButton, UICard, UISkeleton } from "../components/ui";

type MeResponse = {
  user: { id: number; name: string; email: string; role: "user" | "admin" };
  wallet: { balance: number };
  bookings: Array<{ id: number; cycle_id: number; cycle_name?: string; start_time: string; status: string }>;
  activeRide: { rideId: number } | null;
};

export function DashboardPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await api.get("/users/me");
        if (!alive) return;
        setMe(r.data);
        const c = await api.get("/cycles", { params: { distanceKm: 8, type: undefined } });
        setCycleCount(Array.isArray(c.data.cycles) ? c.data.cycles.length : 0);
      } catch (err: any) {
        if (!alive) return;
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load dashboard" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [toast]);

  if (loading) {
    return (
      <MobilePage>
        <UISkeleton className="mb-3 h-28" />
        <UISkeleton className="mb-3 h-28" />
        <UISkeleton className="h-24" />
      </MobilePage>
    );
  }

  const balance = me?.wallet.balance ?? 0;
  const activeRide = me?.activeRide;
  const bookingCount = me?.bookings.length ?? 0;

  return (
    <MobilePage>
      <div className="gradient-primary rounded-2xl p-5 text-white shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold opacity-90">CampusCycle Dashboard</div>
            <div className="mt-1 text-xl font-bold">Hi, {me?.user.name ?? "Rider"} 👋</div>
          </div>
          <div className="rounded-xl bg-white/20 p-2">
            <Wallet size={18} />
          </div>
        </div>
      </div>

      <UICard className="mt-3 gradient-primary p-5 text-white">
        <div className="text-sm font-medium opacity-90">Wallet Balance</div>
        <div className="mt-1 text-3xl font-bold">₹{Number(balance).toFixed(2)}</div>
        <UIButton className="mt-3 rounded-full bg-white text-emerald-700 hover:bg-emerald-50" onClick={() => navigate("/wallet")}>
          Add Money
        </UIButton>
      </UICard>

      <UICard className="mt-3 grid grid-cols-3 gap-2 p-3">
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-700">{cycleCount}</div>
          <div className="text-[11px] text-slate-500">Available cycles</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-teal-700">{activeRide ? 1 : 0}</div>
          <div className="text-[11px] text-slate-500">Active rides</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-700">2 min</div>
          <div className="text-[11px] text-slate-500">Avg wait time</div>
        </div>
      </UICard>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <UICard className="cursor-pointer p-4 hover:shadow-lg" onClick={() => navigate("/map")}>
          <Bike className="mb-2 text-emerald-600" size={20} />
          <div className="text-sm font-semibold">Find Cycles</div>
          <div className="mt-1 text-xs text-slate-500">Locate nearest bikes</div>
        </UICard>
        <UICard className="cursor-pointer p-4 hover:shadow-lg" onClick={() => navigate("/bookings")}>
          <BookMarked className="mb-2 text-indigo-600" size={20} />
          <div className="text-sm font-semibold">Book Ahead</div>
          <div className="mt-1 text-xs text-slate-500">Reserve by time slot</div>
        </UICard>
      </div>

      <div className="mt-3 grid gap-3">
        <UICard className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Trip Insights</div>
            <Clock3 size={16} className="text-slate-400" />
          </div>
          <div className="text-xs text-slate-500">Bookings this week: {bookingCount}</div>
          <div className="mt-1 text-xs text-slate-500">Active ride status: {activeRide ? "On ride" : "Idle"}</div>
        </UICard>
        <UICard className="p-4">
          <div className="mb-2 text-sm font-semibold">Wallet Summary</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Current balance</span>
            <span className="font-semibold text-emerald-700">{formatCurrency(balance)}</span>
          </div>
          <UIButton variant="secondary" className="mt-3 w-full" onClick={() => navigate("/wallet")}>
            Open Wallet <ArrowRight size={14} className="ml-1 inline" />
          </UIButton>
        </UICard>
      </div>
    </MobilePage>
  );
}

