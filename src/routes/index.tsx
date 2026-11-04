import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, ArrowRight, Building2, ClipboardList, HelpCircle, LayoutDashboard,
  ShieldCheck, Smartphone, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RailMark, useDemo } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { DemoNote, SampleBanner, StatCard } from "@/components/shared/ui-bits";
import { isException, cellFor, mrfStations, todayISO, contractStatus, chisOfClerk } from "@/lib/derive";
import type { Role } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indian Railways – EnHM Management System | Role Selection" },
      { name: "description", content: "Demonstration prototype of the Environment & Housekeeping Management System for Eastern Railway, Howrah Division. Select a role to enter the demo workspace." },
      { property: "og:title", content: "Indian Railways – EnHM Management System" },
      { property: "og:description", content: "Environment & Housekeeping Management demonstration prototype — Eastern Railway, Howrah Division." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell>
      <RoleSelection />
    </AppShell>
  );
}

const ROLE_CARDS: { role: Role; label: string; desc: string; icon: React.ElementType; to: string; demoAs: string }[] = [
  { role: "admin", label: "Administrator", desc: "Division-wide administration: users, stations, CHI & clerk assignments, activity configuration and reporting rules.", icon: ShieldCheck, to: "/admin", demoAs: "Arvind Kumar Sinha" },
  { role: "officer", label: "Divisional Officer", desc: "Operational supervision: exceptions, cleared entries, station-by-activity grid, contracts and escalations.", icon: LayoutDashboard, to: "/officer", demoAs: "Dr. Sujit Kumar Chatterjee" },
  { role: "clerk", label: "Verification Clerk", desc: "Exception worklist: send back or clear CHI submissions with mandatory notes; carried-forward workloads.", icon: ClipboardList, to: "/clerk", demoAs: "Priya Sharma · Md. Asif Iqbal" },
  { role: "chi", label: "CHI — Field", desc: "Mobile-first field workspace: daily waste & MRF entries, corrections, submission history and offline-queue simulation.", icon: Smartphone, to: "/chi", demoAs: "3 CHI accounts available" },
];

function RoleSelection() {
  const { db, currentUser, actions } = useDemo();
  const today = todayISO();

  const exceptionsToday =
    db.wasteEntries.filter((e) => e.date === today && isException(cellFor(db, "2", e.stationId, e.date).state)).length +
    db.mrfEntries.filter((e) => e.date === today && isException(cellFor(db, "9", e.stationId, e.date).state)).length;
  const contractAlerts = db.contracts.filter((c) => contractStatus(c, db.rules.contractLeadDays) !== "active").length;
  const activeUsers = db.users.filter((u) => u.active).length;

  const enter = (role: Role) => {
    const first = db.users.find((u) => u.active && u.role === role);
    if (first && currentUser.role !== role) actions.switchUser(first.id);
    toast.success(`Entering as ${first?.name ?? role}`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <SampleBanner>
        <strong>11 of 199 stations shown – Sample Data.</strong> All names, phone numbers and operational figures in this prototype are fictional demonstration values, not official railway data.
      </SampleBanner>

      <header className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <RailMark className="h-16 w-16 shrink-0" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Indian Railways · Eastern Railway | Howrah Division</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            EnHM Management System
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Environment &amp; Housekeeping Management — station cleaning inspection, waste reporting, MRF operations, verification and division-wide monitoring.
          </p>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Stations (sample)" value={db.stations.length} hint="9 NGT + 2 sample halts" icon={Building2} />
        <StatCard label="Active users" value={activeUsers} hint="1 admin · 1 officer · 2 clerks · 3 CHIs" icon={Users} tone="info" />
        <StatCard label="Exceptions today" value={exceptionsToday} hint="Missing · late · out of range" icon={ClipboardList} tone="warn" />
        <StatCard label="Contract alerts" value={contractAlerts} hint={`${mrfStations(db).length} stations with MRF`} icon={Activity} tone="bad" />
      </div>

      <section aria-labelledby="role-heading">
        <h2 id="role-heading" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Select a role to enter the demonstration
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_CARDS.map((card) => {
            const user = db.users.find((u) => u.role === card.role && u.active);
            const isCurrent = currentUser.role === card.role;
            return (
              <Link
                key={card.role}
                to={card.to}
                onClick={() => enter(card.role)}
                className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {card.label}
                    {isCurrent && <span className="rounded bg-success/15 px-1.5 py-px text-[10px] font-bold text-success">CURRENT</span>}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{card.desc}</span>
                  <span className="mt-1.5 block text-[11px] font-medium text-primary">{card.demoAs}</span>
                </span>
                <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HelpCircle className="h-4 w-4 text-primary" aria-hidden /> Suggested demonstration flow
        </h2>
        <ol className="mt-3 grid gap-2 text-[13px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Officer — needs attention, cleared entries, station grid",
            "CHI 1 — open Konnagar's missing report and submit live",
            "Clerk — clear the new entry with a note; send one back",
            "Officer — audit the clerk's verification decision",
            "Admin — users, stations, assignments, leave reassignment",
            "All — the nine Questions & Assumptions decisions",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" style={{ height: 18, width: 18 }}>{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <DemoNote>
          The role switcher in the header lets you move between all seven demo users at any time. No login is required — this replaces authentication in the prototype. Entries created during the demo persist in this browser until you use Reset Demo Data.
        </DemoNote>
      </section>
    </div>
  );
}
