import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightLeft, BarChart3, Building2, ClipboardCheck, ClipboardList, FileClock,
  Gavel, Grid3x3, ListFilter, OctagonAlert, ReceiptText, TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import {
  activityName, contractDaysLeft, contractStatus, fmtDate, stationById, userById,
  chisOfClerk, stationsOfChi, type CellState,
} from "@/lib/derive";
import { exceptionRows, rangeLabel, rowsForEntryScope, valueLabel } from "@/lib/ops";
import type { WasteEntry, MrfEntry } from "@/data/types";
import {
  DemoNote, PageHeader, SectionCard, StatCard, StatusBadge, StatusDot, EmptyState, SampleBanner,
} from "@/components/shared/ui-bits";
import { cn } from "@/lib/utils";
import { todayISO } from "@/data/seed";

export const Route = createFileRoute("/officer/")({
  head: () => ({
    meta: [
      { title: "Officer Dashboard | EnHM Management System" },
      { name: "description", content: "Divisional EnHM officer dashboard — exceptions, clerk verifications and the station-by-activity operational grid." },
      { property: "og:title", content: "Officer Dashboard | EnHM Management System" },
      { property: "og:description", content: "Divisional EnHM officer dashboard for Eastern Railway, Howrah Division (demonstration prototype)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfficerDashboard,
});

type AttentionItem = {
  key: string; severity: "critical" | "high" | "medium";
  state: CellState; stationId: string; activity: "2" | "9";
  title: string; detail: string; href: string;
};

function OfficerDashboard() {
  const { db, actions, currentUser } = useDemo();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const layout = db.prefs.officerLayout;
  const setLayout = (v: string) => { if (v === "worklist" || v === "grid") actions.setOfficerLayout(v); };

  const allStations = useMemo(() => db.stations.filter((s) => s.active), [db.stations]);
  const rows = useMemo(() => rowsForEntryScope(db, allStations, date), [db, allStations, date]);
  const exceptions = useMemo(() => exceptionRows(db, allStations, date), [db, allStations, date]);

  /* ---------------- A. Needs your attention ---------------- */

  const attention: AttentionItem[] = [];
  rows.forEach((r) => {
    if (r.state === "sent_back") {
      attention.push({ key: r.key, severity: "critical", state: r.state, stationId: r.station.id, activity: r.activity, title: "Send-back awaiting CHI response", detail: `${r.station.code} ${r.station.name} · ${activityName(db, r.activity)} · last submitted ${valueLabel(r)}`, href: "/officer/exceptions" });
    } else if (r.state === "escalated") {
      attention.push({ key: r.key, severity: "critical", state: r.state, stationId: r.station.id, activity: r.activity, title: "Escalated exception unresolved", detail: `${r.station.code} ${r.station.name} · ${activityName(db, r.activity)}`, href: "/officer/exceptions" });
    } else if (r.state === "out_of_range" && r.entry) {
      attention.push({ key: r.key, severity: "high", state: r.state, stationId: r.station.id, activity: r.activity, title: "Out-of-range reading", detail: `${r.station.code} ${r.station.name} · ${activityName(db, r.activity)} · ${valueLabel(r)} (expected ${rangeLabel(db, r)})`, href: "/officer/exceptions" });
    } else if (r.state === "late" && r.entry) {
      attention.push({ key: r.key, severity: "medium", state: r.state, stationId: r.station.id, activity: r.activity, title: "Late submission", detail: `${r.station.code} ${r.station.name} · ${activityName(db, r.activity)} · reported ${fmtDate(r.entry.date)}, submitted after due time`, href: "/officer/exceptions" });
    } else if (r.state === "missing") {
      attention.push({ key: r.key, severity: "high", state: r.state, stationId: r.station.id, activity: r.activity, title: "Missing report", detail: `${r.station.code} ${r.station.name} · ${activityName(db, r.activity)} · no entry for ${fmtDate(date)}`, href: "/officer/exceptions" });
    }
  });
  db.contracts.forEach((c) => {
    const st = contractStatus(c, db.rules.contractLeadDays);
    if (st === "active") return;
    const days = contractDaysLeft(c);
    const station = stationById(db, c.stationId);
    attention.push({
      key: `contract:${c.id}`, severity: st === "expired" ? "critical" : "medium", state: "late",
      stationId: c.stationId, activity: "9",
      title: st === "expired" ? "Contract expired" : `Contract expires in ${days} day${Math.abs(days) === 1 ? "" : "s"}`,
      detail: `${station?.code} ${station?.name} · ${c.contractor} · expiry ${fmtDate(c.expiryDate)}`,
      href: "/contracts",
    });
  });
  const sevOrder = { critical: 0, high: 1, medium: 2 };
  attention.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  /* ---------------- B. Cleared by clerks ---------------- */

  const cleared = db.verifications
    .filter((v) => v.action === "clear")
    .map((v) => {
      const entry = v.entryKind === "waste" ? db.wasteEntries.find((e) => e.id === v.entryId) : db.mrfEntries.find((e) => e.id === v.entryId);
      if (!entry) return null;
      const station = stationById(db, entry.stationId);
      const chi = userById(db, entry.chiId);
      const clerk = userById(db, v.clerkId);
      const range = db.ranges[entry.stationId];
      const value = v.entryKind === "waste" ? `Dry ${(entry as WasteEntry).dryKg} / Wet ${(entry as WasteEntry).wetKg} KG` : `Infeed ${(entry as MrfEntry).infeedKg} KG · ${(entry as MrfEntry).bales} bales`;
      const expected = v.entryKind === "waste" ? (range ? `Dry ${range.dry[0]}–${range.dry[1]} · Wet ${range.wet[0]}–${range.wet[1]} KG` : "—") : range ? `Infeed ${range.infeed[0]}–${range.infeed[1]} KG` : "—";
      return { v, entry, station, chi, clerk, value, expected };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.v.at.localeCompare(a.v.at));

  /* ---------------- C. Grid filters ---------------- */

  const [fStation, setFStation] = useState("all");
  const [fChi, setFChi] = useState("all");
  const [fClerk, setFClerk] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fActivity, setFActivity] = useState<"2" | "9" | "both">("both");

  const gridRows = useMemo(() => {
    let list = [...allStations];
    if (fStation !== "all") list = list.filter((s) => s.id === fStation);
    if (fChi !== "all") list = list.filter((s) => s.chiId === fChi);
    if (fClerk !== "all") {
      const chis = chisOfClerk(db, fClerk).map((c) => c.id);
      list = list.filter((s) => s.chiId && chis.includes(s.chiId));
    }
    return list;
  }, [db, allStations, fStation, fChi, fClerk]);

  const cellMatches = (state: CellState) => fStatus === "all" || state === fStatus;

  const submitted = rows.filter((r) => r.entry?.submittedAt).length;
  const pendingCount = rows.filter((r) => r.state === "pending").length;
  const clearedCount = rows.filter((r) => r.state === "cleared").length;

  const chiWorkload = db.users.filter((u) => u.role === "chi" && u.active).map((chi) => {
    const sts = stationsOfChi(db, chi.id);
    const rs = rowsForEntryScope(db, sts, date);
    return { chi, stations: sts.length, exceptions: rs.filter((r) => ["missing", "late", "out_of_range", "sent_back", "escalated"].includes(r.state)).length, cleared: rs.filter((r) => r.state === "cleared").length };
  });
  const clerkPerformance = db.users.filter((u) => u.role === "clerk" && u.active).map((c) => ({
    clerk: c,
    cleared: db.verifications.filter((v) => v.action === "clear" && v.clerkId === c.id).length,
    sentBack: db.verifications.filter((v) => v.action === "send_back" && v.clerkId === c.id).length,
  }));

  return (
    <div className="mx-auto max-w-[1500px]">
      <SampleBanner>
        <strong>11 of 199 stations shown – Sample Data.</strong> Operational figures are a scripted demonstration scenario for client presentation.
      </SampleBanner>

      <PageHeader
        kicker="Divisional Officer, EnHM"
        title={`Division Monitor — ${fmtDate(date)}`}
        description={`Welcome, ${currentUser.name}. Supervision scope: ${allStations.length} sample stations, ${db.users.filter((u) => u.role === "chi" && u.active).length} CHIs, ${db.users.filter((u) => u.role === "clerk" && u.active).length} verification clerks.`}
        actions={
          <>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} className="h-9 w-40" aria-label="Reporting date filter" />
            <ToggleGroup type="single" value={layout} onValueChange={setLayout} aria-label="Dashboard layout">
              <ToggleGroupItem value="worklist" className="gap-1.5 text-xs" aria-label="Worklist first layout"><ClipboardList className="h-3.5 w-3.5" /> Worklist First</ToggleGroupItem>
              <ToggleGroupItem value="grid" className="gap-1.5 text-xs" aria-label="Grid first layout"><Grid3x3 className="h-3.5 w-3.5" /> Grid First</ToggleGroupItem>
            </ToggleGroup>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Needs attention" value={attention.length} tone="bad" hint="Critical & unresolved" icon={OctagonAlert} />
        <StatCard label="Submitted" value={submitted} tone="good" hint="Entries received" icon={ClipboardCheck} />
        <StatCard label="Pending" value={pendingCount} tone="info" hint="Not yet due / unverified" icon={ClipboardList} />
        <StatCard label="Cleared" value={clearedCount} tone="good" hint="Verified by clerks" icon={ClipboardCheck} />
        <StatCard label="Exceptions" value={exceptions.length} tone="warn" hint="Missing · late · range" icon={TriangleAlert} />
        <StatCard label="Contract alerts" value={db.contracts.filter((c) => contractStatus(c, db.rules.contractLeadDays) !== "active").length} tone="bad" hint="Expiring / expired" icon={FileClock} />
      </div>

      <Tabs value={layout} onValueChange={(v) => setLayout(v)}>
        <TabsList className="mb-4 hidden">
          <TabsTrigger value="worklist">Worklist</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
        </TabsList>

        {/* ============ WORKLIST FIRST ============ */}
        <TabsContent value="worklist" className="mt-0 space-y-5">
          <SectionCard
            title="A. Needs Your Attention"
            subtitle="Critical exceptions, unresolved issues, send-backs, missing & late reports, contract alerts"
            icon={OctagonAlert}
            actions={<Badge variant="outline" className="tabular-nums">{attention.length} item{attention.length === 1 ? "" : "s"}</Badge>}
          >
            {attention.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Nothing needs your attention" hint="All sample stations have reported within range and no contract alerts are active." />
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((item) => {
                  const station = stationById(db, item.stationId);
                  const chi = station?.chiId ? userById(db, station.chiId) : undefined;
                  return (
                    <li key={item.key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                      <StatusBadge state={item.state} className="w-fit shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-foreground">
                          {item.title}
                          <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{station?.code} · {activityName(db, item.activity).replace(/Activity \d – /, "")}</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{item.detail}{chi ? ` · CHI: ${chi.name}` : ""}</p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="h-8 shrink-0">
                        <Link to={item.href}>Open <span className="sr-only"> {item.title}</span></Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="B. Cleared by Clerks"
            subtitle="Original submitted figures with the clerk's mandatory verification note — audit the decision"
            icon={ClipboardCheck}
            actions={<Button asChild variant="outline" size="sm" className="h-8"><Link to="/officer/verifications">Full verification history</Link></Button>}
          >
            {cleared.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No entries cleared yet" hint="Cleared entries appear here with the clerk's note for your audit." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>CHI</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Original submitted value</TableHead>
                      <TableHead>Expected range</TableHead>
                      <TableHead>Clerk</TableHead>
                      <TableHead>Clerk's clearing note</TableHead>
                      <TableHead>Verified on</TableHead>
                      <TableHead className="text-right">Audit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cleared.map(({ v, entry, station, chi, clerk, value, expected }) => (
                      <TableRow key={v.id}>
                        <TableCell className="whitespace-nowrap font-medium">{station?.code} <span className="text-muted-foreground">{station?.name}</span></TableCell>
                        <TableCell className="whitespace-nowrap">{chi?.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{entry.activity === "2" ? "2 – Solid Waste" : "9 – MRF Baling"}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{value}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">{expected}</TableCell>
                        <TableCell className="whitespace-nowrap">{clerk?.name}</TableCell>
                        <TableCell className="max-w-[260px] text-xs italic text-foreground">“{v.note}”</TableCell>
                        <TableCell className="whitespace-nowrap text-xs tabular-nums">{new Date(v.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</TableCell>
                        <TableCell className="text-right">
                          <StatusBadge state="cleared" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <DemoNote>The original CHI submission is never altered by verification — the figures above are exactly as the CHI submitted them.</DemoNote>
          </SectionCard>

          <GridSection
            db={db} date={date} gridRows={gridRows} fActivity={fActivity} setFActivity={setFActivity}
            fStation={fStation} setFStation={setFStation} fChi={fChi} setFChi={setFChi}
            fClerk={fClerk} setFClerk={setFClerk} fStatus={fStatus} setFStatus={setFStatus}
            cellMatches={cellMatches}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="CHI Workload Summary" icon={Building2} subtitle={`Reporting position for ${fmtDate(date)}`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>CHI</TableHead><TableHead className="text-right">Stations</TableHead><TableHead className="text-right">Exceptions</TableHead><TableHead className="text-right">Cleared</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {chiWorkload.map((w) => (
                      <TableRow key={w.chi.id}>
                        <TableCell className="whitespace-nowrap font-medium">{w.chi.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{w.stations}</TableCell>
                        <TableCell className="text-right tabular-nums">{w.exceptions}</TableCell>
                        <TableCell className="text-right tabular-nums">{w.cleared}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
            <SectionCard title="Clerk Performance Summary" icon={ReceiptText} subtitle="Verification actions recorded to date">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Clerk</TableHead><TableHead className="text-right">Cleared</TableHead><TableHead className="text-right">Sent back</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {clerkPerformance.map((p) => (
                      <TableRow key={p.clerk.id}>
                        <TableCell className="whitespace-nowrap font-medium">{p.clerk.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.cleared}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.sentBack}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DemoNote>Reassignment history is available under Admin → Assignments &amp; Leave and in the Audit Trail.</DemoNote>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ============ GRID FIRST ============ */}
        <TabsContent value="grid" className="mt-0 space-y-5">
          <GridSection
            db={db} date={date} gridRows={gridRows} fActivity={fActivity} setFActivity={setFActivity}
            fStation={fStation} setFStation={setFStation} fChi={fChi} setFChi={setFChi}
            fClerk={fClerk} setFClerk={setFClerk} fStatus={fStatus} setFStatus={setFStatus}
            cellMatches={cellMatches} expanded
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <AttentionCompact attention={attention} db={db} />
            <SectionCard title="B. Cleared by Clerks" subtitle={`${cleared.length} verification(s) on record`} icon={ClipboardCheck}
              actions={<Button asChild variant="outline" size="sm" className="h-8"><Link to="/officer/verifications">History</Link></Button>}>
              {cleared.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="No entries cleared yet" />
              ) : (
                <ul className="divide-y divide-border">
                  {cleared.slice(0, 5).map(({ v, station, clerk, value, entry }) => (
                    <li key={v.id} className="py-2.5">
                      <p className="text-xs font-semibold">
                        {station?.code} · {entry.activity === "2" ? "Solid Waste" : "MRF Baling"}
                        <span className="ml-2 font-mono tabular-nums font-normal text-muted-foreground">{value}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{clerk?.name}: “{v.note}”</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- grid ---------------- */

type GridProps = {
  db: ReturnType<typeof useDemo>["db"];
  date: string;
  gridRows: import("@/data/types").Station[];
  fActivity: "2" | "9" | "both"; setFActivity: (v: "2" | "9" | "both") => void;
  fStation: string; setFStation: (v: string) => void;
  fChi: string; setFChi: (v: string) => void;
  fClerk: string; setFClerk: (v: string) => void;
  fStatus: string; setFStatus: (v: string) => void;
  cellMatches: (s: CellState) => boolean;
  expanded?: boolean;
};

function GridSection(p: GridProps) {
  const { db } = p;
  const chiList = db.users.filter((u) => u.role === "chi" && u.active);
  const clerkList = db.users.filter((u) => u.role === "clerk" && u.active);
  const statusOptions: { value: string; label: string }[] = [
    { value: "all", label: "All statuses" }, { value: "submitted", label: "Submitted" },
    { value: "pending", label: "Pending" }, { value: "missing", label: "Missing" },
    { value: "late", label: "Late" }, { value: "out_of_range", label: "Out of range" },
    { value: "sent_back", label: "Sent back" }, { value: "cleared", label: "Cleared" },
    { value: "escalated", label: "Escalated" },
  ];

  return (
    <SectionCard
      title={p.expanded ? "C. Complete Division Overview — Station × Activity Grid" : "C. Complete Division Overview"}
      subtitle="Each cell carries an icon and a text label so the grid stays readable in black-and-white print"
      icon={Grid3x3}
    >
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Activity
          <Select value={p.fActivity} onValueChange={(v) => p.setFActivity(v as "2" | "9" | "both")}>
            <SelectTrigger className="mt-1 h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">All activities</SelectItem>
              <SelectItem value="2">Activity 2 – Solid Waste</SelectItem>
              <SelectItem value="9">Activity 9 – MRF Baling</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Station
          <Select value={p.fStation} onValueChange={p.setFStation}>
            <SelectTrigger className="mt-1 h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stations</SelectItem>
              {db.stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          CHI
          <Select value={p.fChi} onValueChange={p.setFChi}>
            <SelectTrigger className="mt-1 h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All CHIs</SelectItem>
              {chiList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Clerk
          <Select value={p.fClerk} onValueChange={p.setFClerk}>
            <SelectTrigger className="mt-1 h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clerks</SelectItem>
              {clerkList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Status
          <Select value={p.fStatus} onValueChange={p.setFStatus}>
            <SelectTrigger className="mt-1 h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => { p.setFStation("all"); p.setFChi("all"); p.setFClerk("all"); p.setFStatus("all"); p.setFActivity("both"); toast.success("Grid filters cleared"); }}>
          <ListFilter className="mr-1 h-3 w-3" aria-hidden /> Clear
        </Button>
      </div>

      {p.gridRows.length === 0 ? (
        <EmptyState icon={Grid3x3} title="No stations match the filters" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-muted">Station</TableHead>
                <TableHead>CHI / Clerk</TableHead>
                {(p.fActivity === "both" || p.fActivity === "2") && <TableHead>Activity 2 – Solid Waste Generation</TableHead>}
                {(p.fActivity === "both" || p.fActivity === "9") && <TableHead>Activity 9 – MRF Plastic Baling</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.gridRows.map((s) => {
                const chi = s.chiId ? userById(db, s.chiId) : undefined;
                const cell2 = rowsForEntryScope(db, [s], p.date).find((r) => r.kind === "waste")!;
                const cell9 = rowsForEntryScope(db, [s], p.date).find((r) => r.kind === "mrf");
                return (
                  <TableRow key={s.id}>
                    <TableCell className="sticky left-0 z-10 bg-card whitespace-nowrap">
                      <Link to="/stations/$stationId" params={{ stationId: s.id }} className="font-semibold text-foreground hover:text-primary hover:underline">
                        {s.code}
                      </Link>
                      <span className="block text-[11px] text-muted-foreground">{s.name}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {chi ? chi.name : <span className="text-destructive">Unassigned</span>}
                      <span className="block text-[11px] text-muted-foreground">Clerk: {chi ? (db.users.find((u) => u.role === "clerk" && u.supervisesChiIds?.includes(chi.id))?.name ?? "—") : "—"}</span>
                    </TableCell>
                    {(p.fActivity === "both" || p.fActivity === "2") && (
                      <TableCell>{p.cellMatches(cell2.state) ? <StatusDot state={cell2.state} /> : <span className="text-[11px] text-muted-foreground">filtered out</span>}</TableCell>
                    )}
                    {(p.fActivity === "both" || p.fActivity === "9") && (
                      <TableCell>{cell9 ? (p.cellMatches(cell9.state) ? <StatusDot state={cell9.state} /> : <span className="text-[11px] text-muted-foreground">filtered out</span>) : <StatusDot state="na" />}</TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <DemoNote>Scroll the grid horizontally on tablet/mobile — the station column stays fixed. “Not Applicable” marks stations without a plastic baling machine.</DemoNote>
    </SectionCard>
  );
}

function AttentionCompact({ attention, db }: { attention: AttentionItem[]; db: ReturnType<typeof useDemo>["db"] }) {
  return (
    <SectionCard title="A. Needs Your Attention" subtitle="Top items — switch to Worklist First for the full list" icon={OctagonAlert}>
      {attention.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nothing needs your attention" />
      ) : (
        <ul className="divide-y divide-border">
          {attention.slice(0, 6).map((item) => (
            <li key={item.key} className="flex items-center gap-3 py-2.5">
              <StatusBadge state={item.state} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{item.title} — {stationById(db, item.stationId)?.code}</p>
                <p className="truncate text-[11px] text-muted-foreground">{item.detail}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 shrink-0"><Link to={item.href}>Open</Link></Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}


