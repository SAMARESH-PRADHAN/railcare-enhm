# RailCare EnHM

# Build a Premium Indian Railways EnHM Management & Cleaning Inspection System

Act as a senior enterprise software architect, railway operations domain expert, UI/UX designer and experienced React developer.

I want you to build a complete, premium-quality, responsive frontend prototype for an Indian Railways Environment & Housekeeping Management (EnHM) system.

This application will be demonstrated to railway department officers and senior management. It must look and feel like a real enterprise railway operations management platform, not a generic admin dashboard or a simple CRUD application.

The project is for railway station cleaning inspection, housekeeping management, environmental monitoring, waste management, activity reporting, verification, staff supervision and division-wide operational monitoring.

IMPORTANT: This is a presentation prototype only.

- Frontend only.
- No backend.
- No database.
- No API integration.
- No real authentication.
- Use localStorage for all demo data and interactions.
- All buttons, filters, forms, assignments, status changes and role-specific workflows must actually work in the frontend.
- All changes must persist after refreshing the browser.
- Provide a Reset Demo Data option to restore the original sample data.

Do not create a backend or introduce Supabase, Firebase, PostgreSQL, MongoDB or any other database.

---

# 1. Technology stack

Use the following technology stack:

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- React Router
- Recharts only if needed for a small operational visualization
- localStorage for demo persistence

Use a clean, scalable folder structure.

Suggested structure:

src/
  components/
    layout/
    navigation/
    dashboard/
    tables/
    forms/
    modals/
    shared/
  pages/
    admin/
    officer/
    clerk/
    chi/
    stations/
    activities/
    assignments/
    reports/
    settings/
  contexts/
  hooks/
  data/
  lib/
  types/

Keep components reusable and maintainable.

Do not put the entire application inside one large component.

---

# 2. Product identity and design direction

Application name:

INDIAN RAILWAYS – EnHM MANAGEMENT SYSTEM

Full name:

Environment & Housekeeping Management System

Subtitle:

Eastern Railway | Howrah Division

Design direction:

Create a premium, professional, modern railway operations interface.

The interface should communicate:
- Authority
- Reliability
- Operational transparency
- Accountability
- Inspection accuracy
- Government enterprise standards
- Data-driven decision-making

Visual style:

- Deep navy blue as the primary colour.
- Railway-inspired blue and steel-grey tones.
- White and very light grey backgrounds.
- Emerald green for completed and verified activities.
- Amber for pending and warning states.
- Red for escalations and critical exceptions.
- Neutral grey for inactive modules.

Use:
- Premium typography.
- Clear information hierarchy.
- Professional tables.
- Compact operational cards.
- Elegant navigation.
- Subtle borders.
- Restrained shadows.
- Consistent spacing.
- High-quality icons.
- Smooth but subtle transitions.

Avoid:
- Generic AI dashboard designs.
- Excessively rounded cards.
- Large empty spaces.
- Excessive gradients.
- Too many colourful elements.
- Oversized dashboard statistics.
- Decorative animations that reduce usability.

This is railway operations software, not a marketing website.

Make the interface dense enough for professional operations while remaining readable.

Every status must have an icon or text label in addition to its colour so that it remains understandable in black-and-white printing.

Use tabular numerals for numeric values.

---

# 3. Fully responsive application

The application must work perfectly on:

1. Desktop and laptop.
2. Tablets.
3. Android smartphones.
4. iPhones.

Desktop:
- Fixed left sidebar.
- Top header.
- Main content area.
- Tables with proper column alignment.
- Suitable information density.

Tablet:
- Collapsible sidebar.
- Responsive grids.
- Tables should support horizontal scrolling or an appropriate compact layout.

Mobile:
- Mobile-friendly navigation.
- Compact top header.
- Bottom navigation or a suitable mobile menu.
- Full-width forms.
- Large touch targets.
- No horizontal page overflow.
- Cards instead of wide tables where necessary.
- Easy access to assigned work.
- Easy data entry in outdoor working conditions.

IMPORTANT:

The CHI interface is primarily a field-working application. Design it mobile-first.

