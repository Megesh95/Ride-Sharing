import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { api } from "../apiClient";
import { useToast } from "../components/ToastProvider";
import { MobilePage } from "../components/MobilePage";
import { UIButton, UICard, UIListItem, UISkeleton } from "../components/ui";
import { formatCurrency } from "../utils/fare";

type Tx = { id: number; amount: number; type: "credit" | "debit"; created_at: string };

export function WalletPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Tx[]>([]);

  const [amount, setAmount] = useState<number>(50);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [balR, txR] = await Promise.all([api.get("/wallet/balance"), api.get("/wallet/transactions")]);
        if (!alive) return;
        setBalance(balR.data.balance);
        setTransactions(txR.data.transactions as Tx[]);
      } catch (err: any) {
        toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load wallet" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [toast]);

  async function addMoney() {
    setAdding(true);
    try {
      const r = await api.post("/wallet/add", { amount });
      setBalance(r.data.balance);
      const txR = await api.get("/wallet/transactions");
      setTransactions(txR.data.transactions as Tx[]);
      toast.pushToast({ type: "success", message: "Money added to wallet." });
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Could not add money" });
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <MobilePage>
        <UISkeleton className="h-32" />
        <UISkeleton className="mt-3 h-24" />
      </MobilePage>
    );
  }

  const totalSpent = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
  const totalTx = transactions.length;

  return (
    <MobilePage>
      <UICard className="gradient-primary p-5 text-white">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-sm opacity-90">Wallet Balance</div>
            <div className="mt-1 text-3xl font-bold">₹{Number(balance).toFixed(2)}</div>
          </div>
          <Wallet size={20} />
        </div>
        <div className="flex gap-2">
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-xl bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70" />
          <UIButton className="rounded-full bg-white px-4 py-2 text-emerald-700" onClick={addMoney} disabled={adding}>
            {adding ? "Adding..." : "Add Money"}
          </UIButton>
        </div>
      </UICard>

      <UICard className="mt-3 grid grid-cols-2 gap-2 p-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-slate-500">Total spent</div>
          <div className="text-lg font-bold text-red-600">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-slate-500">Total transactions</div>
          <div className="text-lg font-bold text-indigo-700">{totalTx}</div>
        </div>
      </UICard>

      <div className="mt-3 text-sm font-semibold text-slate-700">Transactions</div>
      <div className="mt-2 grid gap-2">
        {transactions.length === 0 ? (
          <UICard>
            <div className="text-sm text-slate-500">No transactions yet.</div>
          </UICard>
        ) : (
          transactions.map((t) => (
            <UIListItem
              key={t.id}
              title={t.type === "credit" ? "Wallet Top-up" : "Ride Payment"}
              subtitle={new Date(t.created_at).toLocaleString()}
              icon={t.type === "credit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              right={<span className={`text-sm font-semibold ${t.type === "debit" ? "text-red-600" : "text-emerald-700"}`}>{formatCurrency(t.amount)}</span>}
            />
          ))
        )}
      </div>
    </MobilePage>
  );
}

