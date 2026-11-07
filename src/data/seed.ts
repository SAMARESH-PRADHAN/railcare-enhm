import { addDays, format, set } from "date-fns";
import type {
  ActivityDef,
  Assumption,
  Auction,
  Contract,
  DemoDB,
  DemoRules,
  MrfEntry,
  MrfMonthly,
  Reassignment,
  Station,
  User,
  Verification,
  WasteEntry,
  AuditEntry,
} from "./types";

export const isoDate = (d: Date) => format(d, "yyyy-MM-dd");
export const todayISO = () => isoDate(new Date());
export const dayOffset = (n: number) => isoDate(addDays(new Date(), n));
export const dueAt = (dateISO: string, hour: number) =>
  set(new Date(`${dateISO}T00:00:00`), { hours: hour, minutes: 0, seconds: 0 }).toISOString();
const now = () => new Date().toISOString();

export const ACTIVITY_CATALOGUE: ActivityDef[] = [
  { no: 2, name: "Solid Waste Generation per Day", short: "Solid Waste", description: "Daily generation of dry (blue bin) and wet (green bin) solid waste per station, in kilograms.", status: "live", taskTypes: ["scheduled-daily"], previewFields: ["Dry Waste (Blue Dustbin) – KG", "Wet Waste (Green Bin) – KG", "Sanitary waste – scope confirmation required", "Domestic hazardous waste – scope confirmation required"] },
  { no: 9, name: "MRF – Plastic Baling Machine", short: "MRF Plastic Baling", description: "Material Recovery Facility: daily plastic infeed and bales produced; ad-hoc auction/sale records; long-term O&M contract management.", status: "live", taskTypes: ["scheduled-daily", "scheduled-monthly", "ad-hoc", "long-term"], previewFields: ["Daily plastic infeed (KG)", "Bales produced", "Auction / sale transactions (SRO)", "O&M contract and expiry"] },
  { no: 1, name: "Solid Waste Management", short: "SWM", description: "Division-wide solid waste management overview and compliance reporting.", status: "upcoming", previewFields: ["Division-level SWM summary", "Station compliance register"] },
  { no: 3, name: "ISO Certification", short: "ISO", description: "Station ISO certification register maintained by the department.", status: "upcoming", previewFields: ["ISO 9001/2015", "ISO 14001/2015", "ISO 45001/2018", "ISO 50001/2018", "ISO 5S", "Certificate number", "Certification date", "Surveillance audit dates", "Expiry date", "Issuing authority"] },
  { no: 4, name: "Water Audit", short: "Water Audit", description: "Periodic water audit records for applicable stations.", status: "upcoming", previewFields: ["Audit date", "Time period", "Next audit date", "Audit authority department", "Audit personnel", "Applicable NGT stations"] },
  { no: 5, name: "Energy Audit", short: "Energy Audit", description: "Periodic energy audit records for applicable stations.", status: "upcoming", previewFields: ["Audit date", "Time period", "Next audit date", "Audit authority department", "Audit personnel", "Applicable NGT stations"] },
  { no: 6, name: "Septic Tank Cleaning", short: "Septic Tanks", description: "Station-wise sludge cleaning register.", status: "upcoming", previewFields: ["Sludge cleaned (cubic metres)", "First cleaning date", "Next cleaning date", "Contract period", "Contractor details", "Contract expiry", "Number of septic tanks"] },
  { no: 7, name: "Rodent Control", short: "Rodent Control", description: "Rodent control operations register.", status: "upcoming", previewFields: ["Operation date", "Contractor", "Areas covered", "Contract expiry"] },
  { no: 8, name: "Station-wise Platform Area", short: "Platform Area", description: "Platform area master data used for cleaning norms and cost calculation.", status: "upcoming", previewFields: ["Platform number", "Area (sqm)", "Cleaning category"] },
  { no: 10, name: "MRF – Compost Plant", short: "MRF Compost", description: "Compost plant operations register at Material Recovery Facilities.", status: "upcoming", previewFields: ["Wet waste processed (KG)", "Compost produced (KG)", "Disposal record"] },
  { no: 11, name: "ETP/STP cum Water Recycling Plant", short: "ETP/STP", description: "Effluent/sewage treatment plant operation and recycling register.", status: "upcoming", previewFields: ["Intake volume", "Treated volume", "Recycled water reuse", "Plant status"] },
  { no: 12, name: "Number of Toilets Provided", short: "Toilets", description: "Toilet provision master register per station.", status: "upcoming", previewFields: ["Station", "Number of toilets", "Pay-and-use / free", "Accessibility compliance"] },
  { no: 13, name: "VAT Cleaning", short: "VAT Cleaning", description: "VAT (Veranda, Apron, Track) cleaning schedule and execution register.", status: "upcoming", previewFields: ["Section", "Cleaning date", "Executing agency", "Supervising officer"] },
  { no: 14, name: "SS Twin Bin Dustbins", short: "SS Twin Bins", description: "Stainless steel twin-bin provision and condition register.", status: "upcoming", previewFields: ["Location", "Number of bins", "Condition", "Replacement date"] },
  { no: 15, name: "PBCM", short: "PBCM", description: "Platform Cleaner Machines / PBCM deployment register.", status: "upcoming", previewFields: ["Machine ID", "Station", "Utilisation", "Maintenance schedule"] },
  { no: 16, name: "CCTV Camera Monitoring", short: "CCTV", description: "CCTV coverage and monitoring compliance register.", status: "upcoming", previewFields: ["Cameras installed", "Functional", "Monitoring shift", "DVR retention"] },
  { no: 17, name: "Daily Passenger Footfall", short: "Footfall", description: "Daily passenger footfall records per station.", status: "upcoming", previewFields: ["Date", "Footfall count", "Source (PRS/counter estimate)"] },
  { no: 18, name: "Station Cleaning Contract", short: "Cleaning Contract", description: "Station cleaning contract master register.", status: "upcoming", previewFields: ["Station", "Contractor firm", "Address", "Mobile number", "Contract period", "Cleaning start date", "Expiry date", "Daily frequency cycle", "Cleaning process (sweeping, dry, wet, washing, mopping, cobweb, rag picking, high-pressure jet, ride-on scrubber dryer)"] },
  { no: 19, name: "Public Health Activation – Mosquito Control", short: "Mosquito Control", description: "Mosquito control activation register.", status: "upcoming", previewFields: ["Activation date", "Area", "Method", "Agency"] },
  { no: 20, name: "PVC Dustbins", short: "PVC Dustbins", description: "PVC dustbin provision register.", status: "upcoming", previewFields: ["Location", "Quantity", "Condition"] },
  { no: 21, name: "Atmospheric Water Generator", short: "AWG", description: "Atmospheric water generator installation and output register.", status: "upcoming", previewFields: ["Unit", "Station", "Daily output (L)", "Maintenance"] },
  { no: 22, name: "Air Quality Index", short: "AQI", description: "Station AQI monitoring records.", status: "upcoming", previewFields: ["Date", "AQI value", "Sensor/agency source"] },
  { no: 23, name: "Station and Colony Water Quality Check", short: "Water Quality", description: "Water quality test register for station and railway colony supply.", status: "upcoming", previewFields: ["Sample date", "Lab", "Parameters", "Result", "Action taken"] },
  { no: 24, name: "Daily Passenger Complaint Register", short: "Complaints", description: "Daily passenger complaint register maintained by the EnHM section.", status: "upcoming", previewFields: ["Date", "Complaint", "Category", "Resolution status"] },
  { no: 25, name: "Number of Passengers Penalized", short: "Penalised", description: "Passengers penalised under EnHM-related provisions.", status: "upcoming", previewFields: ["Date", "Section", "Number penalised", "Amount"] },
  { no: 26, name: "Illegal Dumping Locations", short: "Illegal Dumping", description: "Register of identified illegal dumping locations.", status: "upcoming", previewFields: ["Location", "Identified date", "Action taken", "Status"] },
  { no: 27, name: "Encroachment Along Railway Track", short: "Encroachment", description: "Encroachment survey and removal register.", status: "upcoming", previewFields: ["Location", "Survey date", "Removal action", "Status"] },
  { no: 28, name: "Penalty Notices and Public Awareness Posters", short: "Notices & Posters", description: "Penalty notices issued and awareness poster deployment register.", status: "upcoming", previewFields: ["Date", "Notices issued", "Posters deployed", "Location"] },
  { no: 29, name: "Pay-and-Use Toilets", short: "Pay-and-Use", description: "Pay-and-use toilet operation and revenue register.", status: "upcoming", previewFields: ["Station", "Operator", "Daily collection", "Cleaning frequency"] },
  { no: 30, name: "SWM Infrastructure in Division", short: "SWM Infra", description: "Division solid waste management infrastructure master register.", status: "upcoming", previewFields: ["Infrastructure", "Station", "Capacity", "Status"] },
  { no: 31, name: "EnHM Approved Contractors", short: "Contractors", description: "Approved contractor master register for EnHM works.", status: "upcoming", previewFields: ["Contractor", "Scope", "Approval reference", "Validity"] },
];

