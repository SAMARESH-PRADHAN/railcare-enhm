import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft, CheckCircle2, ClipboardCheck, ClipboardList, Hourglass,
  Info, Undo2, TriangleAlert, FileX2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { activityName, chisOfClerk, fmtDate, fmtDateTime, stationsOfClerk } from "@/lib/derive";
import { rangeLabel, rowsForEntryScope, valueLabel, type WorkRow } from "@/lib/ops";
import { DemoNote, EmptyState, PageHeader, SectionCard, StatCard, StatusBadge, DemoPhoto } from "@/components/shared/ui-bits";
import { todayISO } from "@/data/seed";
import type { MrfEntry, WasteEntry } from "@/data/types";

export const Route = createFileRoute("/clerk/")({
  head: () => ({
    meta: [
      { title: "Clerk Dashboard | EnHM Management System" },
      { name: "description", content: "EnHM verification clerk workspace — exception worklist, send back and clearing with mandatory notes." },
      { property: "og:title", content: "Clerk Dashboard | EnHM Management System" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClerkDashboard,
});

function ClerkDashboard() {
  const { db, actions, currentUser } = useDemo();
  const today = todayISO();
  const [date, setDate] = useState(today);

  const myChis = useMemo(() => chisOfClerk(db, currentUser.id), [db, currentUser.id]);
  const myStations = useMemo(() => stationsOfClerk(db, currentUser.id), [db, currentUser.id]);
  const rows = useMemo(() => rowsForEntryScope(db, myStations, date), [db, myStations, date]);

  // Attention = exceptions + submitted-but-unverified entries (assumption Q2)
  const needAttention = rows.filter((r) =>
    r.state === "missing" || r.state === "late" || r.state === "out_of_range" ||
    r.state === "sent_back" || r.state === "escalated" ||
    (!!r.entry && r.entry.status === "submitted"));
  const carried = rows.filter((r) => r.entry?.carriedForward && r.entry.status !== "cleared");

  const counts = {
    total: rows.length,
    exceptions: rows.filter((r) => ["missing", "late", "out_of_range", "sent_back", "escalated"].includes(r.state)).length,
    missing: rows.filter((r) => r.state === "missing").length,
    late: rows.filter((r) => r.state === "late").length,
    outOfRange: rows.filter((r) => r.state === "out_of_range").length,
    awaiting: rows.filter((r) => r.entry?.status === "submitted").length,
    cleared: rows.filter((r) => r.state === "cleared").length,
  };

  const [verifyRow, setVerifyRow] = useState<WorkRow | null>(null);
  const [note, setNote] = useState("");
  const [sendBackRow, setSendBackRow] = useState<WorkRow | null>(null);
  const [reason, setReason] = useState("");

  const doClear = () => {
    if (!verifyRow?.entry) return;
    const res = actions.clearEntry(verifyRow.entry.id, verifyRow.kind, note);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Entry cleared — ${verifyRow.station.code}`, { description: "Your verification note is now visible to the Divisional Officer." });
    setVerifyRow(null); setNote("");
  };
  const doSendBack = () => {
    if (!sendBackRow?.entry) return;
    const res = actions.sendBack(sendBackRow.entry.id, sendBackRow.kind, reason);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Sent back to CHI — ${sendBackRow.station.code}`, { description: `${sendBackRow.chi?.name} will see it under Corrections Required.` });
    setSendBackRow(null); setReason("");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker={`EnHM Verification Clerk · supervising ${myChis.length} CHI${myChis.length === 1 ? "" : "s"}`}
        title={`Verification Worklist — ${fmtDate(date)}`}
        description={`Welcome, ${currentUser.name}. You see the entries of your assigned CHIs only: ${myChis.map((c) => c.name).join(", ")}.`}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} className="h-9 w-40" aria-label="Reporting date" />}
      />

      <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-lg font-bold tabular-nums text-foreground">
          {needAttention.length} of {counts.total} entries need attention
        </p>
        <p className="text-xs text-muted-foreground">Exceptions and submitted entries awaiting your verification for {fmtDate(date)}.</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatCard label="Total entries" value={counts.total} hint="All scoped reports" />
        <StatCard label="Exceptions" value={counts.exceptions} tone="bad" icon={TriangleAlert} />
        <StatCard label="Missing" value={counts.missing} tone="bad" icon={FileX2} />
        <StatCard label="Late" value={counts.late} tone="warn" icon={Clock} />
        <StatCard label="Out of range" value={counts.outOfRange} tone="warn" icon={TriangleAlert} />
        <StatCard label="Awaiting CHI correction" value={rows.filter((r) => r.entry?.status === "sent_back").length} tone="info" icon={Hourglass} />
      </div>

      <SectionCard title="Main worklist" subtitle="Submitted value is shown against the station-specific expected range" icon={ClipboardList}>
        {needAttention.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Worklist clear" hint="No exceptions and no unverified submissions for your CHIs on this date." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Station code</TableHead>
                  <TableHead>CHI name</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Submitted value</TableHead>
                  <TableHead>Expected range</TableHead>
                  <TableHead>Submission date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needAttention.map((r) => {
                  const e = r.entry;
                  const submittedAt = e?.submittedAt ? fmtDateTime(e.submittedAt) : "Not submitted";
                  return (
                    <TableRow key={r.key}>
                      <TableCell className="whitespace-nowrap font-medium">{r.station.name}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{r.station.code}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.chi?.name ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.activity === "2" ? "2 – Solid Waste" : "9 – MRF Baling"}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{valueLabel(r)}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">{rangeLabel(db, r)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">{e ? fmtDate(e.date) : fmtDate(date)}<span className="block text-[10px] text-muted-foreground">{submittedAt}</span></TableCell>
                      <TableCell><StatusBadge state={r.state} /></TableCell>
                      <TableCell className="text-right">
                        {e ? (
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setSendBackRow(r); setReason(""); }}>
                              <Undo2 className="mr-1 h-3 w-3" aria-hidden /> Send Back
                            </Button>
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => { setVerifyRow(r); setNote(""); }}>
                              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden /> Clear
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Awaiting CHI submission</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <DemoNote>
          <strong>Permission rule:</strong> you can never edit or overwrite a submitted CHI figure. Only two actions are available — Send Back (mandatory reason) and Clear (mandatory verification note).
        </DemoNote>
      </SectionCard>

      {carried.length > 0 && (
        <SectionCard className="mt-5" title="Carried Forward After Reassignment" icon={ArrowRightLeft}
          subtitle="These entries belong to CHIs whose workloads have been reassigned — they are not software errors">
          <div className="mb-3 flex items-start gap-2 rounded-md border border-steel/30 bg-steel/5 px-3 py-2 text-xs">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" aria-hidden />
            <p>
              The following entries were submitted under a previous assignment and are carried into your worklist after a CHI reassignment.
              Their supervision follows the reassignment chain; the treatment of pending work after reassignment is a pending client decision (Questions &amp; Assumptions, Q9).
            </p>
          </div>
          <ul className="divide-y divide-border">
            {carried.map((r) => (
              <li key={r.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <span className="font-mono text-sm font-bold">{r.station.code}</span>
                <span className="text-xs text-muted-foreground">{r.station.name}</span>
                <span className="text-xs">{r.activity === "2" ? "Solid Waste" : "MRF Baling"}</span>
                <span className="font-mono text-xs tabular-nums">{valueLabel(r)}</span>
                <span className="text-xs text-muted-foreground">reported {fmtDate(r.entry!.date)}</span>
                <StatusBadge state={r.state} />
                {r.entry && (
                  <span className="ml-auto flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setSendBackRow(r); setReason(""); }}>Send Back</Button>
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={() => { setVerifyRow(r); setNote(""); }}>Clear</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Clear modal */}
      <Dialog open={!!verifyRow} onOpenChange={(v) => !v && setVerifyRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear entry with verification note</DialogTitle>
            <DialogDescription>
              {verifyRow && (
                <>{verifyRow.station.code} {verifyRow.station.name} · {activityName(db, verifyRow.activity)}<br />
                  Original submitted value: <strong className="font-mono tabular-nums">{valueLabel(verifyRow)}</strong><br />
                  Expected range: <span className="font-mono tabular-nums">{rangeLabel(db, verifyRow)}</span>
                  {verifyRow.entry?.remarks && <> <br />CHI remark: “{verifyRow.entry.remarks}”</>}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {verifyRow?.entry?.photo && (
            <div className="flex items-center gap-3">
              <DemoPhoto kind={verifyRow.entry.photo} size="sm" />
              <p className="text-[11px] text-muted-foreground">Demo field photograph attached by the CHI</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="clear-note">Verification note <span className="text-destructive">*</span></Label>
            <Textarea id="clear-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Mandatory — a short explanation supporting your clearing decision…" aria-required="true" />
            <p className="text-[11px] text-muted-foreground">Your note appears on the Divisional Officer's dashboard for audit. The submitted figure remains unchanged.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyRow(null)}>Cancel</Button>
            <Button onClick={doClear} disabled={!note.trim()}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Clear entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send back modal */}
      <Dialog open={!!sendBackRow} onOpenChange={(v) => !v && setSendBackRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send entry back to CHI</DialogTitle>
            <DialogDescription>
              {sendBackRow && (
                <>{sendBackRow.station.code} {sendBackRow.station.name} · CHI: {sendBackRow.chi?.name}<br />
                  {activityName(db, sendBackRow.activity)} · submitted <span className="font-mono tabular-nums">{valueLabel(sendBackRow)}</span> · expected <span className="font-mono tabular-nums">{rangeLabel(db, sendBackRow)}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sb-reason">Reason for send-back <span className="text-destructive">*</span></Label>
            <Textarea id="sb-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Mandatory — why must the CHI correct or re-check this entry?" aria-required="true" />
            <p className="text-[11px] text-muted-foreground">The entry returns to the CHI's pending correction list. The original submission stays in history.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendBackRow(null)}>Cancel</Button>
            <Button onClick={doSendBack} disabled={!reason.trim()}>
              <Undo2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
