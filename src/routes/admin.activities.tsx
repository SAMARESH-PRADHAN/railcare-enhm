import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CirclePlay, ListChecks, Lock } from "lucide-react";
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
import type { ActivityDef } from "@/data/types";
import { PageHeader, SectionCard, StatusBadge, DemoNote, EmptyState } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/admin/activities")({
  head: () => ({ meta: [{ title: "Activity Configuration | Admin | EnHM Management System" }] }),
  component: ActivityConfiguration,
});

function ActivityConfiguration() {
  const { db } = useDemo();
  const [edit, setEdit] = useState<ActivityDef | null>(null);
  const [form, setForm] = useState({ short: "", description: "" });

  const openEdit = (a: ActivityDef) => { setForm({ short: a.short, description: a.description }); setEdit(a); };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        kicker="Admin · Activity catalogue"
        title="Activity Configuration"
        description="Review the EnHM activity catalogue. Activities 2 and 9 are live operational modules; the remaining activities of the department scope are configured for future releases."
      />

      <SectionCard title={`All ${db.activities.length} department activities`} icon={ListChecks} subtitle="Live modules are fully functional in this demo; upcoming modules show their planned field preview">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Module status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...db.activities].sort((a, b) => a.no - b.no).map((a) => (
                <TableRow key={a.no}>
                  <TableCell className="font-mono tabular-nums font-bold">{a.no}</TableCell>
                  <TableCell>
                    <p className="font-medium">{a.name}</p>
                    {a.previewFields && a.status === "upcoming" && (
                      <p className="mt-0.5 max-w-md text-[10.5px] leading-relaxed text-muted-foreground">
                        Planned fields: {a.previewFields.slice(0, 4).join(" · ")}{a.previewFields.length > 4 ? " · …" : ""}
                      </p>
                    )}
                    {a.taskTypes && a.status === "live" && (
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">Task types: {a.taskTypes.map((t) => t.replace("scheduled-", "scheduled ")).join(" · ")}</p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[280px] text-xs text-muted-foreground">{a.description}</TableCell>
                  <TableCell>
                    {a.status === "live" ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold status-good"><CirclePlay className="h-3 w-3" aria-hidden /> Live module</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold status-neutral"><Lock className="h-3 w-3" aria-hidden /> Upcoming – full workflow not included in this demo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(a)}>
                      {a.status === "live" ? "View" : "Edit preview"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DemoNote>
          No invented data-entry forms are provided for the 29 upcoming activities — the catalogue only shows the field previews from the department's requirement document.
        </DemoNote>
      </SectionCard>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activity {edit?.no} — {edit?.name}</DialogTitle>
            <DialogDescription>
              {edit?.status === "live" ? "Live operational module — data-entry flows are under Activity 2 and Activity 9 in the catalogue." : "Upcoming module — configure how it will be presented in the catalogue."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Short label</Label><Input value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description shown in catalogue</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            {edit?.status === "live" && (
              <p className="flex items-start gap-2 rounded-md border border-steel/30 bg-steel/5 p-2.5 text-[11px]">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" aria-hidden />
                Reporting frequency, due time and station-specific ranges for this module are configured under Rules &amp; Ranges.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Close</Button>
            <Button onClick={() => { toast.success("Catalogue preview updated (demo)"); setEdit(null); }}>Save preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
