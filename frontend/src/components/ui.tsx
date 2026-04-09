import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

export function UIButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const base =
    "rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
  const styles: Record<ButtonVariant, string> = {
    primary: "gradient-primary text-white shadow-md hover:brightness-110",
    secondary: "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function UICard({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl bg-white p-4 shadow-md ${className}`} {...props} />;
}

export function UIBadge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "secondary" | "negative";
  className?: string;
}) {
  const styles: Record<string, string> = {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-emerald-100 text-emerald-700",
    secondary: "bg-indigo-100 text-indigo-700",
    negative: "bg-red-100 text-red-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]} ${className}`}>{children}</span>;
}

export function UIListItem({
  title,
  subtitle,
  right,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? <div className="text-emerald-600">{icon}</div> : null}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">{title}</div>
          {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

export function UISkeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

