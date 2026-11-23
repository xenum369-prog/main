# Complete Maintenance Management Ecosystem
## Master Build Prompt for GitHub Copilot

**Purpose:** Use this single document as the master specification and execution guide for planning, building, testing, documenting, and preparing a complete Maintenance Management Ecosystem inside the currently opened repository.

**Primary development tool:** GitHub Copilot in VS Code.
**Working style:** Plan first, then implement in controlled phases using Copilot Agent Mode.
**Important:** This document is the single source of truth for the requested product scope. Do not require the user to provide another prompt, requirements file, or architecture document before beginning. You may create supporting project documentation as implementation deliverables, but this master prompt remains the authoritative specification.

---

# 1. Your Role and Overall Mission

Act as a senior cross-functional product and engineering team. Work with the standards and judgment expected from:

- Product Manager and Business Analyst
- Enterprise Solution Architect
- Senior Full-Stack Engineer
- Database Architect
- UI/UX Designer
- QA and Test Automation Engineer
- DevOps and Deployment Engineer
- Application Security Engineer
- Technical Writer and Trainer

Your mission is to turn the existing repository into a complete, reliable, secure, maintainable, production-oriented Maintenance Management Ecosystem.

Do not treat this as a quick CRUD demo or a collection of disconnected screens. Build a coherent business application with consistent workflows, permissions, validation, auditability, reporting, and a polished user experience.

First understand the existing repository. Preserve useful existing code and conventions. Do not replace the project with a new stack simply because you prefer it. Do not delete or rewrite working functionality without understanding its purpose and explaining why the change is needed.

## Core execution principles

1. Inspect before changing.
2. Plan before implementation.
3. Build in small, testable phases.
4. Keep the application runnable after every phase.
5. Prefer secure, explicit, maintainable solutions over shortcuts.
6. Do not invent completed features, test results, integrations, or deployment outcomes.
7. Never silently discard user data or existing project functionality.
8. Do not hard-code secrets, credentials, tokens, or environment-specific values.
9. Do not leave important actions as decorative buttons or nonfunctional placeholders.
10. If a requirement is ambiguous, identify the ambiguity, recommend a sensible default, and ask only when the decision materially affects architecture, data, cost, security, or business behavior.
11. If a requested feature cannot be completed safely in the current phase, document the reason and provide a clear dependency or next step.
12. Do not mark a phase complete until its acceptance criteria and relevant tests pass.

---

# 2. How to Work in GitHub Copilot

## Stage A: Repository audit and planning

Start in **Copilot Plan Mode** when it is available. If Plan Mode is not available in the user's Copilot version, perform the same read-only planning process in Copilot Chat.

During this stage:

- Inspect the repository structure and identify the actual application stack.
- Read the package manifests, dependency files, configuration, routes, migrations, models, services, tests, and existing documentation.
- Identify the current application entry points and how it is started.
- Identify the database and current schema.
- Identify authentication, authorization, roles, and permission handling.
- Identify existing UI components, design system, styling conventions, and localization approach.
- Identify existing integrations, background jobs, queues, file storage, and notification systems.
- Identify incomplete, duplicated, risky, or broken areas.
- Identify existing tests and how to run them.
- Check the current Git state. Do not overwrite or discard uncommitted user work.
- Identify secrets or sensitive configuration accidentally committed, but do not print secret values in the plan.
- Determine which requirements can reuse existing functionality and which require new implementation.

Produce a practical implementation plan in the Copilot conversation before editing files. The plan must include:

1. Current repository architecture and technology stack.
2. Existing features that should be preserved.
3. Gaps between the current application and this specification.
4. Proposed architecture and major components.
5. Data model and relationship changes.
6. Security and permission considerations.
7. UI/UX and accessibility approach.
8. Testing strategy.
9. Ordered implementation phases and dependencies.
10. Risks, assumptions, and decisions requiring user confirmation.

Do not make code changes during the audit unless the user explicitly asks you to.

## Stage B: Implementation

After the plan is reviewed and approved, switch to **Copilot Agent Mode** and implement the approved plan.

- Work on one phase or vertical slice at a time.
- Before editing, state the objective and the files or areas likely to change.
- Make the smallest coherent change that delivers the feature.
- Run relevant tests, linting, formatting, type checks, and build commands after changes.
- Fix regressions introduced by your work before moving on.
- Update documentation and implementation status as work progresses.
- Summarize what changed, what was tested, what passed, what failed, and what remains.
- Do not claim success when a command was not run or a result was not verified.

If context is lost or a new session begins, inspect the repository and its current status documentation before continuing. Do not restart completed work or assume that a previous plan was implemented exactly.

## Stage C: Progress tracking

Maintain a clear implementation record in the repository, for example:

- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/SETUP_AND_INSTALLATION.md`
- `docs/USER_GUIDE.md`
- `docs/ADMIN_GUIDE.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`

These are implementation deliverables, not prerequisites. Create or update them only as the project reaches the relevant stage. Keep them accurate and concise. Do not create empty documentation files merely to claim they exist.

The status document should contain:

- Phase and feature name
- Status: Not started / In progress / Blocked / Implemented / Verified
- Files or modules changed
- Tests executed and results
- Known limitations
- Next action

---

# 3. Product Vision

Build a unified Maintenance Management Ecosystem for organizations that need to manage assets, maintenance operations, service requests, technicians, work orders, inventory, purchasing, costs, schedules, inspections, vendors, and operational reporting.

The system should provide one reliable source of operational information and support the full maintenance lifecycle:

1. Register and classify assets.
2. Track asset locations, ownership, condition, and history.
3. Receive maintenance requests and incidents.
4. Review, approve, reject, prioritize, and assign requests.
5. Create and manage work orders.
6. Schedule preventive and corrective maintenance.
7. Assign technicians, teams, and required resources.
8. Record diagnosis, labor, materials, activities, and completion details.
9. Manage spare parts and inventory consumption.
10. Handle purchasing and vendor-related workflows where included in the approved scope.
11. Perform inspections and capture results.
12. Track downtime, costs, service quality, and maintenance performance.
13. Generate operational reports and management dashboards.
14. Preserve an auditable history of important actions.

The system must be modular enough to support future growth without turning every feature into a separate, disconnected application.

---

# 4. Users, Roles, and Access Control

Design role-based access control around real business responsibilities. Do not rely on hiding buttons in the frontend as the only security mechanism. Every protected action must also be authorized on the server.

Potential roles include the following. Map them to the repository's existing roles where appropriate rather than creating duplicate roles unnecessarily.

## 4.1 System Administrator

- Manage system configuration.
- Manage users, roles, and permissions.
- Configure departments, locations, categories, priorities, and workflows.
- View and manage all records within the organization.
- Review audit logs.
- Manage integrations and system settings.
- Access administrative reports.

## 4.2 Maintenance Manager

- View maintenance operations.
- Review and approve maintenance requests.
- Create, prioritize, assign, and schedule work orders.
- Manage technicians and maintenance teams.
- Review costs, downtime, and performance.
- Monitor preventive maintenance compliance.
- Access maintenance reports.

## 4.3 Maintenance Supervisor

- Coordinate daily maintenance activities.
- Assign and reassign work orders within authorized scope.
- Review technician updates.
- Verify work completion.
- Escalate delays, safety issues, and resource shortages.
- Monitor team workload.

## 4.4 Technician

- View assigned work orders.
- Accept or acknowledge assignments where the workflow requires it.
- Update work status.
- Record diagnosis, work performed, labor time, parts used, readings, and notes.
- Upload permitted evidence such as images or documents.
- Record completion details.
- Report follow-up work or safety concerns.

Technicians must not be able to alter financial, administrative, or other users' records unless explicitly permitted.

## 4.5 Requester / Employee

- Submit maintenance requests.
- Select an asset or location when permitted.
- Describe the issue and provide supporting attachments.
- View the status of their own requests.
- Add permitted comments or information.
- Receive status notifications.

## 4.6 Storekeeper / Inventory Officer

- Manage spare parts and stock records.
- Receive and issue inventory.
- Record stock adjustments with reasons and authorization.
- Review reservations and work-order material requirements.
- Monitor reorder levels and stock movements.

## 4.7 Procurement Officer

- Manage purchase requests and purchase orders where included.
- Coordinate suppliers and quotations.
- Track order status and received quantities.
- Link purchased items to inventory records.

## 4.8 Management / Read-only User

- View dashboards and authorized reports.
- Review performance, costs, asset availability, and operational KPIs.
- Cannot modify operational records unless granted additional permissions.

## Authorization requirements

- Apply least privilege.
- Deny access by default.
- Enforce permissions on every backend route, API operation, file access, and sensitive action.
- Support organization, site, department, or location scoping if the existing business model requires it.
- Prevent users from viewing records outside their permitted scope.
- Validate ownership and assignment on the server.
- Protect administrative endpoints separately from ordinary authenticated endpoints.
- Avoid relying on role names alone when granular permissions are already supported.
- Provide a clear access-denied experience without leaking protected record details.
- Test both allowed and denied access for every major role.

---

# 5. Core Functional Modules

Implement modules in a coherent sequence and integrate them through shared data models and workflows.

## 5.1 Dashboard and Overview

Provide role-aware dashboards with useful operational summaries, not decorative charts.

Possible dashboard information:

- Open maintenance requests
- Pending approvals
- Open work orders
- Overdue work orders
- Work orders due today or this week
- Preventive maintenance due soon
- Preventive maintenance overdue
- Assets out of service
- Critical asset incidents
- Technician workload
- Parts below reorder level
- Maintenance costs for a selected period
- Downtime trends
- Work-order completion trends
- Mean time to repair (MTTR), where data supports it
- Mean time between failures (MTBF), where data supports it
- Preventive maintenance compliance
- Work-order backlog

Requirements:

- Filter by date range and authorized organizational scope.
- Show clear definitions for KPIs.
- Use real database values; never use fabricated sample values in production dashboards.
- Handle empty datasets and missing historical information.
- Avoid misleading calculations when the required data is incomplete.
- Provide links from summary cards and charts to the relevant filtered records.
- Ensure dashboard queries are efficient and appropriately indexed.

## 5.2 Asset Management

Create a structured asset register.

Potential fields, adapted to the actual business requirements:

- Asset ID / unique asset code
- Asset name
- Description
- Asset category and subcategory
- Asset type
- Manufacturer
- Model
- Serial number
- Barcode or QR identifier
- Site, building, floor, room, or location
- Department or cost center
- Responsible person or owner
- Installation or commissioning date
- Purchase date and purchase cost, if tracked
- Warranty start and end dates
- Supplier or vendor
- Criticality
- Current condition
- Operational status
- Parent asset and component relationships
- Technical specifications
- Manuals, certificates, images, and attachments
- Notes and custom attributes where justified

Asset capabilities:

- Create, view, edit, archive, and search assets according to permissions.
- Support unique asset identifiers.
- Filter by status, location, category, criticality, and other useful fields.
- Display asset details and maintenance history.
- Link requests, work orders, inspections, costs, parts, and documents to assets.
- Support asset hierarchies when useful.
- Track status changes with timestamps and actors.
- Prevent accidental deletion of assets with operational history. Prefer archival or deactivation.
- Provide import/export only with validation, authorization, and error reporting.
- Consider QR/barcode support as a practical way to open an asset record, if supported by the stack.

Do not invent mandatory asset fields that the organization cannot reasonably provide. Use sensible required fields and optional technical metadata.

## 5.3 Maintenance Requests / Service Requests

Provide a request intake workflow for employees and authorized users.

A request should support:

- Unique request number
- Requester
- Submission date and time
- Asset, if known
- Location
- Category
- Subject and detailed description
- Priority or urgency
- Impact or operational consequence
- Attachments
- Status
- Assigned reviewer or department
- Related work order
- Comments and activity history

Suggested lifecycle:

`Draft → Submitted → Under Review → Approved / Rejected → Converted to Work Order → Closed`

The exact statuses may be adapted to existing conventions, but transitions must be explicit and validated.

Requirements:

- Validate required fields.
- Generate unique request references safely.
- Prevent unauthorized users from viewing or modifying other users' requests.
- Support review, approval, rejection, and rejection reasons.
- Record who performed each transition and when.
- Notify the requester when meaningful status changes occur.
- Prevent duplicate work orders from being created through repeated clicks or retries.
- Preserve the original request when converting it to a work order.
- Allow authorized users to create a work order directly when business rules permit.
- Provide filters for status, priority, date, asset, location, and requester.

## 5.4 Work Order Management

Work orders are a central operational module. Build them as a complete workflow, not a simple status field.

A work order may include:

- Unique work-order number
- Source request, if applicable
- Asset and location
- Work type: corrective, preventive, inspection, emergency, predictive, or other configured types
- Title and detailed scope
- Priority and criticality
- Reported issue
- Diagnosis
- Planned start and due date
- Actual start and completion time
- Assigned technician or team
- Supervisor
- Required skills or certifications, if supported
- Estimated labor
- Actual labor
- Required parts and quantities
- Reserved and consumed parts
- Tools and external resources
- Safety instructions and permits, where relevant
- Attachments and evidence
- Work performed
- Findings and measurements
- Completion notes
- Follow-up recommendations
- Downtime and cost information
- Verification and approval details
- Status and full activity history

Suggested lifecycle:

`Draft → Pending Approval → Approved → Scheduled → Assigned → In Progress → On Hold → Completed → Verified → Closed`

Not every organization needs every state. Select a practical state machine and document it.

Workflow rules:

- Define permitted transitions.
- Enforce transitions on the backend.
- Require reasons for rejection, cancellation, or putting work on hold where appropriate.
- Require completion details before completion.
- Require verification or approval for work types that need it.
- Prevent closing a work order while required tasks, materials, or evidence remain incomplete.
- Track who changed the status and when.
- Preserve the distinction between planned and actual dates and labor.
- Support reassignment with an audit record.
- Handle overdue and escalated work orders.
- Avoid deleting historical work orders.
- Prevent duplicate material consumption or duplicate completion submissions.
- Make status and action availability clear in the UI.

## 5.5 Preventive Maintenance (PM)

Support planned maintenance based on schedules and asset requirements.

Potential scheduling methods:

- Calendar-based: daily, weekly, monthly, quarterly, annually, or custom interval.
- Meter-based: runtime hours, cycles, distance, or another supported meter.
- Usage-based where the data source is available.
- Date and meter combinations where business rules require them.

A preventive maintenance plan should support:

- Plan name and reference
- Asset or asset group
- Maintenance task/checklist
- Frequency or trigger
- Next due date or meter value
- Estimated duration
- Assigned team or role
- Priority
- Required parts and tools
- Instructions and safety notes
- Active/inactive state
- Generation history
- Last completion and next planned occurrence

Requirements:

- Generate due work orders reliably.
- Avoid generating duplicate work orders for the same occurrence.
- Handle missed or overdue schedules.
- Recalculate the next due occurrence after completion according to the configured rule.
- Support pausing and resuming a plan.
- Record schedule changes.
- Make upcoming and overdue maintenance visible.
- Do not generate an unbounded number of future work orders.
- Use a reliable scheduler or background job mechanism when available.
- Make the generation process safe to retry.

## 5.6 Maintenance Checklists and Inspections

Support reusable templates for inspections and maintenance tasks.

Checklist capabilities:

- Template name and description
- Applicable asset categories or asset types
- Ordered checklist items
- Required or optional responses
- Response types such as pass/fail, yes/no, text, number, date, or selection
- Acceptable ranges for numeric readings where relevant
- Required comments for failed or out-of-range results
- Evidence attachments where appropriate
- Template versioning or controlled updates

Inspection capabilities:

- Create an inspection from a template.
- Link it to an asset, work order, location, and inspector.
- Record date, time, and results.
- Identify failed checks.
- Create a follow-up request or work order from a failed result.
- Preserve completed inspection results if the template changes later.
- Track who performed and reviewed the inspection.

## 5.7 Technician and Team Management

Maintain technician and team records appropriate to the application.

Potential information:

- User account link
- Employee code
- Team
- Department
- Skills and specialties
- Certifications and expiry dates
- Availability or working schedule, if required
- Contact information according to privacy policy
- Active/inactive status

Capabilities:

- Assign work orders to individuals or teams.
- View workload and assignments.
- Filter by skill, team, and availability where the data exists.
- Avoid assigning inactive users.
- Warn about scheduling conflicts where reliable schedule data is available.
- Keep employee personal data limited to legitimate operational needs.
- Do not expose sensitive HR information in maintenance screens.

## 5.8 Inventory and Spare Parts

Build inventory around traceable stock movements rather than directly editing a quantity without history.

Potential part fields:

- Part number / SKU
- Part name and description
- Category
- Unit of measure
- Manufacturer
- Compatible assets or models
- Storage location
- Minimum and maximum stock
- Reorder point
- Current available quantity
- Reserved quantity
- Unit cost, if authorized
- Supplier
- Active/inactive status

Inventory operations:

- Receive stock
- Issue stock
- Reserve stock for a work order
- Release reservations
- Transfer between stores or locations
- Record authorized adjustments
- Return unused parts
- Track damaged or quarantined stock
- Review stock movement history
- Identify low-stock and out-of-stock parts

Critical rules:

- Every stock change must create a traceable movement record.
- Use database transactions for stock operations.
- Prevent negative stock unless an explicit business rule allows it.
- Prevent duplicate issue operations on retries.
- Validate available quantity before issuing.
- Distinguish on-hand, reserved, and available quantities.
- Reconcile work-order material usage with inventory movements.
- Apply decimal precision and units consistently.
- Restrict cost visibility to authorized roles.
- Do not delete parts that have stock or transaction history; archive them instead.

## 5.9 Purchasing and Suppliers

Implement this module if it fits the repository's scope and the organization needs procurement within the maintenance system.

Potential supplier information:

- Supplier code
- Company name
- Contact person
- Email and phone
- Address
- Tax or registration information where legally required
- Supplied categories or parts
- Status
- Notes and attachments

Potential purchasing workflow:

`Purchase Request → Review / Approval → Quotation → Purchase Order → Partially Received / Received → Closed`

Requirements:

- Link purchase requests to parts, work orders, and stock shortages.
- Track quantities, prices, taxes, delivery dates, and received quantities where applicable.
- Support partial receiving.
- Do not mark an order fully received until quantities are reconciled.
- Record supplier and purchasing status history.
- Restrict financial information.
- Avoid building a full accounting system unless explicitly required.
- Clearly document any integration boundary with external accounting or ERP software.

## 5.10 Vendor and External Service Management

Where external maintenance providers are used, support:

- Vendor records
- Service categories
- Contacts
- Contracts or service agreements
- Contract validity dates
- Response and resolution expectations
- Linked work orders
- Service reports and attachments
- Cost records
- Performance notes

Restrict contract and cost information to authorized users.

## 5.11 Downtime and Cost Tracking

Track operational impact without pretending that incomplete data is exact.

Possible data:

- Downtime start and end
- Downtime duration
- Reason and category
- Production or service impact
- Labor cost
- Parts cost
- External service cost
- Other approved costs
- Total cost calculation
- Related asset and work order

Requirements:

- Clearly define how durations and costs are calculated.
- Distinguish estimated from actual values.
- Avoid double-counting costs.
- Preserve original transaction records.
- Allow authorized corrections with reasons and audit history.
- Make currency and time-zone assumptions explicit.
- Do not calculate MTBF, MTTR, or availability from incomplete or incompatible data without warning.

## 5.12 Notifications and Communication

Provide configurable notifications for meaningful events.

Potential events:

- Request submitted
- Request approved or rejected
- Work order assigned or reassigned
- Work order approaching due date
- Work order overdue
- Work order placed on hold
- Work order completed or verified
- Preventive maintenance due or overdue
- Critical inspection failure
- Stock below reorder level
- Purchase request approved or rejected

Requirements:

- Use the notification mechanisms already present in the repository where possible.
- Support in-app notifications if the stack allows.
- Add email notifications only with properly configured provider credentials.
- Do not expose confidential details in email subject lines or notification previews.
- Avoid sending duplicate notifications on retries.
- Allow users to mark notifications as read.
- Record delivery status where appropriate.
- Provide graceful behavior when a notification provider is unavailable.
- Do not claim an email was delivered unless the provider confirms it.

## 5.13 Documents and Attachments

Support controlled file attachments for assets, requests, work orders, inspections, suppliers, and other relevant records.

Security requirements:

- Validate file type and size on the server.
- Do not trust the client-provided MIME type or filename.
- Generate safe storage names.
- Prevent path traversal and executable uploads.
- Store files outside the public web root or use private object storage where possible.
- Enforce authorization when downloading or previewing files.
- Avoid exposing direct public URLs for private documents.
- Apply malware scanning if the environment provides it.
- Restrict allowed extensions to business-required formats.
- Record uploader, upload date, and linked record.
- Handle deletion and retention according to audit and business rules.
- Do not allow an attachment to bypass the permissions of its parent record.

## 5.14 Search, Filtering, and Data Export

Provide practical search and filtering across major modules.

Requirements:

- Server-side filtering and pagination for large datasets.
- Consistent sorting and filter behavior.
- Search by human-readable identifiers and relevant fields.
- Validate filter parameters.
- Avoid unbounded queries.
- Preserve filter state when navigating where appropriate.
- Export only records the current user is authorized to access.
- Protect exports from formula injection in spreadsheet-compatible formats.
- Log sensitive exports where appropriate.
- Clearly communicate when a result set is limited.

## 5.15 Reports and Analytics

Provide operational reports that are traceable to source records.

Potential reports:

- Work orders by status, priority, type, team, and period
- Requests by status, category, and department
- Overdue work orders
- Preventive maintenance compliance
- Upcoming PM schedule
- Asset maintenance history
- Asset downtime
- Maintenance cost by asset, category, department, and period
- Technician workload and completion
- Spare-part consumption
- Inventory valuation where permitted
- Low-stock and reorder report
- Vendor performance
- Inspection failures
- MTTR and MTBF where the underlying data is sufficient

Requirements:

- Use consistent definitions and documented formulas.
- Support date range and authorized scope filters.
- Respect permissions and organizational boundaries.
- Make reports usable on common screen sizes.
- Use server-side aggregation for large datasets.
- Avoid presenting false precision.
- Include generated date/time and applied filters in exports.
- Ensure exported data matches the visible filtered result.

---

# 6. Workflow and Business Rules

Create a clear workflow model shared across the application.

## General rules

- Every major entity must have a clear lifecycle.
- State changes must be validated on the backend.
- Important transitions must record actor, timestamp, previous state, new state, and reason where relevant.
- Prevent invalid transitions and repeated operations.
- Use transactions when a workflow changes multiple related records.
- Keep a history of operationally important changes.
- Make the next permitted action obvious to the user.
- Do not allow the frontend to decide whether a user is authorized.
- Define behavior for cancellation, rejection, reopening, and archival.
- Preserve links between requests, work orders, assets, inventory, inspections, and costs.

## Example request-to-work-order flow

1. Requester submits a request.
2. System validates required information and creates a unique reference.
3. Authorized reviewer examines the request.
4. Reviewer approves, rejects, or requests more information.
5. Approved request is converted to a work order.
6. Work order is prioritized and assigned.
7. Technician records progress, diagnosis, labor, and material usage.
8. Technician submits completion details.
9. Supervisor verifies the work if required.
10. Work order is closed.
11. Asset history, inventory, costs, and reporting data are updated consistently.
12. Requester receives an appropriate notification.

Do not implement this as a collection of unrelated status updates. Enforce the workflow and its side effects consistently.

---

# 7. UI/UX and Design Requirements

Create a professional, modern enterprise interface that is clear and efficient for daily operational use.

## Design principles

- Prioritize clarity, speed, and consistency.
- Use a consistent spacing, typography, color, border, and component system.
- Avoid visual clutter and excessive gradients, shadows, animations, or decorative cards.
- Use clear visual hierarchy.
- Make tables and forms practical for real business data.
- Use status indicators consistently.
- Make destructive actions visually distinct and require confirmation.
- Provide useful empty, loading, success, validation, and error states.
- Do not use fake charts or placeholder metrics in real screens.
- Avoid horizontal overflow on mobile.
- Ensure the UI remains usable at common desktop, tablet, and mobile widths.

## Navigation

Organize navigation by business task. Possible sections:

- Overview
- Requests
- Work Orders
- Preventive Maintenance
- Assets
- Inspections
- Technicians / Teams
- Inventory
- Purchasing
- Suppliers / Vendors
- Reports
- Notifications
- Administration / Settings

Adapt the menu to actual permissions. Do not show inaccessible modules as if they were available.

## Tables and lists

- Use readable column labels.
- Support useful filters, sorting, and pagination.
- Keep important identifiers and statuses visible.
- Provide row actions that respect permissions.
- Avoid rendering huge datasets in the browser.
- Include responsive behavior for narrow screens.
- Use confirmation for destructive or irreversible actions.

## Forms

- Group related fields logically.
- Clearly mark required fields.
- Provide inline validation and helpful error messages.
- Preserve entered values after recoverable validation errors.
- Avoid asking for the same information repeatedly.
- Use accessible labels and keyboard navigation.
- Provide sensible defaults only when they are safe and unambiguous.
- Explain fields that have important business implications.

## Accessibility

- Use semantic HTML and accessible controls.
- Support keyboard navigation.
- Provide visible focus indicators.
- Use sufficient color contrast.
- Do not communicate status through color alone.
- Associate validation messages with the relevant fields.
- Provide accessible names for icon-only buttons.
- Respect reduced-motion preferences.
- Test important flows without relying on a mouse.

## Arabic and English localization

The application should be prepared for bilingual use where the existing stack supports it.

- Support English and Arabic UI text.
- Support right-to-left layout for Arabic and left-to-right layout for English.
- Ensure navigation, forms, tables, dialogs, and icons behave correctly in RTL.
- Avoid hard-coded text inside components.
- Use the project's localization framework if one exists.
- Keep date, time, number, and currency formatting locale-aware.
- Do not reverse technical identifiers, serial numbers, URLs, or codes in RTL layouts.
- Ensure mixed Arabic and English content remains readable.
- Use clear, natural translations rather than machine-like literal wording.
- Do not assume the user's preferred default language without checking existing project settings or asking if the choice materially affects the application.

---

# 8. Data Architecture and Database Requirements

Inspect the current database and ORM before proposing schema changes.

## Data design principles

- Use normalized relational structures where appropriate.
- Avoid duplicated sources of truth.
- Define primary keys, foreign keys, unique constraints, and indexes.
- Use appropriate data types and precision.
- Define nullability intentionally.
- Use consistent naming conventions.
- Store timestamps consistently, preferably in UTC, and display them in the user's configured time zone.
- Define deletion behavior explicitly.
- Use soft deletion or archival for records with business history.
- Keep transaction and audit records immutable where practical.
- Avoid storing derived values if they can be reliably calculated, unless performance or historical snapshots require them.
- Document important calculated fields and their source.

## Expected conceptual entities

The final schema should be based on the repository and approved architecture. Consider the following conceptual entities where appropriate:

- User
- Role
- Permission
- UserRole / RolePermission
- Organization / Site / Department / Location
- Asset
- AssetCategory
- AssetDocument
- AssetStatusHistory
- MaintenanceRequest
- RequestComment
- RequestAttachment
- WorkOrder
- WorkOrderAssignment
- WorkOrderTask
- WorkOrderStatusHistory
- WorkLog / LaborEntry
- WorkOrderPart
- PreventiveMaintenancePlan
- PreventiveMaintenanceOccurrence
- ChecklistTemplate
- ChecklistTemplateVersion
- ChecklistItem
- Inspection
- InspectionResult
- TechnicianProfile
- Team
- Skill / Certification
- InventoryItem
- InventoryLocation
- InventoryMovement
- StockReservation
- Supplier
- PurchaseRequest
- PurchaseOrder
- GoodsReceipt
- VendorContract
- DowntimeRecord
- CostRecord
- Notification
- Attachment / FileMetadata
- AuditLog
- SystemSetting

Do not create every table automatically. Create only the entities required by the approved architecture and avoid redundant models.

## Migrations and data integrity

- Use version-controlled migrations.
- Never modify production schema manually as a substitute for migrations.
- Review migration impact before execution.
- Back up data before destructive migrations.
- Prefer additive, backward-compatible migrations.
- Avoid dropping or renaming columns without a safe migration plan.
- Include rollback strategy where supported.
- Test migrations against a representative development database.
- Do not run destructive commands against production.
- Use foreign keys and constraints to enforce integrity.
- Handle concurrent updates safely.
- Use transactions for multi-record operations.

## Identifiers

- Use stable internal primary keys.
- Use separate human-readable reference numbers for requests, work orders, assets, and purchasing documents where needed.
- Ensure references remain unique under concurrent creation.
- Do not generate identifiers using unsafe `count + 1` logic.
- Do not expose sequential database IDs as authorization tokens.

---

# 9. Application Architecture and Code Quality

Follow the architecture already established by the repository unless the audit demonstrates a strong reason to change it.

## General standards

- Keep responsibilities separated.
- Keep business rules out of presentation components.
- Use reusable components without overengineering.
- Use services or domain modules for complex business operations where appropriate.
- Keep controllers and route handlers focused.
- Validate input at system boundaries.
- Use typed contracts where the language and stack support them.
- Handle errors consistently.
- Avoid duplicated business logic.
- Avoid giant components and giant service files.
- Avoid unnecessary dependencies.
- Remove dead code only after verifying it is unused.
- Follow the repository's linting and formatting conventions.
- Keep configuration environment-specific.
- Use clear names and comments for non-obvious business rules.
- Do not add comments that merely repeat the code.

## API requirements

If the application exposes an API:

- Use consistent route and response conventions.
- Validate request bodies, query parameters, and path parameters.
- Apply authentication and authorization.
- Use appropriate HTTP status codes.
- Avoid exposing stack traces or internal errors.
- Paginate collection endpoints.
- Define stable error response shapes.
- Prevent mass assignment.
- Rate-limit sensitive or abuse-prone endpoints where appropriate.
- Document API behavior and authentication.
- Validate uploaded files independently from normal JSON input.

## Frontend requirements

- Reuse existing UI framework and component conventions.
- Keep server state and local UI state appropriately separated.
- Avoid unnecessary duplicate API requests.
- Provide loading, empty, and error states.
- Avoid optimistic updates for operations where failure could corrupt business understanding.
- Refresh or invalidate affected data after mutations.
- Prevent repeated submissions where possible, while keeping backend operations idempotent.
- Keep business calculations consistent with backend results.
- Do not rely on client-side validation alone.

---

# 10. Security and Privacy Requirements

Treat the application as business-critical software containing operational, employee, supplier, and potentially financial information.

## Authentication

- Preserve the existing authentication system if it is secure and suitable.
- Use established password hashing algorithms and libraries.
- Never store plaintext passwords.
- Protect password reset and account recovery flows.
- Apply session expiration and secure cookie settings appropriate to the deployment.
- Use multi-factor authentication if supported and required by the business.
- Protect login and recovery endpoints against abuse.
- Do not invent or hard-code administrator credentials.

## Authorization

- Enforce permissions server-side.
- Apply record-level and organization-level scoping.
- Prevent insecure direct object references.
- Test unauthorized access to records and attachments.
- Recheck permissions for background jobs and exports.
- Do not trust user IDs, role names, or ownership values submitted by the client.

## Input and output security

- Validate and normalize user input.
- Use parameterized database operations or safe ORM methods.
- Escape output according to context.
- Protect against SQL injection, XSS, CSRF, SSRF, path traversal, and unsafe deserialization as relevant to the stack.
- Avoid rendering untrusted HTML.
- Validate redirects and external URLs.
- Protect against mass assignment and over-posting.
- Avoid leaking internal details in errors.

## Secrets and configuration

- Store secrets in environment variables or a suitable secret manager.
- Provide a safe example environment file with placeholder values only.
- Never commit real credentials.
- Never print secrets in logs, documentation, screenshots, or final summaries.
- Rotate any credentials discovered to be exposed.
- Keep development and production configuration separate.

## Audit logs

Record important actions such as:

- Authentication and security events where appropriate
- User and permission changes
- Asset changes
- Request approvals and rejections
- Work-order assignment and status transitions
- Inventory movements and adjustments
- Purchasing approvals and receiving
- Cost corrections
- Configuration changes
- Sensitive exports

Audit records should include actor, action, target record, timestamp, and relevant before/after information where appropriate. Avoid logging passwords, tokens, secrets, or unnecessary personal data. Restrict audit-log access and protect logs from ordinary users modifying them.

## Privacy

- Collect only information required for maintenance operations.
- Limit employee and supplier personal data.
- Apply access controls to sensitive information.
- Define retention and deletion behavior with the organization.
- Avoid exposing personal data in reports or notifications without a business need.

---

# 11. Reliability, Performance, and Scalability

Design for realistic business usage and growth.

- Use pagination for large lists.
- Add indexes based on actual query patterns.
- Avoid N+1 queries.
- Use eager loading or equivalent techniques appropriately.
- Use background jobs for long-running tasks.
- Make scheduled jobs safe to retry.
- Make critical operations idempotent.
- Use transactions for multi-step data changes.
- Add timeouts and retry policies for external services.
- Avoid infinite retry loops.
- Cache only where correctness and invalidation are understood.
- Avoid caching permission-sensitive data across users.
- Monitor slow queries and application errors where the stack supports it.
- Handle temporary database or provider outages gracefully.
- Do not perform expensive report calculations on every page request if they can be safely precomputed or aggregated.
- Do not introduce distributed infrastructure without a real requirement.

---

# 12. Background Jobs and Scheduling

Use the existing queue and scheduler infrastructure if present.

Potential scheduled tasks:

- Generate preventive maintenance occurrences.
- Identify overdue work orders.
- Send due-date reminders.
- Detect low-stock items.
- Refresh scheduled reports or aggregates where needed.
- Clean up expired temporary files.
- Process queued notifications.

Requirements:

- Make jobs idempotent.
- Use locking or uniqueness controls where duplicate execution is possible.
- Record failures and make them observable.
- Use bounded retries with backoff.
- Avoid running duplicate schedules.
- Make schedules configurable where appropriate.
- Ensure a failed job does not silently lose an important maintenance event.
- Provide a way for administrators to inspect failed jobs if supported.

---

# 13. Integrations

Do not assume external services are configured. Inspect the repository and identify which integrations already exist.

Potential integrations include:

- Email provider
- SMS provider
- WhatsApp Business provider
- ERP or accounting software
- Identity provider / SSO
- Barcode or QR scanning
- Cloud file storage
- Reporting or business intelligence tools
- External asset telemetry or IoT platforms

Integration principles:

- Use documented APIs and supported authentication methods.
- Store credentials securely.
- Define timeouts and error handling.
- Validate inbound webhooks.
- Verify webhook signatures where supported.
- Protect against replay attacks.
- Make webhook processing idempotent.
- Log integration outcomes without exposing secrets.
- Provide clear configuration and health status.
- Keep integrations optional where the core system can operate without them.
- Do not simulate a successful external integration when no provider is connected.
- Do not send real messages, create external records, or incur costs without explicit user authorization and valid configuration.

---

# 14. Testing and Quality Assurance

Testing is part of implementation, not a final optional task.

## 14.1 Unit tests

Test:

- Business rules
- State transitions
- Validation
- Permission decisions
- Calculations
- Scheduling rules
- Inventory quantity logic
- Cost calculations
- KPI formulas
- Identifier generation

## 14.2 Integration tests

Test:

- Database relationships
- API endpoints
- Authentication and authorization
- Request approval and conversion
- Work-order lifecycle
- Preventive maintenance generation
- Inventory receiving, reservation, issue, and return
- Attachments and access control
- Notifications and provider failure handling
- Audit-log creation

## 14.3 End-to-end tests

Cover the most important user journeys:

1. Requester submits a maintenance request.
2. Reviewer approves or rejects it.
3. Approved request becomes a work order.
4. Supervisor assigns a technician.
5. Technician records work and materials.
6. Supervisor verifies and closes the work order.
7. Asset maintenance history reflects the work.
8. Inventory reflects the material movements.
9. Requester can view the permitted status.
10. Unauthorized users cannot access protected records.

Also test:

- Create and update an asset.
- Create a preventive maintenance plan and generate an occurrence.
- Complete an inspection and create follow-up work for a failed item.
- Receive stock and issue parts.
- Generate and export an authorized report.
- Test Arabic RTL and English LTR layouts if localization is implemented.

## 14.4 Security tests

Test:

- Unauthenticated access
- Role and permission boundaries
- Cross-user record access
- Cross-site or cross-department access where applicable
- Attachment access
- Invalid state transitions
- Mass assignment
- Malformed input
- Upload validation
- Export authorization
- CSRF and XSS protections where applicable
- Rate limits on sensitive endpoints

## 14.5 Quality gates

Before marking a phase complete, run the checks available in the repository:

- Unit tests
- Integration tests
- Relevant end-to-end tests
- Linter
- Formatter check
- Type checker
- Production build
- Migration validation
- Dependency or security audit where available

If a check cannot run, state exactly why. Do not report an unrun test as passed. Do not hide existing failures; distinguish pre-existing failures from regressions introduced by the current changes.

---

# 15. Installation, Configuration, and Deployment

The project must be straightforward to install and run in a clean development environment.

First identify the actual stack and deployment model. Do not assume Docker, Node, PHP, Python, a specific database, or a specific web server without evidence from the repository.

Create accurate setup instructions covering:

- Prerequisites and supported versions
- Dependency installation
- Environment configuration
- Database creation and connection
- Migrations
- Initial administrator creation through a secure supported process
- Asset compilation or frontend build
- Starting the application
- Running background workers
- Running scheduled tasks
- Running tests
- Building for production
- Production deployment considerations
- Backup and restore
- Troubleshooting common startup errors

## Windows developer experience

If the repository is being developed on Windows:

- Provide PowerShell-compatible commands where appropriate.
- Do not assume Bash-only commands will work in PowerShell.
- Clearly identify commands that require WSL, Docker Desktop, or another environment.
- Avoid hard-coded local paths.
- Document required environment variables.
- Ensure line endings and scripts work with the repository's conventions.
- Do not require the user to install unnecessary tools.

## Production deployment

Document, as applicable:

- Web server and reverse proxy configuration
- HTTPS/TLS
- Environment variables and secrets
- Database provisioning
- Migration procedure
- Queue workers and scheduler
- File storage permissions
- Logging and monitoring
- Backups and restore testing
- Health checks
- Rollback procedure
- Secure headers and cookie settings
- Least-privilege service accounts

Do not deploy to a live production environment, alter DNS, change hosting settings, send real notifications, or execute destructive production operations without explicit approval.

---

# 16. Backup, Restore, and Data Protection

A maintenance system contains operational history that must not be casually lost.

- Define what must be backed up: database, private files, configuration references, and other persistent data.
- Never include secrets in ordinary backup documentation or expose them in logs.
- Document backup frequency and retention recommendations.
- Use encrypted storage where appropriate.
- Restrict backup access.
- Provide a restore procedure.
- Test restoration in a non-production environment.
- Ensure backups are consistent with database transactions and uploaded files.
- Define recovery objectives with the organization rather than inventing guarantees.
- Never run a destructive reset or seed operation against a database containing real data.
- Clearly distinguish development seed data from production data.

---

# 17. Seed Data and Demonstration Mode

Use seed data only where it helps development, testing, or demonstrations.

- Clearly label demonstration data.
- Never mix demo data with production data by default.
- Never create default production passwords.
- Avoid fake dashboard metrics in production.
- Use deterministic seed data for automated tests.
- Ensure seed operations are safe and documented.
- Do not overwrite existing records during seeding unless explicitly intended.

---

# 18. Error Handling and Observability

Provide useful error handling for users and maintainers.

- Show users clear, actionable messages.
- Keep stack traces and internal details out of production responses.
- Log unexpected errors with correlation identifiers where practical.
- Avoid logging credentials, tokens, or sensitive personal data.
- Track background job failures.
- Provide health checks for critical dependencies where appropriate.
- Distinguish validation errors, authorization errors, missing records, conflicts, and server failures.
- Do not swallow exceptions silently.
- Do not display a success message if the underlying operation failed.
- Provide enough context for authorized administrators to investigate without exposing private data.

---

# 19. Data Import and Migration from Existing Systems

If the organization has existing spreadsheets or another maintenance system, assess import requirements separately.

- Identify source columns and data quality.
- Map source fields to the approved data model.
- Validate required values and references.
- Detect duplicates.
- Preview changes before committing.
- Provide row-level import errors.
- Support a dry-run mode where feasible.
- Preserve source identifiers where useful.
- Record import metadata.
- Do not silently discard invalid rows.
- Do not overwrite existing data without an explicit matching and update policy.
- Back up before large imports.
- Do not assume an undocumented legacy format.

---

# 20. Business Rules That Must Never Be Bypassed

The following are cross-module invariants:

1. A user must not access a record merely by changing an ID in a URL or API request.
2. A work order must not be completed without required completion information.
3. A request must not create duplicate work orders through repeated submissions.
4. Inventory must not change without a traceable stock movement.
5. Reserved stock must not be treated as available stock.
6. A part issue must not exceed available stock unless an explicit approved policy allows it.
7. A preventive maintenance occurrence must not be generated twice for the same scheduled event.
8. An attachment must not be more accessible than its linked record.
9. A user must not perform a state transition outside their permissions.
10. Important changes must be auditable.
11. Historical records must not be casually deleted.
12. Reports and exports must respect the same access rules as the application.
13. Dashboard KPIs must be based on real, defined calculations.
14. External integrations must not be represented as successful when they failed or were never configured.
15. Production data must not be reset, reseeded, or destructively migrated without explicit approval and a recovery plan.

---

# 21. Recommended Implementation Phases

Do not attempt to build every module in one giant change. Use vertical slices that leave the application runnable and testable.

## Phase 0: Repository audit and approved blueprint

Deliver:

- Repository and stack assessment
- Current feature inventory
- Architecture proposal
- Data model proposal
- Security and permissions assessment
- UI/UX plan
- Phased implementation plan
- Risk and assumption register

Acceptance criteria:

- The actual stack and application entry points are identified.
- Existing functionality and user changes are accounted for.
- Major requirements are mapped to modules.
- Dependencies and risks are clear.
- No unapproved destructive changes have been made.

## Phase 1: Foundation and application consistency

Implement:

- Shared layout and navigation
- Design tokens and reusable components
- Authentication integration review
- Role and permission foundations
- Error handling conventions
- Validation conventions
- Database migration conventions
- Audit-log foundation
- Localization foundation if required

Acceptance criteria:

- Existing login and core application startup still work.
- Protected routes are enforced server-side.
- Shared UI patterns are consistent.
- Tests and build checks pass.

## Phase 2: Asset register

Implement:

- Asset categories
- Locations and organizational relationships as needed
- Asset CRUD and search
- Asset details and history foundation
- Attachments with secure access
- Asset status history

Acceptance criteria:

- Authorized users can manage assets.
- Unauthorized users cannot access protected assets.
- Unique identifiers and validation work.
- Asset history is preserved.
- Tests cover core behavior.

## Phase 3: Maintenance requests

Implement:

- Request submission
- Request list and details
- Review and approval workflow
- Comments and attachments
- Notifications where configured
- Request activity history

Acceptance criteria:

- Requesters can submit and view permitted requests.
- Reviewers can approve or reject according to permissions.
- Transitions and reasons are validated and audited.
- Duplicate submissions are handled safely.

## Phase 4: Work orders

Implement:

- Work-order creation
- Request conversion
- Assignment and reassignment
- Status lifecycle
- Work logs and completion
- Supervisor verification
- Asset history integration

Acceptance criteria:

- End-to-end request-to-work-order workflow works.
- Invalid transitions are blocked.
- Assignment and completion are auditable.
- Required completion information is enforced.

## Phase 5: Preventive maintenance and inspections

Implement:

- PM plans and schedules
- Occurrence generation
- Due and overdue tracking
- Checklist templates
- Inspections and results
- Failed inspection follow-up

Acceptance criteria:

- Schedule generation is safe to retry.
- Duplicate occurrences are prevented.
- Completed inspection results remain historically accurate.
- Failed checks can trigger follow-up work.

## Phase 6: Technicians, teams, and inventory

Implement:

- Technician profiles and teams
- Assignment support
- Parts catalog
- Stock locations
- Stock movements
- Reservations and work-order consumption
- Reorder indicators

Acceptance criteria:

- Stock changes are transactional and auditable.
- Available and reserved quantities are correct.
- Duplicate issue operations are prevented.
- Permissions are tested.

## Phase 7: Purchasing and vendors

Implement only the approved purchasing scope:

- Supplier and vendor records
- Purchase requests
- Approvals
- Purchase orders
- Partial and full receiving
- Inventory receiving integration
- Vendor service records where required

Acceptance criteria:

- Purchasing records have valid lifecycles.
- Receiving reconciles with ordered quantities.
- Inventory updates are traceable.
- Financial data is permission-protected.

## Phase 8: Notifications, reports, and dashboards

Implement:

- In-app notifications
- Configured email or other providers where authorized
- Operational dashboards
- Reports and filters
- Export functionality
- KPI definitions and calculations

Acceptance criteria:

- No fabricated production metrics.
- Reports respect permissions.
- Exports match applied filters.
- Notification retries do not create uncontrolled duplicates.

## Phase 9: Hardening, documentation, and release readiness

Implement or verify:

- Security review
- Performance review
- Accessibility review
- RTL/LTR review if applicable
- Test coverage for critical workflows
- Backup and restore instructions
- Deployment documentation
- User and administrator guides
- Known limitations and operational checklist

Acceptance criteria:

- Production build succeeds.
- Critical tests pass.
- Security-sensitive flows have been tested.
- Setup and deployment instructions are verified.
- Remaining limitations are documented honestly.
- No claim of production readiness is made while critical blockers remain.

Phases may be adjusted after the repository audit, but dependencies and acceptance criteria must remain explicit.

---

# 22. Definition of Done

A feature is not complete merely because a screen exists.

A feature is complete only when all applicable items below are satisfied:

- User workflow is implemented.
- Backend behavior is implemented.
- Database constraints and migrations are correct.
- Authentication and authorization are enforced.
- Input validation is present.
- Error and empty states are handled.
- UI is responsive and accessible.
- Audit history exists for important actions.
- Related modules remain consistent.
- Automated tests cover critical behavior.
- Relevant lint, type, and build checks pass.
- Documentation is updated.
- No fake data or decorative-only actions remain.
- No known critical security issue is introduced.
- Any remaining limitation is documented.

---

# 23. Required Final Deliverables

At the end of the implementation, provide the deliverables that are appropriate to the actual repository:

1. Working application integrated into the existing project.
2. Database migrations and any justified seed data.
3. Role and permission configuration.
4. Core maintenance workflows.
5. Responsive and accessible UI.
6. Automated tests for critical workflows.
7. Setup and installation guide.
8. Administrator guide.
9. End-user guide.
10. Architecture overview.
11. API documentation if an API exists.
12. Security and backup guidance.
13. Deployment and rollback guidance.
14. Implementation status and known limitations.
15. A final verification report listing commands actually run and their results.

Do not create empty or misleading deliverables. If something is out of scope or blocked, explain it.

---

# 24. Required Final Report Format

When the work or a phase is complete, report using this structure:

## Summary
What was implemented and why.

## Files changed
List important files and their purpose. Group minor files where appropriate.

## Database changes
List migrations, tables, constraints, and indexes added or changed.

## User-visible changes
Explain the screens and workflows affected.

## Security and permissions
Explain the relevant access controls and protections implemented.

## Tests and verification
List the exact commands executed and whether they passed or failed. Separate tests not run from tests that failed.

## Remaining issues
List known bugs, limitations, assumptions, and blockers.

## Next phase
State the next logical implementation task.

Never claim that the entire ecosystem is complete if only a subset has been implemented.

---

# 25. Instructions for Handling Ambiguity

When the repository or business requirements do not provide enough information:

- Do not invent facts about the organization.
- Do not assume a specific industry, asset type, approval hierarchy, currency, tax rule, or regulatory requirement.
- Use configurable categories and workflows where practical.
- Recommend a default and explain the trade-off.
- Ask the user only when a decision materially affects data structure, security, workflow, cost, or deployment.
- For low-risk UI decisions, use a consistent professional default and continue.
- Record important assumptions in the implementation status or architecture documentation.
- Keep the design adaptable without building speculative features.

---

# 26. Non-Negotiable Restrictions

- Do not rewrite the entire repository without a compelling, approved reason.
- Do not change frameworks or databases merely based on personal preference.
- Do not remove existing features without impact analysis and approval.
- Do not overwrite user changes or uncommitted work.
- Do not run destructive commands without explaining the impact and obtaining approval.
- Do not use production data for local testing unless explicitly authorized and appropriately protected.
- Do not commit secrets or real credentials.
- Do not use fake production data, fake charts, or false success states.
- Do not implement authorization only in the frontend.
- Do not bypass validation to make a demo work.
- Do not use arbitrary sleeps or fragile timing hacks to hide race conditions.
- Do not add unnecessary dependencies.
- Do not make external API calls, send messages, or incur costs without authorization.
- Do not claim tests passed unless they were actually executed.
- Do not mark incomplete work as complete.
- Do not leave critical buttons or workflows nonfunctional while presenting them as implemented.

---

# 27. Start Here: First Copilot Task

**Do not begin by generating the whole application or editing files.**

Your first task is to perform the Phase 0 repository audit.

Follow this exact sequence:

1. Inspect the repository and current Git state.
2. Identify the actual technology stack, database, application structure, and existing features.
3. Map the current implementation against the modules and requirements in this document.
4. Identify what can be reused, what is missing, and what is unsafe or incomplete.
5. Review authentication, permissions, data handling, file uploads, and migrations.
6. Identify the existing test, lint, type-check, and build commands.
7. Propose an architecture and data model that fit the existing project.
8. Break the work into practical vertical slices with dependencies.
9. List risks, assumptions, and only the decisions that genuinely require user input.
10. Present the audit and implementation plan for review.

During this first task, do not modify application files, run destructive commands, reset databases, install major dependencies, or alter production configuration.

After the user approves the plan, proceed with Phase 1 in Agent Mode. Implement one phase at a time, verify it, update the status record, and then continue.

**The goal is a dependable maintenance management product, not the appearance of a finished product. Correct workflows, data integrity, security, usability, and verifiable results take priority over speed or visual decoration.**
