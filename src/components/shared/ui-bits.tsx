import React from "react";
import {
  CheckCircle2, Clock, FileCheck2, FileX2, Hourglass, Minus, OctagonAlert,
  RefreshCw, TriangleAlert, Undo2, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CELL_META, type CellState } from "@/lib/derive";
import wastePhoto from "@/assets/attach-waste-bins.jpg";
import mrfPhoto from "@/assets/attach-mrf-bales.jpg";

/* ---------------- status badge (icon + text, B/W printable) ---------------- */

const TONE_CLASS: Record<string, string> = {
  good: "status-good",
  warn: "status-warn",
  bad: "status-bad",
  info: "status-info",
  neutral: "status-neutral",
};

const CELL_ICONS: Record<CellState, LucideIcon> = {
  cleared: CheckCircle2, escalated: OctagonAlert, sent_back: Undo2,
  out_of_range: TriangleAlert, late: Clock, resubmitted: RefreshCw,
  submitted: FileCheck2, pending: Hourglass, missing: FileX2, na: Minus,
};

export function StatusBadge({ state, className }: { state: CellState; className?: string }) {
  const meta = CELL_META[state];
  const Icon = CELL_ICONS[state];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight", TONE_CLASS[meta.tone], className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{meta.label}</span>
    </span>
  );
}

export function StatusDot({ state }: { state: CellState }) {
  const meta = CELL_META[state];
  const Icon = CELL_ICONS[state];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium", TONE_CLASS[meta.tone])}>
      <Icon className="h-3 w-3" aria-hidden />
      <span className="hidden xl:inline">{meta.label}</span>
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}

/* ---------------- page scaffolding ---------------- */

export function PageHeader({ title, description, actions, kicker }: {
  title: string; description?: string; kicker?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {kicker && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{kicker}</p>}
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, subtitle, actions, children, className, icon: Icon }: {
  title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode;
  className?: string; icon?: LucideIcon;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card shadow-sm", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden />}
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "neutral", icon: Icon }: {
  label: string; value: React.ReactNode; hint?: string; tone?: "neutral" | "good" | "warn" | "bad" | "info"; icon?: LucideIcon;
}) {
  const toneRing: Record<string, string> = {
    neutral: "border-border", good: "border-l-success", warn: "border-l-warning",
    bad: "border-l-danger", info: "border-l-steel",
  };
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3 shadow-sm", toneRing[tone], "border-l-[3px]")}>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: {
  icon?: LucideIcon; title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      {Icon && <Icon className="mb-2 h-8 w-8 text-muted-foreground/60" aria-hidden />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function SampleBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-dashed border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
      <span className="mt-0.5 rounded bg-warning px-1.5 py-px text-[10px] font-bold uppercase text-warning-foreground">Sample data</span>
      <span>{children}</span>
    </div>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
      <span className="mt-px rounded border border-border bg-muted px-1 text-[9px] font-bold uppercase">Demo</span>
      <span>{children}</span>
    </p>
  );
}

/* ---------------- demo photo attachments ---------------- */

export function DemoPhoto({ kind, size = "md" }: { kind: "waste" | "mrf" | null | undefined; size?: "sm" | "md" }) {
  if (!kind) return null;
  const src = kind === "waste" ? wastePhoto : mrfPhoto;
  return (
    <div className={cn("overflow-hidden rounded-md border border-border", size === "sm" ? "h-12 w-16" : "h-24 w-32")}>
      <img src={src} alt={`Demo field photograph — ${kind === "waste" ? "waste bins" : "MRF plastic bales"}`} loading="lazy" width={1024} height={1024}
        className="h-full w-full object-cover" />
      <p className="sr-only">Demo photograph attached</p>
    </div>
  );
}

/* ---------------- form helpers ---------------- */

export function Field({ label, required, hint, children, className }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function KeyValue({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium text-foreground", mono && "font-mono tabular-nums")}>{value}</p>
    </div>
  );
}
