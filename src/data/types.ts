export type Role = "admin" | "officer" | "clerk" | "chi";

export type LiveActivity = "2" | "9";

export interface User {
  id: string;
  name: string;
  role: Role;
  designation: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
  /** Clerks only: CHI user ids under supervision. */
  supervisesChiIds?: string[];
  leaveNote?: string;
}

export type StationCategory = "NGT" | "Sample Halt";

export interface Station {
  id: string;
  code: string;
  name: string;
  category: StationCategory;
  platforms: number;
  active: boolean;
  chiId: string | null;
  createdAt: string;
}

export interface ActivityDef {
  no: number;
  name: string;
  short: string;
  description: string;
  status: "live" | "upcoming";
  /** For live modules */
  taskTypes?: ("scheduled-daily" | "scheduled-monthly" | "ad-hoc" | "long-term")[];
  previewFields?: string[];
}

/** Per-station expected ranges. Index: stationId. */
export interface StationRange {
  dry: [number, number];
  wet: [number, number];
  infeed: [number, number];
}

export type EntryStatus =
  | "pending"
  | "submitted"
  | "out_of_range"
  | "sent_back"
  | "cleared"
  | "escalated";

export interface EntryHistoryItem {
  at: string;
  byUserId: string;
  type: "submit" | "resubmit";
  note: string;
  previous?: { dryKg?: number; wetKg?: number; infeedKg?: number; bales?: number };
}

export interface BaseEntry {
  id: string;
  activity: LiveActivity;
  stationId: string;
  chiId: string;
  date: string; // YYYY-MM-DD reporting date
  remarks: string;
  /** Demo attachment key: "waste" | "mrf" | null */
  photo?: "waste" | "mrf" | null;
  dueAt: string;
  submittedAt?: string;
  late: boolean;
  outOfRange: boolean;
  carriedForward: boolean;
  status: EntryStatus;
  history: EntryHistoryItem[];
}

export interface WasteEntry extends BaseEntry {
  activity: "2";
  dryKg: number;
  wetKg: number;
}

export interface MrfEntry extends BaseEntry {
  activity: "9";
  infeedKg: number;
  bales: number;
}

export interface MrfMonthly {
  id: string;
  stationId: string;
  chiId: string;
  month: number; // 1-12
  year: number;
  totalInfeedKg: number;
  totalBales: number;
  remarks: string;
  submittedAt: string;
}

export interface Auction {
  id: string;
  stationId: string;
  auctionDate: string;
  saleDate: string;
  qtyKg: number;
  ratePerKg: number;
  totalValue: number;
  sroNumber: string;
  sroDate: string;
  contractor: string;
  remarks: string;
  recordedAt: string;
}

export type ContractStatus = "active" | "expiring_soon" | "expired";

export interface Contract {
  id: string;
  stationId: string;
  activity: LiveActivity;
  contractor: string;
  period: string;
  startDate: string;
  expiryDate: string;
  omDetails: string;
  remarks: string;
}

export interface Verification {
  id: string;
  entryId: string;
  entryKind: "waste" | "mrf";
  action: "send_back" | "clear";
  clerkId: string;
  note: string; // mandatory reason / verification note
  at: string;
}

export interface Reassignment {
  id: string;
  kind: "chi" | "clerk";
  fromUserId: string;
  toUserId: string;
  stationIds: string[];
  chiIds: string[];
  leaveStart?: string;
  leaveEnd?: string;
  reason: string;
  at: string;
  byUserId: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  actorId: string;
  actorName: string;
  role: Role;
  action: string;
  stationId?: string;
  activity?: LiveActivity;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
}

export type AssumptionStatus = "pending" | "confirmed" | "change_required";

export interface Assumption {
  id: number; // 1..9
  title: string;
  assumption: string;
  demoBehaviour: string;
  question: string;
  status: AssumptionStatus;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

export interface DemoRules {
  wasteDueHour: number; // local hour, same-day deadline
  mrfDueHour: number;
  contractLeadDays: number;
}

export interface DemoDB {
  version: number;
  seededAt: string;
  sessionUserId: string;
  users: User[];
  stations: Station[];
  activities: ActivityDef[];
  wasteEntries: WasteEntry[];
  mrfEntries: MrfEntry[];
  mrfMonthly: MrfMonthly[];
  auctions: Auction[];
  contracts: Contract[];
  verifications: Verification[];
  reassignments: Reassignment[];
  audit: AuditEntry[];
  assumptions: Assumption[];
  ranges: Record<string, StationRange>;
  rules: DemoRules;
  prefs: { officerLayout: "worklist" | "grid" };
}

export type AnyEntry = WasteEntry | MrfEntry;