const USERS: User[] = [
  { id: "u-admin", name: "Arvind Kumar Sinha", role: "admin", designation: "Divisional Administrator, EnHM", phone: "+91 98000 11001", email: "enhms.admin@demo.railway.gov.in", active: true, createdAt: now() },
  { id: "u-officer", name: "Dr. Sujit Kumar Chatterjee", role: "officer", designation: "Divisional Officer, EnHM (Health)", phone: "+91 98000 11002", email: "enhms.officer@demo.railway.gov.in", active: true, createdAt: now() },
  { id: "u-clerk-1", name: "Priya Sharma", role: "clerk", designation: "EnHM Verification Clerk, Grade-I", phone: "+91 98000 11003", email: "priya.sharma@demo.railway.gov.in", active: true, createdAt: now(), supervisesChiIds: ["u-chi-1", "u-chi-2"] },
  { id: "u-clerk-2", name: "Md. Asif Iqbal", role: "clerk", designation: "EnHM Verification Clerk, Grade-I", phone: "+91 98000 11004", email: "asif.iqbal@demo.railway.gov.in", active: true, createdAt: now(), supervisesChiIds: ["u-chi-3"] },
  { id: "u-chi-1", name: "Rajesh Kumar Yadav", role: "chi", designation: "Chief Health Inspector (CHI)", phone: "+91 98000 11005", email: "rajesh.yadav@demo.railway.gov.in", active: true, createdAt: now() },
  { id: "u-chi-2", name: "Sourav Mondal", role: "chi", designation: "Chief Health Inspector (CHI)", phone: "+91 98000 11006", email: "sourav.mondal@demo.railway.gov.in", active: true, createdAt: now() },
  { id: "u-chi-3", name: "Anil Prasad", role: "chi", designation: "Chief Health Inspector (CHI)", phone: "+91 98000 11007", email: "anil.prasad@demo.railway.gov.in", active: true, createdAt: now() },
];

