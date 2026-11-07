import type { AnyEntry, DemoDB, MrfEntry, Station, User, WasteEntry } from "@/data/types";
import {
  cellFor, entryCellState, clerkOfChi, mrfStations, isException, type CellState,
} from "@/lib/derive";

export interface WorkRow {
  key: string;
  kind: "waste" | "mrf";
  activity: "2" | "9";
  entry: AnyEntry | null;
  state: CellState;
  station: Station;
  chi?: User;
  clerk?: User;
  date: string;
}

function decorate(db: DemoDB, station: Station, kind: "waste" | "mrf", date: string, entry: AnyEntry | null, state: CellState): WorkRow {
  const chi = station.chiId ? db.users.find((u) => u.id === station.chiId) : undefined;
  const clerk = chi ? clerkOfChi(db, chi.id) : undefined;
  return {
    key: entry ? `${kind}:${entry.id}` : `${kind}:missing:${station.id}:${date}`,
    kind, activity: kind === "waste" ? "2" : "9", entry, state, station,
    ...(chi ? { chi } : {}), ...(clerk ? { clerk } : {}), date,
  };
}

/** All reporting rows for a station scope on a date — includes virtual "missing" rows. */
export function workRowsForStations(db: DemoDB, stations: Station[], date: string): WorkRow[] {
  const rows: WorkRow[] = [];
  stations.forEach((station) => {
    const waste = db.wasteEntries.find((e) => e.stationId === station.id && e.date === date);
    rows.push(decorate(db, station, "waste", date, waste ?? null, waste ? entryCellState(waste) : cellFor(db, "2", station.id, date).state));
    if (mrfStations(db).some((s) => s.id === station.id)) {
      const mrf = db.mrfEntries.find((e) => e.stationId === station.id && e.date === date);
      rows.push(decorate(db, station, "mrf", date, mrf ?? null, mrf ? entryCellState(mrf) : cellFor(db, "9", station.id, date).state));
    }
  });
  return rows;
}

/** Rows needing attention: missing, late, out of range, sent back, escalated. */
export function exceptionRows(db: DemoDB, stations: Station[], date: string): WorkRow[] {
  return workRowsForStations(db, stations, date).filter((r) => isException(r.state));
}

/** Entries submitted but not yet verified (clerk worklist, includes normal in-range submissions). */
export function unverifiedRows(db: DemoDB, stations: Station[], date: string): WorkRow[] {
  return workRowsForStations(db, stations, date).filter((r) => r.entry && (r.entry.status === "submitted"));
}

export function rowsForEntryScope(db: DemoDB, stations: Station[], date: string): WorkRow[] {
  return workRowsForStations(db, stations, date);
}

export function entryOfKind(db: DemoDB, kind: "waste" | "mrf", entryId: string): WasteEntry | MrfEntry | undefined {
  return kind === "waste" ? db.wasteEntries.find((e) => e.id === entryId) : db.mrfEntries.find((e) => e.id === entryId);
}

export function valueLabel(row: WorkRow): string {
  if (!row.entry) return "—";
  if (row.kind === "waste") {
    const e = row.entry as WasteEntry;
    return `Dry ${e.dryKg} / Wet ${e.wetKg} KG`;
  }
  const e = row.entry as MrfEntry;
  return `Infeed ${e.infeedKg} KG · ${e.bales} bales`;
}

export function rangeLabel(db: DemoDB, row: WorkRow): string {
  const r = db.ranges[row.station.id];
  if (!r) return "—";
  return row.kind === "waste" ? `Dry ${r.dry[0]}–${r.dry[1]} · Wet ${r.wet[0]}–${r.wet[1]}` : `Infeed ${r.infeed[0]}–${r.infeed[1]}`;
}

export function isOutOfRangeValue(db: DemoDB, row: WorkRow): boolean {
  if (!row.entry) return false;
  const r = db.ranges[row.station.id];
  if (!r) return false;
  if (row.kind === "waste") {
    const e = row.entry as WasteEntry;
    return e.dryKg < r.dry[0] || e.dryKg > r.dry[1] || e.wetKg < r.wet[0] || e.wetKg > r.wet[1];
  }
  const e = row.entry as MrfEntry;
  return e.infeedKg < r.infeed[0] || e.infeedKg > r.infeed[1];
}