On desktop, show the CHI workspace inside a realistic phone-shaped preview or phone-sized layout, so officers immediately understand how it will be used in the field.

---

# 4. Four user roles and hierarchy

There are four roles.

## ROLE 1: ADMIN

Admin has division-wide administrative control.

Admin can:
- View all users.
- Add and edit CHIs.
- Add and edit clerks.
- Add and edit officers.
- Deactivate users.
- Add, edit and deactivate railway stations.
- Assign CHIs to stations.
- Assign CHIs to clerks.
- Reassign CHIs when somebody goes on leave.
- Reassign a clerk's CHIs to another clerk.
- Configure activity definitions.
- Configure activity-specific reporting frequency.
- Configure station-specific expected ranges.
- View all reports.
- View all operational activities.
- View all assignments.
- Review the activity catalogue.
- Configure demo settings.

The Admin must never directly modify an already-submitted CHI figure through the clerk verification process.

Create a professional Admin dashboard.

Dashboard sections:

- Total Stations
- Total CHIs
- Total Clerks
- Active Users
- Activities
- Pending Entries
- Exceptions
- Escalations
- Contracts Expiring Soon

Admin sidebar:

1. Dashboard
2. User Management
3. Station Management
4. CHI Management
5. Clerk Management
6. Officer Management
7. Assignments
8. Activity Configuration
9. Reporting Rules
10. Range Configuration
11. Reports Overview
12. Settings

Create proper Add/Edit modals and functional forms.

Create a leave management interface.

Example:

When a clerk is on leave:
- Select the clerk.
- Show all CHIs assigned to that clerk.
- Select a replacement clerk.
- Enter leave start date.
- Enter leave end date.
- Confirm reassignment.

The system should transfer the CHIs under that clerk to the replacement clerk.

Their stations should follow their respective CHIs.

Show a reassignment history.

Do not allow a station to be directly allocated to a clerk.

## ROLE 2: OFFICER

The Officer is responsible for division-wide monitoring and operational supervision.

The Officer can:
- View all railway stations.
- View all CHIs.
- View all clerks.
- View division-wide reports.
- Monitor activity completion.
- View delayed entries.
- View missing entries.
- View out-of-range entries.
- View clerk verification.
- View unresolved exceptions.
- Give instructions to clerks.
- Assign pending follow-up work to clerks.
- Reassign a clerk's workload if that clerk is on leave.
- Reassign CHIs when necessary.
- Monitor reassignment history.
- View cleared entries with clerk remarks.
- Escalate important issues.
- Review contract expiry alerts.

Officer dashboard must contain three major sections in this order:

A. NEEDS YOUR ATTENTION

Show:
- Critical exceptions.
- Unresolved issues.
- Escalations.
- Send-backs awaiting CHI response.
- Missing daily reports.
- Overdue submissions.
- Important contract expiry alerts.

B. CLEARED BY CLERKS

Show:
- Station.
- CHI.
- Activity.
- Original submitted value.
- Expected range.
- Clerk name.
- Clerk's mandatory clearing note.
- Date of verification.

The Officer must be able to audit the clerk's decision.

C. COMPLETE DIVISION OVERVIEW

Show a station-by-activity operational grid.

Each cell should indicate:
- Submitted.
- Pending.
- Missing.
- Late.
- Out of range.
- Sent back.
- Cleared.
- Escalated.

Each state must have an icon and text/accessible label.

Create two switchable dashboard layouts:

1. Worklist First.
2. Grid First.

Add a prominent toggle to switch between these layouts.

The Officer must be able to switch layouts without losing the current filter or data state.

Also include:

- Ad-hoc activity records.
- Long-term contract alerts.
- Station-wise operational overview.
- Clerk performance summary.
- CHI workload summary.

## ROLE 3: CLERK

The Clerk supervises multiple CHIs.

A clerk should see only the CHIs assigned to them and the stations belonging to those CHIs.

The Clerk is responsible for checking submitted reports and identifying issues.

The Clerk can:
- View assigned CHIs.
- View their station reports.
- Monitor pending work.
- View exceptions.
- View late submissions.
- View missing reports.
- View out-of-range figures.
- Send an entry back to the CHI with a mandatory reason.
- Clear an entry with a mandatory verification note.
- Monitor previously cleared entries.
- Monitor pending corrections.
- Follow up with CHIs.
- View reassigned CHI workloads.

