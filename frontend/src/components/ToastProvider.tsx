import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  pushToast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    const toast: Toast = { ...t, id };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      <div className="pointer-events-none fixed left-1/2 top-3 z-[100] w-[calc(100%-18px)] max-w-[402px] -translate-x-1/2 md:max-w-[780px]">
        {toasts.map((t) => (
          <div
            className="pointer-events-auto mb-2 rounded-2xl px-3 py-2 text-sm font-medium text-white shadow-lg"
            key={t.id}
            style={{
              background:
                t.type === "success"
                  ? "linear-gradient(120deg,#059669,#0d9488)"
                  : t.type === "error"
                    ? "linear-gradient(120deg,#ef4444,#dc2626)"
                    : "linear-gradient(120deg,#2563eb,#0891b2)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  );
}

