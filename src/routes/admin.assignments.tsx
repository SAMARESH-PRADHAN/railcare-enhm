import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft, ArrowRight, CalendarRange, GitBranch, History, ShieldAlert, TriangleAlert, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { clerkOfChi, fmtDate, fmtDateTime, stationsOfChi } from "@/lib/derive";
import { PageHeader, SectionCard, DemoNote, EmptyState } from "@/components/shared/ui-bits";
import { userById } from "@/lib/derive";
import type { User } from "@/data/types";

export const Route = createFileRoute("/admin/assignments")({
  head: () => ({ meta: [{ title: "Assignments & Leave | Admin | EnHM Management System" }] }),
  component: Assignments,
});

function Assignments() {
  const { db, actions } = useDemo();
  const chis = db.users.filter((u) => u.role === "chi" && u.active);
  const clerks = db.users.filter((u) => u.role === "clerk" && u.active);

  /* CHI reassignment form state */
  const [fromChi, setFromChi] = useState<string>("");
  const [toChi, setToChi] = useState<string>("");
  const [selStations, setSelStations] = useState<string[]>([]);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [chiReason, setChiReason] = useState("");
  const [carryPending, setCarryPending] = useState(true);
  const [chiConfirm, setChiConfirm] = useState(false);

  /* Clerk reassignment form state */
  const [fromClerk, setFromClerk] = useState<string>("");
  const [toClerk, setToClerk] = useState<string>("");
  const [cLeaveStart, setCLeaveStart] = useState("");
  const [cLeaveEnd, setCLeaveEnd] = useState("");
  const [clerkReason, setClerkReason] = useState("");
  const [clerkConfirm, setClerkConfirm] = useState(false);

  const fromChiStations = useMemo(() => (fromChi ? stationsOfChi(db, fromChi) : []), [db, fromChi]);
  const fromClerkChis = useMemo(() => (fromClerk ? (userById(db, fromClerk)?.supervisesChiIds ?? []) : []), [db, fromClerk]);

  const doChiReassign = () => {
    const res = actions.reassignChi({ fromChiId: fromChi, toChiId: toChi, stationIds: selStations, ...(leaveStart ? { leaveStart } : {}), ...(leaveEnd ? { leaveEnd } : {}), reason: chiReason, carryPending });
    setChiConfirm(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("CHI reassignment complete", {
      description: carryPending ? "Submitted-but-unverified work for the transferred stations is now labelled Carried Forward in the clerk's workspace." : "Pending work has moved to the replacement CHI.",
    });
    setFromChi(""); setToChi(""); setSelStations([]); setLeaveStart(""); setLeaveEnd(""); setChiReason("");
  };
  const doClerkReassign = () => {
    const res = actions.reassignClerk({ fromClerkId: fromClerk, toClerkId: toClerk, ...(cLeaveStart ? { leaveStart: cLeaveStart } : {}), ...(cLeaveEnd ? { leaveEnd: cLeaveEnd } : {}), reason: clerkReason });
    setClerkConfirm(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Clerk workload transferred", { description: "The absent clerk's CHIs now report to the replacement clerk." });
    setFromClerk(""); setToClerk(""); setCLeaveStart(""); setCLeaveEnd(""); setClerkReason("");
  };

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        kicker="Admin · Assignment hierarchy"
        title="Assignments & Leave Management"
        description="Assignment chain: Railway Station → CHI → Clerk → Officer. Stations are never allocated directly to a clerk — supervision always flows through the CHI."
      />

      <SectionCard title="Current assignment chain" icon={GitBranch} subtitle="Each station works through exactly one CHI; each CHI reports to exactly one clerk">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Station</TableHead><TableHead>CHI</TableHead><TableHead>Clerk (supervision)</TableHead><TableHead>Officer</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {db.stations.map((s) => {
                const chi = s.chiId ? userById(db, s.chiId) : undefined;
                const clerk = chi ? clerkOfChi(db, chi.id) : undefined;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap font-medium">{s.code} <span className="text-xs text-muted-foreground">{s.name}</span></TableCell>
                    <TableCell>{chi ? chi.name : <span className="text-destructive">Unassigned</span>}</TableCell>
                    <TableCell>{clerk ? clerk.name : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{db.users.find((u) => u.role === "officer" && u.active)?.name ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard className="mt-5" title="Clerk ↔ CHI supervision" icon={UserCog} subtitle="Assign multiple CHIs to each clerk; a station never bypasses its CHI">
        <div className="grid gap-4 md:grid-cols-2">
          {clerks.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="mb-2 text-[11px] text-muted-foreground">{c.designation}</p>
              <ul className="space-y-1.5">
                {chis.map((chi) => {
                  const assigned = (c.supervisesChiIds ?? []).includes(chi.id);
                  return (
                    <li key={chi.id} className="flex items-center justify-between gap-2 rounded border border-border bg-muted/40 px-2.5 py-1.5">
                      <span className="text-xs">{chi.name}<span className="ml-1 text-[10px] text-muted-foreground">({db.stations.filter((s) => s.chiId === chi.id).length} stations)</span></span>
                      <Switch checked={assigned} onCheckedChange={() => {
                        const res = actions.toggleSupervision(c.id, chi.id);
                        if (res.ok) toast.success(assigned ? `${chi.name} removed from ${c.name}` : `${chi.name} assigned to ${c.name}`);
                      }} aria-label={`${assigned ? "Remove" : "Assign"} ${chi.name} ${assigned ? "from" : "to"} clerk ${c.name}`} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="mt-5" title="Leave & workload reassignment" icon={ArrowRightLeft}
        subtitle="Transfers follow the assignment chain — stations move with their CHI; a clerk's CHIs move to the replacement clerk">
        <Tabs defaultValue="chi">
          <TabsList>
            <TabsTrigger value="chi">CHI on leave</TabsTrigger>
            <TabsTrigger value="clerk">Clerk on leave</TabsTrigger>
          </TabsList>

          <TabsContent value="chi" className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>CHI going on leave / being moved <span className="text-destructive">*</span></Label>
                <Select value={fromChi} onValueChange={(v) => { setFromChi(v); setSelStations([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select CHI" /></SelectTrigger>
                  <SelectContent>{chis.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({db.stations.filter((s) => s.chiId === c.id).length} stations)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Replacement CHI <span className="text-destructive">*</span></Label>
                <Select value={toChi} onValueChange={setToChi}>
                  <SelectTrigger><SelectValue placeholder="Select replacement" /></SelectTrigger>
                  <SelectContent>{chis.filter((c) => c.id !== fromChi).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({db.stations.filter((s) => s.chiId === c.id).length} stations)</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {fromChi && (
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-semibold">Stations of {userById(db, fromChi)?.name} — select the stations to transfer:</p>
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {fromChiStations.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-xs">
                      <Checkbox checked={selStations.includes(s.id)} onCheckedChange={(v) => setSelStations((prev) => v ? [...prev, s.id] : prev.filter((x) => x !== s.id))} aria-label={`Transfer ${s.code}`} />
                      <span className="font-mono font-bold">{s.code}</span> {s.name}
                    </label>
                  ))}
                  {fromChiStations.length === 0 && <p className="text-xs text-muted-foreground">This CHI currently has no stations assigned.</p>}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Leave start</Label><Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Leave end</Label><Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} /></div>
              <div className="flex items-end">
                <label className="flex items-start gap-2 text-xs">
                  <Switch checked={carryPending} onCheckedChange={setCarryPending} aria-label="Carry pending work" />
                  <span><span className="font-semibold">Carry pending work as “Carried Forward”</span><span className="block text-[10px] text-muted-foreground">Off = pending work moves to the replacement CHI</span></span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={chiReason} onChange={(e) => setChiReason(e.target.value)} placeholder="e.g. Earned leave — cluster temporarily transferred…" />
            </div>
            <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p><strong>Reassignment warning:</strong> the selected stations will report through {toChi ? userById(db, toChi)?.name : "the replacement CHI"} until the assignment is reverted. Submitted-but-unverified work is kept intact and labelled Carried Forward (client decision pending — Q9 in Questions &amp; Assumptions).</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setChiConfirm(true)} disabled={!fromChi || !toChi || selStations.length === 0 || !chiReason.trim()}>
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Confirm reassignment
              </Button>
              <Button variant="ghost" onClick={() => { setFromChi(""); setToChi(""); setSelStations([]); setChiReason(""); }}>Clear form</Button>
            </div>
          </TabsContent>

          <TabsContent value="clerk" className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Clerk going on leave <span className="text-destructive">*</span></Label>
                <Select value={fromClerk} onValueChange={setFromClerk}>
                  <SelectTrigger><SelectValue placeholder="Select clerk" /></SelectTrigger>
                  <SelectContent>{clerks.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({(c.supervisesChiIds ?? []).length} CHIs)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Replacement clerk <span className="text-destructive">*</span></Label>
                <Select value={toClerk} onValueChange={setToClerk}>
                  <SelectTrigger><SelectValue placeholder="Select replacement" /></SelectTrigger>
                  <SelectContent>{clerks.filter((c) => c.id !== fromClerk).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({(c.supervisesChiIds ?? []).length} CHIs)</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {fromClerk && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold">CHIs whose supervision will transfer:</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {fromClerkChis.map((id) => {
                    const chi = userById(db, id);
                    return chi ? <li key={id} className="rounded border border-border bg-muted px-2 py-0.5 text-xs">{chi.name} <span className="text-[10px] text-muted-foreground">({db.stations.filter((s) => s.chiId === id).length} stations)</span></li> : null;
                  })}
                </ul>
                <p className="mt-1.5 text-[11px] text-muted-foreground"><CalendarRange className="mr-1 inline h-3 w-3" aria-hidden />Reporting history stays intact; the replacement clerk supervises verification going forward.</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Leave start</Label><Input type="date" value={cLeaveStart} onChange={(e) => setCLeaveStart(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Leave end</Label><Input type="date" value={cLeaveEnd} onChange={(e) => setCLeaveEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={clerkReason} onChange={(e) => setClerkReason(e.target.value)} placeholder="e.g. Annual medical leave — verification workload transferred…" />
            </div>
            <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p><strong>Reassignment warning:</strong> all CHIs under {fromClerk ? userById(db, fromClerk)?.name : "the selected clerk"} move to {toClerk ? userById(db, toClerk)?.name : "the replacement clerk"}. Their stations follow their respective CHIs.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setClerkConfirm(true)} disabled={!fromClerk || !toClerk || !clerkReason.trim()}>
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Confirm transfer
              </Button>
              <Button variant="ghost" onClick={() => { setFromClerk(""); setToClerk(""); setClerkReason(""); }}>Clear form</Button>
            </div>
          </TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard className="mt-5" title="Reassignment history" icon={History} subtitle="Previous and current assignment, with leave period and reason">
        {db.reassignments.length === 0 ? (
          <EmptyState icon={History} title="No reassignments recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead>
                  <TableHead>Scope</TableHead><TableHead>Leave period</TableHead><TableHead>Reason</TableHead><TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...db.reassignments].reverse().map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">{fmtDateTime(r.at)}</TableCell>
                    <TableCell><span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase">{r.kind === "chi" ? "CHI" : "Clerk"}</span></TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{userById(db, r.fromUserId)?.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{userById(db, r.toUserId)?.name}</TableCell>
                    <TableCell className="text-xs">{r.kind === "chi" ? r.stationIds.map((id) => db.stations.find((s) => s.id === id)?.code).join(", ") : r.chiIds.map((id) => userById(db, id)?.name).join(", ")}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">{r.leaveStart ? `${fmtDate(r.leaveStart)} – ${fmtDate(r.leaveEnd ?? r.leaveStart)}` : "—"}</TableCell>
                    <TableCell className="max-w-[240px] text-xs italic">“{r.reason}”</TableCell>
                    <TableCell className="text-xs">{userById(db, r.byUserId)?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DemoNote>
          Seeded example: Rampurhat (RPH) was moved from CHI Sourav Mondal to CHI Anil Prasad during leave — its pending entries appear as “Carried Forward” in Clerk 2's workspace.
        </DemoNote>
      </SectionCard>

      {/* CHI confirm */}
      <Dialog open={chiConfirm} onOpenChange={setChiConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirm CHI reassignment</DialogTitle>
            <DialogDescription>
              {selStations.length} station(s) ({selStations.map((id) => db.stations.find((s) => s.id === id)?.code).join(", ")}) move from {userById(db, fromChi)?.name} to {userById(db, toChi)?.name}.
              {carryPending ? " Pending work stays labelled Carried Forward under the previous assignment." : " Pending work moves to the new CHI."} Reassignment history is recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChiConfirm(false)}>Cancel</Button>
            <Button onClick={doChiReassign}><ArrowRight className="mr-1 h-3.5 w-3.5" aria-hidden /> Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clerk confirm */}
      <Dialog open={clerkConfirm} onOpenChange={setClerkConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirm clerk workload transfer</DialogTitle>
            <DialogDescription>
              {fromClerkChis.length} CHI(s) supervised by {userById(db, fromClerk)?.name} move to {userById(db, toClerk)?.name}. Their stations follow their respective CHIs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClerkConfirm(false)}>Cancel</Button>
            <Button onClick={doClerkReassign}><ArrowRight className="mr-1 h-3.5 w-3.5" aria-hidden /> Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
