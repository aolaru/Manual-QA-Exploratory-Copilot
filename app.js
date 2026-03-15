const heuristics = {
  keywords: {
    auth: ["login", "password", "reset", "otp", "token", "authentication", "sign in", "verify"],
    payments: ["payment", "refund", "card", "checkout", "invoice", "subscription", "billing"],
    dataMutation: ["create", "edit", "update", "delete", "save", "submit", "sync", "import"],
    search: ["search", "filter", "sort", "results", "pagination"],
    communication: ["email", "sms", "notification", "message", "invite"],
    permissions: ["role", "admin", "permission", "access", "shared", "tenant"],
    fileHandling: ["upload", "download", "attachment", "image", "document", "csv", "pdf"],
  },
  charterLibrary: {
    baseline: [
      "Walk the happy path end to end and confirm the user receives clear system feedback at each step.",
      "Probe validation boundaries and error recovery paths, not just field-level errors.",
      "Check how the flow behaves after refresh, back navigation, and repeat submissions.",
    ],
    auth: [
      "Exercise valid, expired, reused, and tampered credentials or tokens.",
      "Check account state transitions: logged out, partially verified, locked, or recently changed credentials.",
    ],
    payments: [
      "Test double-submit, retry, timeout, and partial-success paths around money movement.",
      "Check what the user sees when the transaction state is delayed or reverses later.",
    ],
    dataMutation: [
      "Try interrupted writes: refresh during submit, slow network, duplicate clicks, and stale tabs.",
      "Validate auditability: what changed, who changed it, and whether the UI reflects the final saved state.",
    ],
    search: [
      "Challenge the search flow with special characters, empty filters, and contradictory filter combinations.",
      "Check sorting and pagination consistency when results are updated or sparse.",
    ],
    communication: [
      "Verify content delivery timing, duplicate sends, localization, and invalid recipient cases.",
      "Check links or CTAs received through messages across browsers and expired states.",
    ],
    permissions: [
      "Compare what each role can see, trigger, and infer through the UI.",
      "Attempt direct navigation or action replay from a higher-privilege session.",
    ],
    fileHandling: [
      "Use wrong file types, oversized payloads, renamed files, and duplicate uploads.",
      "Confirm previews, failures, and cleanup behavior for interrupted file operations.",
    ],
  },
  probes: {
    baseline: [
      "Boundary data sizes",
      "Empty and null-like inputs",
      "Rapid repeat actions",
      "Refresh / back-button behavior",
      "Slow network or delayed backend response",
      "Clear and actionable error messaging",
    ],
    auth: [
      "Expired token",
      "Reused reset or verification link",
      "Mismatched account context",
      "Session invalidation after credential change",
    ],
    payments: [
      "Currency and rounding edge case",
      "Retry after gateway timeout",
      "Duplicate charge protection",
      "Refund state drift",
    ],
    dataMutation: [
      "Concurrent edits from two tabs",
      "Stale form data",
      "Autosave or unsaved-change handling",
      "Idempotent resubmission",
    ],
    search: [
      "Case sensitivity and whitespace",
      "Special characters and encoding",
      "Filter reset consistency",
      "Pagination after query change",
    ],
    communication: [
      "Delayed or duplicate notification",
      "Broken deep link from message",
      "Template fallback for missing variables",
      "Localized content mismatch",
    ],
    permissions: [
      "Role downgrade while session is open",
      "UI hides action but API still accepts it",
      "Cross-tenant data visibility",
      "Shared link misuse",
    ],
    fileHandling: [
      "Same filename with different contents",
      "Interrupted upload",
      "Corrupt file disguised by extension",
      "Large preview/render performance",
    ],
  },
};

const form = document.querySelector("#brief-form");
const emptyState = document.querySelector("#emptyState");
const results = document.querySelector("#results");
const missionText = document.querySelector("#missionText");
const riskLevel = document.querySelector("#riskLevel");
const topicSummary = document.querySelector("#topicSummary");
const packCounts = document.querySelector("#packCounts");
const charterList = document.querySelector("#charterList");
const probeList = document.querySelector("#probeList");
const coverageList = document.querySelector("#coverageList");
const statusMessage = document.querySelector("#statusMessage");
const exportBtn = document.querySelector("#exportBtn");
const copyBtn = document.querySelector("#copyBtn");
const sampleBtn = document.querySelector("#sampleBtn");
const clearBtn = document.querySelector("#clearBtn");

const storageKey = "field-notes-qa-copilot";

const sampleBrief = {
  featureName: "Password reset with email verification",
  summary: "Users request a reset link, confirm via email, and set a new password. High risk because account access is affected.",
  personas: "new user, returning user, admin",
  platforms: "Chrome, Safari iPhone, staging",
  risks: "email delays, token expiry, localization, weak passwords",
  notes: "Acceptance criteria include one-time token use and clear error guidance.",
  sessionGoal: "Validate valid and invalid reset flows across persona and platform variants",
  coverageNotes: "Covered happy path, expired token, token reuse, delayed email, and admin-visible flows.",
  observations: "Delayed email path is unclear. Expired token copy needs stronger recovery wording.",
  evidence: "screens/reset-expired-token.png, video/reset-delay.mov",
  bugTitle: "Expired reset token flow shows weak recovery guidance",
  steps: "1. Request a reset link\n2. Wait for token expiry\n3. Open the link\n4. Submit a new password",
  expected: "The user should see a clear expired-link message and a path to request a new reset link.",
  actual: "The UI blocks the reset but the message does not explain next steps.",
  severity: "High",
};

