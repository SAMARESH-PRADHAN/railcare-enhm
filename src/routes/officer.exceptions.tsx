import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Undo2, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { activityName, fmtDate, fmtDateTime } from "@/lib/derive";
import { exceptionRows, rangeLabel, valueLabel, type WorkRow } from "@/lib/ops";
import { DemoNote, EmptyState, PageHeader, SampleBanner, SectionCard, StatCard } from "@/components/shared/ui-bits";
import { todayISO } from "@/data/seed";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/officer/exceptions")({
  head: () => ({
    meta: [{ title: "Exception Queue | Officer | EnHM Management System" }],
  }),
  component: ExceptionQueue,
});

function ExceptionQueue() {
  const { db, actions, currentUser } = useDemo();
  const [date, setDate] = useState(todayISO());
  const [fStatus, setFStatus] = useState("all");
  const [sendBackRow, setSendBackRow] = useState<WorkRow | null>(null);
  const [reason, setReason] = useState("");
  const [escalateRow, setEscalateRow] = useState<WorkRow | null>(null);
  const [note, setNote] = useState("");

  const stations = db.stations.filter((s) => s.active);
  const rows = useMemo(() => exceptionRows(db, stations, date), [db, stations, date]);
  const filtered = fStatus === "all" ? rows : rows.filter((r) => r.state === fStatus);
  const canVerify = currentUser.role === "officer" || currentUser.role === "clerk" || currentUser.role === "admin";

  const doSendBack = () => {
    if (!sendBackRow?.entry) return;
    const res = actions.sendBack(sendBackRow.entry.id, sendBackRow.kind, reason);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Entry sent back to CHI`, { description: `${sendBackRow.station.code} — the CHI will see it under Corrections Required.` });
    setSendBackRow(null); setReason("");
  };
  const doEscalate = () => {
    if (!escalateRow?.entry) return;
    const res = actions.escalate(escalateRow.entry.id, escalateRow.kind, note);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Exception escalated", { description: `${escalateRow.station.code} — marked Escalated in every role's view.` });
    setEscalateRow(null); setNote("");
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <SampleBanner>Demonstration exception queue — entries below are sample data plus anything submitted during this demo session.</SampleBanner>
      <PageHeader
        kicker="Officer · Operational supervision"
        title="Exception Queue"
        description="Missing, late, out-of-range, sent-back and escalated reporting positions for the selected date. You may send an entry back to the CHI or escalate it for divisional attention."
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value || todayISO())} className="h-9 w-40" aria-label="Reporting date" />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["missing", "late", "out_of_range", "sent_back", "escalated"] as const).map((s) => (
          <StatCard key={s} label={s.replace("_", " ")} value={rows.filter((r) => r.state === s).length}
            tone={s === "escalated" || s === "sent_back" ? "bad" : s === "out_of_range" || s === "late" ? "warn" : "bad"} />
        ))}
      </div>

      <SectionCard title={`Exceptions — ${fmtDate(date)}`} icon={ClipboardList}
        actions={
          <label className="text-xs text-muted-foreground">
            Status:{" "}
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="ml-1 h-8 rounded-md border border-input bg-background px-2 text-xs" aria-label="Filter by status">
              <option value="all">All</option>
              <option value="missing">Missing</option>
              <option value="late">Late</option>
              <option value="out_of_range">Out of range</option>
              <option value="sent_back">Sent back</option>
              <option value="escalated">Escalated</option>
            </select>
          </label>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No exceptions for this date" hint="Every scoped station has reported within range, on time." />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const chi = r.chi;
              const lastVerification = r.entry ? db.verifications.filter((v) => v.entryId === r.entry!.id).at(-1) : undefined;
              return (
                <li key={r.key} className={cn("py-3", r.state === "sent_back" && "bg-destructive/5")}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex items-center gap-2 sm:w-56 sm:shrink-0">
                      <span className="font-mono text-sm font-bold tabular-nums">{r.station.code}</span>
                      <span className="truncate text-xs text-muted-foreground">{r.station.name}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground">
                        {activityName(db, r.activity)}
                        <span className="ml-2 font-mono tabular-nums text-xs text-muted-foreground">{valueLabel(r)} · expected {rangeLabel(db, r)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CHI: {chi?.name ?? "—"} · Clerk: {r.clerk?.name ?? "—"}
                        {r.entry?.submittedAt ? ` · submitted ${fmtDateTime(r.entry.submittedAt)}${r.entry.late ? " (after due time)" : ""}` : ` · due ${new Date(r.entry?.dueAt ?? Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                        {r.entry?.remarks ? ` · CHI remark: “${r.entry.remarks}”` : ""}
                        {lastVerification?.action === "send_back" ? ` · send-back reason: “${lastVerification.note}”` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {r.entry && canVerify && r.state !== "sent_back" && r.state !== "escalated" && (
                        <>
                          <Button size="sm" variant="outline" className="h-8" onClick={() => { setSendBackRow(r); setReason(""); }}>
                            <Undo2 className="mr-1 h-3.5 w-3.5" aria-hidden /> Send Back
                          </Button>
                          {currentUser.role === "officer" && (
                            <Button size="sm" variant="outline" className="h-8 border-danger/40 text-danger hover:bg-danger/5" onClick={() => { setEscalateRow(r); setNote(""); }}>
                              <Gavel className="mr-1 h-3.5 w-3.5" aria-hidden /> Escalate
                            </Button>
                          )}
                        </>
                      )}
                      {(r.state === "sent_back" || r.state === "escalated") && (
                        <span className="text-[11px] font-medium text-muted-foreground">Awaiting CHI correction</span>
                      )}
                      {!r.entry && (
                        <span className="text-[11px] font-medium text-muted-foreground">Awaiting CHI submission</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <DemoNote>
          Clerks can never edit the submitted figure — they may only send the entry back with a reason or clear it with a verification note (see their workspace). Original figures are preserved in the submission history.
        </DemoNote>
      </SectionCard>

      {/* Send back modal */}
      <Dialog open={!!sendBackRow} onOpenChange={(v) => !v && setSendBackRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send entry back to CHI</DialogTitle>
            <DialogDescription>
              {sendBackRow && (
                <> {sendBackRow.station.code} {sendBackRow.station.name} · {activityName(db, sendBackRow.activity)}<br />
                  Submitted value: <span className="font-mono tabular-nums">{valueLabel(sendBackRow)}</span> · Expected: <span className="font-mono tabular-nums">{rangeLabel(db, sendBackRow)}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sendback-reason">Reason for send-back <span className="text-destructive">*</span></Label>
            <Textarea id="sendback-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Mandatory — explain why the CHI must correct or re-check this entry…" aria-required="true" />
            <p className="text-[11px] text-muted-foreground">The reason is shown to the CHI under Corrections Required and recorded in the audit trail. The original submitted value is never changed.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendBackRow(null)}>Cancel</Button>
            <Button onClick={doSendBack} disabled={!reason.trim()}>Send back to CHI</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate modal */}
      <Dialog open={!!escalateRow} onOpenChange={(v) => !v && setEscalateRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escalate exception</DialogTitle>
            <DialogDescription>
              {escalateRow && <>{escalateRow.station.code} {escalateRow.station.name} · {activityName(db, escalateRow.activity)}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="esc-note">Escalation note <span className="text-destructive">*</span></Label>
            <Textarea id="esc-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Why this needs divisional attention…" aria-required="true" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateRow(null)}>Cancel</Button>
            <Button onClick={doEscalate} disabled={!note.trim()}>Escalate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
