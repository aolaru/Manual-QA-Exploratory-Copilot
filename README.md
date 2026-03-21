# Field Notes QA Copilot

Local-first MVP for manual QA exploratory testing.

## What it does

- turns a feature brief into exploratory test charters
- suggests edge-case probes from common QA heuristics
- provides a lightweight live session log
- exports session notes as plain text for sharing or archiving
- autosaves drafts locally and offers quick-fill helper chips
- includes inline help tips for better briefs, session notes, and bug drafts
- saves sessions into searchable local history
- supports multiple bug drafts per session
- includes feature templates, risk templates, and Jira-friendly export text
- includes a `Home` dashboard with recent activity and shared tags
- includes a local SQL queries workspace for saving your own QA database queries
- includes a local API test cases workspace for saving your own reusable API checks
- includes a Swagger/OpenAPI JSON to Postman collection generator for API QA work
- supports full workspace backup export/import as JSON

## Run it

Open [/Users/andreiolaru/Library/CloudStorage/Dropbox/OLARUAI/qa-tools/index.html](/Users/andreiolaru/Library/CloudStorage/Dropbox/OLARUAI/qa-tools/index.html) in a browser.

## Current scope

- no backend
- no authentication
- no external API/model integration
- browser `localStorage` persistence for drafts and saved sessions
- browser `localStorage` persistence for saved SQL queries
- browser `localStorage` persistence for saved API test cases
- JSON backup/export for moving local data between browsers or machines
- Jira export is file-based, not API-based

## Good next steps

- add TestRail/Xray/Linear export formats
- add screenshot drag and drop
- add session comparison and recurring-risk analytics
- plug in an LLM for richer charter generation once the workflow is validated
