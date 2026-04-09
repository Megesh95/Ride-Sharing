import React from "react";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="sbs-card" style={{ padding: 14, ...style }}>
      {children}
    </div>
  );
}

