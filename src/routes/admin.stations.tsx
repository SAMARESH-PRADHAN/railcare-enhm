import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin, Pencil, Plus, Power, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { clerkOfChi, type CellState } from "@/lib/derive";
import { cellFor } from "@/lib/derive";
import { todayISO } from "@/data/seed";
import type { Station, StationCategory } from "@/data/types";
import { EmptyState, PageHeader, SampleBanner, SectionCard, StatusBadge, DemoNote } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/admin/stations")({
  head: () => ({ meta: [{ title: "Station Management | Admin | EnHM Management System" }] }),
  component: StationManagement,
});

function StationManagement() {
  const { db, actions } = useDemo();
  const today = todayISO();
  const [search, setSearch] = useState("");
  const [editStation, setEditStation] = useState<Station | "new" | null>(null);
  const [confirmStation, setConfirmStation] = useState<Station | null>(null);
  const [form, setForm] = useState({ code: "", name: "", category: "NGT" as StationCategory, platforms: "2", chiId: "none", active: true });

  const chis = db.users.filter((u) => u.role === "chi" && u.active);
  const stations = useMemo(() => {
    let list = db.stations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => `${s.code} ${s.name}`.toLowerCase().includes(q));
    }
    return list;
  }, [db.stations, search]);

  const openEdit = (s: Station) => {
    setForm({ code: s.code, name: s.name, category: s.category, platforms: String(s.platforms), chiId: s.chiId ?? "none", active: s.active });
    setEditStation(s);
  };
  const openNew = () => {
    setForm({ code: "", name: "", category: "NGT", platforms: "2", chiId: "none", active: true });
    setEditStation("new");
  };

  const save = () => {
    const res = actions.upsertStation({
      ...(editStation !== "new" && editStation ? { id: editStation.id } : {}),
      active: form.active,
      chiId: form.chiId === "none" ? null : form.chiId,
      code: form.code.trim(), name: form.name.trim(), category: form.category, platforms: Number(form.platforms) || 0,
    });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(editStation === "new" ? "Station added" : "Station updated");
    setEditStation(null);
  };

  return (
    <div className="mx-auto max-w-[1300px]">
      <SampleBanner>
        <strong>11 of 199 stations shown – Sample Data.</strong> Only the nine NGT stations and two clearly marked sample halts are seeded; the division's remaining stations are out of prototype scope.
      </SampleBanner>
      <PageHeader
        kicker="Admin · Infrastructure"
        title="Station Management"
        description="Add, edit and deactivate stations, and assign a Chief Health Inspector to each. A station is always worked through its CHI — it is never allocated directly to a clerk."
        actions={<Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Add Station</Button>}
      />

      <SectionCard title={`${stations.length} station${stations.length === 1 ? "" : "s"}`} icon={Building2}
        actions={<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name…" className="h-8 w-52 text-xs" aria-label="Search stations" />}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Platforms</TableHead>
                <TableHead>Assigned CHI</TableHead>
                <TableHead>Clerk (via CHI)</TableHead>
                <TableHead>Today</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((s) => {
                const chi = s.chiId ? db.users.find((u) => u.id === s.chiId) : undefined;
                const clerk = chi ? clerkOfChi(db, chi.id) : undefined;
                const state: CellState = s.active ? cellFor(db, "2", s.id, today).state : "na";
                return (
                  <TableRow key={s.id} className={(!s.active || s.category === "Sample Halt") ? undefined : undefined}>
                    <TableCell className="font-mono text-sm font-bold"><Link to="/stations/$stationId" params={{ stationId: s.id }} className="hover:text-primary hover:underline">{s.code}</Link></TableCell>
                    <TableCell>
                      {s.name}
                      {s.category === "Sample Halt" && <span className="ml-1.5 rounded bg-secondary px-1 py-px text-[9px] font-bold uppercase text-muted-foreground">Sample</span>}
                    </TableCell>
                    <TableCell className="text-xs">{s.category === "NGT" ? "NGT station" : "Sample halt"}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.platforms}</TableCell>
                    <TableCell>
                      <Select value={s.chiId ?? "none"} onValueChange={(v) => {
                        const res = actions.assignChi(s.id, v === "none" ? null : v);
                        if (res.ok) toast.success(v === "none" ? `${s.code}: CHI unassigned` : `${s.code}: assigned to ${db.users.find((u) => u.id === v)?.name}`);
                      }}>
                        <SelectTrigger className="h-7 w-40 text-xs" aria-label={`Assign CHI to ${s.code}`}><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Unassigned —</SelectItem>
                          {chis.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{clerk?.name ?? "—"}</TableCell>
                    <TableCell>{s.active ? <StatusBadge state={state} /> : <span className="text-[11px] text-muted-foreground">Inactive</span>}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${s.active ? "status-good" : "status-neutral"}`}>{s.active ? "Active" : "Deactivated"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(s)} aria-label={`Edit ${s.code}`}><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setConfirmStation(s)} aria-label={s.active ? `Deactivate ${s.code}` : `Reactivate ${s.code}`}>
                          <Power className="h-3.5 w-3.5" aria-hidden /> {s.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DemoNote>The CHI dropdown writes an assignment record to the audit trail. Deactivating a station removes it from active reporting scope.</DemoNote>
      </SectionCard>

      {/* Edit / add modal */}
      <Dialog open={!!editStation} onOpenChange={(v) => !v && setEditStation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editStation === "new" ? "Add station" : `Edit ${form.code}`}</DialogTitle>
            <DialogDescription>
              {editStation === "new" ? "New stations start with default expected ranges, which can be tuned under Rules & Ranges." : "Station master data and CHI assignment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="s-code">Code <span className="text-destructive">*</span></Label><Input id="s-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={4} placeholder="HWH" className="font-mono uppercase" /></div>
              <div className="col-span-2 space-y-1.5"><Label htmlFor="s-name">Station name <span className="text-destructive">*</span></Label><Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Naihati Junction" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as StationCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGT">NGT station</SelectItem>
                    <SelectItem value="Sample Halt">Sample halt (fictional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="s-plat">Platforms</Label><Input id="s-plat" type="number" min={1} value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned CHI</Label>
              <Select value={form.chiId} onValueChange={(v) => setForm({ ...form, chiId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {chis.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" aria-hidden />The station's reporting flows through this CHI and then to the CHI's clerk.</p>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-input" /> Active station</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStation(null)}>Cancel</Button>
            <Button onClick={save} disabled={!form.code.trim() || !form.name.trim()}><UserPlus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> {editStation === "new" ? "Add station" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={!!confirmStation} onOpenChange={(v) => !v && setConfirmStation(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmStation?.active ? "Deactivate" : "Reactivate"} {confirmStation?.code}?</DialogTitle>
            <DialogDescription>
              {confirmStation?.active
                ? "The station leaves the active reporting scope. Existing submissions are preserved."
                : "The station returns to the active reporting scope."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStation(null)}>Cancel</Button>
            <Button variant={confirmStation?.active ? "destructive" : "default"}
              onClick={() => {
                if (!confirmStation) return;
                const res = actions.upsertStation({ id: confirmStation.id, active: !confirmStation.active, chiId: confirmStation.chiId, code: confirmStation.code, name: confirmStation.name, category: confirmStation.category, platforms: confirmStation.platforms });
                if (!res.ok) toast.error(res.error); else toast.success(`${confirmStation.code} ${confirmStation.active ? "deactivated" : "reactivated"}`);
                setConfirmStation(null);
              }}>
              {confirmStation?.active ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
