import type { ReactNode } from "react";

export function MobilePage({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell px-3 pt-3 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[420px] md:max-w-3xl lg:max-w-5xl">{children}</div>
    </div>
  );
}

