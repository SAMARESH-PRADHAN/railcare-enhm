import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDemo } from "@/lib/store";
import { ChiPhoneFrame } from "@/components/layout/chi-phone-frame";
import { activityName, fmtDate, fmtDateTime, stationsOfChi, userById } from "@/lib/derive";
import type { MrfEntry, WasteEntry } from "@/data/types";
import { EmptyState, StatusBadge, DemoNote, DemoPhoto } from "@/components/shared/ui-bits";
import { todayISO } from "@/data/seed";

export const Route = createFileRoute("/chi/history")({
  head: () => ({ meta: [
    { title: "Submission History | CHI Field Workspace | EnHM" },
    { name: "description", content: "CHI report submission history, verification notes and preserved readings." },
    { property: "og:title", content: "Submission History | CHI Field Workspace | EnHM" },
    { property: "og:description", content: "Field report history for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ChiHistory,
});

function ChiHistory() {
  const { db, currentUser } = useDemo();
  const myStations = useMemo(() => stationsOfChi(db, currentUser.id), [db, currentUser.id]);
  const ids = new Set(myStations.map((s) => s.id));

  const [filter, setFilter] = useState<"all" | "waste" | "mrf">("all");
  const rows = [
    ...db.wasteEntries.filter((e) => ids.has(e.stationId) && e.submittedAt).map((e) => ({ kind: "waste" as const, e })),
    ...db.mrfEntries.filter((e) => ids.has(e.stationId) && e.submittedAt).map((e) => ({ kind: "mrf" as const, e })),
  ].filter((r) => filter === "all" || r.kind === filter)
    .sort((a, b) => b.e.submittedAt!.localeCompare(a.e.submittedAt!));

  return (
    <ChiPhoneFrame>
      <div className="sticky top-0 z-10 bg-sidebar px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-sidebar-muted">CHI Field Workspace</p>
        <p className="text-sm font-bold text-sidebar-active-foreground">Submission History</p>
      </div>
      <div className="space-y-3 p-3 pb-24">
        <div className="flex gap-2">
          {(["all", "waste", "mrf"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
              aria-pressed={filter === f}>
              {f === "all" ? "All" : f === "waste" ? "Solid Waste" : "MRF"}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={FileClock} title="No submissions yet" hint="Entries you submit will appear here with their verification trail." />
        ) : (
          <div className="space-y-2">
            {rows.map(({ kind, e }) => {
              const station = db.stations.find((s) => s.id === e.stationId)!;
              const clerk = userById(db, (db.verifications.filter((v) => v.entryId === e.id && v.action === "clear").at(-1)?.clerkId) ?? "");
              const clearNote = db.verifications.filter((v) => v.entryId === e.id && v.action === "clear").at(-1)?.note;
              return (
                <div key={e.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{station.code} {station.name}</p>
                      <p className="text-[11px] text-muted-foreground">{activityName(db, kind === "waste" ? "2" : "9")}</p>
                    </div>
                    <StatusBadge state={e.status === "submitted" ? (e.late ? "late" : e.outOfRange ? "out_of_range" : e.history.length > 1 ? "resubmitted" : "submitted") : e.status === "cleared" ? "cleared" : e.status === "sent_back" ? "sent_back" : "escalated"} />
                  </div>
                  <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
                    Reported {fmtDate(e.date)} · submitted {fmtDateTime(e.submittedAt ?? "")}
                    {kind === "waste" ? ` · dry ${(e as WasteEntry).dryKg} / wet ${(e as WasteEntry).wetKg} KG` : ` · infeed ${(e as MrfEntry).infeedKg} KG · ${e.bales} bales`}
                  </p>
                  {e.remarks && <p className="mt-1 text-[11px] italic">Your remark: “{e.remarks}”</p>}
                  {e.photo && <div className="mt-2"><DemoPhoto kind={e.photo} size="sm" /></div>}
                  {clearNote && (
                    <p className="mt-1.5 rounded bg-success/10 px-2 py-1 text-[11px] text-success">
                      Cleared by {clerk?.name ?? "clerk"}: “{clearNote}”
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <DemoNote>History shown as of {fmtDate(todayISO())} — the officer can audit the same trail division-wide.</DemoNote>
      </div>
    </ChiPhoneFrame>
  );
}
