import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, SlidersHorizontal, Timer, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { dueTimeLabel } from "@/lib/derive";
import { PageHeader, SectionCard, DemoNote, SampleBanner } from "@/components/shared/ui-bits";
import type { StationRange } from "@/data/types";

export const Route = createFileRoute("/admin/rules")({
  head: () => ({ meta: [{ title: "Rules & Ranges | Admin | EnHM Management System" }] }),
  component: RulesAndRanges,
});

function RulesAndRanges() {
  const { db, actions } = useDemo();
  const [wasteHour, setWasteHour] = useState(String(db.rules.wasteDueHour));
  const [mrfHour, setMrfHour] = useState(String(db.rules.mrfDueHour));
  const [lead, setLead] = useState(String(db.rules.contractLeadDays));

  const saveRules = () => {
    const res = actions.updateRules({ wasteDueHour: Number(wasteHour), mrfDueHour: Number(mrfHour), contractLeadDays: Number(lead) });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Reporting rules updated", { description: "Late detection now uses the new deadlines for future submissions." });
  };

  const [draft, setDraft] = useState<Record<string, StationRange>>({});
  const rangeOf = (id: string) => draft[id] ?? db.ranges[id];

  const setRange = (id: string, key: keyof StationRange, idx: 0 | 1, value: string) => {
    const cur = rangeOf(id);
    const num = value === "" ? 0 : Number(value);
    const next = { ...cur, [key]: idx === 0 ? [num, cur[key][1]] : [cur[key][0], num] } as StationRange;
    setDraft((d) => ({ ...d, [id]: next }));
  };

  const commit = (id: string) => {
    const r = rangeOf(id);
    const fields: (keyof StationRange)[] = ["dry", "wet", "infeed"];
    let failed = false;
    fields.forEach((k) => {
      [0, 1].forEach((i) => {
        const res = actions.updateRange(id, k, i as 0 | 1, r[k][i]);
        if (!res.ok) { toast.error(`${id}: ${res.error}`); failed = true; }
      });
    });
    if (!failed) {
      setDraft((d) => { const n = { ...d }; delete n[id]; return n; });
      toast.success(`Expected ranges updated for ${db.stations.find((s) => s.id === id)?.code}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <SampleBanner>Rules below apply to the sample scope only — in production they would be configured per division.</SampleBanner>
      <PageHeader
        kicker="Admin · Reporting configuration"
        title="Reporting Rules & Range Configuration"
        description="Activity-specific reporting frequency and deadlines, the contract warning window, and station-specific expected ranges. Ranges are set per station — one global range is never applied to every station."
      />

      <SectionCard title="Reporting rules" icon={Timer} subtitle="Late status is always calculated automatically from these deadlines"
        actions={<Button size="sm" onClick={saveRules}><Save className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Save rules</Button>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="r-waste">Activity 2 – Solid Waste: daily due time (hour of day)</Label>
            <Input id="r-waste" type="number" min={0} max={23} value={wasteHour} onChange={(e) => setWasteHour(e.target.value)} className="w-24 font-mono" />
            <p className="text-[11px] text-muted-foreground">Currently {dueTimeLabel(db.rules.wasteDueHour)} — a daily report not submitted by this time is flagged Missing.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-mrf">Activity 9 – MRF: daily due time (hour of day)</Label>
            <Input id="r-mrf" type="number" min={0} max={23} value={mrfHour} onChange={(e) => setMrfHour(e.target.value)} className="w-24 font-mono" />
            <p className="text-[11px] text-muted-foreground">Currently {dueTimeLabel(db.rules.mrfDueHour)}. Monthly returns are due with the last daily entry of the month.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-lead">Contract expiry warning window (days)</Label>
            <Input id="r-lead" type="number" min={1} value={lead} onChange={(e) => setLead(e.target.value)} className="w-24 font-mono" />
            <p className="text-[11px] text-muted-foreground">Currently {db.rules.contractLeadDays} days. Per-activity warning periods are a pending client decision (Q7).</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="mt-5" title="Station-specific expected ranges" icon={TrendingUp} subtitle="Activity 2 (dry / wet waste, KG) and Activity 9 (plastic infeed, KG)">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Dry waste min</TableHead><TableHead>Dry waste max</TableHead>
                <TableHead>Wet waste min</TableHead><TableHead>Wet waste max</TableHead>
                <TableHead>MRF infeed min</TableHead><TableHead>MRF infeed max</TableHead>
                <TableHead className="text-right">Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.stations.map((s) => {
                const r = rangeOf(s.id);
                const dirty = !!draft[s.id];
                return (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap"><span className="font-mono font-bold">{s.code}</span> <span className="text-xs text-muted-foreground">{s.name}</span></TableCell>
                    {(["dry", "wet", "infeed"] as const).map((k) => (
                      <TableCell key={k} colSpan={2} className="p-1">
                        <div className="flex items-center gap-1">
                          <Input aria-label={`${s.code} ${k} minimum`} type="number" min={0} value={r[k][0]} onChange={(e) => setRange(s.id, k, 0, e.target.value)} className="h-7 w-16 font-mono text-xs tabular-nums" />
                          <span className="text-xs text-muted-foreground">–</span>
                          <Input aria-label={`${s.code} ${k} maximum`} type="number" min={0} value={r[k][1]} onChange={(e) => setRange(s.id, k, 1, e.target.value)} className="h-7 w-16 font-mono text-xs tabular-nums" />
                          <span className="text-[10px] uppercase text-muted-foreground">{k}</span>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button size="sm" variant={dirty ? "default" : "ghost"} className="h-7 px-2 text-xs" disabled={!dirty} onClick={() => commit(s.id)}>
                        <SlidersHorizontal className="mr-1 h-3 w-3" aria-hidden /> {dirty ? "Save" : "Saved"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DemoNote>
          Example from the client brief: Howrah dry waste 300–600 KG while Sample Small Halt A is 15–45 KG — each station keeps its own range. Out-of-range submissions are accepted with a mandatory remark, never rejected.
        </DemoNote>
      </SectionCard>
    </div>
  );
}