const STATIONS: Station[] = [
  { id: "st-hwh", code: "HWH", name: "Howrah Junction", category: "NGT", platforms: 23, active: true, chiId: "u-chi-1", createdAt: now() },
  { id: "st-bdc", code: "BDC", name: "Bandel Junction", category: "NGT", platforms: 8, active: true, chiId: "u-chi-1", createdAt: now() },
  { id: "st-srp", code: "SRP", name: "Serampore", category: "NGT", platforms: 5, active: true, chiId: "u-chi-2", createdAt: now() },
  { id: "st-kog", code: "KOG", name: "Konnagar", category: "NGT", platforms: 4, active: true, chiId: "u-chi-1", createdAt: now() },
  { id: "st-ris", code: "RIS", name: "Rishra", category: "NGT", platforms: 3, active: true, chiId: "u-chi-2", createdAt: now() },
  { id: "st-she", code: "SHE", name: "Sheoraphuli", category: "NGT", platforms: 4, active: true, chiId: "u-chi-2", createdAt: now() },
  { id: "st-bwn", code: "BWN", name: "Barddhaman Junction", category: "NGT", platforms: 6, active: true, chiId: "u-chi-3", createdAt: now() },
  { id: "st-bhp", code: "BHP", name: "Bolpur Shantiniketan", category: "NGT", platforms: 4, active: true, chiId: "u-chi-3", createdAt: now() },
  { id: "st-rph", code: "RPH", name: "Rampurhat Junction", category: "NGT", platforms: 5, active: true, chiId: "u-chi-3", createdAt: now() },
  { id: "st-sha", code: "SHA", name: "Sample Small Halt A", category: "Sample Halt", platforms: 1, active: true, chiId: "u-chi-3", createdAt: now() },
  { id: "st-shb", code: "SHB", name: "Sample Small Halt B", category: "Sample Halt", platforms: 1, active: true, chiId: "u-chi-3", createdAt: now() },
];

