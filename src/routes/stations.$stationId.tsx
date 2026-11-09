import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, ClipboardList, FileClock, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/shared/ui-bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemo } from "@/lib/store";
import { activityName, cellFor, clerkOfChi, contractStatus, fmtDate, fmtKg, stationById, userById, stationsOfClerk } from "@/lib/derive";
import { todayISO } from "@/data/seed";

export const Route = createFileRoute("/stations/$stationId")({
  head: ({ params }) => ({
    meta: [
      { title: `Station Details | EnHM Management System` },
      { name: "description", content: "Station profile, assigned health inspector, reporting status and contract details in the EnHM demonstration system." },
      { property: "og:title", content: "Station Details | EnHM Management System" },
      { property: "og:description", content: "Station operations and reporting profile in the EnHM demonstration system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StationDetails,
});

function StationDetails() {
  const { stationId } = Route.useParams();
  const { db, currentUser } = useDemo();
  const station = stationById(db, stationId);

  const allowed = currentUser.role === "admin" || currentUser.role === "officer" ||
    (currentUser.role === "chi" && station?.chiId === currentUser.id) ||
    (currentUser.role === "clerk" && station?.chiId && stationsOfClerk(db, currentUser.id).some((item) => item.id === station.id));
  if (!station || !allowed) {
    return <EmptyState icon={Building2} title={station ? "Station not in your assigned scope" : "Station not found"} hint="Station profiles are limited to the current role's assignment scope." action={<Button asChild variant="outline"><Link to="/stations">Back to stations</Link></Button>} />;
  }

  const chi = station.chiId ? userById(db, station.chiId) : undefined;
  const clerk = chi ? clerkOfChi(db, chi.id) : undefined;
  const range = db.ranges[station.id];
  const waste = db.wasteEntries.filter((entry) => entry.stationId === station.id).sort((a, b) => b.date.localeCompare(a.date));
  const mrf = db.mrfEntries.filter((entry) => entry.stationId === station.id).sort((a, b) => b.date.localeCompare(a.date));
  const contracts = db.contracts.filter((contract) => contract.stationId === station.id);
  const today = todayISO();

  return (
    <div className="mx-auto max-w-[1300px]">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/admin/stations"><ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden /> Station directory</Link>
        </Button>
      </div>
      <PageHeader
        kicker={`${station.code} · ${station.category === "NGT" ? "NGT station" : "Sample halt"}`}
        title={station.name}
        description={`${station.platforms} platform${station.platforms === 1 ? "" : "s"} · ${station.active ? "Active reporting scope" : "Inactive station"}`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SectionCard title="Station assignment" icon={MapPin}>
          <p className="text-sm font-semibold">{chi?.name ?? "Unassigned"}</p>
          <p className="text-xs text-muted-foreground">Chief Health Inspector</p>
          <p className="mt-3 text-sm font-medium">{clerk?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Verification clerk via CHI</p>
        </SectionCard>
        <SectionCard title="Today’s reporting" icon={ClipboardList}>
          <div className="flex items-center justify-between gap-2 py-1 text-xs"><span>{activityName(db, "2")}</span><StatusBadge state={cellFor(db, "2", station.id, today).state} /></div>
          {db.mrfEntries.some((entry) => entry.stationId === station.id) && <div className="flex items-center justify-between gap-2 border-t border-border py-2 text-xs"><span>{activityName(db, "9")}</span><StatusBadge state={cellFor(db, "9", station.id, today).state} /></div>}
        </SectionCard>
        <SectionCard title="Expected daily ranges" icon={Building2}>
          {range ? <div className="space-y-2 text-xs"><p>Dry waste <span className="float-right font-mono tabular-nums">{fmtKg(range.dry[0])}–{fmtKg(range.dry[1])}</span></p><p>Wet waste <span className="float-right font-mono tabular-nums">{fmtKg(range.wet[0])}–{fmtKg(range.wet[1])}</span></p><p>MRF infeed <span className="float-right font-mono tabular-nums">{fmtKg(range.infeed[0])}–{fmtKg(range.infeed[1])}</span></p></div> : <p className="text-sm text-muted-foreground">No configured ranges.</p>}
        </SectionCard>
      </div>

      <SectionCard title="Solid waste reporting history" subtitle={`${waste.length} recorded entries`} icon={ClipboardList}>
        {waste.length === 0 ? <EmptyState title="No solid waste entries" /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Reporting date</TableHead><TableHead>CHI</TableHead><TableHead className="text-right">Dry waste</TableHead><TableHead className="text-right">Wet waste</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader><TableBody>{waste.map((entry) => <TableRow key={entry.id}><TableCell className="whitespace-nowrap">{fmtDate(entry.date)}</TableCell><TableCell>{userById(db, entry.chiId)?.name ?? "—"}</TableCell><TableCell className="text-right font-mono tabular-nums">{fmtKg(entry.dryKg)}</TableCell><TableCell className="text-right font-mono tabular-nums">{fmtKg(entry.wetKg)}</TableCell><TableCell><StatusBadge state={cellFor(db, "2", station.id, entry.date).state} /></TableCell><TableCell className="max-w-64 text-xs text-muted-foreground">{entry.remarks || "—"}</TableCell></TableRow>)}</TableBody></Table></div>}
      </SectionCard>

      {mrf.length > 0 && <SectionCard className="mt-5" title="MRF plastic baling history" subtitle={`${mrf.length} recorded entries`} icon={ClipboardList}>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Reporting date</TableHead><TableHead className="text-right">Plastic infeed</TableHead><TableHead className="text-right">Bales</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader><TableBody>{mrf.map((entry) => <TableRow key={entry.id}><TableCell className="whitespace-nowrap">{fmtDate(entry.date)}</TableCell><TableCell className="text-right font-mono tabular-nums">{fmtKg(entry.infeedKg)}</TableCell><TableCell className="text-right font-mono tabular-nums">{entry.bales}</TableCell><TableCell><StatusBadge state={cellFor(db, "9", station.id, entry.date).state} /></TableCell><TableCell className="max-w-64 text-xs text-muted-foreground">{entry.remarks || "—"}</TableCell></TableRow>)}</TableBody></Table></div>
      </SectionCard>}

      <SectionCard className="mt-5" title="Cleaning and MRF contracts" subtitle={`${contracts.length} contracts`} icon={FileClock}>
        {contracts.length === 0 ? <EmptyState title="No contracts recorded" /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Contractor</TableHead><TableHead>Period</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{contracts.map((contract) => { const status = contractStatus(contract, db.rules.contractLeadDays); return <TableRow key={contract.id}><TableCell>{activityName(db, contract.activity)}</TableCell><TableCell>{contract.contractor}</TableCell><TableCell>{contract.period}</TableCell><TableCell>{fmtDate(contract.expiryDate)}</TableCell><TableCell><StatusBadge state={status === "active" ? "cleared" : status === "expiring_soon" ? "late" : "escalated"} /></TableCell></TableRow>; })}</TableBody></Table></div>}
      </SectionCard>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" aria-hidden /> Station data is a demonstration preview and is not an official railway record.</div>
    </div>
  );
}