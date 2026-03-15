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

const riskTemplates = {
  auth: [
    "expired token",
    "reused link",
    "session invalidation",
    "password policy mismatch",
    "account lock state",
  ],
  payments: [
    "double submission",
    "timeout on gateway response",
    "rounding mismatch",
    "refund drift",
    "partial success state",
  ],
  permissions: [
    "role downgrade mid-session",
    "cross-tenant visibility",
    "hidden UI but accessible action",
    "stale permission cache",
    "shared-link misuse",
  ],
  notifications: [
    "delayed delivery",
    "duplicate notification",
    "broken deep link",
    "wrong locale content",
    "missing template variable",
  ],
  fileHandling: [
    "oversized upload",
    "corrupt renamed file",
    "interrupted upload",
    "duplicate filename conflict",
    "preview/render failure",
  ],
};

const featureTemplates = {
  auth: {
    featureName: "Login or password recovery flow",
    summary: "Users authenticate, recover access, or verify identity. High risk because account access and session security are affected.",
    personas: "new user, returning user, locked-out user, admin",
    platforms: "Chrome, Safari iPhone, staging",
    risks: "token expiry, session invalidation, localization, weak passwords",
    notes: "Focus on token lifecycle, error guidance, and post-auth session behavior.",
  },
  checkout: {
    featureName: "Checkout and payment confirmation flow",
    summary: "Users review cart contents, pay, and receive confirmation. High risk because money movement, order state, and trust are involved.",
    personas: "guest shopper, returning customer, support agent",
    platforms: "Chrome, Firefox, iPhone Safari, staging",
    risks: "duplicate submission, gateway timeout, rounding mismatch, delayed confirmation",
    notes: "Probe retries, partial success states, and confirmation messaging.",
  },
  profile: {
    featureName: "Profile update and settings flow",
    summary: "Users change account details and preferences. High risk because incorrect saves or stale state can affect long-term account behavior.",
    personas: "returning user, admin, support agent",
    platforms: "Chrome, Safari, staging",
    risks: "stale form data, permissions drift, autosave confusion, validation mismatch",
    notes: "Check save confirmation, refresh handling, and audit visibility.",
  },
  search: {
    featureName: "Search, filtering, and result refinement",
    summary: "Users search and narrow results across a large dataset. High risk because incorrect results mislead users and hide important content.",
    personas: "new user, returning user, analyst",
    platforms: "Chrome, Firefox, staging",
    risks: "special characters, empty filters, pagination drift, sorting inconsistency",
    notes: "Challenge query parsing, contradictory filters, and result stability.",
  },
  upload: {
    featureName: "Upload and attachment flow",
    summary: "Users upload files and expect clear validation, preview, and persistence behavior. High risk because failures are often silent and data-heavy.",
    personas: "returning user, admin, support agent",
    platforms: "Chrome, Safari iPhone, staging",
    risks: "oversized upload, corrupt file, preview failure, duplicate filenames",
    notes: "Test wrong file types, interrupted transfers, and duplicate uploads.",
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
const jiraBtn = document.querySelector("#jiraBtn");
const copyBtn = document.querySelector("#copyBtn");
const sampleBtn = document.querySelector("#sampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const saveSessionBtn = document.querySelector("#saveSessionBtn");
const saveDraftBtn = document.querySelector("#saveDraftBtn");
const resetDraftBtn = document.querySelector("#resetDraftBtn");
const historySearch = document.querySelector("#historySearch");
const historyList = document.querySelector("#historyList");
const historyCount = document.querySelector("#historyCount");
const draftList = document.querySelector("#draftList");
const activeDraftLabel = document.querySelector("#activeDraftLabel");
const activeDraftStamp = document.querySelector("#activeDraftStamp");
const riskTemplate = document.querySelector("#riskTemplate");
const templatePreview = document.querySelector("#templatePreview");
const applyTemplateBtn = document.querySelector("#applyTemplateBtn");
const featureTemplate = document.querySelector("#featureTemplate");
const featureTemplatePreview = document.querySelector("#featureTemplatePreview");
const applyFeatureTemplateBtn = document.querySelector("#applyFeatureTemplateBtn");

const storageKey = "field-notes-qa-copilot-draft";
const sessionsKey = "field-notes-qa-copilot-sessions";

const sampleBrief = {
  featureName: "Password reset with email verification",
  summary: "Users request a reset link, confirm via email, and set a new password. High risk because account access is affected.",
  personas: "new user, returning user, admin",
  platforms: "Chrome, Safari iPhone, staging",
  risks: "email delays, token expiry, localization, weak passwords",
  notes: "Acceptance criteria include one-time token use and clear error guidance.",
  testerName: "Andrei",
  buildRef: "staging-2026.03.15",
  sessionTags: "auth, regression, release-blocker",
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
let bugDrafts = [];
let activeDraftId = null;
let sessions = loadSessions();
let currentSessionId = null;

hydrateDraft();
bindAutosave();
bindChipInputs();
renderHistory();
renderDraftList();
updateTemplatePreview();
updateFeatureTemplatePreview();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  latestPack = buildSessionPack(getBriefState());
  renderPack(latestPack);
  persistDraft();
  statusMessage.textContent = "Session pack generated. Capture notes, save bug drafts, then save the session.";
});

exportBtn.addEventListener("click", () => {
  const sessionRecord = buildSessionRecord();
  if (!sessionRecord) return;
  downloadText(`session-${slugify(sessionRecord.featureName || "qa-session")}.txt`, buildMarkdown(sessionRecord));
  statusMessage.textContent = "Session notes export created.";
});

jiraBtn.addEventListener("click", () => {
  const draft = getSelectedOrCurrentBugDraft();
  if (!draft) {
    statusMessage.textContent = "Save or select a bug draft before exporting to Jira.";
    return;
  }

  const sessionRecord = buildSessionRecord();
  if (!sessionRecord) return;
  const jiraText = buildJiraDraft(sessionRecord, draft);
  downloadText(`jira-bug-${slugify(draft.title || "jira-draft")}.txt`, jiraText);
  statusMessage.textContent = "Jira paste-format export created.";
});

copyBtn.addEventListener("click", async () => {
  const sessionRecord = buildSessionRecord();
  if (!sessionRecord) return;

  try {
    await copyToClipboard(buildShareSummary(sessionRecord));
    statusMessage.textContent = "Session summary copied.";
  } catch {
    statusMessage.textContent = "Clipboard access failed. Use the session-notes export instead.";
  }
});

sampleBtn.addEventListener("click", () => {
  fillAllFields(sampleBrief);
  latestPack = buildSessionPack(getBriefState());
  renderPack(latestPack);
  statusMessage.textContent = "Example brief loaded.";
});

clearBtn.addEventListener("click", () => {
  form.reset();
  clearSessionFields();
  clearDraftEditor(false);
  currentSessionId = null;
  latestPack = null;
  localStorage.removeItem(storageKey);
  emptyState.classList.remove("hidden");
  results.classList.add("hidden");
  renderDraftList();
  statusMessage.textContent = "Draft cleared.";
});

saveDraftBtn.addEventListener("click", () => {
  const draft = collectBugForm();
  if (!draft.title) {
    statusMessage.textContent = "Add a bug title before saving the draft.";
    return;
  }

  if (activeDraftId) {
    bugDrafts = bugDrafts.map((item) => (item.id === activeDraftId ? { ...item, ...draft } : item));
    statusMessage.textContent = "Bug draft updated.";
  } else {
    const nextDraft = { ...draft, id: createId("bug"), createdAt: new Date().toISOString() };
    bugDrafts.unshift(nextDraft);
    activeDraftId = nextDraft.id;
    statusMessage.textContent = "Bug draft saved.";
  }

  renderDraftList();
  persistDraft();
});

resetDraftBtn.addEventListener("click", () => {
  clearDraftEditor(true);
  statusMessage.textContent = "New bug draft ready.";
});

saveSessionBtn.addEventListener("click", () => {
  const sessionRecord = buildSessionRecord();
  if (!sessionRecord) return;

  const savedAt = new Date().toISOString();
  const nextSession = { ...sessionRecord, id: currentSessionId || createId("session"), savedAt };

  const existingIndex = sessions.findIndex((item) => item.id === nextSession.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = nextSession;
  } else {
    sessions.unshift(nextSession);
  }

  currentSessionId = nextSession.id;
  sessions = sortSessions(sessions);
  localStorage.setItem(sessionsKey, JSON.stringify(sessions));
  renderHistory();
  persistDraft();
  statusMessage.textContent = "Session saved to history.";
});

historySearch.addEventListener("input", renderHistory);

riskTemplate.addEventListener("change", updateTemplatePreview);
featureTemplate.addEventListener("change", updateFeatureTemplatePreview);

applyTemplateBtn.addEventListener("click", () => {
  const templateName = riskTemplate.value;
  if (!templateName) {
    statusMessage.textContent = "Choose a risk template first.";
    return;
  }

  const riskField = document.querySelector("#risks");
  const currentItems = parseCsvish(riskField.value);
  const merged = unique([...currentItems, ...riskTemplates[templateName]]);
  riskField.value = merged.join(", ");
  persistDraft();
  statusMessage.textContent = `${labelForTemplate(templateName)} risks applied.`;
});

applyFeatureTemplateBtn.addEventListener("click", () => {
  const templateName = featureTemplate.value;
  if (!templateName) {
    statusMessage.textContent = "Choose a feature template first.";
    return;
  }

  fillAllFields(featureTemplates[templateName]);
  latestPack = buildSessionPack(getBriefState());
  renderPack(latestPack);
  statusMessage.textContent = `${labelForTemplate(templateName)} feature template applied.`;
});

function getBriefState() {
  return Object.fromEntries(new FormData(form).entries());
}

function collectSessionState() {
  return {
    testerName: valueOf("#testerName"),
    buildRef: valueOf("#buildRef"),
    sessionTags: valueOf("#sessionTags"),
    sessionGoal: valueOf("#sessionGoal"),
    coverageNotes: valueOf("#coverageNotes"),
    observations: valueOf("#observations"),
    evidence: valueOf("#evidence"),
  };
}

function collectBugForm() {
  return {
    title: valueOf("#bugTitle"),
    steps: valueOf("#steps"),
    expected: valueOf("#expected"),
    actual: valueOf("#actual"),
    severity: valueOf("#severity"),
    status: valueOf("#draftStatus"),
  };
}

function buildSessionRecord() {
  const brief = getBriefState();
  if (!brief.featureName.trim() || !brief.summary.trim()) {
    statusMessage.textContent = "Feature / story and summary are required.";
    return null;
  }

  latestPack = latestPack || buildSessionPack(brief);

  return {
    featureName: brief.featureName.trim(),
    summary: brief.summary.trim(),
    personas: parseCsvish(brief.personas),
    platforms: parseCsvish(brief.platforms),
    risks: parseCsvish(brief.risks),
    notes: brief.notes.trim(),
    pack: latestPack,
    session: {
      ...collectSessionState(),
      tags: parseCsvish(valueOf("#sessionTags")),
    },
    bugDrafts,
  };
}

function buildSessionPack(brief) {
  const normalizedText = [brief.featureName, brief.summary, brief.risks, brief.notes].join(" ").toLowerCase();
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

  return {
    mission: `Explore ${brief.featureName.trim()} with emphasis on failure handling, user clarity, and risky state transitions.`,
    riskLevel: deriveRiskLevel(brief, uniqueTopics),
    charters,
    probes,
    coverage: unique([
      "Happy path",
      "Validation and error states",
      "Recovery and retry behavior",
      "Cross-browser / device behavior",
      "User feedback and messaging",
      ...parseCsvish(brief.personas).map((persona) => `Persona: ${persona}`),
      ...parseCsvish(brief.platforms).map((platform) => `Platform: ${platform}`),
    ]),
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

function renderDraftList() {
  draftList.replaceChildren();

  if (!bugDrafts.length) {
    draftList.classList.add("empty-list");
    draftList.innerHTML = `<p class="microcopy">No saved bug drafts yet.</p>`;
    activeDraftLabel.textContent = "New draft";
    activeDraftStamp.textContent = "Not saved yet";
    return;
  }

  draftList.classList.remove("empty-list");
  bugDrafts.forEach((draft) => {
    const item = document.createElement("article");
    item.className = `saved-item ${draft.id === activeDraftId ? "is-active" : ""}`;
    item.innerHTML = `
      <div>
        <div class="saved-title-row">
          <strong>${escapeHtml(draft.title)}</strong>
          <span class="status-pill ${statusClass(draft.status)}">${escapeHtml(draft.status || "New")}</span>
        </div>
        <p class="saved-meta">${escapeHtml(draft.severity)} severity • ${escapeHtml(formatDate(draft.createdAt))}</p>
        <p class="saved-submeta">${escapeHtml(draft.actual || "No actual result captured yet.")}</p>
      </div>
      <div class="inline-actions">
        <button type="button" class="ghost small-btn" data-action="edit" data-id="${draft.id}">Edit</button>
        <button type="button" class="ghost small-btn" data-action="jira" data-id="${draft.id}">Jira</button>
        <button type="button" class="ghost small-btn" data-action="delete" data-id="${draft.id}">Delete</button>
      </div>
    `;
    draftList.appendChild(item);
  });

  const active = bugDrafts.find((draft) => draft.id === activeDraftId);
  activeDraftLabel.textContent = active ? `Editing: ${active.title}` : "New draft";
  activeDraftStamp.textContent = active ? `${active.status || "New"} • ${formatDate(active.createdAt)}` : "Not saved yet";
}

function renderHistory() {
  const query = historySearch.value.trim().toLowerCase();
  const filtered = sessions.filter((session) => {
    if (!query) return true;
    const haystack = [
      session.featureName,
      session.summary,
      ...(session.risks || []),
      ...((session.pack && session.pack.topics) || []),
      ...((session.bugDrafts || []).map((draft) => draft.title)),
      ...((session.session && session.session.tags) || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  historyCount.textContent = `${filtered.length} session${filtered.length === 1 ? "" : "s"}`;
  historyList.replaceChildren();

  if (!filtered.length) {
    historyList.classList.add("empty-list");
    historyList.innerHTML = `<p class="microcopy">No matching sessions yet.</p>`;
    return;
  }

  historyList.classList.remove("empty-list");
  filtered.forEach((session) => {
    const item = document.createElement("article");
    item.className = `saved-item ${session.id === currentSessionId ? "is-active" : ""}`;
    item.innerHTML = `
      <div>
        <div class="saved-title-row">
          <strong>${escapeHtml(session.featureName)}</strong>
          <span class="pill">${(session.bugDrafts || []).length} bugs</span>
        </div>
        <p class="saved-meta">${escapeHtml(formatHistoryMeta(session))}</p>
        <p class="saved-submeta">${escapeHtml(session.summary)}</p>
        <div class="tag-row">${(session.session?.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="inline-actions">
        <button type="button" class="ghost small-btn" data-action="load" data-id="${session.id}">Open</button>
        <button type="button" class="ghost small-btn" data-action="delete" data-id="${session.id}">Delete</button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

draftList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const draft = bugDrafts.find((item) => item.id === id);
  if (!draft) return;

  if (action === "edit") {
    loadDraftIntoEditor(draft);
    statusMessage.textContent = "Bug draft loaded.";
  } else if (action === "jira") {
    const sessionRecord = buildSessionRecord();
    if (!sessionRecord) return;
    downloadText(`jira-bug-${slugify(draft.title || "jira-draft")}.txt`, buildJiraDraft(sessionRecord, draft));
    statusMessage.textContent = "Jira paste-format export created.";
  } else if (action === "delete") {
    bugDrafts = bugDrafts.filter((item) => item.id !== id);
    if (activeDraftId === id) clearDraftEditor(false);
    renderDraftList();
    persistDraft();
    statusMessage.textContent = "Bug draft deleted.";
  }
});

historyList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const session = sessions.find((item) => item.id === id);
  if (!session) return;

  if (action === "load") {
    loadSession(session);
    statusMessage.textContent = "Saved session loaded.";
  } else if (action === "delete") {
    sessions = sessions.filter((item) => item.id !== id);
    localStorage.setItem(sessionsKey, JSON.stringify(sessions));
    if (currentSessionId === id) currentSessionId = null;
    renderHistory();
    statusMessage.textContent = "Saved session deleted.";
  }
});

function loadSession(session) {
  currentSessionId = session.id;
  fillAllFields({
    featureName: session.featureName,
    summary: session.summary,
    personas: (session.personas || []).join(", "),
    platforms: (session.platforms || []).join(", "),
    risks: (session.risks || []).join(", "),
    notes: session.notes || "",
    testerName: session.session?.testerName || "",
    buildRef: session.session?.buildRef || "",
    sessionTags: (session.session?.tags || []).join(", "),
    sessionGoal: session.session?.sessionGoal || "",
    coverageNotes: session.session?.coverageNotes || "",
    observations: session.session?.observations || "",
    evidence: session.session?.evidence || "",
  });
  latestPack = session.pack || buildSessionPack(getBriefState());
  renderPack(latestPack);
  bugDrafts = [...(session.bugDrafts || [])];
  clearDraftEditor(true);
  renderDraftList();
  renderHistory();
}

function loadDraftIntoEditor(draft) {
  activeDraftId = draft.id;
  document.querySelector("#bugTitle").value = draft.title || "";
  document.querySelector("#steps").value = draft.steps || "";
  document.querySelector("#expected").value = draft.expected || "";
  document.querySelector("#actual").value = draft.actual || "";
  document.querySelector("#severity").value = draft.severity || "High";
  document.querySelector("#draftStatus").value = draft.status || "New";
  renderDraftList();
}

function clearDraftEditor(keepSavedDrafts) {
  activeDraftId = null;
  document.querySelector("#bugTitle").value = "";
  document.querySelector("#steps").value = "";
  document.querySelector("#expected").value = "";
  document.querySelector("#actual").value = "";
  document.querySelector("#severity").value = "High";
  document.querySelector("#draftStatus").value = "New";
  if (!keepSavedDrafts) bugDrafts = [];
  renderDraftList();
}

function buildMarkdown(sessionRecord) {
  const { pack, session, bugDrafts: drafts } = sessionRecord;
  return `# Exploratory QA Session: ${sessionRecord.featureName}

## Mission
${pack.mission}

## Feature Summary
${sessionRecord.summary}

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

## Session Metadata
- Tester: ${session.testerName || "_Not provided_"}
- Build: ${session.buildRef || "_Not provided_"}
- Tags: ${(session.tags || []).join(", ") || "_Not provided_"}

## Session Goal
${session.sessionGoal || "_Not provided_"}

## Coverage Notes
${session.coverageNotes || "_Not provided_"}

## Observations
${session.observations || "_Not provided_"}

## Evidence
${session.evidence || "_Not provided_"}

## Bug Drafts
${drafts.length ? drafts.map((draft) => `### ${draft.title}
- Severity: ${draft.severity}
- Steps: ${draft.steps || "_Not provided_"}
- Expected: ${draft.expected || "_Not provided_"}
- Actual: ${draft.actual || "_Not provided_"}`).join("\n\n") : "_No saved bug drafts_"}
`;
}

function buildJiraDraft(sessionRecord, draft) {
  return `Summary: ${draft.title}
Issue Type: Bug
Priority Hint: ${draft.severity}

Description:
h2. Context
* Feature: ${sessionRecord.featureName}
* Build: ${sessionRecord.session.buildRef || "Not provided"}
* Tester: ${sessionRecord.session.testerName || "Not provided"}
* Tags: ${(sessionRecord.session.tags || []).join(", ") || "Not provided"}

h2. Steps to Reproduce
${toWikiList(draft.steps)}

h2. Expected Result
${draft.expected || "Not provided"}

h2. Actual Result
${draft.actual || "Not provided"}

h2. Exploratory Notes
${sessionRecord.session.observations || "Not provided"}

h2. Evidence
${sessionRecord.session.evidence || "Not provided"}
`;
}

function buildShareSummary(sessionRecord) {
  return [
    `Feature: ${sessionRecord.featureName}`,
    `Risk: ${sessionRecord.pack.riskLevel}`,
    `Topics: ${sessionRecord.pack.topics.join(", ")}`,
    `Top charters: ${sessionRecord.pack.charters.slice(0, 3).join(" | ")}`,
    `Session goal: ${sessionRecord.session.sessionGoal || "Not provided"}`,
    `Saved bug drafts: ${sessionRecord.bugDrafts.length}`,
  ].join("\n");
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

function createPersonaCharter(personas) {
  const values = parseCsvish(personas);
  return values.length
    ? `Compare the experience across personas: ${values.join(", ")}. Focus on missing permissions, unclear messaging, and inconsistent defaults.`
    : "";
}

function createPlatformCharter(platforms) {
  const values = parseCsvish(platforms);
  return values.length
    ? `Spot-check the flow on ${values.join(", ")} and note layout, timing, or browser-specific inconsistencies.`
    : "";
}

function createRiskCharter(risks) {
  const values = parseCsvish(risks);
  return values.length
    ? `Deliberately stress the known risk areas: ${values.join(", ")}. Confirm both technical behavior and user-facing recovery guidance.`
    : "";
}

function bindAutosave() {
  document.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("input", persistDraft);
    field.addEventListener("change", persistDraft);
  });
}

function persistDraft() {
  const draft = {
    ...getBriefState(),
    ...collectSessionState(),
    ...collectBugForm(),
    bugDrafts,
    currentSessionId,
    activeDraftId,
  };
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

function hydrateDraft() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;

  try {
    const draft = JSON.parse(saved);
    fillAllFields(draft);
    bugDrafts = draft.bugDrafts || [];
    currentSessionId = draft.currentSessionId || null;
    activeDraftId = draft.activeDraftId || null;
    latestPack = draft.featureName && draft.summary ? buildSessionPack(draft) : null;
    if (latestPack) renderPack(latestPack);
    renderDraftList();
    if (activeDraftId) {
      const active = bugDrafts.find((item) => item.id === activeDraftId);
      if (active) loadDraftIntoEditor(active);
    }
    if (draft.featureName || bugDrafts.length) {
      statusMessage.textContent = "Restored your saved draft.";
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function fillAllFields(values) {
  Object.entries(values).forEach(([key, value]) => {
    const node = document.querySelector(`#${key}`);
    if (!node) return;
    node.value = value;
  });
  persistDraft();
}

function clearSessionFields() {
  [
    "#testerName",
    "#buildRef",
    "#sessionTags",
    "#sessionGoal",
    "#coverageNotes",
    "#observations",
    "#evidence",
  ].forEach((selector) => {
    const node = document.querySelector(selector);
    if (node) node.value = "";
  });
}

function bindChipInputs() {
  document.querySelectorAll(".chip-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      const button = event.target.closest(".chip");
      if (!button) return;
      const input = document.querySelector(`#${row.dataset.target}`);
      const currentItems = parseCsvish(input.value);
      const nextValue = button.textContent.trim();
      if (!currentItems.includes(nextValue)) currentItems.push(nextValue);
      input.value = currentItems.join(", ");
      persistDraft();
    });
  });
}

function updateTemplatePreview() {
  const templateName = riskTemplate.value;
  templatePreview.textContent = templateName
    ? riskTemplates[templateName].join(", ")
    : "Select a template to preview suggested risks.";
}

function updateFeatureTemplatePreview() {
  const templateName = featureTemplate.value;
  if (!templateName) {
    featureTemplatePreview.textContent = "Select a workflow template to prefill the brief.";
    return;
  }

  const template = featureTemplates[templateName];
  featureTemplatePreview.textContent = `${template.featureName}: ${template.summary}`;
}

function getSelectedOrCurrentBugDraft() {
  if (activeDraftId) {
    const selected = bugDrafts.find((draft) => draft.id === activeDraftId);
    if (selected) return selected;
  }
  const current = collectBugForm();
  return current.title ? current : bugDrafts[0];
}

function loadSessions() {
  try {
    return sortSessions(JSON.parse(localStorage.getItem(sessionsKey) || "[]"));
  } catch {
    return [];
  }
}

function sortSessions(items) {
  return [...items].sort((left, right) => new Date(right.savedAt || 0) - new Date(left.savedAt || 0));
}

function formatHistoryMeta(session) {
  const parts = [
    session.session?.buildRef || "No build",
    session.session?.testerName || "No tester",
    `${(session.bugDrafts || []).length} bug draft${(session.bugDrafts || []).length === 1 ? "" : "s"}`,
    formatDate(session.savedAt),
  ];
  return parts.join(" • ");
}

function formatDate(value) {
  if (!value) return "unsaved";
  return new Date(value).toLocaleString();
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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
  if (!copied) throw new Error("copy failed");
}

function parseCsvish(input = "") {
  return input.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

function unique(items) {
  return [...new Set(items)];
}

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function labelForTemplate(name) {
  return name === "fileHandling" ? "File handling" : name.charAt(0).toUpperCase() + name.slice(1);
}

function statusClass(status = "New") {
  return `status-${status.toLowerCase().replaceAll(/\s+/g, "-")}`;
}

function valueOf(selector) {
  return document.querySelector(selector).value.trim();
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toWikiList(text) {
  const lines = (text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length ? lines.map((line) => `# ${line.replace(/^\d+\.\s*/, "")}`).join("\n") : "Not provided";
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