export const RANGES: DemoDB["ranges"] = {
  "st-hwh": { dry: [300, 600], wet: [250, 450], infeed: [200, 800] },
  "st-bdc": { dry: [120, 240], wet: [90, 180], infeed: [120, 500] },
  "st-srp": { dry: [55, 110], wet: [45, 90], infeed: [40, 260] },
  "st-kog": { dry: [40, 90], wet: [30, 70], infeed: [30, 150] },
  "st-ris": { dry: [35, 80], wet: [25, 60], infeed: [30, 140] },
  "st-she": { dry: [35, 75], wet: [25, 55], infeed: [25, 120] },
  "st-bwn": { dry: [150, 300], wet: [120, 240], infeed: [100, 400] },
  "st-bhp": { dry: [60, 120], wet: [45, 100], infeed: [50, 200] },
  "st-rph": { dry: [80, 160], wet: [60, 130], infeed: [60, 250] },
  "st-sha": { dry: [15, 45], wet: [10, 30], infeed: [10, 60] },
  "st-shb": { dry: [15, 45], wet: [10, 30], infeed: [10, 60] },
};

const RULES: DemoRules = { wasteDueHour: 12, mrfDueHour: 16, contractLeadDays: 60 };

function waste(
  id: string,
  stationId: string,
  chiId: string,
  date: string,
  dryKg: number,
  wetKg: number,
  opts: {
    status: WasteEntry["status"];
    late?: boolean;
    outOfRange?: boolean;
    remarks?: string;
    photo?: WasteEntry["photo"];
    submittedHour?: number;
    carriedForward?: boolean;
  }
): WasteEntry {
  const submittedAt = opts.status === "pending" || !opts.submittedHour
    ? undefined
    : set(new Date(`${date}T00:00:00`), { hours: opts.submittedHour }).toISOString();
  return {
    id, activity: "2", stationId, chiId, date, dryKg, wetKg,
    remarks: opts.remarks ?? "",
    photo: opts.photo ?? null,
    dueAt: dueAt(date, RULES.wasteDueHour),
    ...(submittedAt ? { submittedAt } : {}),
    late: opts.late ?? false,
    outOfRange: opts.outOfRange ?? false,
    carriedForward: opts.carriedForward ?? false,
    status: opts.status,
    history: opts.status === "pending" ? [] : [{ at: submittedAt ?? now(), byUserId: chiId, type: "submit", note: "Initial submission" }],
  };
}

function mrf(
  id: string,
  stationId: string,
  chiId: string,
  date: string,
  infeedKg: number,
  bales: number,
  opts: {
    status: MrfEntry["status"];
    late?: boolean;
    outOfRange?: boolean;
    remarks?: string;
    submittedHour?: number;
    carriedForward?: boolean;
  }
): MrfEntry {
  const submittedAt = opts.submittedHour !== undefined
    ? set(new Date(`${date}T00:00:00`), { hours: opts.submittedHour }).toISOString()
    : undefined;
  return {
    id, activity: "9", stationId, chiId, date, infeedKg, bales,
    remarks: opts.remarks ?? "",
    photo: null,
    dueAt: dueAt(date, RULES.mrfDueHour),
    ...(submittedAt ? { submittedAt } : {}),
    late: opts.late ?? false,
    outOfRange: opts.outOfRange ?? false,
    carriedForward: opts.carriedForward ?? false,
    status: opts.status,
    history: opts.status === "pending" ? [] : [{ at: now(), byUserId: chiId, type: "submit", note: "Initial submission" }],
  };
}

const T = todayISO();
const Y = dayOffset(-1);
const M3 = dayOffset(-3);

