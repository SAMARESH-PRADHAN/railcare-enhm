import { differenceInCalendarDays, format, set } from "date-fns";
import type {
  AnyEntry, Contract, DemoDB, MrfEntry, Station, User, WasteEntry,
} from "@/data/types";
import { dayOffset, dueAt, todayISO } from "@/data/seed";

/* ---------- cell status ---------- */

export type CellState =
  | "cleared" | "escalated" | "sent_back" | "out_of_range" | "late"
  | "resubmitted" | "submitted" | "pending" | "missing" | "na";

export const CELL_META: Record<CellState, { label: string; icon: string; tone: "good" | "warn" | "bad" | "info" | "neutral" }> = {
  cleared: { label: "Cleared", icon: "CheckCircle2", tone: "good" },
  escalated: { label: "Escalated", icon: "OctagonAlert", tone: "bad" },
  sent_back: { label: "Sent Back", icon: "Undo2", tone: "bad" },
  out_of_range: { label: "Out of Range", icon: "TriangleAlert", tone: "warn" },
  late: { label: "Late", icon: "Clock", tone: "warn" },
  resubmitted: { label: "Resubmitted", icon: "RefreshCw", tone: "info" },
  submitted: { label: "Submitted", icon: "FileCheck2", tone: "good" },
  pending: { label: "Pending", icon: "Hourglass", tone: "info" },
  missing: { label: "Missing", icon: "FileX2", tone: "bad" },
  na: { label: "Not Applicable", icon: "Minus", tone: "neutral" },
};

export function entryCellState(entry: AnyEntry, nowTs = Date.now()): CellState {
  if (entry.status === "escalated") return "escalated";
  if (entry.status === "sent_back") return "sent_back";
  if (entry.status === "cleared") return "cleared";
  if (!entry.submittedAt) return nowTs > new Date(entry.dueAt).getTime() ? "missing" : "pending";
  if (entry.late) return "late";
  if (entry.outOfRange) return "out_of_range";
  if (entry.history.length > 1) return "resubmitted";
  return "submitted";
}

/** Cell for a station/activity on a date, even when no entry exists. */
export function cellFor(db: DemoDB, activity: "2" | "9", stationId: string, date: string, nowTs = Date.now()): { state: CellState; entry?: AnyEntry } {
  const entries = (activity === "2" ? db.wasteEntries : db.mrfEntries).filter((e) => e.stationId === stationId && e.date === date);
  if (entries.length) return { state: entryCellState(entries[0], nowTs), entry: entries[0] };
  const due = dueAt(date, activity === "2" ? db.rules.wasteDueHour : db.rules.mrfDueHour);
  if (date < todayISO() || nowTs > new Date(due).getTime()) return { state: "missing" };
  return { state: "pending" };
}

export function isException(state: CellState): boolean {
  return state === "missing" || state === "late" || state === "out_of_range" || state === "sent_back" || state === "escalated";
}

/* ---------- people / stations ---------- */

export const userById = (db: DemoDB, id: string) => db.users.find((u) => u.id === id);
export const stationById = (db: DemoDB, id: string) => db.stations.find((s) => s.id === id);
export const clerkOfChi = (db: DemoDB, chiId: string) =>
  db.users.find((u) => u.role === "clerk" && u.active && u.supervisesChiIds?.includes(chiId));

export function stationsOfChi(db: DemoDB, chiId: string): Station[] {
  return db.stations.filter((s) => s.chiId === chiId);
}
export function chisOfClerk(db: DemoDB, clerkId: string): User[] {
  const u = userById(db, clerkId);
  return (u?.supervisesChiIds ?? []).map((id) => userById(db, id)).filter((x): x is User => !!x);
}
export function stationsOfClerk(db: DemoDB, clerkId: string): Station[] {
  return chisOfClerk(db, clerkId).flatMap((c) => stationsOfChi(db, c.id));
}

/* ---------- contracts ---------- */

export function contractStatus(c: Contract, leadDays: number, today = todayISO()): ContractStatus {
  const diff = differenceInCalendarDays(new Date(c.expiryDate), new Date(`${today}T00:00:00`));
  if (diff < 0) return "expired";
  if (diff <= leadDays) return "expiring_soon";
  return "active";
}
export const contractDaysLeft = (c: Contract, today = todayISO()) =>
  differenceInCalendarDays(new Date(c.expiryDate), new Date(`${today}T00:00:00`));

/* ---------- reporting scope ---------- */

export function wasteStations(db: DemoDB): Station[] {
  return db.stations.filter((s) => s.active);
}
export function mrfStations(db: DemoDB): Station[] {
  // Stations with an MRF plastic baling machine (seeded as those with entries/contracts)
  const ids = new Set<string>([...db.mrfEntries.map((e) => e.stationId), ...db.contracts.map((c) => c.stationId)]);
  return db.stations.filter((s) => s.active && ids.has(s.id));
}

export function rangeOf(db: DemoDB, stationId: string) {
  return db.ranges[stationId] ?? { dry: [0, 0] as [number, number], wet: [0, 0] as [number, number], infeed: [0, 0] as [number, number] };
}

export function fmtKg(n: number) {
  return `${n.toLocaleString("en-IN")} KG`;
}

export const fmtDate = (d: string) => format(new Date(`${d}T00:00:00`), "dd MMM yyyy");
export const fmtDateTime = (d: string) => format(new Date(d), "dd MMM, HH:mm");

export function activityName(db: DemoDB, activity: "2" | "9") {
  return activity === "2" ? "Activity 2 – Solid Waste Generation per Day" : "Activity 9 – MRF – Plastic Baling Machine";
}

export function daysUntilISO(dateISO: string): number {
  return differenceInCalendarDays(new Date(`${dateISO}T00:00:00`), new Date(`${todayISO()}T00:00:00`));
}

export const yesterdaysISO = () => dayOffset(-1);
export const dueTimeLabel = (hour: number) => format(set(new Date(), { hours: hour, minutes: 0 }), "HH:mm");
