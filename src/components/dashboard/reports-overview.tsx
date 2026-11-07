import { useMemo } from "react";
import { Bar, BarChart, Cell as RCell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { BarChart3, ClipboardCheck, FileClock, Info, TriangleAlert } from "lucide-react";
import { useDemo } from "@/lib/store";
import { contractDaysLeft, contractStatus, fmtDate, stationById, userById } from "@/lib/derive";
import { rowsForEntryScope } from "@/lib/ops";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DemoNote, EmptyState, SampleBanner, SectionCard, StatusBadge } from "@/components/shared/ui-bits";
import { todayISO } from "@/data/seed";

export function ReportsOverview() {
  const { db } = useDemo();
  const today = todayISO();
  const stations = db.stations.filter((s) => s.active);

  const perStation = useMemo(() => {
    return stations.map((s) => {
      const rows = rowsForEntryScope(db, [s], today);
      const total = rows.length;
      const cleared = rows.filter((r) => r.state === "cleared").length;
      const submitted = rows.filter((r) => ["submitted", "out_of_range", "late", "resubmitted"].includes(r.state)).length;
      const exceptions = rows.filter((r) => ["missing", "late", "out_of_range", "sent_back", "escalated"].includes(r.state)).length;
      const complete = total === 0 ? 0 : Math.round(((cleared + submitted) / total) * 100);
      return { s, total, cleared, submitted, exceptions, complete };
    });
  }, [db, stations, today]);

  const chartData = perStation.map((p) => ({ code: p.s.code, completion: p.complete }));

  const activityWise = (activity: "2" | "9") => {
    const rows = rowsForEntryScope(db, stations, today).filter((r) => r.activity === activity);
    return {
      total: rows.length,
      cleared: rows.filter((r) => r.state === "cleared").length,
      submitted: rows.filter((r) => ["submitted", "resubmitted"].includes(r.state)).length,
      late: rows.filter((r) => r.state === "late").length,
      outOfRange: rows.filter((r) => r.state === "out_of_range").length,
      missing: rows.filter((r) => r.state === "missing").length,
      sentBack: rows.filter((r) => r.state === "sent_back").length,
    };
  };

  return (
    <div className="mx-auto max-w-[1300px]">
      <SampleBanner>Frontend demonstration previews — not official railway reports. Figures reflect the demo data in this browser.</SampleBanner>

      <SectionCard title="Station-wise reporting completion" subtitle={`Reporting date ${fmtDate(today)} — submitted or cleared entries as % of scoped reports`} icon={BarChart3}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="code" tick={{ fontSize: 11 }} stroke="var(--color-border)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-border)" unit="%" />
              <Bar dataKey="completion" radius={[3, 3, 0, 0]}>
                {chartData.map((d, i) => (
                  <RCell key={d.code} fill={(perStation[i]?.exceptions ?? 0) > 0 ? "var(--color-chart-3)" : "var(--color-chart-2)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DemoNote>Amber bars indicate stations with at least one exception on this date.</DemoNote>
      </SectionCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Activity-wise submission status" icon={ClipboardCheck}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Activity</TableHead><TableHead className="text-right">Scoped</TableHead><TableHead className="text-right">Cleared</TableHead><TableHead className="text-right">Submitted</TableHead><TableHead className="text-right">Late</TableHead><TableHead className="text-right">Out of range</TableHead><TableHead className="text-right">Missing</TableHead><TableHead className="text-right">Sent back</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {([["2", "2 – Solid Waste Generation"], ["9", "9 – MRF Plastic Baling"]] as const).map(([id, label]) => {
                  const a = activityWise(id as "2" | "9");
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.total}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.cleared}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.submitted}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.late}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.outOfRange}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.missing}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.sentBack}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <SectionCard title="Contract expiry overview" icon={FileClock} subtitle={`Warning window: ${db.rules.contractLeadDays} days`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Station</TableHead><TableHead>Contractor</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {db.contracts.map((c) => {
                  const st = contractStatus(c, db.rules.contractLeadDays);
                  const days = contractDaysLeft(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold">{stationById(db, c.stationId)?.code}</TableCell>
                      <TableCell className="text-xs">{c.contractor}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">{fmtDate(c.expiryDate)} {st !== "active" && <span className="text-[10px]">({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`})</span>}</TableCell>
                      <TableCell><StatusBadge state={st === "active" ? "cleared" : st === "expiring_soon" ? "late" : "escalated"} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-5" title="Detailed station completion" icon={BarChart3}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Station</TableHead><TableHead>CHI</TableHead><TableHead className="text-right">Scoped reports</TableHead><TableHead className="text-right">Cleared</TableHead><TableHead className="text-right">Submitted</TableHead><TableHead className="text-right">Exceptions</TableHead><TableHead className="text-right">Completion</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {perStation.map((p) => (
                <TableRow key={p.s.id}>
                  <TableCell className="whitespace-nowrap font-medium">{p.s.code} <span className="text-xs text-muted-foreground">{p.s.name}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{p.s.chiId ? userById(db, p.s.chiId)?.name : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.cleared}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.submitted}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.exceptions}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{p.complete}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Missing & late entries" icon={TriangleAlert}>
          {(() => {
            const rows = rowsForEntryScope(db, stations, today).filter((r) => r.state === "missing" || r.state === "late");
            if (rows.length === 0) return <EmptyState title="No missing or late entries today" />;
            return (
              <ul className="divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.key} className="flex items-center gap-3 py-2">
                    <StatusBadge state={r.state} className="shrink-0" />
                    <span className="text-xs">{r.station.code} · {r.activity === "2" ? "Solid Waste" : "MRF"}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </SectionCard>
        <SectionCard title="Clerk verification status" icon={Info}>
          <ul className="divide-y divide-border">
            {db.users.filter((u) => u.role === "clerk").map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-xs">
                <span className="font-medium">{c.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {db.verifications.filter((v) => v.clerkId === c.id && v.action === "clear").length} cleared · {db.verifications.filter((v) => v.clerkId === c.id && v.action === "send_back").length} sent back
                </span>
              </li>
            ))}
          </ul>
          <DemoNote>Reassignment history lives under Admin → Assignments &amp; Leave; the full action log is in the Audit Trail.</DemoNote>
        </SectionCard>
      </div>
    </div>
  );
}
