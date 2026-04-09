import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useToast } from "../components/ToastProvider";
import { Spinner } from "../components/Spinner";
import { MobilePage } from "../components/MobilePage";
import { UIButton, UICard } from "../components/ui";

export function LoginPage() {
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.login(email, password);
      toast.pushToast({ type: "success", message: "Logged in successfully" });
      navigate(auth.role === "admin" ? "/admin" : "/");
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? "Login failed";
      toast.pushToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobilePage>
      <div className="gradient-primary rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 text-lg font-semibold"><CircleUserRound size={18} /> CampusCycle</div>
        <div className="mt-2 text-2xl font-bold">Welcome back</div>
      </div>
      <UICard className="mt-3">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <UIButton disabled={loading} type="submit">
            {loading ? <Spinner /> : "Login"}
          </UIButton>
          <div className="text-center text-sm text-slate-500">
            New here? <a href="/signup" className="font-semibold text-indigo-600">Create an account</a>
          </div>
        </form>
      </UICard>
    </MobilePage>
  );
}