IMPORTANT PERMISSION RULE:

The Clerk must NEVER directly edit or overwrite a submitted CHI figure.

Only two verification actions are allowed:

1. SEND BACK
2. CLEAR WITH NOTE

Send Back workflow:

- Click Send Back.
- Open a modal.
- Show station, CHI, activity and original value.
- Enter a mandatory reason.
- Submit.
- Mark entry as Sent Back.
- Show the entry again in the CHI's pending correction list.

Clear workflow:

- Click Clear.
- Open a modal.
- Show the submitted details.
- Enter a mandatory verification note.
- Note is mandatory.
- Confirm.
- Change status to Cleared.
- Display the clerk's note in the Officer dashboard.

The original CHI submission must remain unchanged.

Clerk dashboard design:

This should be a professional operational worklist, NOT a chart-heavy dashboard.

At the top show:

"6 of 24 entries need attention"

Use realistic demo numbers.

Display:
- Total entries.
- Exceptions.
- Missing.
- Late.
- Out of range.
- Awaiting CHI correction.

Main table columns:

- Station
- Station Code
- CHI Name
- Activity
- Submitted Value
- Expected Range
- Submission Date
- Status
- Action

Create a separate section:

"Carried Forward After Reassignment"

Clearly explain that these entries belong to CHIs whose workloads have been reassigned.

Do not make carried-forward entries appear like software errors.

## ROLE 4: CHI – CHIEF HEALTH INSPECTOR

CHI is the field-level user.

CHI can see only:
- Their assigned stations.
- Their assigned activities.
- Their pending work.
- Their submitted work.
- Entries returned by the clerk.
- Upcoming contract-related tasks.

CHI can:
- Enter daily waste figures.
- Enter MRF daily readings.
- Submit activity reports.
- Add remarks.
- Attach demo photographs.
- Edit fixed station information where permitted.
- View submission history.
- Correct entries sent back by the clerk.
- View assignment information.

CHI cannot:
- View another CHI's stations.
- Verify their own reports.
- Clear their own exceptions.
- Reassign stations.
- Change activity reporting rules.

CHI interface must be mobile-first.

Create an outstanding-work list.

Completed entries should move below outstanding work.

The CHI should be able to open a task, enter figures and submit the report.

Create a cosmetic offline queue indicator, for example:

"3 entries waiting to sync"

Clearly label this as DEMO SIMULATION ONLY.

Do not claim real offline synchronization is implemented.

---

# 5. Demonstration data

Do not seed all 199 stations.

Use 11 sample stations and clearly show:

"11 of 199 stations shown – Sample Data"

Use these nine NGT stations:

| Code | Station |
|---|---|
| HWH | Howrah |
| BDC | Bandel |
| SRP | Serampore |
| KOG | Konnagar |
| RIS | Rishra |
| SHE | Sheoraphuli |
| BWN | Barddhaman |
| BHP | Bolpur Shantiniketan |
| RPH | Rampurhat |

Add two clearly fictional stations:

- Sample Small Halt A
- Sample Small Halt B

Label both as sample stations.

Create:
- 3 CHIs.
- 2 Clerks.
- 1 Officer.
- 1 Admin.

Assign stations to CHIs.

Assign multiple CHIs to each clerk.

Never assign stations directly to clerks.

Use realistic Indian names and contact details in the demo. Clearly mark all personal information as fictional sample data.

Keep the sample data consistent across every role.

---

# 6. Main operational activities – FULLY FUNCTIONAL DEMO

Implement only two activities as fully functional operational modules.

The remaining 29 activities should appear in the activity catalogue as upcoming modules.

## ACTIVITY 2: SOLID WASTE GENERATION PER DAY

This is the primary demonstration activity.

Purpose:

Every assigned station submits daily solid waste generation information.

Main fields:

- Railway Station.
- Station Code.
- Reporting Date.
- CHI Name.
- Dry Waste (Blue Dustbin) – KG.
- Wet Waste (Green Bin) – KG.
- Remarks.
- Photograph attachment (demo only).

