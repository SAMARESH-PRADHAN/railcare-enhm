import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, ArrowRightLeft, Building2, ClipboardList, FileClock, OctagonAlert,
  ShieldCheck, TriangleAlert, UserCog, Users,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/store";
import { contractDaysLeft, contractStatus, fmtDate, fmtDateTime, todayISO } from "@/lib/derive";
import { rowsForEntryScope, valueLabel } from "@/lib/ops";
import { PageHeader, SectionCard, StatCard, StatusBadge, SampleBanner, DemoNote } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | EnHM Management System" },
      { name: "description", content: "Division-wide administration dashboard — users, stations, assignments, activity configuration and demo settings." },
      { property: "og:title", content: "Admin Dashboard | EnHM Management System" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { db, currentUser } = useDemo();
  const today = todayISO();

  const stations = db.stations;
  const rows = useMemo(() => rowsForEntryScope(db, stations.filter((s) => s.active), today), [db, stations, today]);
  const pendingEntries = rows.filter((r) => r.state === "pending" || (!!r.entry && r.entry.status === "submitted")).length;
  const exceptions = rows.filter((r) => ["missing", "late", "out_of_range"].includes(r.state)).length;
  const escalations = rows.filter((r) => r.state === "escalated").length;
  const contractAlerts = db.contracts.filter((c) => contractStatus(c, db.rules.contractLeadDays) !== "active");

  const quickLinks = [
    { label: "User Management", to: "/admin/users", icon: Users, desc: "Add / edit CHIs, clerks & officers" },
    { label: "Station Management", to: "/admin/stations", icon: Building2, desc: "Stations, CHI assignment" },
    { label: "Assignments & Leave", to: "/admin/assignments", icon: ArrowRightLeft, desc: "Supervision chain & reassignment" },
    { label: "Rules & Ranges", to: "/admin/rules", icon: ClipboardList, desc: "Due times & expected ranges" },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <SampleBanner>
        <strong>11 of 199 stations shown – Sample Data.</strong> All personal details are fictional demonstration values.
      </SampleBanner>
      <PageHeader
        kicker="Divisional Administrator, EnHM"
        title={`Administration Overview — ${fmtDate(today)}`}
        description={`Signed in as ${currentUser.name}. Administrative control across the Howrah Division sample scope. The administrator never modifies submitted CHI figures — corrections flow through clerk verification.`}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total stations" value={stations.length} hint="of 199 in division (sample)" icon={Building2} />
        <StatCard label="Total CHIs" value={db.users.filter((u) => u.role === "chi").length} hint="Chief Health Inspectors" icon={ShieldCheck} />
        <StatCard label="Total clerks" value={db.users.filter((u) => u.role === "clerk").length} hint="Verification clerks" icon={UserCog} />
        <StatCard label="Active users" value={db.users.filter((u) => u.active).length} hint={`${db.users.filter((u) => !u.active).length} deactivated`} icon={Users} tone="info" />
        <StatCard label="Activities" value={db.activities.length} hint="2 live · 29 upcoming" icon={Activity} />
        <StatCard label="Pending entries" value={pendingEntries} tone="info" hint="Awaiting verification" icon={ClipboardList} />
        <StatCard label="Exceptions" value={exceptions} tone="warn" hint="Missing · late · range" icon={TriangleAlert} />
        <StatCard label="Escalations" value={escalations} tone="bad" hint="Unresolved" icon={OctagonAlert} />
        <StatCard label="Contracts expiring" value={contractAlerts.length} tone="bad" hint="Within warning window" icon={FileClock} />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((q) => (
          <Link key={q.to} to={q.to} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><q.icon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} aria-hidden /></span>
            <span>
              <span className="block text-sm font-semibold">{q.label}</span>
              <span className="block text-[11px] text-muted-foreground">{q.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Contract Expiry Alerts" icon={FileClock} subtitle={`Warning window: ${db.rules.contractLeadDays} days (configurable)`}
          actions={<Button asChild variant="outline" size="sm" className="h-8"><Link to="/contracts">All contracts</Link></Button>}>
          {contractAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contract alerts.</p>
          ) : (
            <ul className="divide-y divide-border">
              {contractAlerts.map((c) => {
                const days = contractDaysLeft(c);
                const st = contractStatus(c, db.rules.contractLeadDays);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{db.stations.find((s) => s.id === c.stationId)?.code} · {c.contractor}</p>
                      <p className="text-[11px] text-muted-foreground">Expiry {fmtDate(c.expiryDate)}</p>
                    </div>
                    <StatusBadge state={st === "expired" ? "escalated" : "late"} />
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Latest Audit Trail" icon={FileClock} actions={<Button asChild variant="outline" size="sm" className="h-8"><Link to="/audit">Full trail</Link></Button>}>
          <ul className="divide-y divide-border">
            {db.audit.slice(0, 6).map((a) => (
              <li key={a.id} className="py-2">
                <p className="text-xs font-medium">{a.action}</p>
                <p className="text-[10.5px] text-muted-foreground">{a.actorName} ({a.role.toUpperCase()}) · {fmtDateTime(a.ts)}{a.stationId ? ` · ${db.stations.find((s) => s.id === a.stationId)?.code}` : ""}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard className="mt-5" title="Today's Reporting Snapshot" icon={ClipboardList} subtitle={`All scoped stations — ${fmtDate(today)}`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Station</TableHead><TableHead>Activity 2 – Solid Waste</TableHead><TableHead>Values</TableHead><TableHead>Activity 9 – MRF</TableHead><TableHead>Values</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {stations.filter((s) => s.active).map((s) => {
                const r2 = rows.find((r) => r.station.id === s.id && r.kind === "waste")!;
                const r9 = rows.find((r) => r.station.id === s.id && r.kind === "mrf");
                return (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap font-medium">{s.code} <span className="text-xs text-muted-foreground">{s.name}</span></TableCell>
                    <TableCell><StatusBadge state={r2.state} /></TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{valueLabel(r2)}</TableCell>
                    <TableCell>{r9 ? <StatusBadge state={r9.state} /> : <StatusBadge state="na" />}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{r9 ? valueLabel(r9) : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DemoNote>Activities 1 and 3–31 appear in the catalogue as upcoming modules; only Activity 2 and Activity 9 are operational in this demonstration.</DemoNote>
      </SectionCard>
    </div>
  );
}
