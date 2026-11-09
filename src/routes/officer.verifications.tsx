import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Undo2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/store";
import { activityName, fmtDateTime, stationById, userById } from "@/lib/derive";
import type { MrfEntry, WasteEntry } from "@/data/types";
import { EmptyState, PageHeader, SectionCard, StatusBadge, DemoNote } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/officer/verifications")({
  head: () => ({ meta: [
    { title: "Cleared & Verifications | Officer | EnHM Management System" },
    { name: "description", content: "Audit clerk clear and send-back decisions with original report values and mandatory notes." },
    { property: "og:title", content: "Cleared & Verifications | Officer | EnHM Management System" },
    { property: "og:description", content: "Officer review of sample clerk verification actions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Verifications,
});

function Verifications() {
  const { db } = useDemo();
  const verifications = [...db.verifications].sort((a, b) => b.at.localeCompare(a.at));

  const rows = verifications.map((v) => {
    const entry = v.entryKind === "waste" ? db.wasteEntries.find((e) => e.id === v.entryId) : db.mrfEntries.find((e) => e.id === v.entryId);
    const station = entry ? stationById(db, entry.stationId) : undefined;
    const chi = entry ? userById(db, entry.chiId) : undefined;
    const clerk = userById(db, v.clerkId);
    const value = entry
      ? v.entryKind === "waste"
        ? `Dry ${(entry as WasteEntry).dryKg} / Wet ${(entry as WasteEntry).wetKg} KG`
        : `Infeed ${(entry as MrfEntry).infeedKg} KG · ${(entry as MrfEntry).bales} bales`
      : "—";
    return { v, entry, station, chi, clerk, value };
  });

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        kicker="Officer · Verification audit"
        title="Cleared Entries & Verification History"
        description="Every send-back and clearing action taken by clerks, with the original submitted value preserved for audit."
      />

      <SectionCard title={`Verification records (${rows.length})`} icon={ClipboardCheck}>
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No verification actions yet" hint="Clerk actions will appear here as they happen." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Original submitted value</TableHead>
                  <TableHead>CHI</TableHead>
                  <TableHead>Clerk</TableHead>
                  <TableHead>Mandatory note</TableHead>
                  <TableHead>Entry status now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ v, entry, station, chi, clerk, value }) => (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">{fmtDateTime(v.at)}</TableCell>
                    <TableCell>
                      {v.action === "clear" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><ClipboardCheck className="h-3.5 w-3.5" aria-hidden /> Cleared</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger"><Undo2 className="h-3.5 w-3.5" aria-hidden /> Sent back</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{station?.code} <span className="text-xs text-muted-foreground">{station?.name}</span></TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{entry ? activityName(db, entry.activity).replace("Activity ", "Act. ") : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{value}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{chi?.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{clerk?.name}</TableCell>
                    <TableCell className="max-w-[280px] text-xs italic">“{v.note}”</TableCell>
                    <TableCell>{entry ? <StatusBadge state={entry.status === "submitted" ? "submitted" : entry.status === "cleared" ? "cleared" : entry.status === "sent_back" ? "sent_back" : "out_of_range"} /> : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DemoNote>Only two verification actions exist by design: Send Back (with mandatory reason) and Clear (with mandatory note). Neither edits the CHI's original figure.</DemoNote>
      </SectionCard>
    </div>
  );
}