let latestPack = null;

hydrateDraft();
bindAutosave();
bindChipInputs();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const brief = Object.fromEntries(formData.entries());
  latestPack = buildSessionPack(brief);
  renderPack(latestPack);
  persistDraft();
  statusMessage.textContent = "Session pack generated. Capture notes below and export when ready.";
});

exportBtn.addEventListener("click", () => {
  if (!latestPack) {
    statusMessage.textContent = "Generate a session pack before exporting.";
    return;
  }

  const markdown = buildMarkdown(latestPack, collectSessionState());
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = slugify(latestPack.featureName || "qa-session");

  anchor.href = url;
  anchor.download = `${slug || "qa-session"}.md`;
  anchor.click();

  URL.revokeObjectURL(url);
  statusMessage.textContent = "Markdown exported.";
});

copyBtn.addEventListener("click", async () => {
  if (!latestPack) {
    statusMessage.textContent = "Generate a session pack before copying a summary.";
    return;
  }

  const text = buildShareSummary(latestPack, collectSessionState());
  try {
    await copyToClipboard(text);
    statusMessage.textContent = "Session summary copied.";
  } catch {
    statusMessage.textContent = "Clipboard access failed. Export Markdown instead.";
  }
});

sampleBtn.addEventListener("click", () => {
  fillFields(sampleBrief);
  statusMessage.textContent = "Example brief loaded.";
});

clearBtn.addEventListener("click", () => {
  form.reset();
  clearSessionFields();
  latestPack = null;
  localStorage.removeItem(storageKey);
  emptyState.classList.remove("hidden");
  results.classList.add("hidden");
  statusMessage.textContent = "Draft cleared.";
});

function buildSessionPack(brief) {
  const normalizedText = [brief.featureName, brief.summary, brief.risks, brief.notes]
    .join(" ")
    .toLowerCase();

  const matchedTopics = Object.entries(heuristics.keywords)
    .filter(([, terms]) => terms.some((term) => normalizedText.includes(term)))
    .map(([topic]) => topic);

  const uniqueTopics = matchedTopics.length ? matchedTopics : ["baseline"];
  const charters = unique([
    ...heuristics.charterLibrary.baseline,
    ...uniqueTopics.flatMap((topic) => heuristics.charterLibrary[topic] || []),
    createPersonaCharter(brief.personas),
    createPlatformCharter(brief.platforms),
    createRiskCharter(brief.risks),
  ]).filter(Boolean);

  const probes = unique([
    ...heuristics.probes.baseline,
    ...uniqueTopics.flatMap((topic) => heuristics.probes[topic] || []),
    ...parseCsvish(brief.risks).map((risk) => `Probe around: ${risk}`),
  ]).filter(Boolean);

  const coverage = unique([
    "Happy path",
    "Validation and error states",
    "Recovery and retry behavior",
    "Cross-browser / device behavior",
    "User feedback and messaging",
    ...parseCsvish(brief.personas).map((persona) => `Persona: ${persona}`),
    ...parseCsvish(brief.platforms).map((platform) => `Platform: ${platform}`),
  ]);

  return {
    featureName: brief.featureName.trim(),
    summary: brief.summary.trim(),
    personas: parseCsvish(brief.personas),
    platforms: parseCsvish(brief.platforms),
    risks: parseCsvish(brief.risks),
    notes: brief.notes.trim(),
    mission: `Explore ${brief.featureName.trim()} with emphasis on failure handling, user clarity, and risky state transitions.`,
    riskLevel: deriveRiskLevel(brief, uniqueTopics),
    charters,
    probes,
    coverage,
    topics: uniqueTopics,
  };
}

function renderPack(pack) {
  emptyState.classList.add("hidden");
  results.classList.remove("hidden");
  missionText.textContent = pack.mission;
  riskLevel.textContent = pack.riskLevel;
  topicSummary.textContent = pack.topics.join(", ");
  packCounts.textContent = `${pack.charters.length} charters / ${pack.probes.length} probes`;
  renderList(charterList, pack.charters);
  renderList(probeList, pack.probes);
  renderList(coverageList, pack.coverage);
}

function renderList(node, items) {
  node.replaceChildren();
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    node.appendChild(li);
  });
}

function deriveRiskLevel(brief, topics) {
  let score = 1;
  const riskyWords = ["critical", "security", "payment", "billing", "auth", "login", "password", "prod"];
  const combined = [brief.summary, brief.risks, brief.notes].join(" ").toLowerCase();

  score += topics.length;
  score += riskyWords.filter((word) => combined.includes(word)).length;

  if (score >= 6) return "High";
  if (score >= 3) return "Medium";
  return "Low";
}

