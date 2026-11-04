import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { buildSeedDB, STORAGE_KEY, dueAt } from "@/data/seed";
import type {
  AssumptionStatus, Auction, Contract, DemoDB, MrfEntry,
  Role, Station, StationRange, User, WasteEntry,
} from "@/data/types";
import { rangeOf, stationById } from "@/lib/derive";

type ActionResult = { ok: true } | { ok: false; error: string };
const ok = (): ActionResult => ({ ok: true });
const fail = (error: string): ActionResult => ({ ok: false, error });

function loadDB(): DemoDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDB;
      if (parsed.version === 3) return parsed;
    }
  } catch {
    /* corrupted → reseed */
  }
  const seeded = buildSeedDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

interface StoreActions {
  switchUser: (userId: string) => void;
  // entries
  submitWasteEntry: (input: { stationId: string; date: string; dryKg: number; wetKg: number; remarks: string; photo?: WasteEntry["photo"] }) => ActionResult;
  submitMrfEntry: (input: { stationId: string; date: string; infeedKg: number; bales: number; remarks: string }) => ActionResult;
  sendBack: (entryId: string, kind: "waste" | "mrf", reason: string) => ActionResult;
  clearEntry: (entryId: string, kind: "waste" | "mrf", note: string) => ActionResult;
  escalate: (entryId: string, kind: "waste" | "mrf", note: string) => ActionResult;
  addMrfMonthly: (input: { stationId: string; month: number; year: number; totalInfeedKg: number; totalBales: number; remarks: string }) => ActionResult;
  addAuction: (a: Omit<Auction, "id" | "recordedAt">) => ActionResult;
  // contracts
  upsertContract: (c: Omit<Contract, "id"> & { id?: string }) => ActionResult;
  // admin entities
  upsertUser: (u: Omit<User, "createdAt" | "active" | "id"> & { id?: string; active?: boolean }) => ActionResult;
  toggleUserActive: (userId: string) => ActionResult;
  upsertStation: (s: Omit<Station, "createdAt" | "id" | "active"> & { id?: string; active?: boolean }) => ActionResult;
  assignChi: (stationId: string, chiId: string | null) => ActionResult;
  toggleSupervision: (clerkId: string, chiId: string) => ActionResult;
  updateRange: (stationId: string, key: keyof StationRange, idx: 0 | 1, value: number) => ActionResult;
  updateRules: (patch: Partial<DemoDB["rules"]>) => ActionResult;
  // reassignment
  reassignChi: (input: { fromChiId: string; toChiId: string; stationIds: string[]; leaveStart?: string; leaveEnd?: string; reason: string; carryPending: boolean }) => ActionResult;
  reassignClerk: (input: { fromClerkId: string; toClerkId: string; leaveStart?: string; leaveEnd?: string; reason: string }) => ActionResult;
  // assumptions / prefs
  setAssumption: (id: number, status: AssumptionStatus, note?: string) => ActionResult;
  setOfficerLayout: (layout: "worklist" | "grid") => void;
  resetDemo: () => void;
}

interface StoreValue {
  db: DemoDB;
  currentUser: User;
  actions: StoreActions;
}