const WASTE_SEED: WasteEntry[] = [
  // Demo scenario 1: Howrah out-of-range 842 KG with CHI explanation
  waste("w-hwh-T", "st-hwh", "u-chi-1", T, 842, 410, {
    status: "submitted", outOfRange: true, remarks: "Mela footfall surge — two festival specials handled today; additional platform cleaning stock generated.", photo: "waste", submittedHour: 10,
  }),
  // Demo scenario 3: Bandel entry for the reporting date 3 days ago submitted today → Late
  waste("w-bdc-M3", "st-bdc", "u-chi-1", M3, 132, 98, { status: "submitted", late: true, remarks: "Submitted late — field staff shortage on 01 Nov.", submittedHour: 10 }),
  // Cleared examples for the Officer "Cleared by Clerks" section
  waste("w-srp-T", "st-srp", "u-chi-2", T, 95, 72, { status: "cleared", remarks: "Normal day.", submittedHour: 9 }),
  waste("w-ris-T", "st-ris", "u-chi-2", T, 62, 47, { status: "cleared", remarks: "In range.", submittedHour: 9 }),
  waste("w-bhp-T", "st-bhp", "u-chi-3", T, 88, 66, { status: "cleared", remarks: "Normal.", submittedHour: 10 }),
  waste("w-sha-T", "st-sha", "u-chi-3", T, 28, 19, { status: "cleared", remarks: "Halt station — small volume.", submittedHour: 10 }),
  // Pending verification
  waste("w-she-T", "st-she", "u-chi-2", T, 58, 40, { status: "submitted", remarks: "", submittedHour: 11 }),
  waste("w-bwn-T", "st-bwn", "u-chi-3", T, 210, 165, { status: "submitted", remarks: "", submittedHour: 11 }),
  // Carried forward after reassignment (RPH moved from CHI-2 to CHI-3)
  waste("w-rph-Y", "st-rph", "u-chi-3", Y, 155, 120, { status: "submitted", carriedForward: true, remarks: "Submitted before reassignment handover.", submittedHour: 15 }),
  waste("w-rph-T", "st-rph", "u-chi-3", T, 120, 90, { status: "submitted", remarks: "", submittedHour: 11 }),
  // Small halts normal
  waste("w-shb-T", "st-shb", "u-chi-3", T, 33, 22, { status: "submitted", remarks: "", submittedHour: 10 }),
  // Konnagar: NO entry today → missing. (deliberately absent)
  waste("w-kog-Y", "st-kog", "u-chi-1", Y, 55, 41, { status: "cleared", remarks: "Normal.", submittedHour: 10 }),
];

const MRF_SEED: MrfEntry[] = [
  mrf("m-hwh-T", "st-hwh", "u-chi-1", T, 520, 11, { status: "submitted", submittedHour: 10 }),
  mrf("m-bdc-T", "st-bdc", "u-chi-1", T, 260, 6, { status: "cleared", submittedHour: 10 }),
  // Serampore low infeed outlier (expected 40–260)
  mrf("m-srp-T", "st-srp", "u-chi-2", T, 4, 0, { status: "submitted", outOfRange: true, remarks: "Baling machine hydraulic seal failure — machine idle since 01 Nov; repair vendor informed.", submittedHour: 11 }),
  // Rampurhat carried-forward entry after reassignment
  mrf("m-rph-Y", "st-rph", "u-chi-3", Y, 140, 3, { status: "submitted", carriedForward: true, submittedHour: 15 }),
  mrf("m-rph-T", "st-rph", "u-chi-3", T, 130, 3, { status: "submitted", submittedHour: 11 }),
  mrf("m-bwn-Y", "st-bwn", "u-chi-3", Y, 240, 5, { status: "cleared", submittedHour: 15 }),
  // Barddhaman: NO MRF entry today → missing.
];

const MRF_MONTHLY: MrfMonthly[] = [
  { id: "mm-srp-2026-10", stationId: "st-srp", chiId: "u-chi-2", month: 10, year: 2026, totalInfeedKg: 5240, totalBales: 104, remarks: "October monthly baling return.", submittedAt: now() },
  { id: "mm-hwh-2026-10", stationId: "st-hwh", chiId: "u-chi-1", month: 10, year: 2026, totalInfeedKg: 14280, totalBales: 286, remarks: "October monthly baling return.", submittedAt: now() },
];

const AUCTIONS: Auction[] = [
  { id: "a-hwh-1", stationId: "st-hwh", auctionDate: dayOffset(-7), saleDate: dayOffset(-6), qtyKg: 1250, ratePerKg: 14.5, totalValue: 18125, sroNumber: "HWH/SRO/2026/114", sroDate: dayOffset(-5), contractor: "Metro Waste Recyclers LLP", remarks: "Plastic bales auctioned from MRF yard.", recordedAt: now() },
  { id: "a-bwn-1", stationId: "st-bwn", auctionDate: dayOffset(-5), saleDate: dayOffset(-4), qtyKg: 780, ratePerKg: 13.0, totalValue: 10140, sroNumber: "BWN/SRO/2026/87", sroDate: dayOffset(-3), contractor: "Eastern Polymers", remarks: "", recordedAt: now() },
];

