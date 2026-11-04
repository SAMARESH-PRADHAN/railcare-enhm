import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/store";
import { ChiPhoneFrame } from "@/components/layout/chi-phone-frame";
import { activityName, fmtDate, stationsOfChi } from "@/lib/derive";
import { EmptyState, StatusBadge, DemoNote } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/chi/corrections")({
  head: () => ({ meta: [{ title: "Corrections Required | CHI Field Workspace | EnHM" }] }),
  component: ChiCorrections,
});

function ChiCorrections() {
  const { db, currentUser } = useDemo();
  const myStations = useMemo(() => stationsOfChi(db, currentUser.id), [db, currentUser.id]);
  const ids = new Set(myStations.map((s) => s.id));

  const sentBack = [
    ...db.wasteEntries.filter((e) => e.status === "sent_back" && ids.has(e.stationId)).map((e) => ({ kind: "waste" as const, e })),
    ...db.mrfEntries.filter((e) => e.status === "sent_back" && ids.has(e.stationId)).map((e) => ({ kind: "mrf" as const, e })),
  ];
  const corrected = [
    ...db.wasteEntries.filter((e) => e.history.length > 1 && e.status === "submitted" && ids.has(e.stationId)).map((e) => ({ kind: "waste" as const, e })),
    ...db.mrfEntries.filter((e) => e.history.length > 1 && e.status === "submitted" && ids.has(e.stationId)).map((e) => ({ kind: "mrf" as const, e })),
  ];

  return (
    <ChiPhoneFrame>
      <div className="sticky top-0 z-10 bg-sidebar px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-sidebar-muted">CHI Field Workspace</p>
        <p className="text-sm font-bold text-sidebar-active-foreground">Corrections Required</p>
      </div>
      <div className="space-y-4 p-3 pb-24">
        <section>
          <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-danger">Sent back by clerk ({sentBack.length})</h2>
          {sentBack.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No corrections pending" hint="Entries the clerk returns will appear here with their reason." />
          ) : (
            <div className="space-y-2">
              {sentBack.map(({ kind, e }) => {
                const station = db.stations.find((s) => s.id === e.stationId)!;
                const reason = db.verifications.filter((v) => v.entryId === e.id && v.action === "send_back").at(-1)?.note;
                return (
                  <Link key={e.id} to="/chi/task/$taskId" params={{ taskId: `${kind}~${e.stationId}~${e.date}` }} className="block rounded-lg border border-danger/40 bg-danger/5 p-3">
                    <p className="text-[13px] font-semibold">{station.code} {station.name}</p>
                    <p className="text-xs text-muted-foreground">{activityName(db, kind === "waste" ? "2" : "9")} · reported {fmtDate(e.date)}</p>
                    <p className="mt-1 text-[11px] italic text-danger">Clerk's reason: “{reason}”</p>
                    <span className="mt-1.5 inline-block text-[11px] font-semibold text-primary">Correct &amp; resubmit →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Corrected &amp; resubmitted ({corrected.length})</h2>
          {corrected.length === 0 ? (
            <EmptyState title="Nothing resubmitted yet" />
          ) : (
            <div className="space-y-2">
              {corrected.map(({ kind, e }) => {
                const station = db.stations.find((s) => s.id === e.stationId)!;
                const last = e.history.at(-1);
                return (
                  <div key={e.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{station.code} · {activityName(db, kind === "waste" ? "2" : "9")} · {fmtDate(e.date)}</p>
                      <StatusBadge state={e.status === "submitted" ? "resubmitted" : "submitted"} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Previous figures preserved in history: {last?.previous ? ("dryKg" in last.previous ? `dry ${last.previous.dryKg} / wet ${last.previous.wetKg} KG` : `infeed ${last.previous.infeedKg} KG, ${last.previous.bales} bales`) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <DemoNote>Each resubmission keeps your original figures — the clerk and officer audit the full history.</DemoNote>
        </section>
      </div>
    </ChiPhoneFrame>
  );
}
