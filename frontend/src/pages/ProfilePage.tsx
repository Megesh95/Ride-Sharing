import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut, Mail, Phone, Wallet } from "lucide-react";
import { api } from "../apiClient";
import { useAuth } from "../AuthContext";
import { useToast } from "../components/ToastProvider";
import { formatCurrency } from "../utils/fare";
import { MobilePage } from "../components/MobilePage";
import { UIButton, UICard, UIListItem, UISkeleton } from "../components/ui";
import type { Booking, User } from "../types";

type MeResponse = {
  user: User;
  wallet: { balance: number };
  bookings: Booking[];
  activeRide: any;
};

export function ProfilePage() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await api.get("/users/me");
        if (!alive) return;
        setMe(r.data as MeResponse);
      } catch (err: any) {
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load profile" });
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
        <UISkeleton className="h-40" />
        <UISkeleton className="mt-3 h-32" />
      </MobilePage>
    );
  }

  if (!me) return null;

  return (
    <MobilePage>
      <UICard className="gradient-primary p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/20 p-2">
            <CircleUserRound size={28} />
          </div>
          <div>
            <div className="text-lg font-bold">{me.user.name}</div>
            <div className="text-sm opacity-90">{me.user.email}</div>
          </div>
        </div>
      </UICard>

      <UICard className="mt-3 gradient-primary p-4 text-white">
        <div className="mb-2 text-sm opacity-90">Wallet Balance</div>
        <div className="text-2xl font-bold">{formatCurrency(me.wallet.balance)}</div>
        <UIButton className="mt-3 rounded-full bg-white text-emerald-700" onClick={() => navigate("/wallet")}>
          <Wallet size={14} className="mr-1 inline" /> Wallet
        </UIButton>
      </UICard>

      <div className="mt-3 grid gap-2">
        <UIListItem title="Name" subtitle={me.user.name} icon={<CircleUserRound size={16} />} />
        <UIListItem title="Email" subtitle={me.user.email} icon={<Mail size={16} />} />
        <UIListItem title="Phone" subtitle="+91 98xxxxxx21" icon={<Phone size={16} />} />
      </div>

      <UICard className="mt-3">
        <div className="mb-2 text-sm font-semibold">Recent Booking History</div>
        <div className="grid gap-2">
          {me.bookings.slice(0, 4).map((b) => (
            <UIListItem key={b.id} title={b.cycle_name ?? `Cycle #${b.cycle_id}`} subtitle={new Date(b.start_time).toLocaleString()} right={<span className="text-xs font-semibold text-slate-500">{b.status}</span>} />
          ))}
          {me.bookings.length === 0 ? <div className="text-sm text-slate-500">No bookings yet.</div> : null}
        </div>
      </UICard>

      <div className="mt-3 grid gap-2">
        <UIButton variant="secondary" onClick={() => navigate("/trip-history")}>Trip History</UIButton>
        <UIButton variant="secondary" onClick={() => navigate("/bookings")}>View all bookings</UIButton>
        {me.user.role === "admin" ? <UIButton onClick={() => navigate("/admin")}>Admin Dashboard</UIButton> : null}
        <UIButton
          variant="danger"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={14} className="mr-1 inline" /> Logout
        </UIButton>
      </div>
    </MobilePage>
  );
}