For the primary demo workflow, activate the two fields:
- Dry waste.
- Wet waste.

The client department document also mentions sanitary and special-care/domestic hazardous waste categories. Show these as additional categories marked "Scope confirmation required", not as fully active reporting fields.

### Station-specific reporting ranges

Ranges must be configurable separately for each station.

Example:

Howrah:
- Dry waste expected range: 300–600 KG.
- Wet waste: use a clearly marked sample range.

Small Halt A:
- Dry waste expected range: 15–45 KG.
- Wet waste: use a clearly marked sample range.

Do not apply one global range to every station.

### Important validation rules

Rule 1:

If a CHI enters a figure within the expected range, allow saving normally.

Rule 2:

If a CHI enters an out-of-range figure, DO NOT reject the figure.

Accept the actual value but require a remark.

Example:

Howrah dry waste = 842 KG.

Show:

"Out of Range – Expected 300–600 KG"

Reveal the remark field dynamically.

Hint:

"Please explain why this reading is outside the expected range."

Block submission until the remark is provided.

Once the remark is entered, allow the original figure to be saved.

Mark the report as:

"Out of Range – Awaiting Verification"

Never automatically replace the entered figure.

Rule 3:

Calculate late submission automatically.

Store:
- Reporting period.
- Due date.
- Actual submission timestamp.

Compare the submission timestamp against the due date.

Do not allow users to manually choose the Late status.

### Demonstration scenarios

Seed these situations:

1. Howrah: Dry waste = 842 KG, expected 300–600 KG, with CHI explanation attached.
2. Konnagar: No entry submitted today.
3. Bandel: Entry for 1 November submitted on 4 November; automatically marked Late.
4. Sample Small Halt A: Normal in-range entry.
5. Sample Small Halt B: Normal in-range entry.

Konnagar must be enterable during the client demonstration.

Allow the Officer or CHI to switch to the CHI role and enter Konnagar's missing report live.

## ACTIVITY 9: MRF – PLASTIC BALING MACHINE

This activity demonstrates three different task types.

### A. Scheduled tasks

Daily:
- Station.
- Reporting date.
- Daily plastic infeed (KG).
- Bales produced.
- Remarks.

Monthly:
- Month.
- Year.
- Monthly baling total.
- Total bales produced.

Scheduled entries can be missing or late.

### B. Ad-hoc tasks

Record completed plastic auction or sale transactions.

Fields:
- Station.
- Auction/Sale Date.
- Sale Date.
- Quantity Sold (KG).
- Selling Rate.
- Total Sale Value.
- SRO Number.
- SRO Date.
- Contractor (if applicable).
- Remarks.

An auction is recorded after the event.

IMPORTANT:

Do not create missing or overdue status for an auction that has not been recorded.

Show an informational message:

"An auction that is not recorded is invisible to the system. A monthly NIL return may be required to confirm that no auction took place."

Seed two existing auction records:
- Howrah.
- Barddhaman.

### C. Long-term tasks

Contract management.

Fields:
- Station.
- Contractor Name.
- Contract Period.
- Contract Start Date.
- Contract Expiry Date.
- O&M Contract Details.
- Remarks.

Contract expiry warning must be activity-specific.

Default demonstration lead time: 60 days.

Seed:

Howrah MRF contract expires in 20 days.

Show an amber alert.

Show contract status:
- Active.
- Expiring Soon.
- Expired.

Never treat a long-term contract as a daily entry.

### Additional MRF demonstration scenarios

Serampore:
- Daily infeed = 4 KG.
- Expected range = 40–260 KG.
- Flag as a low outlier.

Rampurhat:
- One carried-forward entry following a CHI reassignment.
- Display a clear reassignment history.

---

# 7. Exception management and workflow

This is one of the most important parts of the application.

Implement a real interactive workflow using localStorage.

Example:

CHI submits 842 KG for Howrah.

↓

System detects an out-of-range figure.

↓

Remark is required.

↓

CHI saves the report.

↓

Entry appears in the Clerk's exception queue.

↓

Clerk reviews the entry.