const StoreContext = createContext<StoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DemoDB | null>(null);

  useEffect(() => {
    setDb(loadDB());
  }, []);

  const mutate = useCallback((fn: (draft: DemoDB) => void, auditEntry?: Partial<import("@/data/types").AuditEntry>) => {
    setDb((prev) => {
      if (!prev) return prev;
      const next: DemoDB = {
        ...prev, users: [...prev.users], stations: [...prev.stations],
        wasteEntries: [...prev.wasteEntries], mrfEntries: [...prev.mrfEntries],
        verifications: [...prev.verifications], reassignments: [...prev.reassignments],
        audit: [...prev.audit], assumptions: [...prev.assumptions],
        auctions: [...prev.auctions], contracts: [...prev.contracts], mrfMonthly: [...prev.mrfMonthly],
        ranges: { ...prev.ranges }, rules: { ...prev.rules }, prefs: { ...prev.prefs },
      };
      fn(next);
      if (auditEntry) {
        const actor = next.users.find((u) => u.id === next.sessionUserId)!;
        next.audit = [{
          id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ts: new Date().toISOString(),
          actorId: actor.id, actorName: actor.name, role: actor.role, action: auditEntry.action ?? "Action", ...auditEntry,
        }, ...next.audit];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const actorOf = (d: DemoDB, id: string) => d.users.find((u) => u.id === id)!;

  /* ---------------- entry submission ---------------- */

  const submitWasteEntry: StoreActions["submitWasteEntry"] = (input) => {
    const d = db!;
    const station = stationById(d, input.stationId);
    if (!station) return fail("Select a railway station.");
    const chi = actorOf(d, station.chiId ?? "");
    const range = rangeOf(d, input.stationId);
    const outOfRange = input.dryKg < range.dry[0] || input.dryKg > range.dry[1] || input.wetKg < range.wet[0] || input.wetKg > range.wet[1];
    if (outOfRange && !input.remarks.trim()) return fail("Out-of-range figure: a remark explaining the deviation is mandatory before saving.");
    const existing = d.wasteEntries.find((e) => e.stationId === input.stationId && e.date === input.date);
    const submittedAt = new Date().toISOString();
    const late = submittedAt > new Date(dueAt(input.date, d.rules.wasteDueHour)).getTime();
    const wasSentBack = existing?.status === "sent_back";
    const isResubmit = !!existing && (wasSentBack || !!existing.submittedAt);

    mutate(
      (draft) => {
        if (existing) {
          const prev = { dryKg: existing.dryKg, wetKg: existing.wetKg };
          Object.assign(existing, {
            dryKg: input.dryKg, wetKg: input.wetKg, remarks: input.remarks, photo: input.photo ?? null,
            outOfRange, status: "submitted" as const, submittedAt, late, chiId: chi.id,
            history: [...existing.history, { at: submittedAt, byUserId: chi.id, type: "resubmit" as const, note: wasSentBack ? "Corrected after send-back" : "Re-submitted", previous: prev }],
          });
        } else {
          draft.wasteEntries.push({
            id: `w-${input.stationId}-${input.date}`, activity: "2", stationId: input.stationId, chiId: chi.id, date: input.date,
            dryKg: input.dryKg, wetKg: input.wetKg, remarks: input.remarks, photo: input.photo ?? null,
            dueAt: dueAt(input.date, draft.rules.wasteDueHour), submittedAt, late, outOfRange,
            carriedForward: false, status: "submitted", history: [{ at: submittedAt, byUserId: chi.id, type: "submit", note: "Initial submission" }],
          });
        }
      },
      {
        action: isResubmit ? (wasSentBack ? "Resubmitted corrected solid waste report" : "Updated solid waste report") : "Submitted daily solid waste report",
        stationId: input.stationId, activity: "2", toStatus: "submitted",
        note: outOfRange ? `Dry ${input.dryKg} KG / Wet ${input.wetKg} KG — out of range (${range.dry[0]}–${range.dry[1]}), explanation attached` : `Dry ${input.dryKg} KG / Wet ${input.wetKg} KG`,
      }
    );
    return ok();
  };

  const submitMrfEntry: StoreActions["submitMrfEntry"] = (input) => {
    const d = db!;
    const station = stationById(d, input.stationId)!;
    const chi = actorOf(d, station.chiId ?? "");
    const range = rangeOf(d, input.stationId);
    const outOfRange = input.infeedKg < range.infeed[0] || input.infeedKg > range.infeed[1];
    if (outOfRange && !input.remarks.trim()) return fail("Out-of-range figure: a remark explaining the deviation is mandatory before saving.");
    const existing = d.mrfEntries.find((e) => e.stationId === input.stationId && e.date === input.date);
    const submittedAt = new Date().toISOString();
    const late = submittedAt > new Date(dueAt(input.date, d.rules.mrfDueHour)).getTime();
    const wasSentBack = existing?.status === "sent_back";
    const isResubmit = !!existing && (wasSentBack || !!existing.submittedAt);
    mutate(
      (draft) => {
        if (existing) {
          const prev = { infeedKg: existing.infeedKg, bales: existing.bales };
          Object.assign(existing, {
            infeedKg: input.infeedKg, bales: input.bales, remarks: input.remarks,
            outOfRange, status: "submitted" as const, submittedAt, late, chiId: chi.id,
            history: [...existing.history, { at: submittedAt, byUserId: chi.id, type: "resubmit" as const, note: wasSentBack ? "Corrected after send-back" : "Re-submitted", previous: prev }],
          });
        } else {
          draft.mrfEntries.push({
            id: `m-${input.stationId}-${input.date}`, activity: "9", stationId: input.stationId, chiId: chi.id, date: input.date,
            infeedKg: input.infeedKg, bales: input.bales, remarks: input.remarks, photo: null,
            dueAt: dueAt(input.date, draft.rules.mrfDueHour), submittedAt, late, outOfRange,
            carriedForward: false, status: "submitted", history: [{ at: submittedAt, byUserId: chi.id, type: "submit", note: "Initial submission" }],
          });
        }
      },
      { action: isResubmit ? (wasSentBack ? "Resubmitted corrected MRF daily entry" : "Updated MRF daily entry") : "Submitted MRF daily infeed", stationId: input.stationId, activity: "9", toStatus: "submitted", note: `Infeed ${input.infeedKg} KG, bales ${input.bales}` }
    );
    return ok();
  };

  /* ---------------- verification ---------------- */

  const verify = (entryId: string, kind: "waste" | "mrf", action: "send_back" | "clear" | "escalate", note: string): ActionResult => {
    const d = db!;
    const list = kind === "waste" ? d.wasteEntries : d.mrfEntries;
    const entry = list.find((e) => e.id === entryId);
    if (!entry) return fail("Entry not found.");
    if (action !== "escalate" && !note.trim()) return fail(action === "clear" ? "A verification note is mandatory before clearing." : "A send-back reason is mandatory.");
    const fromStatus = entry.status;
    const toStatus = action === "clear" ? "cleared" : action === "send_back" ? "sent_back" : "escalated";
    mutate(
      (draft) => {
        const target = (kind === "waste" ? draft.wasteEntries : draft.mrfEntries).find((e) => e.id === entryId)!;
        target.status = toStatus as typeof target.status;
        if (action !== "escalate") {
          draft.verifications.push({ id: `v-${Date.now()}`, entryId, entryKind: kind, action: action as "send_back" | "clear", clerkId: draft.sessionUserId, note: note.trim(), at: new Date().toISOString() });
        }
      },
      {
        action: action === "clear" ? "Cleared entry with verification note" : action === "send_back" ? "Sent entry back to CHI" : "Escalated exception",
        stationId: entry.stationId, activity: entry.activity, fromStatus, toStatus, note: note.trim(),
      }
    );
    return ok();
  };

  /* ---------------- admin entities ---------------- */

  const upsertUser: StoreActions["upsertUser"] = (input) => {
    if (!input.name.trim()) return fail("Name is required.");
    mutate(
      (draft) => {
        if (input.id) {
          const u = draft.users.find((x) => x.id === input.id)!;
          Object.assign(u, { name: input.name, designation: input.designation, phone: input.phone, email: input.email });
        } else {
          draft.users.push({ id: `u-${Date.now()}`, name: input.name, role: input.role, designation: input.designation, phone: input.phone, email: input.email, active: true, createdAt: new Date().toISOString() });
        }
      },
      { action: input.id ? "Edited user details" : "Added new user", note: `${input.name} (${input.role.toUpperCase()})` }
    );
    return ok();
  };

  const toggleUserActive: StoreActions["toggleUserActive"] = (userId) => {
    const d = db!;
    const u = d.users.find((x) => x.id === userId)!;
    if (u.role === "admin") return fail("The divisional administrator account cannot be deactivated.");
    mutate(
      (draft) => {
        const target = draft.users.find((x) => x.id === userId)!;
        target.active = !target.active;
        if (!target.active && target.role === "chi") {
          draft.stations.forEach((s) => { if (s.chiId === userId) s.chiId = null; });
          draft.users.filter((x) => x.role === "clerk").forEach((c) => { c.supervisesChiIds = c.supervisesChiIds?.filter((id) => id !== userId); });
        }
      },
      { action: u.active ? "Deactivated user" : "Reactivated user", note: u.name }
    );
    return ok();
  };

  const upsertStation: StoreActions["upsertStation"] = (input) => {
    if (!input.code.trim() || !input.name.trim()) return fail("Station code and name are required.");
    mutate(
      (draft) => {
        if (input.id) {
          const s = draft.stations.find((x) => x.id === input.id)!;
          Object.assign(s, { code: input.code.toUpperCase(), name: input.name, category: input.category, platforms: input.platforms });
          if (input.active !== undefined) s.active = input.active;
        } else {
          const id = `st-${input.code.toLowerCase()}-${Date.now()}`;
          draft.stations.push({ id, code: input.code.toUpperCase(), name: input.name, category: input.category, platforms: input.platforms, active: true, chiId: null, createdAt: new Date().toISOString() });
          draft.ranges[id] = { dry: [50, 150], wet: [40, 120], infeed: [40, 160] };
        }
      },
      { action: input.id ? "Edited station" : "Added new station", stationId: input.id, note: `${input.code} ${input.name}` }
    );
    return ok();
  };

  const assignChi: StoreActions["assignChi"] = (stationId, chiId) => {
    mutate(
      (draft) => { draft.stations.find((x) => x.id === stationId)!.chiId = chiId; },
      { action: chiId ? "Assigned CHI to station" : "Unassigned CHI from station", stationId, note: chiId ? `CHI: ${db!.users.find((u) => u.id === chiId)?.name}` : "CHI removed" }
    );
    return ok();
  };

  const toggleSupervision: StoreActions["toggleSupervision"] = (clerkId, chiId) => {
    const had = (db!.users.find((u) => u.id === clerkId)?.supervisesChiIds ?? []).includes(chiId);
    mutate(
      (draft) => {
        const c = draft.users.find((x) => x.id === clerkId)!;
        if (had) c.supervisesChiIds = (c.supervisesChiIds ?? []).filter((x) => x !== chiId);
        else c.supervisesChiIds = [...(c.supervisesChiIds ?? []), chiId];
      },
      { action: had ? "Removed CHI from clerk supervision" : "Assigned CHI to clerk supervision", note: `${db!.users.find((u) => u.id === clerkId)?.name} ↔ ${db!.users.find((u) => u.id === chiId)?.name}` }
    );
    return ok();
  };

  /* ---------------- reassignment ---------------- */

  const reassignChi: StoreActions["reassignChi"] = (input) => {
    const d = db!;
    if (input.stationIds.length === 0) return fail("Select at least one station to transfer.");
    if (input.fromChiId === input.toChiId) return fail("The source and replacement CHI must be different.");
    if (!input.reason.trim()) return fail("A reason for the reassignment is mandatory.");
    mutate(
      (draft) => {
        input.stationIds.forEach((sid) => { draft.stations.find((s) => s.id === sid)!.chiId = input.toChiId; });
        if (!input.carryPending) {
          [...draft.wasteEntries, ...draft.mrfEntries].filter((e) => input.stationIds.includes(e.stationId) && !e.carriedForward && e.status !== "cleared" && e.status !== "escalated" && !!e.submittedAt).forEach((e) => { e.chiId = input.toChiId; });
        } else {
          [...draft.wasteEntries, ...draft.mrfEntries].filter((e) => input.stationIds.includes(e.stationId) && !e.carriedForward && (e.status === "submitted" || e.status === "out_of_range")).forEach((e) => { e.carriedForward = true; });
        }
        draft.reassignments.push({
          id: `r-${Date.now()}`, kind: "chi", fromUserId: input.fromChiId, toUserId: input.toChiId,
          stationIds: input.stationIds, chiIds: [], leaveStart: input.leaveStart, leaveEnd: input.leaveEnd,
          reason: input.reason.trim(), at: new Date().toISOString(), byUserId: draft.sessionUserId,
        });
      },
      { action: "CHI reassignment executed", note: `${input.stationIds.length} station(s): ${d.users.find((u) => u.id === input.fromChiId)?.name} → ${d.users.find((u) => u.id === input.toChiId)?.name}` }
    );
    return ok();
  };

  const reassignClerk: StoreActions["reassignClerk"] = (input) => {
    const d = db!;
    if (input.fromClerkId === input.toClerkId) return fail("The absent clerk and replacement clerk must be different.");
    if (!input.reason.trim()) return fail("A reason for the reassignment is mandatory.");
    const from = d.users.find((u) => u.id === input.fromClerkId)!;
    const to = d.users.find((u) => u.id === input.toClerkId)!;
    const chiIds = from.supervisesChiIds ?? [];
    if (chiIds.length === 0) return fail("The selected clerk currently supervises no CHIs.");
    mutate(
      (draft) => {
        const f = draft.users.find((u) => u.id === input.fromClerkId)!;
        const t = draft.users.find((u) => u.id === input.toClerkId)!;
        f.supervisesChiIds = [];
        f.leaveNote = input.reason.trim();
        t.supervisesChiIds = [...(t.supervisesChiIds ?? []), ...chiIds];
        draft.reassignments.push({
          id: `r-${Date.now()}`, kind: "clerk", fromUserId: input.fromClerkId, toUserId: input.toClerkId,
          stationIds: [], chiIds, leaveStart: input.leaveStart, leaveEnd: input.leaveEnd,
          reason: input.reason.trim(), at: new Date().toISOString(), byUserId: draft.sessionUserId,
        });
      },
      { action: "Clerk workload reassignment executed", note: `${chiIds.length} CHI(s): ${from.name} → ${to.name}` }
    );
    return ok();
  };

  /* ---------------- actions object ---------------- */

  const actions: StoreActions = {
    switchUser: (userId) => mutate((draft) => { draft.sessionUserId = userId; }),
    submitWasteEntry,
    submitMrfEntry,
    sendBack: (entryId, kind, reason) => verify(entryId, kind, "send_back", reason),
    clearEntry: (entryId, kind, note) => verify(entryId, kind, "clear", note),
    escalate: (entryId, kind, note) => verify(entryId, kind, "escalate", note),
    addMrfMonthly: (input) => {
      mutate(
        (draft) => {
          draft.mrfMonthly = [...draft.mrfMonthly.filter((m) => !(m.stationId === input.stationId && m.month === input.month && m.year === input.year)), {
            id: `mm-${input.stationId}-${input.month}-${input.year}`, stationId: input.stationId,
            chiId: draft.stations.find((s) => s.id === input.stationId)?.chiId ?? "", month: input.month, year: input.year,
            totalInfeedKg: input.totalInfeedKg, totalBales: input.totalBales, remarks: input.remarks, submittedAt: new Date().toISOString(),
          }];
        },
        { action: "Recorded MRF monthly baling return", activity: "9", note: `${input.month}/${input.year}: ${input.totalInfeedKg} KG infeed, ${input.totalBales} bales` }
      );
      return ok();
    },
    addAuction: (a) => {
      if (!a.qtyKg || !a.ratePerKg) return fail("Quantity and selling rate are required.");
      mutate(
        (draft) => { draft.auctions.push({ ...a, id: `a-${Date.now()}`, recordedAt: new Date().toISOString() }); },
        { action: "Recorded plastic auction/sale transaction", activity: "9", note: `${a.qtyKg} KG @ ₹${a.ratePerKg}/KG — SRO ${a.sroNumber}` }
      );
      return ok();
    },
    upsertContract: (c) => {
      mutate(
        (draft) => {
          if (c.id) { const t = draft.contracts.find((x) => x.id === c.id)!; Object.assign(t, c); }
          else draft.contracts.push({ ...c, id: `c-${Date.now()}` });
        },
        { action: c.id ? "Edited contract details" : "Added new contract", stationId: c.stationId, activity: c.activity, note: c.contractor }
      );
      return ok();
    },
    upsertUser, toggleUserActive, upsertStation, assignChi, toggleSupervision,
    updateRange: (stationId, key, idx, value) => {
      if (Number.isNaN(value)) return fail("Enter a numeric value.");
      mutate((draft) => {
        const cur = draft.ranges[stationId][key];
        draft.ranges[stationId] = { ...draft.ranges[stationId], [key]: idx === 0 ? [value, cur[1]] : [cur[0], value] } as StationRange;
      });
      return ok();
    },
    updateRules: (patch) => {
      mutate((draft) => { draft.rules = { ...draft.rules, ...patch }; }, { action: "Updated reporting rules", note: JSON.stringify(patch) });
      return ok();
    },
    reassignChi, reassignClerk,
    setAssumption: (id, status, note) => {
      mutate(
        (draft) => {
          const a = draft.assumptions.find((x) => x.id === id)!;
          a.status = status;
          a.decidedAt = new Date().toISOString();
          if (note) a.note = note;
          a.decidedBy = draft.users.find((u) => u.id === draft.sessionUserId)!.name;
        },
        { action: "Decision recorded on assumptions panel", note: `Q${id} → ${status.replace("_", " ")}` }
      );
      return ok();
    },
    setOfficerLayout: (layout) => mutate((draft) => { draft.prefs.officerLayout = layout; }),
    resetDemo: () => {
      localStorage.removeItem(STORAGE_KEY);
      setDb(loadDB());
    },
  };

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RailMark className="h-10 w-10" />
          <p className="text-sm text-muted-foreground">Loading demonstration workspace…</p>
        </div>
      </div>
    );
  }

  const currentUser = db.users.find((u) => u.id === db.sessionUserId) ?? db.users[0];
  return <StoreContext.Provider value={{ db, currentUser, actions }}>{children}</StoreContext.Provider>;
}

export function RailMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="7" fill="var(--color-primary)" />
      <path d="M8 26 L20 8 L32 26" stroke="var(--color-primary-foreground)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 26 L20 15.5 L27 26" stroke="var(--color-primary-foreground)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
      <rect x="10" y="29" width="20" height="2.6" rx="1.3" fill="var(--color-primary-foreground)" />
      <rect x="14" y="34" width="12" height="2" rx="1" fill="var(--color-primary-foreground)" opacity="0.6" />
    </svg>
  );
}

export function useDemo(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoStoreProvider");
  return ctx;
}
