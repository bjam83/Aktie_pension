export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-[400px]">
        <div className="mb-7 text-center">
          <div className="eyebrow mb-2">Pension &amp; opsparing</div>
          <h1 className="h1">{title}</h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}