↓

Clerk chooses:
- Send Back.
- Clear With Note.

↓

If sent back:

- Clerk's reason is saved.
- Entry returns to CHI.
- CHI sees it under Corrections Required.
- CHI can submit a corrected version.
- Original submission remains available in history.

↓

If cleared:

- Clerk's verification note is saved.
- Entry becomes Cleared.
- Officer can see the original entry and clerk's note.
- The officer can review the verification decision.

Do not overwrite original submissions.

Maintain a simple frontend audit trail containing:

- Action.
- User.
- Role.
- Station.
- Activity.
- Timestamp.
- Previous status.
- New status.
- Remark or verification note.

All actions must work in the demo.

---

# 8. Missing and late reporting system

For scheduled activities, calculate reporting status.

Possible statuses:

- Not Due.
- Pending.
- Submitted.
- Late.
- Out of Range.
- Sent Back.
- Resubmitted.
- Cleared.
- Escalated.

Missing detection must be based on expected reporting frequency and due date.

A daily report that has not been submitted by its due time should appear as missing/overdue according to the configured rule.

A late report must remain identifiable as late even after submission.

Ad-hoc tasks must not be included in the missing-report calculation.

Long-term contracts must use expiry alerts instead of missing-entry detection.

---

# 9. Leave management and reassignment

Implement a functional reassignment interface.

Assignment hierarchy:

Railway Station → CHI → Clerk → Officer.

When a CHI moves:
- All their assigned stations move with them.
- Their existing submitted reports remain intact.
- Pending work is clearly tracked.
- Clerk ownership is updated according to the assignment chain.
- Show previous and current assignment.
- Maintain reassignment history.

When a clerk goes on leave:
- Select a replacement clerk.
- Transfer the allocated CHIs.
- Transfer their supervision workload.
- Keep the original reporting history intact.

The treatment of pending work after reassignment must be visible and configurable/marked for client confirmation.

Display a clear reassignment warning before confirming.

---

# 10. Officer station-by-activity grid

Build a compact, professional grid.

Rows:
- Railway stations.

Columns:
- Activity 2 – Solid Waste Generation.
- Activity 9 – MRF Plastic Baling.

Each cell shows a status icon and short label.

Example:

| Station | Solid Waste | MRF Plastic |
|---|---|---|
| Howrah | ⚠ Out of Range | ⚠ Contract Alert |
| Bandel | ◷ Late | ✓ Submitted |
| Serampore | ✓ Submitted | ⚠ Low Infeed |
| Konnagar | ! Missing | ✓ Submitted |
| Rishra | ✓ Submitted | ✓ Submitted |

This is illustrative demo data. Keep actual values and status consistent across the application.

Include filters:
- Station.
- CHI.
- Clerk.
- Activity.
- Status.
- Reporting Date.

Grid must work on mobile through horizontal scrolling or an appropriate alternative.

---

# 11. All 31 EnHM department activities

Create a professional Activity Catalogue.

The catalogue must display all 31 activities provided by the client.

Use the following exact activity names:

1. Solid Waste Management.
2. Solid Waste Generation per Day.
3. ISO Certification.
4. Water Audit.
5. Energy Audit.
6. Septic Tank Cleaning.
7. Rodent Control.
8. Station-wise Platform Area.
9. MRF – Plastic Baling Machine.
10. MRF – Compost Plant.
11. ETP/STP cum Water Recycling Plant.
12. Number of Toilets Provided.
13. VAT Cleaning.
14. SS Twin Bin Dustbins.
15. PBCM.
16. CCTV Camera Monitoring.
17. Daily Passenger Footfall.
18. Station Cleaning Contract.
19. Public Health Activation – Mosquito Control.
20. PVC Dustbins.
21. Atmospheric Water Generator.
22. Air Quality Index.
23. Station and Colony Water Quality Check.
24. Daily Passenger Complaint Register.
25. Number of Passengers Penalized.
26. Illegal Dumping Locations.
27. Encroachment Along Railway Track.
28. Penalty Notices and Public Awareness Posters.
29. Pay-and-Use Toilets.
30. SWM Infrastructure in Division.
31. EnHM Approved Contractors.