const CONTRACTS: Contract[] = [
  { id: "c-hwh-1", stationId: "st-hwh", activity: "9", contractor: "CleanSpace Enviro Services Pvt. Ltd.", period: "Dec 2024 – Dec 2026", startDate: "2024-12-01", expiryDate: dayOffset(20), omDetails: "O&M of horizontal plastic baling machine incl. manpower and consumables.", remarks: "Renewal proposal under submission." },
  { id: "c-srp-1", stationId: "st-srp", activity: "9", contractor: "Ganga Sanitation Works", period: "Apr 2025 – Mar 2027", startDate: "2025-04-01", expiryDate: "2027-03-31", omDetails: "MRF shed upkeep and machine preventive maintenance.", remarks: "" },
  { id: "c-bwn-1", stationId: "st-bwn", activity: "9", contractor: "Barddhaman Cleansing Coop. Society Ltd.", period: "Jul 2025 – Jun 2027", startDate: "2025-07-01", expiryDate: "2027-06-30", omDetails: "Baling machine O&M.", remarks: "" },
  { id: "c-rph-1", stationId: "st-rph", activity: "9", contractor: "RPH Enviro Care", period: "Feb 2025 – Jan 2027", startDate: "2025-02-01", expiryDate: dayOffset(180), omDetails: "O&M of baling machine and yard housekeeping.", remarks: "" },
  { id: "c-bdc-1", stationId: "st-bdc", activity: "9", contractor: "Bandel Sanitary Syndicate", period: "Sep 2024 – Sep 2026", startDate: "2024-09-15", expiryDate: dayOffset(-10), omDetails: "Baling machine O&M — contract expired, extension awaited.", remarks: "" },
];

const VERIFICATIONS: Verification[] = [
  { id: "v-1", entryId: "w-srp-T", entryKind: "waste", action: "clear", clerkId: "u-clerk-1", note: "Verified against bin weighing register; figures consistent with daily average. Cleared.", at: now() },
  { id: "v-2", entryId: "w-ris-T", entryKind: "waste", action: "clear", clerkId: "u-clerk-1", note: "Within expected range, no anomaly observed. Cleared.", at: now() },
  { id: "v-3", entryId: "m-bdc-T", entryKind: "mrf", action: "clear", clerkId: "u-clerk-1", note: "Bale count matches log book entry no. 214. Cleared.", at: now() },
  { id: "v-4", entryId: "w-bhp-T", entryKind: "waste", action: "clear", clerkId: "u-clerk-2", note: "In range. Weighbridge slip verified. Cleared.", at: now() },
  { id: "v-5", entryId: "w-sha-T", entryKind: "waste", action: "clear", clerkId: "u-clerk-2", note: "Halt station volumes consistent. Cleared.", at: now() },
  { id: "v-6", entryId: "w-kog-Y", entryKind: "waste", action: "clear", clerkId: "u-clerk-1", note: "Within range. Cleared.", at: now() },
  { id: "v-7", entryId: "m-bwn-Y", entryKind: "mrf", action: "clear", clerkId: "u-clerk-2", note: "In feed and bale tally consistent. Cleared.", at: now() },
];

const REASSIGNMENTS: Reassignment[] = [
  {
    id: "r-1", kind: "chi", fromUserId: "u-chi-2", toUserId: "u-chi-3", stationIds: ["st-rph"],
    chiIds: [], leaveStart: dayOffset(-14), leaveEnd: dayOffset(-7),
    reason: "CHI Sourav Mondal on earned leave — Rampurhat Junction temporarily transferred to CHI Anil Prasad.",
    at: dayOffset(-14), byUserId: "u-officer",
  },
];

