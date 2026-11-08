import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2, ChevronRight, ClipboardList, CloudUpload, FileClock, Info,
  RefreshCw, Smartphone, TriangleAlert, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { activityName, contractDaysLeft, contractStatus, fmtDate, mrfStations, stationsOfChi, userById } from "@/lib/derive";
import { todayISO } from "@/data/seed";
import type { WasteEntry, MrfEntry } from "@/data/types";
import { DemoNote, EmptyState, StatusBadge } from "@/components/shared/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chi/")({
  head: () => ({
    meta: [
      { title: "CHI Field Workspace | EnHM Management System" },
      { name: "description", content: "Mobile-first field workspace for Chief Health Inspectors — daily solid waste and MRF reporting with offline-queue simulation." },
      { property: "og:title", content: "CHI Field Workspace | EnHM Management System" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChiWorkspace,
});

export function ChiPhoneFrame({ children, note = true }: { children: React.ReactNode; note?: boolean }) {
  return (
    <div>
      {note && (
        <p className="mb-3 hidden items-center gap-2 text-xs text-muted-foreground md:flex">
          <Smartphone className="h-3.5 w-3.5" aria-hidden />
          Field CHI workspace — shown in a phone preview on desktop. On a field tablet or phone it opens full-screen.
        </p>
      )}
      <div className="mx-auto w-full max-w-[430px] md:my-6 md:rounded-[2.2rem] md:border-[10px] md:border-sidebar md:shadow-xl">
        <div className="min-h-[640px] overflow-hidden rounded-xl bg-background md:rounded-[1.6rem]">
          {children}
        </div>
      </div>
    </div>
  );
}

function ChiWorkspace() {
  const { db, currentUser } = useDemo();
  const today = todayISO();

  const myStations = useMemo(() => stationsOfChi(db, currentUser.id), [db, currentUser.id]);
  const mrfIds = new Set(mrfStations(db).map((s) => s.id));

  /* outstanding = waste/mrf tasks not yet submitted today + sent-back corrections */
  const corrections = [
    ...db.wasteEntries.filter((e) => e.status === "sent_back" && e.chiId === currentUser.id),
    ...db.mrfEntries.filter((e) => e.status === "sent_back" && e.chiId === currentUser.id),
  ];

  const outstanding: { key: string; kind: "waste" | "mrf"; stationId: string; date: string; dueHour: number; exists?: WasteEntry | MrfEntry }[] = [];
  myStations.forEach((s) => {
    const w = db.wasteEntries.find((e) => e.stationId === s.id && e.date === today);
    if (!w || w.status === "sent_back") outstanding.push({ key: `waste~${s.id}~${today}`, kind: "waste", stationId: s.id, date: today, dueHour: db.rules.wasteDueHour, ...(w ? { exists: w } : {}) });
    if (mrfIds.has(s.id)) {
      const m = db.mrfEntries.find((e) => e.stationId === s.id && e.date === today);
      if (!m || m.status === "sent_back") outstanding.push({ key: `mrf~${s.id}~${today}`, kind: "mrf", stationId: s.id, date: today, dueHour: db.rules.mrfDueHour, ...(m ? { exists: m } : {}) });
    }
  });

  const completed = [
    ...db.wasteEntries.filter((e) => e.chiId === currentUser.id && e.submittedAt).sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")).map((e) => ({ kind: "waste" as const, e })),
    ...db.mrfEntries.filter((e) => e.chiId === currentUser.id && e.submittedAt).sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")).map((e) => ({ kind: "mrf" as const, e })),
  ].slice(0, 10);

  const myContracts = db.contracts.filter((c) => myStations.some((s) => s.id === c.stationId) && contractStatus(c, db.rules.contractLeadDays) !== "active");

  return (
    <ChiPhoneFrame>
      {/* compact mobile header */}
      <div className="sticky top-0 z-10 bg-sidebar px-4 py-3 text-sidebar-foreground">
        <p className="text-[10px] uppercase tracking-widest text-sidebar-muted">CHI Field Workspace</p>
        <p className="text-sm font-bold text-sidebar-active-foreground">{currentUser.name}</p>
        <p className="text-[11px] text-sidebar-muted">{myStations.length} assigned stations · {fmtDate(today)}</p>
      </div>

      <div className="space-y-4 p-3 pb-24">
        {/* offline queue — demo simulation only */}
        <div className="rounded-lg border border-dashed border-steel/50 bg-steel/5 p-3">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4 shrink-0 text-steel" aria-hidden />
            <p className="flex-1 text-xs font-semibold text-foreground">3 entries waiting to sync</p>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast.info("Demo simulation only — no real offline synchronisation is implemented.")}>
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden /> Sync now
            </Button>
          </div>
          <p className="mt-1.5 flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            DEMO SIMULATION ONLY — this indicator is cosmetic and does not reflect real offline behaviour.
          </p>
        </div>

        {/* corrections */}
        {corrections.length > 0 && (
          <section>
            <h2 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-danger">
              <Undo2 className="h-3.5 w-3.5" aria-hidden /> Corrections Required ({corrections.length})
            </h2>
            <div className="space-y-2">
              {corrections.map((e) => {
                const station = userById(db, currentUser.id) && db.stations.find((s) => s.id === e.stationId);
                const reason = db.verifications.filter((v) => v.entryId === e.id && v.action === "send_back").at(-1)?.note;
                return (
                  <Link key={e.id} to="/chi/task/$taskId" params={{ taskId: `${e.activity === "2" ? "waste" : "mrf"}~${e.stationId}~${e.date}` }}
                    className="block rounded-lg border border-danger/40 bg-danger/5 p-3">
                    <p className="text-[13px] font-semibold text-foreground">{station?.code} {station?.name}</p>
                    <p className="text-xs text-muted-foreground">{activityName(db, e.activity)} · reported {fmtDate(e.date)}</p>
                    <p className="mt-1 text-[11px] italic text-danger">Clerk's reason: “{reason}”</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">Correct &amp; resubmit <ChevronRight className="h-3 w-3" aria-hidden /></span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* outstanding work */}
        <section>
          <h2 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden /> Outstanding Work ({outstanding.length})
          </h2>
          {outstanding.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All caught up" hint="Every assigned report for today has been submitted." />
          ) : (
            <div className="space-y-2">
              {outstanding.map((t) => {
                const station = db.stations.find((s) => s.id === t.stationId);
                if (!station) return null;
                const isLate = new Date().getHours() >= t.dueHour;
                return (
                  <Link key={t.key} to="/chi/task/$taskId" params={{ taskId: t.key }}
                    className={cn("block rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary/40", t.exists ? "border-danger/40" : "border-border")}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">{station.code} {station.name}</p>
                        <p className="text-[11px] text-muted-foreground">{activityName(db, t.kind === "waste" ? "2" : "9")} · due by {String(t.dueHour).padStart(2, "0")}:00</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {t.exists ? <StatusBadge state="sent_back" /> : isLate ? <StatusBadge state="missing" /> : <StatusBadge state="pending" />}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* contract-related upcoming tasks */}
        {myContracts.length > 0 && (
          <section>
            <h2 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning-foreground">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Contract Follow-ups
            </h2>
            <div className="space-y-2">
              {myContracts.map((c) => {
                const station = db.stations.find((s) => s.id === c.stationId)!;
                const days = contractDaysLeft(c);
                return (
                  <div key={c.id} className="rounded-lg border border-warning/40 bg-warning/5 p-3">
                    <p className="text-[13px] font-semibold">{station.code} {station.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.contractor} · contract {days < 0 ? `expired ${Math.abs(days)} days ago` : `expires in ${days} days`}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* completed below outstanding */}
        <section>
          <h2 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <FileClock className="h-3.5 w-3.5" aria-hidden /> Completed &amp; Submitted
          </h2>
          {completed.length === 0 ? (
            <EmptyState title="No submissions yet" />
          ) : (
            <div className="space-y-2">
              {completed.map(({ kind, e }) => {
                const station = db.stations.find((s) => s.id === e.stationId)!;
                return (
                  <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{station.code} · {activityName(db, kind === "waste" ? "2" : "9")}</p>
                      <p className="text-[10px] tabular-nums text-muted-foreground">
                        reported {fmtDate(e.date)}
                        {kind === "waste" ? ` · dry ${(e as WasteEntry).dryKg} / wet ${(e as WasteEntry).wetKg} KG` : ` · infeed ${(e as MrfEntry).infeedKg} KG`}
                      </p>
                    </div>
                    <StatusBadge state={e.status === "submitted" ? (e.late ? "late" : e.outOfRange ? "out_of_range" : "submitted") : e.status === "cleared" ? "cleared" : e.status === "sent_back" ? "sent_back" : e.status === "escalated" ? "escalated" : "submitted"} />
                  </div>
                );
              })}
            </div>
          )}
          <DemoNote>Completed entries move below outstanding work automatically. You can only see your own assigned stations — other CHIs' data is hidden by design.</DemoNote>
        </section>
      </div>
    </ChiPhoneFrame>
  );
}