Implementation:

- Activity 2: Fully functional.
- Activity 9: Fully functional.
- Remaining activities: Show as "Upcoming – Full workflow not included in this demo".

Do not create invented data-entry forms or fake operational reports for the remaining activities.

Where the client PDF specifies fields, show a small information preview or activity description.

Some important examples:

ISO Certification:
- ISO 9001/2015.
- ISO 14001/2015.
- ISO 45001/2018.
- ISO 50001/2018.
- ISO 5S.
- Certificate number.
- Certification date.
- Surveillance audit dates.
- Expiry date.
- Issuing authority.

Water Audit and Energy Audit:
- Audit date.
- Time period.
- Next audit date.
- Audit authority department.
- Audit personnel.
- Applicable NGT stations.

Septic Tank Cleaning:
- Station-wise sludge cleaning in cubic metres.
- First cleaning date.
- Next cleaning date.
- Contract period.
- Contractor details.
- Contract expiry.
- Number of septic tanks.

Station Cleaning Contract:
- Station name.
- Contractor firm.
- Address.
- Mobile number.
- Contract period.
- Cleaning start date.
- Expiry date.
- Daily frequency cycle.
- Cleaning process.

Cleaning processes listed in the client document:
- Sweeping.
- Dry cleaning.
- Wet cleaning.
- Washing.
- Mopping.
- Cobweb cleaning.
- Rag picking.
- High-pressure jet cleaning.
- Ride-on scrubber dryer.

Keep these descriptions faithful to the department document.

---

# 12. Questions and assumptions panel – VERY IMPORTANT

Create a permanent "Client Discussion / Assumptions" button in the header.

It must be accessible from every role and every page.

When clicked, open a premium right-side drawer.

Title:

"EnHM Requirements – Decisions Pending"

Subtitle:

"These are the assumptions used in this demonstration. Please confirm or correct them."

Create nine decision cards.

Each card must contain:

1. Assumption.
2. What the demo currently does.
3. Question for the railway officer.
4. Optional decision status: Pending / Confirmed / Change Required.

The nine questions:

QUESTION 1 – OUT-OF-RANGE VALUES

Assumption:
Out-of-range values are accepted rather than blocked.

Demo behaviour:
842 KG at Howrah can be saved with a mandatory remark and is flagged for verification.

Question:
"Do you agree that actual figures should be accepted with an explanation instead of rejecting the entry?"

QUESTION 2 – CLERK VISIBILITY

Assumption:
Clerks see exceptions rather than every normal submission.

Demo behaviour:
The Clerk receives missing, late and out-of-range entries.

Question:
"Should clerks see only exceptions, or should they also have access to all normal submissions?"

QUESTION 3 – LATE CALCULATION

Assumption:
Late status is automatically calculated.

Demo behaviour:
The system compares the due date and submission timestamp.

Question:
"Should the late-entry rule be calculated automatically using the submission time?"

QUESTION 4 – ORIGINAL FIGURE PROTECTION

Assumption:
Clerks cannot edit CHI-submitted figures.

Demo behaviour:
The Clerk can only send back or clear an entry with a note.

Question:
"Should the original CHI entry remain unchanged after verification?"

QUESTION 5 – MANDATORY VERIFICATION NOTE

Assumption:
Clearing an exception requires a mandatory note.

Demo behaviour:
The clerk must enter a short explanation before clearing.

Question:
"Should a clerk's verification note be compulsory for every cleared exception?"

QUESTION 6 – AD-HOC AUCTIONS

Assumption:
Unrecorded auctions cannot be automatically identified as missing.

Demo behaviour:
The system displays an informational warning and proposes a monthly NIL return for consideration.

Question:
"Should the department introduce a monthly NIL return for auction activities?"

QUESTION 7 – CONTRACT WARNING

Assumption:
MRF contract expiry alerts begin 60 days before expiry.

Demo behaviour:
A contract expiring in 20 days appears as an alert.

Question:
"Is 60 days the correct advance-warning period for this activity, or should each activity have its own warning period?"

QUESTION 8 – PHOTO COMPRESSION AND ARCHIVING

