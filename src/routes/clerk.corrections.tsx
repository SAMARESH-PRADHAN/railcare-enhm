import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Hourglass } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/store";
import { activityName, chisOfClerk, fmtDate, fmtDateTime, stationsOfClerk } from "@/lib/derive";
import { rangeLabel, valueLabel } from "@/lib/ops";
import { EmptyState, PageHeader, SectionCard, StatusBadge, DemoNote } from "@/components/shared/ui-bits";
import { todayISO } from "@/data/seed";

export const Route = createFileRoute("/clerk/corrections")({
  head: () => ({ meta: [{ title: "Pending Corrections | Clerk | EnHM Management System" }] }),
  component: PendingCorrections,
});

function PendingCorrections() {
  const { db, currentUser } = useDemo();
  const myStations = useMemo(() => stationsOfClerk(db, currentUser.id), [db, currentUser.id]);
  const stationIds = new Set(myStations.map((s) => s.id));

  const sentBack = [
    ...db.wasteEntries.filter((e) => e.status === "sent_back" && stationIds.has(e.stationId)).map((e) => ({ kind: "waste" as const, e })),
    ...db.mrfEntries.filter((e) => e.status === "sent_back" && stationIds.has(e.stationId)).map((e) => ({ kind: "mrf" as const, e })),
  ];
  const resubmitted = [
    ...db.wasteEntries.filter((e) => e.history.length > 1 && e.status === "submitted" && stationIds.has(e.stationId)).map((e) => ({ kind: "waste" as const, e })),
    ...db.mrfEntries.filter((e) => e.history.length > 1 && e.status === "submitted" && stationIds.has(e.stationId)).map((e) => ({ kind: "mrf" as const, e })),
  ];

  const lastReason = (entryId: string) => db.verifications.filter((v) => v.entryId === entryId && v.action === "send_back").at(-1)?.note;

  const row = (kind: "waste" | "mrf", e: (typeof sentBack)[number]["e"]) => ({
    kind, e,
    station: stationById(db, e.stationId),
    chi: userById(db, e.chiId),
    value: kind === "waste" ? `Dry ${(e as import("@/data/types").WasteEntry).dryKg} / Wet ${(e as import("@/data/types").WasteEntry).wetKg} KG` : `Infeed ${(e as import("@/data/types").MrfEntry).infeedKg} KG · ${(e as import("@/data/types").MrfEntry).bales} bales`,
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        kicker="EnHM Verification Clerk"
        title="Pending Corrections"
        description="Entries you sent back that are still with the CHI, and corrected entries that have been resubmitted for re-verification."
      />

      <SectionCard title={`Awaiting CHI correction (${sentBack.length})`} icon={Hourglass}>
        {sentBack.length === 0 ? (
          <EmptyState icon={Hourglass} title="No entries awaiting correction" hint="Entries you send back will be tracked here until the CHI resubmits." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>CHI</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Submitted value</TableHead>
                  <TableHead>Expected range</TableHead>
                  <TableHead>Your send-back reason</TableHead>
                  <TableHead>Sent back at</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentBack.map(({ kind, e }) => {
                  const r = row(kind, e);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{r.station?.code} <span className="text-xs text-muted-foreground">{r.station?.name}</span></TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.chi?.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{activityName(db, kind === "waste" ? "2" : "9").replace("Activity ", "Act. ")}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{r.value}</TableCell>
                      <TableCell className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {kind === "waste" ? `Dry ${db.ranges[e.stationId]?.dry.join("–")} · Wet ${db.ranges[e.stationId]?.wet.join("–")}` : `Infeed ${db.ranges[e.stationId]?.infeed.join("–")}`}
                      </TableCell>
                      <TableCell className="max-w-[240px] text-xs italic">“{lastReason(e.id) ?? "—"}”</TableCell>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">{db.verifications.filter((v) => v.entryId === e.id && v.action === "send_back").at(-1)?.at ? fmtDateTime(db.verifications.filter((v) => v.entryId === e.id && v.action === "send_back").at(-1)!.at) : "—"}</TableCell>
                      <TableCell><StatusBadge state="sent_back" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard className="mt-5" title={`Resubmitted — re-verify (${resubmitted.length})`} icon={ClipboardList}>
        {resubmitted.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No resubmissions pending" />
        ) : (
          <ul className="divide-y divide-border">
            {resubmitted.map(({ kind, e }) => {
              const r = row(kind, e);
              return (
                <li key={e.id} className="py-2.5 text-xs">
                  <span className="font-mono font-bold">{r.station?.code}</span> · {r.station?.name} · {activityName(db, kind === "waste" ? "2" : "9")} · <span className="font-mono tabular-nums">{r.value}</span> (expected <span className="font-mono tabular-nums">{kind === "waste" ? `Dry ${db.ranges[e.stationId]?.dry.join("–")}` : `Infeed ${db.ranges[e.stationId]?.infeed.join("–")}`}</span>) · reported {fmtDate(e.date)}
                  <span className="block text-[11px] text-muted-foreground">Last correction at {fmtDateTime(e.history.at(-1)?.at ?? e.submittedAt ?? "")} — verify on the dashboard worklist.</span>
                </li>
              );
            })}
          </ul>
        )}
        <DemoNote>The reporting date here follows each entry's own reporting period; overdue items also appear on the dashboard for {fmtDate(todayISO())}.</DemoNote>
      </SectionCard>
    </div>
  );
}

export { chisOfClerk, rangeLabel };
