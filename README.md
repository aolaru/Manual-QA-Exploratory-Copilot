# Field Notes QA Copilot

Local-first MVP for manual QA exploratory testing.

## What it does

- turns a feature brief into exploratory test charters
- suggests edge-case probes from common QA heuristics
- provides a lightweight live session log
- exports the session as Markdown for sharing or bug filing
- autosaves drafts locally and offers quick-fill helper chips
- includes inline help tips for better briefs, session notes, and bug drafts

## Run it

Open [/Users/andreiolaru/Library/CloudStorage/Dropbox/OLARUAI/qa-tools/index.html](/Users/andreiolaru/Library/CloudStorage/Dropbox/OLARUAI/qa-tools/index.html) in a browser.

## Current scope

- no backend
- no authentication
- no external API/model integration
- no persistence beyond your current page session

## Good next steps

- add local save/load with `localStorage`
- add Jira or TestRail export formats
- add screenshot drag and drop
- plug in an LLM for richer charter generation once the workflow is validated