Assumption:
Photographs will eventually require compression and an archiving policy.

Demo behaviour:
Only mock thumbnails are displayed.

Question:
"What image quality, storage duration and archiving rules should apply to field inspection photographs?"

QUESTION 9 – REASSIGNMENT OF PENDING WORK

Assumption:
Pending work may remain associated with the original assignment during reassignment.

Demo behaviour:
Carried-forward entries are separately labelled and shown in the Clerk's workspace.

Question:
"When a CHI or clerk is reassigned, should pending work stay with the previous owner or automatically move to the new owner?"

Allow the Admin/Officer to mark decisions as confirmed or requiring changes in the demo.

Store these decisions in localStorage.

This panel is NOT decorative. It is a major part of the client presentation.

---

# 13. Additional application screens

Create these screens:

1. Role Selection / Role Switcher.
2. Admin Dashboard.
3. Officer Dashboard.
4. Clerk Dashboard.
5. CHI Mobile Dashboard.
6. Station Directory.
7. Station Details.
8. CHI Directory.
9. Clerk Directory.
10. User Details.
11. Assignment Management.
12. Leave and Reassignment.
13. Activity Catalogue.
14. Solid Waste Daily Reporting.
15. MRF Plastic Baling Reporting.
16. Exception Queue.
17. Verification History.
18. Send-back Corrections.
19. Contract Alerts.
20. Audit Trail.
21. Reports Overview – demo preview only.
22. Questions and Assumptions.
23. Demo Settings.

Use role-specific navigation and permissions.

Do not show administrative functions to CHIs.

Do not show other CHIs' assigned station data to a clerk.

---

# 14. Header and navigation

Header must contain:

- Indian Railways EnHM logo placeholder (do not use an unofficial railway emblem).
- Application name.
- Eastern Railway – Howrah Division.
- Current role.
- Current demo user.
- Sample Data indicator.
- Notification/alert icon for the demo.
- Questions & Assumptions button.
- Reset Demo Data option.

Provide a highly convenient role switcher.

For the client meeting, I must be able to switch between:

- Admin.
- Officer.
- Clerk 1.
- Clerk 2.
- CHI 1.
- CHI 2.
- CHI 3.

No login screen is required.

The role switcher replaces authentication for this prototype.

---

# 15. Reports and operational summaries

Create a Reports Overview section for presentation purposes.

Show:
- Station-wise reporting completion.
- Activity-wise submission status.
- Missing and late entries.
- Out-of-range entries.
- Clerk verification status.
- Contract expiry overview.
- Reassignment history.

Use compact tables and small charts only where they add value.

Do not create elaborate trend-analysis dashboards.

Clearly label these as frontend demonstration previews, not official railway reports.

Do not add real PDF/Excel export functionality unless it can be implemented entirely in the frontend without a backend.

---

# 16. localStorage architecture

This is a frontend-only demonstration.

Implement a central state management system using React Context or another lightweight approach.

Persist these entities in localStorage:

- Users.
- Roles.
- Stations.
- CHI assignments.
- Clerk assignments.
- Activities.
- Reporting ranges.
- Daily reports.
- MRF daily entries.
- Auction records.
- Contract details.
- Verification records.
- Send-back reasons.
- Clerk notes.
- Reassignment history.
- Audit trail.
- Client assumptions.

Create a consistent TypeScript data model.

Use stable IDs and timestamps.

Seed initial data only when the localStorage keys do not already exist.

Create a Reset Demo Data function with confirmation.

Do not reset all data simply because the browser refreshes.

All role-specific screens must use the same shared state.

Example:

When CHI 1 submits a report:
- It appears in the relevant clerk's queue.
- It appears in the officer's overview.
- The Admin can see it division-wide.

When a clerk clears an entry:
- The status updates everywhere.
- The verification note appears in the Officer view.
- The original submitted figure remains unchanged.

When a clerk sends back an entry:
- The CHI receives the correction request.
- The Clerk sees the pending correction.
- The Officer sees the unresolved exception.

These interactions must work immediately without page refresh.

---

# 17. UI interaction and quality requirements

Every visible button must perform a meaningful action.

