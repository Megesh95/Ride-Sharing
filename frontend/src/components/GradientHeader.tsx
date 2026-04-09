export function GradientHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="sbs-gradient-header">
      <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
      {subtitle ? <div style={{ marginTop: 6, opacity: 0.95 }}>{subtitle}</div> : null}
    </div>
  );
}

