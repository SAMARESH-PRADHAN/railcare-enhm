import { useState } from "react";
import { CheckCircle2, CircleHelp, Wrench, TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";
import type { Assumption, AssumptionStatus } from "@/data/types";
import { DemoNote } from "@/components/shared/ui-bits";

const STATUS_META: Record<AssumptionStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: CircleHelp, className: "status-info" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "status-good" },
  change_required: { label: "Change Required", icon: TriangleAlert, className: "status-warn" },
};

export function AssumptionDecision({ assumption, canDecide }: { assumption: Assumption; canDecide: boolean }) {
  const { actions } = useDemo();
  const [note, setNote] = useState(assumption.note ?? "");
  const [noteOpen, setNoteOpen] = useState(false);
  const meta = STATUS_META[assumption.status];

  const set = (status: AssumptionStatus) => {
    actions.setAssumption(assumption.id, status, note.trim() || undefined);
    toast.success(`Q${assumption.id} marked "${STATUS_META[status].label}"`, {
      description: "The decision is recorded in the demonstration data and shown to every role.",
    });
  };

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          <span className="mr-1.5 inline-flex h-5 items-center rounded bg-primary px-1.5 align-middle text-[10px] font-bold text-primary-foreground">Q{assumption.id}</span>
          {assumption.title}
        </h3>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", meta.className)}>
          <meta.icon className="h-3 w-3" aria-hidden /> {meta.label}
        </span>
      </div>
      <dl className="mt-3 space-y-2 text-[12.5px] leading-relaxed">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assumption</dt>
          <dd className="text-foreground">{assumption.assumption}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What the demo currently does</dt>
          <dd className="text-foreground">{assumption.demoBehaviour}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Question for the railway officer</dt>
          <dd className="font-medium text-primary">“{assumption.question}”</dd>
        </div>
      </dl>

      {canDecide && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Record decision (demo)</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={assumption.status === "confirmed" ? "default" : "outline"} className="h-7" onClick={() => set("confirmed")}>
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden /> Confirmed
            </Button>
            <Button size="sm" variant={assumption.status === "change_required" ? "default" : "outline"} className="h-7" onClick={() => set("change_required")}>
              <Wrench className="mr-1 h-3 w-3" aria-hidden /> Change Required
            </Button>
            <Button size="sm" variant={assumption.status === "pending" ? "default" : "outline"} className="h-7" onClick={() => set("pending")}>
              <CircleHelp className="mr-1 h-3 w-3" aria-hidden /> Keep Pending
            </Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setNoteOpen((v) => !v)}>
              {noteOpen ? "Hide note" : "Add note"}
            </Button>
          </div>
          {noteOpen && (
            <div className="mt-2 space-y-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional decision note, e.g. department's clarification…" rows={2} aria-label={`Decision note for question ${assumption.id}`} />
              <Button size="sm" variant="secondary" className="h-7" onClick={() => { actions.setAssumption(assumption.id, assumption.status, note.trim() || undefined); toast.success("Note saved with this decision."); }}>
                Save note
              </Button>
            </div>
          )}
        </div>
      )}

      {!canDecide && assumption.status !== "pending" && (
        <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
          Decision recorded by {assumption.decidedBy ?? "—"}{assumption.note ? ` — “${assumption.note}”` : ""}
        </p>
      )}
    </article>
  );
}

export function AssumptionsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { db, currentUser } = useDemo();
  const canDecide = currentUser.role === "admin" || currentUser.role === "officer";
  const pending = db.assumptions.filter((a) => a.status === "pending").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <SheetTitle className="text-base">EnHM Requirements – Decisions Pending</SheetTitle>
          <SheetDescription className="text-xs">
            These are the assumptions used in this demonstration. Please confirm or correct them.
            <span className="ml-1 font-semibold text-warning-foreground">{pending} of {db.assumptions.length} still pending.</span>
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {db.assumptions.map((a) => (
              <AssumptionDecision key={a.id} assumption={a} canDecide={canDecide} />
            ))}
          </div>
          <DemoNote>
            Decision statuses are stored in the demonstration browser storage and can be reset from the header menu. This panel is part of the prototype scope discussion, not an official record.
          </DemoNote>
        </div>
      </SheetContent>
    </Sheet>
  );
}