Implement:
- Add.
- Edit.
- View.
- Deactivate.
- Search.
- Filter.
- Sort.
- Pagination where appropriate.
- Form validation.
- Modal confirmation.
- Status updates.
- Reassignment.
- Role switching.
- Report submission.
- Verification.
- Send back.
- Clearing.
- Audit history.
- Assumption status changes.
- Reset demo.

Show professional toast notifications for successful and unsuccessful actions.

Provide loading and empty states where appropriate.

Use proper confirmation dialogs for destructive actions.

Make all forms keyboard accessible.

Ensure:
- Visible keyboard focus.
- Accessible labels.
- Reduced-motion support.
- Good colour contrast.
- Readable tables.
- Icon plus text status.
- Responsive dialogs and drawers.

Do not use fake buttons that do nothing.

Do not use placeholder links that lead nowhere.

Do not show random or inconsistent values across screens.

---

# 18. Presentation demonstration flow

Prepare the sample data and navigation so I can demonstrate the complete system to a railway officer in this sequence.

DEMO 1 – OFFICER

Open Officer Dashboard.

Show:
- 11 of 199 stations.
- Pending exceptions.
- Howrah out-of-range reading.
- Konnagar missing entry.
- Bandel late entry.
- Serampore MRF low infeed.
- Contract expiring in 20 days.
- Cleared by Clerks section.
- Station activity grid.

Switch between Worklist First and Grid First.

DEMO 2 – CHI

Switch to CHI 1.

Open Konnagar's missing report.

Enter a new dry waste figure.

Demonstrate:
- Expected range.
- Dynamic out-of-range validation.
- Mandatory remark.
- Photograph thumbnail.
- Submission.

Save the report.

DEMO 3 – CLERK

Switch to the clerk supervising CHI 1.

Show the newly submitted report.

Demonstrate:
- Exception queue.
- Submitted value.
- Expected range.
- CHI remark.

Clear it with a mandatory note.

Then demonstrate Send Back on another sample exception.

DEMO 4 – OFFICER

Switch back to Officer.

Show:
- Cleared entry.
- Clerk verification note.
- Returned entry.
- Pending correction.
- Updated audit trail.

DEMO 5 – ADMIN

Switch to Admin.

Show:
- User management.
- Station management.
- CHI assignment.
- Clerk assignment.
- Leave management.
- Workload reassignment.
- Station-specific reporting ranges.

DEMO 6 – CLIENT REQUIREMENTS

Open the Questions and Assumptions drawer.

Go through the nine pending decisions.

This should make the meeting interactive and help the officer confirm the actual workflow.

---

# 19. Important scope restrictions

Do NOT implement:

- Backend.
- Database.
- API integrations.
- Real login/authentication.
- Real SMS/email notifications.
- Real photo cloud storage.
- Real offline synchronization.
- All 199 railway stations as seeded records.
- Fully functional reporting for all 31 activities.
- Official railway branding or unofficial government seals.
- Unverified railway department rules.
- Invented official data.

The remaining 29 activities should be presented as future modules.

The application must clearly identify demo-only features.

Do not claim this application is officially deployed or approved by Indian Railways.

---

# 20. Final implementation expectations

Build the actual application, not just a design concept.

Prioritize in this order:

1. Application shell and role switching.
2. Shared localStorage state.
3. CHI mobile experience.
4. Solid Waste daily reporting.
5. MRF Plastic Baling reporting.
6. Clerk exception workflow.
7. Officer dashboard and grid.
8. Admin management and reassignment.
9. Activity catalogue.
10. Questions and Assumptions drawer.
11. Responsive optimization.
12. Final visual polish.

Do not stop after creating the dashboard.

Make sure the full demonstration workflow works from CHI submission through clerk verification to officer review.

Use realistic railway operations terminology throughout the interface.

Keep all sample data internally consistent.

The final result should look like a premium enterprise-grade Indian Railways EnHM software product that is ready for a professional client presentation.

Most importantly, focus on operational clarity, role-based accountability, data accuracy, exceptional-case management and a seamless mobile experience for field CHIs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/027602e5-7fda-4a43-b664-43f46268b13b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
