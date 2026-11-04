import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, ArrowRightLeft, BarChart3, Bell, Building2, ChevronsUpDown, ClipboardCheck,
  ClipboardList, FileClock, FlaskConical, HelpCircle, LayoutDashboard, ListChecks,
  LogOut, MapPin, RotateCcw, ShieldCheck, SlidersHorizontal, Users, Menu, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RailMark, useDemo } from "@/lib/store";
import { isException, cellFor, contractStatus, mrfStations, todayISO } from "@/lib/derive";
import type { Role } from "@/data/types";
import { AssumptionsDrawer } from "@/components/layout/assumptions-drawer";

/* ---------------- navigation config ---------------- */

interface NavItem {
  label: string; to: string; icon: React.ElementType;
  group: "operations" | "reference"; badge?: "exceptions" | "contracts";
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard, group: "operations" },
    { label: "User Management", to: "/admin/users", icon: Users, group: "operations" },
    { label: "Station Management", to: "/admin/stations", icon: Building2, group: "operations" },
    { label: "Assignments & Leave", to: "/admin/assignments", icon: ArrowRightLeft, group: "operations" },
    { label: "Activity Configuration", to: "/admin/activities", icon: ListChecks, group: "operations" },
    { label: "Rules & Ranges", to: "/admin/rules", icon: SlidersHorizontal, group: "operations" },
    { label: "Reports Overview", to: "/admin/reports", icon: BarChart3, group: "operations" },
    { label: "Audit Trail", to: "/audit", icon: FileClock, group: "operations" },
    { label: "Settings", to: "/admin/settings", icon: FlaskConical, group: "reference" },
    { label: "Stations Directory", to: "/stations", icon: MapPin, group: "reference" },
    { label: "Activity Catalogue", to: "/activities", icon: Activity, group: "reference" },
  ],
  officer: [
    { label: "Dashboard", to: "/officer", icon: LayoutDashboard, group: "operations" },
    { label: "Exception Queue", to: "/officer/exceptions", icon: ClipboardList, group: "operations", badge: "exceptions" },
    { label: "Cleared & Verifications", to: "/officer/verifications", icon: ClipboardCheck, group: "operations" },
    { label: "Contracts", to: "/contracts", icon: FileClock, group: "operations", badge: "contracts" },
    { label: "Reports Overview", to: "/reports", icon: BarChart3, group: "operations" },
    { label: "Audit Trail", to: "/audit", icon: FileClock, group: "operations" },
    { label: "Stations Directory", to: "/stations", icon: MapPin, group: "reference" },
    { label: "Users Directory", to: "/users", icon: Users, group: "reference" },
    { label: "Activity Catalogue", to: "/activities", icon: Activity, group: "reference" },
  ],
  clerk: [
    { label: "Dashboard", to: "/clerk", icon: LayoutDashboard, group: "operations" },
    { label: "Verification History", to: "/clerk/history", icon: ClipboardCheck, group: "operations" },
    { label: "Pending Corrections", to: "/clerk/corrections", icon: ClipboardList, group: "operations", badge: "exceptions" },
    { label: "Stations Directory", to: "/stations", icon: MapPin, group: "reference" },
    { label: "Activity Catalogue", to: "/activities", icon: Activity, group: "reference" },
  ],
  chi: [
    { label: "My Tasks", to: "/chi", icon: ClipboardList, group: "operations" },
    { label: "Corrections", to: "/chi/corrections", icon: ClipboardCheck, group: "operations", badge: "exceptions" },
    { label: "Submission History", to: "/chi/history", icon: FileClock, group: "operations" },
    { label: "My Stations", to: "/stations", icon: MapPin, group: "reference" },
    { label: "Activity Catalogue", to: "/activities", icon: Activity, group: "reference" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator", officer: "Officer", clerk: "Clerk", chi: "CHI (Field)",
};

/* ---------------- assumptions drawer context ---------------- */

const AssumptionsContext = createContext<{ open: () => void }>({ open: () => undefined });
export const useAssumptionsDrawer = () => useContext(AssumptionsContext);

/* ---------------- shell ---------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const { db, currentUser, actions } = useDemo();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const openAssumptions = useCallback(() => setAssumptionsOpen(true), []);

  const nav = NAV[currentUser.role];
  const today = todayISO();

  const badgeCounts = useMemo(() => {
    let exceptions = 0;
    let contracts = 0;
    const scopeStations =
      currentUser.role === "chi" ? db.stations.filter((s) => s.chiId === currentUser.id) :
      currentUser.role === "clerk" ? db.stations.filter((s) => s.chiId && (db.users.find((u) => u.id === currentUser.id)?.supervisesChiIds ?? []).includes(s.chiId)) :
      db.stations;
    const ids = new Set(scopeStations.map((s) => s.id));
    ([db.wasteEntries, db.mrfEntries] as const).forEach((list) => {
      list.forEach((e) => {
        if (!ids.has(e.stationId) || e.date !== today) return;
        if (isException(cellFor(db, e.activity, e.stationId, e.date).state)) exceptions += 1;
      });
    });
    // missing (no entry yet)
    if (currentUser.role === "officer" || currentUser.role === "admin") {
      mrfStations(db).forEach((s) => {
        if (!ids.has(s.id)) return;
        if (!db.mrfEntries.some((e) => e.stationId === s.id && e.date === today)) exceptions += 0; // grid covers it; avoid double counting noise
      });
    }
    if (currentUser.role === "officer" || currentUser.role === "admin") {
      contracts = db.contracts.filter((c) => contractStatus(c, db.rules.contractLeadDays) !== "active").length;
    }
    return { exceptions, contracts };
  }, [db, currentUser, today]);

  const sidebar = (onNavigate?: () => void) => (
    <nav className="flex h-full flex-col" aria-label="Main navigation">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <RailMark className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight text-sidebar-active-foreground">EnHM Management</p>
          <p className="truncate text-[10.5px] text-sidebar-muted">Eastern Railway · Howrah Div.</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {(["operations", "reference"] as const).map((group) => (
          <div key={group} className="mb-3">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
              {group === "operations" ? "Operations" : "Reference"}
            </p>
            {nav.filter((n) => n.group === group).map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(`${item.to}/`));
              const badge = item.badge === "exceptions" ? badgeCounts.exceptions : item.badge === "contracts" ? badgeCounts.contracts : 0;
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-sidebar-active-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge > 0 && (
                    <span className="rounded-full bg-warning px-1.5 py-px text-[10px] font-bold tabular-nums text-warning-foreground" aria-label={`${badge} items need attention`}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[10px] leading-relaxed text-sidebar-muted">
          Frontend demonstration prototype · Sample data only · Not an official Indian Railways system
        </p>
      </div>
    </nav>
  );

  const mobileItems = nav.filter((n) => n.group === "operations").slice(0, 4);

  return (
    <AssumptionsContext.Provider value={{ open: openAssumptions }}>
      <div className="min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-sidebar lg:block" aria-label="Sidebar">
          {sidebar()}
        </aside>

        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur lg:pl-60">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">
                <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
                {sidebar(() => setMobileNavOpen(false))}
              </SheetContent>
            </Sheet>

            <RailMark className="h-8 w-8 shrink-0 lg:hidden" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-foreground sm:text-sm">
                INDIAN RAILWAYS – EnHM MANAGEMENT SYSTEM
              </p>
              <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
                Environment &amp; Housekeeping Management · Eastern Railway | Howrah Division
              </p>
            </div>

            <span className="hidden items-center gap-1 rounded-md border border-dashed border-warning/60 bg-warning/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-warning-foreground md:inline-flex">
              <FlaskConical className="h-3 w-3" aria-hidden /> Sample Data
            </span>

            <Button variant="outline" size="sm" className="hidden h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5 sm:inline-flex" onClick={openAssumptions}>
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
              Questions &amp; Assumptions
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden" onClick={openAssumptions} aria-label="Questions and assumptions">
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* alerts */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-8 w-8" aria-label="Demo notifications">
                  <Bell className="h-4 w-4" />
                  {badgeCounts.exceptions + badgeCounts.contracts > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {badgeCounts.exceptions + badgeCounts.contracts}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Demo alerts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {badgeCounts.exceptions > 0 && <DropdownMenuItem asChild><Link to={currentUser.role === "clerk" ? "/clerk" : currentUser.role === "chi" ? "/chi/corrections" : "/officer/exceptions"}>{badgeCounts.exceptions} exception entr{badgeCounts.exceptions === 1 ? "y" : "ies"} today</Link></DropdownMenuItem>}
                {badgeCounts.contracts > 0 && <DropdownMenuItem asChild><Link to="/contracts">{badgeCounts.contracts} contract alert(s)</Link></DropdownMenuItem>}
                {badgeCounts.exceptions + badgeCounts.contracts === 0 && <DropdownMenuItem disabled>No alerts — all clear</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-[11px]">Demo simulation — no real notifications</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* user / role switcher / reset */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 text-left hover:bg-accent" aria-label="Switch demo user or role">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground" aria-hidden>
                    {currentUser.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block max-w-[140px] truncate text-[11px] font-semibold leading-tight">{currentUser.name}</span>
                    <span className="block text-[10px] leading-tight text-muted-foreground">{ROLE_LABEL[currentUser.role]}</span>
                  </span>
                  <ChevronsUpDown className="h-3 w-3 text-muted-foreground" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Switch demo user</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["admin", "officer", "clerk", "chi"] as Role[]).map((role) => (
                  <DropdownMenuGroup key={role}>
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">{ROLE_LABEL[role]}</DropdownMenuLabel>
                    {db.users.filter((u) => u.role === role && (u.active || u.id === currentUser.id)).map((u) => (
                      <DropdownMenuItem
                        key={u.id}
                        onClick={() => { actions.switchUser(u.id); toast.success(`Now working as ${u.name} (${ROLE_LABEL[u.role]})`); }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 opacity-50" aria-hidden />
                        <span className={cn("flex-1 truncate", u.id === currentUser.id && "font-bold")}>{u.name}</span>
                        {u.id === currentUser.id && <span className="text-[10px] text-muted-foreground">current</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setResetOpen(true)} className="text-destructive focus:text-destructive">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset Demo Data…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="px-3 pb-24 pt-4 sm:px-5 lg:pb-10 lg:pl-[19rem] lg:pr-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden" aria-label="Quick navigation">
          <div className="mx-auto grid max-w-lg grid-cols-4">
            {mobileItems.map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(`${item.to}/`));
              const badge = item.badge === "exceptions" ? badgeCounts.exceptions : item.badge === "contracts" ? badgeCounts.contracts : 0;
              return (
                <Link key={item.to + item.label} to={item.to}
                  className={cn("relative flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}
                  aria-current={active ? "page" : undefined}>
                  <item.icon className="h-4 w-4" aria-hidden />
                  <span className="max-w-full truncate">{item.label}</span>
                  {badge > 0 && <span className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden />}
                </Link>
              );
            })}
          </div>
        </nav>

        <AssumptionsDrawer open={assumptionsOpen} onOpenChange={setAssumptionsOpen} />

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset demo data?</DialogTitle>
              <DialogDescription>
                All demonstration data — submissions, verifications, reassignments, decisions recorded in the assumptions panel — will be restored to the original sample scenario. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { actions.resetDemo(); setResetOpen(false); toast.success("Demo data has been reset to the original sample set."); }}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Reset demo data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AssumptionsContext.Provider>
  );
}

export function ResetDemoButton() {
  const { actions } = useDemo();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Reset Demo Data
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>All demonstration changes will be discarded and the original sample scenario restored.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { actions.resetDemo(); setOpen(false); toast.success("Demo data reset to the original sample set."); }}>Reset demo data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { LogOut, X };
