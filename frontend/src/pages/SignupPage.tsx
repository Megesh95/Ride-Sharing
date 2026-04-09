import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useToast } from "../components/ToastProvider";
import { Spinner } from "../components/Spinner";
import { MobilePage } from "../components/MobilePage";
import { UIButton, UICard } from "../components/ui";

export function SignupPage() {
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signup(name, email, password);
      toast.pushToast({ type: "success", message: "Account created. Welcome!" });
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? "Signup failed";
      toast.pushToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobilePage>
      <div className="gradient-primary rounded-2xl p-5 text-white shadow-lg">
        <div className="text-xl font-bold">Create Account</div>
        <div className="mt-1 text-sm opacity-90">Join CampusCycle in one minute</div>
      </div>
      <UICard className="mt-3">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
            <input className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a strong password" />
          </div>
          <UIButton disabled={loading} type="submit">{loading ? <Spinner /> : "Sign up"}</UIButton>
          <div className="text-center text-sm text-slate-500">
            Already have an account? <a href="/login" className="font-semibold text-indigo-600">Login</a>
          </div>
        </form>
      </UICard>
    </MobilePage>
  );
}

