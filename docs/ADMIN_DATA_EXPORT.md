# Admin Campaign Data Export

Only an active Admin can access `GET /api/admin/export/campaign.xlsx` or see the Settings button. Authorization is re-verified before participant data is loaded. The Node.js route returns a private `no-store` XLSX and records `campaign.data_exported` with actor ID and row count after successful generation. Reviewer and signed-out requests are denied before data loading.

The export intentionally includes participant email and is sensitive; it is not a raw database dump.

## Workbook and dependency

ExcelJS 4.4.0 was selected for styled server XLSX output, TypeScript support, Node 24 compatibility, and Excel/Sheets/LibreOffice compatibility. Its UUID dependency is overridden to 11.1.1; the installed tree passes npm audit with zero vulnerabilities.

Sheets are `Overview`, `Submissions`, `Consents`, `Media`, `Certificates`, `Email Deliveries`, and `Audit`. Headers are styled, top rows frozen, filters enabled, dates typed/formatted, booleans and Guardian numbers typed, and widths bounded. There are no formulas, macros, external links, images, hidden sheets, or password protection.

## Exclusions and formula safety

The export omits secret keys, passwords, Auth sessions, JWTs, `public_request_token_hash`, signed URLs/tokens, service-role information, raw images, certificate bytes, and audit `before_data`/`after_data`. It never signs exported paths.

Every string passes through a control-character sanitizer. If the remaining value starts, after whitespace, with `=`, `+`, `-`, or `@`, it receives a leading apostrophe and remains plain text.

`npm run test:export` saves, reopens, and validates a real seven-sheet 1,000-row workbook in `/private/tmp`. The ordinary suite also parses the XLSX and verifies types, formula neutralization, and excluded fields.
