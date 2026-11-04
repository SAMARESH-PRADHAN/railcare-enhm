import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Undo2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/store";
import { activityName, fmtDateTime, stationById, userById } from "@/lib/derive";
import type { MrfEntry, WasteEntry } from "@/data/types";
import { EmptyState, PageHeader, SectionCard, DemoNote } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/clerk/history")({
  head: () => ({ meta: [{ title: "Verification History | Clerk | EnHM Management System" }] }),
  component: ClerkHistory,
});

function ClerkHistory() {
  const { db, currentUser } = useDemo();
  const mine = [...db.verifications].filter((v) => v.clerkId === currentUser.id).sort((a, b) => b.at.localeCompare(a.at));

  const rows = mine.map((v) => {
    const entry = v.entryKind === "waste" ? db.wasteEntries.find((e) => e.id === v.entryId) : db.mrfEntries.find((e) => e.id === v.entryId);
    const station = entry ? stationById(db, entry.stationId) : undefined;
    const chi = entry ? userById(db, entry.chiId) : undefined;
    const value = entry
      ? v.entryKind === "waste"
        ? `Dry ${(entry as WasteEntry).dryKg} / Wet ${(entry as WasteEntry).wetKg} KG`
        : `Infeed ${(entry as MrfEntry).infeedKg} KG · ${(entry as MrfEntry).bales} bales`
      : "—";
    return { v, entry, station, chi, value };
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        kicker="EnHM Verification Clerk"
        title="My Verification History"
        description="Previously cleared entries and pending corrections you have handled. Cleared entries remain monitorable here."
      />
      <SectionCard title={`Verification actions (${rows.length})`} icon={ClipboardCheck}>
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No verification actions yet" hint="Actions you take on the worklist will be recorded here." />
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
                  <TableHead>Note</TableHead>
                  <TableHead>Entry status now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ v, entry, station, chi, value }) => (
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
                    <TableCell className="max-w-[260px] text-xs italic">“{v.note}”</TableCell>
                    <TableCell className="text-xs">{entry?.status === "cleared" ? "Cleared" : entry?.status === "sent_back" ? "Sent back — awaiting CHI" : entry?.status === "submitted" ? "Resubmitted — re-verify" : entry?.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DemoNote>Entries sent back and later corrected by the CHI reappear on your worklist as Resubmitted.</DemoNote>
      </SectionCard>
    </div>
  );
}
