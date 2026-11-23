# User guide

## Public homepage and contact

The public homepage describes the maintenance platform's capabilities, scope, and illustrative request-to-close workflow. Its example is not a customer case study or performance claim. Use **Sign in** to access an existing account, or submit the contact form to send an inquiry to the app database. An administrator reviews submissions in the protected **Contact inquiries** dashboard view and can respond using their configured mail client. Submitting a form does not send an email, create a maintenance request, or guarantee a response time.

## Sign in

Use the email and password provided by your administrator. There are no shared/default production credentials. Sessions expire after eight hours; use **Sign out** on shared devices.

## Role-based navigation

- **Requester:** Overview and Requests. Submit a clear title, description, and priority; follow request status and add an allowed attachment.
- **Technician:** Work Orders and Inventory. Only assigned work orders are actionable. Move work through start/hold/complete, complete each checklist item, add a completion note, and reserve/issue parts against an assigned order.
- **Manager:** Review requests, approve/reject with an explanatory note, convert approved requests, assign technicians, verify/close completed work, manage assets and stock, and review in-location workload/audit activity.
- **Administrator:** All manager capabilities plus user creation, activation/deactivation, and password reset. User creation currently assigns the administrator's first location.

## Asset and request lifecycle

Managers create assets with a unique code, name, category, and criticality. Requesters submit a maintenance request; managers approve or reject it. Only approved requests can be converted, and a request converts at most once. Conversion creates a work order with a basic safety/visual/work-record checklist.

## Work orders and inspections

Managers assign active technicians in the same location. Assigned technicians start or hold work, check each inspection item, and complete the order with a note. Managers then verify and close it. The server rejects skipped/invalid transitions and prevents completion while checklist items remain incomplete.

## Inventory

Managers add parts with an opening quantity, record receipts/issues, and inspect movement history. Managers and assigned technicians can reserve stock for a work order. Issuing against that order consumes its reservation; stock availability is checked transactionally and cannot become negative. Use a distinct, accurate reason for each movement.

## Attachments, notifications, localization

PDF/JPEG/PNG attachments up to 10 MiB may be added to authorized assets, requests, or orders. Files download only through a signed-in, scoped application route; do not upload sensitive files unless organizational storage and scanning policies permit it. Notifications are in-app only. Use the language control to switch document direction; some secondary copy remains English in Arabic mode.

Dashboard values reflect database records. Empty states mean there are no matching records; the app does not show fabricated work or KPI values.