function seedAudit(): AuditEntry[] {
  const base = now();
  const mk = (action: string, actorId: string, role: AuditEntry["role"], extra: Partial<AuditEntry> = {}): AuditEntry => ({
    id: `au-${Math.random().toString(36).slice(2, 8)}-${action.length}`, ts: base, actorId,
    actorName: USERS.find((u) => u.id === actorId)!.name, role, action, ...extra,
  });
  return [
    mk("Demo data initialised with sample scenario set", "u-admin", "admin"),
    mk("Submitted daily solid waste report", "u-chi-1", "chi", { stationId: "st-hwh", activity: "2", toStatus: "submitted", note: "842 KG dry (expected 300–600) — out of range, explanation attached" }),
    mk("Submitted MRF daily infeed", "u-chi-2", "chi", { stationId: "st-srp", activity: "9", toStatus: "submitted", note: "4 KG infeed (expected 40–260) — low outlier flagged" }),
    mk("Cleared solid waste entry with verification note", "u-clerk-1", "clerk", { stationId: "st-srp", activity: "2", fromStatus: "submitted", toStatus: "cleared", note: "Verified against bin weighing register." }),
    mk("Cleared solid waste entry with verification note", "u-clerk-1", "clerk", { stationId: "st-ris", activity: "2", fromStatus: "submitted", toStatus: "cleared" }),
    mk("Contract expiry alert raised (20 days)", "u-admin", "admin", { stationId: "st-hwh", activity: "9" }),
    mk("CHI reassignment executed (leave)", "u-officer", "officer", { note: "Rampurhat: CHI Sourav Mondal → CHI Anil Prasad" }),
  ];
}

const ASSUMPTIONS: Assumption[] = [
  { id: 1, title: "Out-of-range values", assumption: "Out-of-range values are accepted rather than blocked.", demoBehaviour: "842 KG at Howrah can be saved with a mandatory remark and is flagged for verification.", question: "Do you agree that actual figures should be accepted with an explanation instead of rejecting the entry?", status: "pending" },
  { id: 2, title: "Clerk visibility", assumption: "Clerks see exceptions rather than every normal submission.", demoBehaviour: "The Clerk receives missing, late and out-of-range entries.", question: "Should clerks see only exceptions, or should they also have access to all normal submissions?", status: "pending" },
  { id: 3, title: "Late calculation", assumption: "Late status is automatically calculated.", demoBehaviour: "The system compares the due date and submission timestamp.", question: "Should the late-entry rule be calculated automatically using the submission time?", status: "confirmed" },
  { id: 4, title: "Original figure protection", assumption: "Clerks cannot edit CHI-submitted figures.", demoBehaviour: "The Clerk can only send back or clear an entry with a note.", question: "Should the original CHI entry remain unchanged after verification?", status: "pending" },
  { id: 5, title: "Mandatory verification note", assumption: "Clearing an exception requires a mandatory note.", demoBehaviour: "The clerk must enter a short explanation before clearing.", question: "Should a clerk's verification note be compulsory for every cleared exception?", status: "pending" },
  { id: 6, title: "Ad-hoc auctions", assumption: "Unrecorded auctions cannot be automatically identified as missing.", demoBehaviour: "The system displays an informational warning and proposes a monthly NIL return for consideration.", question: "Should the department introduce a monthly NIL return for auction activities?", status: "pending" },
  { id: 7, title: "Contract warning", assumption: "MRF contract expiry alerts begin 60 days before expiry.", demoBehaviour: "A contract expiring in 20 days appears as an alert.", question: "Is 60 days the correct advance-warning period for this activity, or should each activity have its own warning period?", status: "pending" },
  { id: 8, title: "Photo compression and archiving", assumption: "Photographs will eventually require compression and an archiving policy.", demoBehaviour: "Only mock thumbnails are displayed.", question: "What image quality, storage duration and archiving rules should apply to field inspection photographs?", status: "change_required" },
  { id: 9, title: "Reassignment of pending work", assumption: "Pending work may remain associated with the original assignment during reassignment.", demoBehaviour: "Carried-forward entries are separately labelled and shown in the Clerk's workspace.", question: "When a CHI or clerk is reassigned, should pending work stay with the previous owner or automatically move to the new owner?", status: "pending" },
];

export function buildSeedDB(): DemoDB {
  return {
    version: 3,
    seededAt: now(),
    sessionUserId: "u-admin",
    users: USERS,
    stations: STATIONS,
    activities: ACTIVITY_CATALOGUE,
    wasteEntries: WASTE_SEED,
    mrfEntries: MRF_SEED,
    mrfMonthly: MRF_MONTHLY,
    auctions: AUCTIONS,
    contracts: CONTRACTS,
    verifications: VERIFICATIONS,
    reassignments: REASSIGNMENTS,
    audit: seedAudit(),
    assumptions: ASSUMPTIONS,
    ranges: RANGES,
    rules: RULES,
    prefs: { officerLayout: "worklist" },
  };
}

export const STORAGE_KEY = "enhm-demo-db-v3";
