import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, CheckCircle2, Info, TriangleAlert, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { ChiPhoneFrame } from "@/components/layout/chi-phone-frame";
import { fmtDate, fmtDateTime } from "@/lib/derive";
import type { MrfEntry, WasteEntry } from "@/data/types";
import { DemoNote, DemoPhoto } from "@/components/shared/ui-bits";

export const Route = createFileRoute("/chi/task/$taskId")({
  head: () => ({ meta: [
    { title: "Report Entry | CHI Field Workspace | EnHM" },
    { name: "description", content: "Submit or correct a station's daily solid waste or MRF report in the EnHM demo." },
    { property: "og:title", content: "Report Entry | CHI Field Workspace | EnHM" },
    { property: "og:description", content: "Daily field reporting page for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = Route.useParams();
  // key resets form state when navigating between different task entries
  return <TaskInner key={taskId} taskId={taskId} />;
}

function TaskInner({ taskId }: { taskId: string }) {
  const { db, actions, currentUser } = useDemo();

  const [kindRaw, stationId = "", date = ""] = taskId.split("~");
  const kind = kindRaw === "waste" ? "waste" : kindRaw;
  const valid = (kind === "waste" || kind === "mrf") && !!db.stations.find((s) => s.id === stationId && s.chiId === currentUser.id);

  const station = db.stations.find((s) => s.id === stationId);
  const range = station ? db.ranges[station.id] : undefined;
  const existing = valid
    ? kind === "waste"
      ? db.wasteEntries.find((e) => e.stationId === stationId && e.date === date)
      : db.mrfEntries.find((e) => e.stationId === stationId && e.date === date)
    : undefined;

  const [dry, setDry] = useState(existing && "dryKg" in existing ? String(existing.dryKg) : "");
  const [wet, setWet] = useState(existing && "wetKg" in existing ? String(existing.wetKg) : "");
  const [infeed, setInfeed] = useState(existing && "infeedKg" in existing ? String(existing.infeedKg) : "");
  const [bales, setBales] = useState(existing && "bales" in existing ? String(existing.bales) : "");
  const [remarks, setRemarks] = useState(existing?.remarks ?? "");
  const [photo, setPhoto] = useState<WasteEntry["photo"]>(null);

  const sentBack = existing?.status === "sent_back";
  const cleared = existing?.status === "cleared";
  const clerkReason = existing ? db.verifications.filter((v) => v.entryId === existing.id && v.action === "send_back").at(-1)?.note : undefined;

  if (!valid || !station || !range) {
    return (
      <ChiPhoneFrame note={false}>
        <div className="p-6 text-center">
          <TriangleAlert className="mx-auto mb-2 h-8 w-8 text-destructive" aria-hidden />
          <p className="text-sm font-semibold">Task not available</p>
          <p className="mt-1 text-xs text-muted-foreground">This entry does not belong to your assigned stations, or the link is invalid.</p>
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/chi"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to my tasks</Link></Button>
        </div>
      </ChiPhoneFrame>
    );
  }

  const isWaste = kind === "waste";
  const dryNum = Number(dry);
  const wetNum = Number(wet);
  const infeedNum = Number(infeed);
  const dryOut = isWaste && dry !== "" && (dryNum < range.dry[0] || dryNum > range.dry[1]);
  const wetOut = isWaste && wet !== "" && (wetNum < range.wet[0] || wetNum > range.wet[1]);
  const infeedOut = !isWaste && infeed !== "" && (infeedNum < range.infeed[0] || infeedNum > range.infeed[1]);
  const outOfRange = dryOut || wetOut || infeedOut;
  const remarkMissing = outOfRange && !remarks.trim();
  const formIncomplete = isWaste ? dry === "" || wet === "" : infeed === "" || bales === "";

  const submit = () => {
    if (formIncomplete) { toast.error("Please enter all figures before submitting."); return; }
    if (remarkMissing) { toast.error("Out-of-range reading: a remark explaining the deviation is mandatory."); return; }
    const res = isWaste
      ? actions.submitWasteEntry({ stationId, date, dryKg: dryNum, wetKg: wetNum, remarks: remarks.trim(), photo })
      : actions.submitMrfEntry({ stationId, date, infeedKg: infeedNum, bales: Number(bales), remarks: remarks.trim() });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(isWaste ? `Report saved — ${station.code}` : `MRF entry saved — ${station.code}`, {
      description: outOfRange ? "Saved with your explanation — marked Out of Range, awaiting clerk verification." : "Submitted for clerk verification.",
    });
  };

  return (
    <ChiPhoneFrame note={false}>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 py-2.5">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-white/10" aria-label="Back to my tasks">
          <Link to="/chi"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-sidebar-active-foreground">{station.code} · {isWaste ? "Solid Waste Entry" : "MRF Baling Entry"}</p>
          <p className="truncate text-[10px] text-sidebar-muted">Reporting date {fmtDate(date)} · CHI {currentUser.name}</p>
        </div>
      </div>

      <div className="space-y-4 p-4 pb-24">
        {cleared && (
          <div className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-xs text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>This entry has been cleared by the clerk. It is read-only; submitted figures remain unchanged.</p>
          </div>
        )}
        {sentBack && clerkReason && (
          <div className="rounded-md border border-danger/40 bg-danger/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger"><Undo2 className="h-3.5 w-3.5" aria-hidden /> Sent back by clerk — correction required</p>
            <p className="mt-1 text-[11px] italic text-foreground">“{clerkReason}”</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Correct the figures below and resubmit. Your original submission stays in the history.</p>
          </div>
        )}
        {existing && existing.status !== "sent_back" && existing.status !== "cleared" && (
          <div className="flex items-start gap-2 rounded-md border border-steel/40 bg-steel/5 p-3 text-xs">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-steel" aria-hidden />
            <p>Entry already submitted at {fmtDateTime(existing.submittedAt ?? "")}. You may update it before verification — the previous figures are preserved in the submission history.</p>
          </div>
        )}

        {isWaste ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dry">Dry waste (blue bin) — KG <span className="text-destructive">*</span></Label>
                <Input id="dry" type="number" inputMode="decimal" min={0} value={dry} onChange={(e) => setDry(e.target.value)} className="font-mono tabular-nums" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wet">Wet waste (green bin) — KG <span className="text-destructive">*</span></Label>
                <Input id="wet" type="number" inputMode="decimal" min={0} value={wet} onChange={(e) => setWet(e.target.value)} className="font-mono tabular-nums" placeholder="0" />
              </div>
            </div>
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-[11px] font-medium">
              Expected range for {station.code} — Dry <span className="font-mono tabular-nums">{range.dry[0]}–{range.dry[1]} KG</span>, Wet <span className="font-mono tabular-nums">{range.wet[0]}–{range.wet[1]} KG</span>
            </p>
            {(dryOut || wetOut) && (
              <div className="rounded-md border border-warning/60 bg-warning/10 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-warning-foreground">
                  <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
                  Out of Range — Expected {dryOut ? `${range.dry[0]}–${range.dry[1]}` : `${range.wet[0]}–${range.wet[1]}`} KG
                </p>
                <p className="mt-1 text-[11px]">Please explain why this reading is outside the expected range. The actual figure is not rejected — it will be saved with your explanation and marked “Out of Range – Awaiting Verification”.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="infeed">Daily plastic infeed — KG <span className="text-destructive">*</span></Label>
                <Input id="infeed" type="number" inputMode="decimal" min={0} value={infeed} onChange={(e) => setInfeed(e.target.value)} className="font-mono tabular-nums" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bales">Bales produced <span className="text-destructive">*</span></Label>
                <Input id="bales" type="number" inputMode="numeric" min={0} value={bales} onChange={(e) => setBales(e.target.value)} className="font-mono tabular-nums" placeholder="0" />
              </div>
            </div>
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-[11px] font-medium">
              Expected infeed range for {station.code} — <span className="font-mono tabular-nums">{range.infeed[0]}–{range.infeed[1]} KG</span>
            </p>
            {infeedOut && (
              <div className="rounded-md border border-warning/60 bg-warning/10 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-warning-foreground">
                  <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
                  Out of Range — Expected {range.infeed[0]}–{range.infeed[1]} KG
                </p>
                <p className="mt-1 text-[11px]">Please explain why this reading is outside the expected range. The actual figure will be saved with your explanation.</p>
              </div>
            )}
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="remarks">
            Remarks {outOfRange ? <span className="text-destructive">* required — out-of-range reading</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
          </Label>
          <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
            placeholder={outOfRange ? "Please explain why this reading is outside the expected range…" : "Anything the clerk should know about today's figures…"}
            aria-required={outOfRange ? "true" : undefined} className={remarkMissing ? "border-warning" : undefined} />
          {remarkMissing && <p className="flex items-center gap-1 text-[11px] font-medium text-warning-foreground"><X className="h-3 w-3" aria-hidden /> Submission is blocked until the remark is provided.</p>}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/50 p-3">
          {photo ? (
            <div className="flex items-center gap-3">
              <DemoPhoto kind={photo} size="sm" />
              <div>
                <p className="text-[11px] font-medium">Demo photograph attached</p>
                <button className="text-[11px] text-muted-foreground underline" onClick={() => setPhoto(null)}>Remove</button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Field photograph (demo thumbnail only — no real camera or cloud storage)</p>
          )}
          <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={() => { setPhoto(isWaste ? "waste" : "mrf"); toast.info("Demo photo attached — real photography is out of prototype scope."); }}>
            <Camera className="mr-1 h-3.5 w-3.5" aria-hidden /> Attach
          </Button>
        </div>

        <Button className="w-full" onClick={submit} disabled={formIncomplete || remarkMissing || cleared}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
          {existing ? (sentBack ? "Resubmit corrected entry" : "Update entry") : "Save & submit report"}
        </Button>
        {outOfRange && !remarkMissing && (
          <p className="text-center text-[11px] font-medium text-warning-foreground">Will be marked “Out of Range – Awaiting Verification” with your explanation attached.</p>
        )}
        <DemoNote>Late status is calculated automatically from the reporting deadline — you cannot set it manually.</DemoNote>
      </div>
    </ChiPhoneFrame>
  );
}