function collectSessionState() {
  return {
    sessionGoal: valueOf("#sessionGoal"),
    coverageNotes: valueOf("#coverageNotes"),
    observations: valueOf("#observations"),
    evidence: valueOf("#evidence"),
    bugTitle: valueOf("#bugTitle"),
    steps: valueOf("#steps"),
    expected: valueOf("#expected"),
    actual: valueOf("#actual"),
    severity: valueOf("#severity"),
  };
}

function buildMarkdown(pack, session) {
  return `# Exploratory QA Session: ${pack.featureName}

## Mission
${pack.mission}

## Feature Summary
${pack.summary}

## Risk Level
${pack.riskLevel}

## Focus Topics
${pack.topics.map((topic) => `- ${topic}`).join("\n")}

## Charters
${pack.charters.map((item) => `- ${item}`).join("\n")}

## Edge-Case Probes
${pack.probes.map((item) => `- ${item}`).join("\n")}

## Coverage Map
${pack.coverage.map((item) => `- ${item}`).join("\n")}

## Session Goal
${session.sessionGoal || "_Not provided_"}

## Coverage Notes
${session.coverageNotes || "_Not provided_"}

## Observations
${session.observations || "_Not provided_"}

## Evidence
${session.evidence || "_Not provided_"}

## Defect Draft
### Title
${session.bugTitle || "_Not provided_"}

### Severity
${session.severity || "_Not provided_"}

### Steps
${session.steps || "_Not provided_"}

### Expected
${session.expected || "_Not provided_"}

### Actual
${session.actual || "_Not provided_"}
`;
}

function buildShareSummary(pack, session) {
  return [
    `Feature: ${pack.featureName}`,
    `Risk: ${pack.riskLevel}`,
    `Topics: ${pack.topics.join(", ")}`,
    `Top charters: ${pack.charters.slice(0, 3).join(" | ")}`,
    `Session goal: ${session.sessionGoal || "Not provided"}`,
    `Observation: ${session.observations || "Not provided"}`,
    `Bug draft: ${session.bugTitle || "None"}`,
  ].join("\n");
}

function createPersonaCharter(personas) {
  const values = parseCsvish(personas);
  if (!values.length) return "";
  return `Compare the experience across personas: ${values.join(", ")}. Focus on missing permissions, unclear messaging, and inconsistent defaults.`;
}

function createPlatformCharter(platforms) {
  const values = parseCsvish(platforms);
  if (!values.length) return "";
  return `Spot-check the flow on ${values.join(", ")} and note layout, timing, or browser-specific inconsistencies.`;
}

function createRiskCharter(risks) {
  const values = parseCsvish(risks);
  if (!values.length) return "";
  return `Deliberately stress the known risk areas: ${values.join(", ")}. Confirm both technical behavior and user-facing recovery guidance.`;
}

function parseCsvish(input = "") {
  return input
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(items) {
  return [...new Set(items)];
}

function valueOf(selector) {
  return document.querySelector(selector).value.trim();
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(helper);

  if (!copied) {
    throw new Error("copy failed");
  }
}

function bindAutosave() {
  document.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("input", persistDraft);
    field.addEventListener("change", persistDraft);
  });
}

function persistDraft() {
  const draft = {
    ...Object.fromEntries(new FormData(form).entries()),
    ...collectSessionState(),
  };
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

function hydrateDraft() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;

  try {
    const draft = JSON.parse(saved);
    fillFields(draft);
    if (draft.featureName && draft.summary) {
      latestPack = buildSessionPack(draft);
      renderPack(latestPack);
      statusMessage.textContent = "Restored your saved draft.";
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function fillFields(values) {
  Object.entries(values).forEach(([key, value]) => {
    const node = document.querySelector(`#${key}`);
    if (!node) return;
    node.value = value;
  });

  if (values.featureName && values.summary) {
    const formData = new FormData(form);
    latestPack = buildSessionPack(Object.fromEntries(formData.entries()));
    renderPack(latestPack);
  }

  persistDraft();
}

function clearSessionFields() {
  [
    "#sessionGoal",
    "#coverageNotes",
    "#observations",
    "#evidence",
    "#bugTitle",
    "#steps",
    "#expected",
    "#actual",
    "#severity",
  ].forEach((selector) => {
    const node = document.querySelector(selector);
    if (!node) return;
    if (node.tagName === "SELECT") {
      node.selectedIndex = 1;
    } else {
      node.value = "";
    }
  });
}

function bindChipInputs() {
  document.querySelectorAll(".chip-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      const button = event.target.closest(".chip");
      if (!button) return;

      const input = document.querySelector(`#${row.dataset.target}`);
      const nextValue = button.textContent.trim();
      const currentItems = parseCsvish(input.value);
      if (!currentItems.includes(nextValue)) {
        currentItems.push(nextValue);
      }
      input.value = currentItems.join(", ");
      persistDraft();
    });
  });
}
