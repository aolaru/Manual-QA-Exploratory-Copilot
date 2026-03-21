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
const homeWorkspace = document.querySelector("#homeWorkspace");
const exploratoryWorkspace = document.querySelector("#exploratoryWorkspace");
const sqlWorkspace = document.querySelector("#sqlWorkspace");
const apiWorkspace = document.querySelector("#apiWorkspace");
const showHomeBtn = document.querySelector("#showHomeBtn");
const showExploratoryBtn = document.querySelector("#showExploratoryBtn");
const showSqlBtn = document.querySelector("#showSqlBtn");
const showApiBtn = document.querySelector("#showApiBtn");
const exportDataBtn = document.querySelector("#exportDataBtn");
const importDataBtn = document.querySelector("#importDataBtn");
const importDataInput = document.querySelector("#importDataInput");
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
const sqlName = document.querySelector("#sqlName");
const sqlCategory = document.querySelector("#sqlCategory");
const sqlTags = document.querySelector("#sqlTags");
const sqlDialect = document.querySelector("#sqlDialect");
const sqlSafety = document.querySelector("#sqlSafety");
const sqlQueryText = document.querySelector("#sqlQueryText");
const sqlNotes = document.querySelector("#sqlNotes");
const sqlLinks = document.querySelector("#sqlLinks");
const activeSqlLabel = document.querySelector("#activeSqlLabel");
const activeSqlStamp = document.querySelector("#activeSqlStamp");
const resetSqlBtn = document.querySelector("#resetSqlBtn");
const saveSqlBtn = document.querySelector("#saveSqlBtn");
const sqlSearch = document.querySelector("#sqlSearch");
const sqlCount = document.querySelector("#sqlCount");
const sqlList = document.querySelector("#sqlList");
const apiName = document.querySelector("#apiName");
const apiMethod = document.querySelector("#apiMethod");
const apiEnvironment = document.querySelector("#apiEnvironment");
const apiEndpoint = document.querySelector("#apiEndpoint");
const apiTags = document.querySelector("#apiTags");
const postmanCollectionName = document.querySelector("#postmanCollectionName");
const swaggerFileInput = document.querySelector("#swaggerFileInput");
const generatePostmanBtn = document.querySelector("#generatePostmanBtn");
const downloadPostmanBtn = document.querySelector("#downloadPostmanBtn");
const postmanSummary = document.querySelector("#postmanSummary");
const apiAuth = document.querySelector("#apiAuth");
const apiHeaders = document.querySelector("#apiHeaders");
const apiBody = document.querySelector("#apiBody");
const apiExpectedStatus = document.querySelector("#apiExpectedStatus");
const apiCaseType = document.querySelector("#apiCaseType");
const apiChecks = document.querySelector("#apiChecks");
const apiNotes = document.querySelector("#apiNotes");
const apiLinks = document.querySelector("#apiLinks");
const activeApiLabel = document.querySelector("#activeApiLabel");
const activeApiStamp = document.querySelector("#activeApiStamp");
const resetApiBtn = document.querySelector("#resetApiBtn");
const saveApiBtn = document.querySelector("#saveApiBtn");
const apiSearch = document.querySelector("#apiSearch");
const apiCount = document.querySelector("#apiCount");
const apiList = document.querySelector("#apiList");
const homeSessionCount = document.querySelector("#homeSessionCount");
const homeSqlCount = document.querySelector("#homeSqlCount");
const homeApiCount = document.querySelector("#homeApiCount");
const homeBackupHint = document.querySelector("#homeBackupHint");
const recentActivityList = document.querySelector("#recentActivityList");
const tagSummaryList = document.querySelector("#tagSummaryList");

const storageKey = "field-notes-qa-copilot-draft";
const sessionsKey = "field-notes-qa-copilot-sessions";
const sqlQueriesKey = "field-notes-qa-sql-queries";
const apiCasesKey = "field-notes-qa-api-cases";

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
let sqlQueries = loadSqlQueries();
let activeSqlId = null;
let apiCases = loadApiCases();
let activeApiId = null;
let uploadedOpenApiSpec = null;
let generatedPostmanCollection = null;

hydrateDraft();
bindAutosave();
bindChipInputs();
renderHistory();
renderDraftList();
updateTemplatePreview();
updateFeatureTemplatePreview();
renderSqlQueries();
renderApiCases();
renderDashboard();
switchWorkspace("home");

showHomeBtn.addEventListener("click", () => switchWorkspace("home"));
showExploratoryBtn.addEventListener("click", () => switchWorkspace("exploratory"));
showSqlBtn.addEventListener("click", () => switchWorkspace("sql"));
showApiBtn.addEventListener("click", () => switchWorkspace("api"));

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
  renderDashboard();
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
  renderDashboard();
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

saveSqlBtn.addEventListener("click", () => {
  const query = collectSqlForm();
  if (!query.name || !query.sql) {
    statusMessage.textContent = "Add a query name and SQL text before saving.";
    return;
  }

  if (activeSqlId) {
    sqlQueries = sqlQueries.map((item) =>
      item.id === activeSqlId ? { ...item, ...query, updatedAt: new Date().toISOString() } : item
    );
    statusMessage.textContent = "SQL query updated.";
  } else {
    const nextQuery = {
      ...query,
      id: createId("sql"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sqlQueries.unshift(nextQuery);
    activeSqlId = nextQuery.id;
    statusMessage.textContent = "SQL query saved.";
  }

  persistSqlQueries();
  renderSqlQueries();
  renderDashboard();
});

resetSqlBtn.addEventListener("click", () => {
  clearSqlForm();
  statusMessage.textContent = "New SQL query ready.";
});

sqlSearch.addEventListener("input", renderSqlQueries);

saveApiBtn.addEventListener("click", () => {
  const apiCase = collectApiForm();
  if (!apiCase.name || !apiCase.endpoint) {
    statusMessage.textContent = "Add an API case name and endpoint before saving.";
    return;
  }

  if (activeApiId) {
    apiCases = apiCases.map((item) =>
      item.id === activeApiId ? { ...item, ...apiCase, updatedAt: new Date().toISOString() } : item
    );
    statusMessage.textContent = "API case updated.";
  } else {
    const nextCase = {
      ...apiCase,
      id: createId("api"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    apiCases.unshift(nextCase);
    activeApiId = nextCase.id;
    statusMessage.textContent = "API case saved.";
  }

  persistApiCases();
  renderApiCases();
  renderDashboard();
});

resetApiBtn.addEventListener("click", () => {
  clearApiForm();
  statusMessage.textContent = "New API case ready.";
});

apiSearch.addEventListener("input", renderApiCases);
exportDataBtn.addEventListener("click", exportWorkspaceBackup);
importDataBtn.addEventListener("click", () => importDataInput.click());
importDataInput.addEventListener("change", importWorkspaceBackup);
generatePostmanBtn.addEventListener("click", generatePostmanCollectionFromUpload);
downloadPostmanBtn.addEventListener("click", downloadGeneratedPostmanCollection);

function getBriefState() {
  return Object.fromEntries(new FormData(form).entries());
}

function collectSessionState() {
  return {
    testerName: valueOf("#testerName"),
    buildRef: valueOf("#buildRef"),
    sessionTags: valueOf("#sessionTags"),
    sessionLinks: valueOf("#sessionLinks"),
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

function collectSqlForm() {
  return {
    name: sqlName.value.trim(),
    category: sqlCategory.value.trim(),
    tags: sqlTags.value.trim(),
    dialect: sqlDialect.value,
    safety: sqlSafety.value,
    sql: sqlQueryText.value.trim(),
    notes: sqlNotes.value.trim(),
    links: sqlLinks.value.trim(),
  };
}

function collectApiForm() {
  return {
    name: apiName.value.trim(),
    method: apiMethod.value,
    environment: apiEnvironment.value.trim(),
    endpoint: apiEndpoint.value.trim(),
    tags: apiTags.value.trim(),
    auth: apiAuth.value.trim(),
    headers: apiHeaders.value.trim(),
    body: apiBody.value.trim(),
    expectedStatus: apiExpectedStatus.value.trim(),
    caseType: apiCaseType.value,
    checks: apiChecks.value.trim(),
    notes: apiNotes.value.trim(),
    links: apiLinks.value.trim(),
  };
}

function generatePostmanCollectionFromUpload() {
  const [file] = swaggerFileInput.files || [];
  if (!file) {
    statusMessage.textContent = "Choose a Swagger / OpenAPI JSON file first.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      uploadedOpenApiSpec = JSON.parse(String(reader.result || "{}"));
      generatedPostmanCollection = convertOpenApiToPostmanCollection(
        uploadedOpenApiSpec,
        postmanCollectionName.value.trim()
      );
      renderPostmanSummary(generatedPostmanCollection.summary);
      statusMessage.textContent = "Postman collection generated from the uploaded OpenAPI file.";
    } catch (error) {
      generatedPostmanCollection = null;
      renderPostmanSummary(null, error instanceof Error ? error.message : "Invalid OpenAPI file.");
      statusMessage.textContent = "Postman generation failed. Check that the uploaded file is valid OpenAPI / Swagger JSON.";
    }
  };
  reader.readAsText(file);
}

function downloadGeneratedPostmanCollection() {
  if (!generatedPostmanCollection) {
    statusMessage.textContent = "Generate a Postman collection first.";
    return;
  }

  downloadText(
    `postman-${slugify(generatedPostmanCollection.collection.info.name || "collection")}.json`,
    JSON.stringify(generatedPostmanCollection.collection, null, 2)
  );
  statusMessage.textContent = "Postman collection download created.";
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
      links: parseCsvish(valueOf("#sessionLinks")),
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
        ${renderLinksRow(session.session?.links)}
      </div>
      <div class="inline-actions">
        <button type="button" class="ghost small-btn" data-action="load" data-id="${session.id}">Open</button>
        <button type="button" class="ghost small-btn" data-action="delete" data-id="${session.id}">Delete</button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function renderSqlQueries() {
  const query = sqlSearch.value.trim().toLowerCase();
  const filtered = sqlQueries.filter((item) => {
    if (!query) return true;
    return [item.name, item.category, item.tags, item.dialect, item.notes, item.links, item.sql]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  sqlCount.textContent = `${filtered.length} quer${filtered.length === 1 ? "y" : "ies"}`;
  sqlList.replaceChildren();

  if (!filtered.length) {
    sqlList.classList.add("empty-list");
    sqlList.innerHTML = `<p class="microcopy">No saved SQL queries yet.</p>`;
    activeSqlLabel.textContent = "New query";
    activeSqlStamp.textContent = "Not saved yet";
    return;
  }

  sqlList.classList.remove("empty-list");
  filtered.forEach((item) => {
    const article = document.createElement("article");
    article.className = `saved-item ${item.id === activeSqlId ? "is-active" : ""}`;
    article.innerHTML = `
      <div>
        <div class="saved-title-row">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="status-pill ${sqlSafetyClass(item.safety)}">${escapeHtml(item.safety)}</span>
        </div>
        <p class="saved-meta">${escapeHtml(item.dialect)} • ${escapeHtml(item.category || "uncategorized")} • ${escapeHtml(formatDate(item.updatedAt))}</p>
        <p class="saved-submeta">${escapeHtml(item.notes || "No notes added.")}</p>
        <div class="tag-row">${parseCsvish(item.tags || "").map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        ${renderLinksRow(item.links)}
        <pre class="sql-snippet">${escapeHtml(trimSqlPreview(item.sql))}</pre>
      </div>
      <div class="inline-actions">
        <button type="button" class="ghost small-btn" data-action="edit" data-id="${item.id}">Edit</button>
        <button type="button" class="ghost small-btn" data-action="copy" data-id="${item.id}">Copy</button>
        <button type="button" class="ghost small-btn" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;
    sqlList.appendChild(article);
  });

  const active = sqlQueries.find((item) => item.id === activeSqlId);
  activeSqlLabel.textContent = active ? `Editing: ${active.name}` : "New query";
  activeSqlStamp.textContent = active ? `${active.dialect} • ${formatDate(active.updatedAt)}` : "Not saved yet";
}

function renderApiCases() {
  const query = apiSearch.value.trim().toLowerCase();
  const filtered = apiCases.filter((item) => {
    if (!query) return true;
    return [
      item.name,
      item.method,
      item.environment,
      item.endpoint,
      item.tags,
      item.notes,
      item.checks,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  apiCount.textContent = `${filtered.length} case${filtered.length === 1 ? "" : "s"}`;
  apiList.replaceChildren();

  if (!filtered.length) {
    apiList.classList.add("empty-list");
    apiList.innerHTML = `<p class="microcopy">No saved API cases yet.</p>`;
    activeApiLabel.textContent = "New API case";
    activeApiStamp.textContent = "Not saved yet";
    return;
  }

  apiList.classList.remove("empty-list");
  filtered.forEach((item) => {
    const article = document.createElement("article");
    article.className = `saved-item ${item.id === activeApiId ? "is-active" : ""}`;
    article.innerHTML = `
      <div>
        <div class="saved-title-row">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="status-pill ${statusClass(item.caseType || "Positive")}">${escapeHtml(item.caseType || "Positive")}</span>
        </div>
        <p class="saved-meta">${escapeHtml(item.method)} ${escapeHtml(item.endpoint)} • ${escapeHtml(item.environment || "no env")} • ${escapeHtml(formatDate(item.updatedAt))}</p>
        <p class="saved-submeta">${escapeHtml(item.notes || "No notes added.")}</p>
        <div class="tag-row">${parseCsvish(item.tags || "").map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        ${renderLinksRow(item.links)}
        <pre class="sql-snippet">${escapeHtml(trimApiPreview(item))}</pre>
      </div>
      <div class="inline-actions">
        <button type="button" class="ghost small-btn" data-action="edit" data-id="${item.id}">Edit</button>
        <button type="button" class="ghost small-btn" data-action="copy" data-id="${item.id}">Copy</button>
        <button type="button" class="ghost small-btn" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;
    apiList.appendChild(article);
  });

  const active = apiCases.find((item) => item.id === activeApiId);
  activeApiLabel.textContent = active ? `Editing: ${active.name}` : "New API case";
  activeApiStamp.textContent = active ? `${active.method} • ${formatDate(active.updatedAt)}` : "Not saved yet";
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
    renderDashboard();
    statusMessage.textContent = "Saved session deleted.";
  }
});

sqlList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const item = sqlQueries.find((query) => query.id === id);
  if (!item) return;

  if (action === "edit") {
    loadSqlIntoForm(item);
    statusMessage.textContent = "SQL query loaded.";
  } else if (action === "copy") {
    try {
      await copyToClipboard(item.sql);
      statusMessage.textContent = "SQL query copied.";
    } catch {
      statusMessage.textContent = "Clipboard access failed for SQL query copy.";
    }
  } else if (action === "delete") {
    sqlQueries = sqlQueries.filter((query) => query.id !== id);
    if (activeSqlId === id) clearSqlForm();
    persistSqlQueries();
    renderSqlQueries();
    renderDashboard();
    statusMessage.textContent = "SQL query deleted.";
  }
});

apiList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const item = apiCases.find((apiCase) => apiCase.id === id);
  if (!item) return;

  if (action === "edit") {
    loadApiIntoForm(item);
    statusMessage.textContent = "API case loaded.";
  } else if (action === "copy") {
    try {
      await copyToClipboard(formatApiCaseForCopy(item));
      statusMessage.textContent = "API case copied.";
    } catch {
      statusMessage.textContent = "Clipboard access failed for API case copy.";
    }
  } else if (action === "delete") {
    apiCases = apiCases.filter((apiCase) => apiCase.id !== id);
    if (activeApiId === id) clearApiForm();
    persistApiCases();
    renderApiCases();
    renderDashboard();
    statusMessage.textContent = "API case deleted.";
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
    sessionLinks: (session.session?.links || []).join(", "),
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

function loadSqlIntoForm(item) {
  activeSqlId = item.id;
  sqlName.value = item.name || "";
  sqlCategory.value = item.category || "";
  sqlTags.value = item.tags || "";
  sqlDialect.value = item.dialect || "PostgreSQL";
  sqlSafety.value = item.safety || "Read only";
  sqlQueryText.value = item.sql || "";
  sqlNotes.value = item.notes || "";
  sqlLinks.value = item.links || "";
  renderSqlQueries();
}

function loadApiIntoForm(item) {
  activeApiId = item.id;
  apiName.value = item.name || "";
  apiMethod.value = item.method || "POST";
  apiEnvironment.value = item.environment || "";
  apiEndpoint.value = item.endpoint || "";
  apiTags.value = item.tags || "";
  apiAuth.value = item.auth || "";
  apiHeaders.value = item.headers || "";
  apiBody.value = item.body || "";
  apiExpectedStatus.value = item.expectedStatus || "";
  apiCaseType.value = item.caseType || "Positive";
  apiChecks.value = item.checks || "";
  apiNotes.value = item.notes || "";
  apiLinks.value = item.links || "";
  renderApiCases();
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

function clearSqlForm() {
  activeSqlId = null;
  sqlName.value = "";
  sqlCategory.value = "";
  sqlTags.value = "";
  sqlDialect.value = "PostgreSQL";
  sqlSafety.value = "Read only";
  sqlQueryText.value = "";
  sqlNotes.value = "";
  sqlLinks.value = "";
  renderSqlQueries();
}

function clearApiForm() {
  activeApiId = null;
  apiName.value = "";
  apiMethod.value = "POST";
  apiEnvironment.value = "";
  apiEndpoint.value = "";
  apiTags.value = "";
  apiAuth.value = "";
  apiHeaders.value = "";
  apiBody.value = "";
  apiExpectedStatus.value = "";
  apiCaseType.value = "Positive";
  apiChecks.value = "";
  apiNotes.value = "";
  apiLinks.value = "";
  renderApiCases();
}

function renderPostmanSummary(summary, errorMessage = "") {
  if (errorMessage) {
    postmanSummary.textContent = errorMessage;
    return;
  }

  if (!summary) {
    postmanSummary.textContent = "No OpenAPI file loaded yet.";
    return;
  }

  postmanSummary.textContent =
    `${summary.name} • ${summary.requestCount} requests • ${summary.folderCount} folders • ` +
    `base URL ${summary.baseUrl || "not detected"} • auth ${summary.authSchemes || "not detected"}`;
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
- Related links: ${(session.links || []).join(", ") || "_Not provided_"}

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
    "#sessionLinks",
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

function loadSqlQueries() {
  try {
    return JSON.parse(localStorage.getItem(sqlQueriesKey) || "[]");
  } catch {
    return [];
  }
}

function persistSqlQueries() {
  localStorage.setItem(sqlQueriesKey, JSON.stringify(sqlQueries));
}

function loadApiCases() {
  try {
    return JSON.parse(localStorage.getItem(apiCasesKey) || "[]");
  } catch {
    return [];
  }
}

function persistApiCases() {
  localStorage.setItem(apiCasesKey, JSON.stringify(apiCases));
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

function sqlSafetyClass(safety = "Read only") {
  if (safety === "Read only") return "status-new";
  if (safety === "Setup / Insert") return "status-ready-to-file";
  return "status-filed";
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

function trimSqlPreview(sql) {
  const normalized = sql.trim();
  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 180)}...`;
}

function trimApiPreview(item) {
  const preview = [
    `${item.method} ${item.endpoint}`,
    item.expectedStatus ? `expected ${item.expectedStatus}` : "",
    item.checks || "",
  ]
    .filter(Boolean)
    .join("\n");
  return preview.length <= 180 ? preview : `${preview.slice(0, 180)}...`;
}

function formatApiCaseForCopy(item) {
  return [
    `Name: ${item.name}`,
    `Method: ${item.method}`,
    `Endpoint: ${item.endpoint}`,
    `Environment: ${item.environment || "Not provided"}`,
    `Tags: ${item.tags || "Not provided"}`,
    `Auth: ${item.auth || "Not provided"}`,
    `Expected status: ${item.expectedStatus || "Not provided"}`,
    `Case type: ${item.caseType || "Not provided"}`,
    `Related links: ${item.links || "Not provided"}`,
    "",
    "Headers:",
    item.headers || "Not provided",
    "",
    "Body:",
    item.body || "Not provided",
    "",
    "Checks:",
    item.checks || "Not provided",
    "",
    "Notes:",
    item.notes || "Not provided",
  ].join("\n");
}

function renderDashboard() {
  homeSessionCount.textContent = `${sessions.length} session${sessions.length === 1 ? "" : "s"} saved`;
  homeSqlCount.textContent = `${sqlQueries.length} SQL quer${sqlQueries.length === 1 ? "y" : "ies"} saved`;
  homeApiCount.textContent = `${apiCases.length} API case${apiCases.length === 1 ? "" : "s"} saved`;
  homeBackupHint.textContent = `Last backup target: JSON export for ${sessions.length + sqlQueries.length + apiCases.length} records`;

  renderRecentActivity();
  renderTagSummary();
}

function renderRecentActivity() {
  const activity = [
    ...sessions.map((session) => ({
      type: "Session",
      title: session.featureName,
      meta: formatHistoryMeta(session),
      detail: session.summary,
      updatedAt: session.savedAt || session.updatedAt || session.createdAt,
    })),
    ...sqlQueries.map((item) => ({
      type: "SQL",
      title: item.name,
      meta: `${item.dialect} • ${item.category || "uncategorized"} • ${formatDate(item.updatedAt)}`,
      detail: item.notes || trimSqlPreview(item.sql),
      updatedAt: item.updatedAt || item.createdAt,
    })),
    ...apiCases.map((item) => ({
      type: "API",
      title: item.name,
      meta: `${item.method} ${item.endpoint} • ${item.environment || "no env"} • ${formatDate(item.updatedAt)}`,
      detail: item.notes || item.checks || "No notes added.",
      updatedAt: item.updatedAt || item.createdAt,
    })),
  ]
    .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0))
    .slice(0, 8);

  recentActivityList.replaceChildren();
  if (!activity.length) {
    recentActivityList.classList.add("empty-list");
    recentActivityList.innerHTML = `<p class="microcopy">No saved activity yet.</p>`;
    return;
  }

  recentActivityList.classList.remove("empty-list");
  activity.forEach((item) => {
    const article = document.createElement("article");
    article.className = "saved-item";
    article.innerHTML = `
      <div>
        <div class="saved-title-row">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="pill activity-type">${escapeHtml(item.type)}</span>
        </div>
        <p class="saved-meta">${escapeHtml(item.meta)}</p>
        <p class="saved-submeta">${escapeHtml(item.detail)}</p>
      </div>
    `;
    recentActivityList.appendChild(article);
  });
}

function renderTagSummary() {
  const tagCounts = new Map();
  [
    ...sessions.flatMap((session) => session.session?.tags || []),
    ...sqlQueries.flatMap((item) => parseCsvish(item.tags || "")),
    ...apiCases.flatMap((item) => parseCsvish(item.tags || "")),
  ].forEach((tag) => {
    const key = tag.trim();
    if (!key) return;
    tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
  });

  const sortedTags = [...tagCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 12);

  tagSummaryList.replaceChildren();
  if (!sortedTags.length) {
    tagSummaryList.classList.add("empty-list");
    tagSummaryList.innerHTML = `<p class="microcopy">No shared tags yet.</p>`;
    return;
  }

  tagSummaryList.classList.remove("empty-list");
  sortedTags.forEach(([tag, count]) => {
    const article = document.createElement("article");
    article.className = "saved-item";
    article.innerHTML = `
      <div class="saved-title-row">
        <strong>${escapeHtml(tag)}</strong>
        <span class="pill">${count} use${count === 1 ? "" : "s"}</span>
      </div>
    `;
    tagSummaryList.appendChild(article);
  });
}

function renderLinksRow(links) {
  const items = Array.isArray(links) ? links : parseCsvish(links || "");
  if (!items.length) return "";
  return `<p class="saved-submeta"><strong>Related:</strong> ${escapeHtml(items.join(" • "))}</p>`;
}

function convertOpenApiToPostmanCollection(spec, collectionNameOverride = "") {
  const version = detectOpenApiVersion(spec);
  const baseUrl = deriveBaseUrl(spec, version);
  const grouped = new Map();
  const requests = [];

  Object.entries(spec.paths || {}).forEach(([pathName, pathItem]) => {
    Object.entries(pathItem || {}).forEach(([method, operation]) => {
      const normalizedMethod = method.toUpperCase();
      if (!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].includes(normalizedMethod)) return;
      const request = buildPostmanRequest({
        version,
        spec,
        pathName,
        method: normalizedMethod,
        operation: operation || {},
        pathItem: pathItem || {},
        baseUrl,
      });
      requests.push(request.summary);
      const tagName = request.tag;
      if (!grouped.has(tagName)) grouped.set(tagName, []);
      grouped.get(tagName).push(request.item);
    });
  });

  const collectionName =
    collectionNameOverride ||
    spec.info?.title ||
    spec.swagger ||
    spec.openapi ||
    "Generated QA API Collection";

  const item = [...grouped.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([tag, items]) => ({
      name: tag,
      item: items.sort((left, right) => left.name.localeCompare(right.name)),
    }));

  return {
    collection: {
      info: {
        name: collectionName,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        description: buildCollectionDescription(spec, requests),
      },
      variable: [
        {
          key: "baseUrl",
          value: baseUrl || "https://example.com",
          type: "string",
        },
      ],
      item,
    },
    summary: {
      name: collectionName,
      requestCount: requests.length,
      folderCount: item.length,
      baseUrl,
      authSchemes: describeAuthSchemes(spec, version),
    },
  };
}

function buildPostmanRequest({ version, spec, pathName, method, operation, pathItem, baseUrl }) {
  const tag = operation.tags?.[0] || "Untagged";
  const parameters = collectOperationParameters(version, operation, pathItem);
  const pathParams = parameters.filter((parameter) => parameter.in === "path");
  const queryParams = parameters
    .filter((parameter) => parameter.in === "query")
    .map((parameter) => ({
      key: parameter.name,
      value: sampleValueFromParameter(spec, parameter),
      description: parameter.description || "",
      disabled: !parameter.required,
    }));
  const headerParams = parameters
    .filter((parameter) => parameter.in === "header")
    .map((parameter) => ({
      key: parameter.name,
      value: sampleValueFromParameter(spec, parameter),
      type: "text",
      description: parameter.description || "",
      disabled: !parameter.required,
    }));

  const resolvedPath = pathName.replace(/\{([^}]+)\}/g, "{{$1}}");
  const header = [
    ...headerParams,
    ...deriveContentHeaders(version, operation, method),
  ];

  const auth = buildAuthBlock(spec, operation, version);
  const body = buildRequestBody(version, spec, operation, method);
  const expectedStatus = deriveExpectedStatus(operation.responses || {});

  const request = {
    method,
    header,
    url: {
      raw: `{{baseUrl}}${resolvedPath}`,
      host: ["{{baseUrl}}"],
      path: resolvedPath.replace(/^\//, "").split("/").filter(Boolean),
      query: queryParams,
      variable: pathParams.map((parameter) => ({
        key: parameter.name,
        value: sampleValueFromParameter(spec, parameter),
        description: parameter.description || "",
      })),
    },
    description: buildRequestDescription(operation, expectedStatus),
  };
  if (auth) request.auth = auth;
  if (body) request.body = body;

  return {
    tag,
    summary: {
      tag,
      method,
      pathName,
      expectedStatus,
    },
    item: {
      name: operation.summary || operation.operationId || `${method} ${pathName}`,
      request,
      event: buildPostmanTests(expectedStatus),
      response: [],
    },
  };
}

function buildCollectionDescription(spec, requests) {
  return [
    spec.info?.description || "",
    `Generated for QA from OpenAPI / Swagger.`,
    `Requests: ${requests.length}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildRequestDescription(operation, expectedStatus) {
  return [
    operation.description || operation.summary || "",
    expectedStatus ? `Expected status: ${expectedStatus}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPostmanTests(expectedStatus) {
  if (!expectedStatus) return [];
  return [
    {
      listen: "test",
      script: {
        type: "text/javascript",
        exec: [
          `pm.test("Status code is ${expectedStatus}", function () {`,
          `  pm.response.to.have.status(${Number(expectedStatus)});`,
          `});`,
        ],
      },
    },
  ];
}

function buildAuthBlock(spec, operation, version) {
  const security = operation.security || spec.security || [];
  if (!security.length) return null;
  const schemeName = Object.keys(security[0])[0];
  const scheme = getSecurityScheme(spec, version, schemeName);
  if (!scheme) return null;

  if (scheme.type === "http" && scheme.scheme === "bearer") {
    return { type: "bearer", bearer: [{ key: "token", value: "{{bearerToken}}", type: "string" }] };
  }
  if (scheme.type === "apiKey") {
    return {
      type: "apikey",
      apikey: [
        { key: "key", value: scheme.name || schemeName, type: "string" },
        { key: "value", value: `{{${schemeName}}}`, type: "string" },
        { key: "in", value: scheme.in || "header", type: "string" },
      ],
    };
  }
  if (scheme.type === "http" && scheme.scheme === "basic") {
    return {
      type: "basic",
      basic: [
        { key: "username", value: "{{username}}", type: "string" },
        { key: "password", value: "{{password}}", type: "string" },
      ],
    };
  }
  return null;
}

function buildRequestBody(version, spec, operation, method) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return undefined;

  if (version === 3) {
    const content = operation.requestBody?.content || {};
    const mediaType = Object.keys(content)[0];
    if (!mediaType) return undefined;
    const media = content[mediaType];
    const bodyExample = media.example || media.examples?.default?.value || sampleFromSchema(spec, media.schema);
    return buildBodyFromMediaType(mediaType, bodyExample);
  }

  const bodyParam = (operation.parameters || []).find((parameter) => parameter.in === "body");
  if (!bodyParam) return undefined;
  const bodyExample = bodyParam.example || sampleFromSchema(spec, bodyParam.schema);
  return buildBodyFromMediaType("application/json", bodyExample);
}

function buildBodyFromMediaType(mediaType, exampleValue) {
  const value = typeof exampleValue === "string" ? exampleValue : JSON.stringify(exampleValue ?? {}, null, 2);
  if (mediaType.includes("json")) {
    return { mode: "raw", raw: value, options: { raw: { language: "json" } } };
  }
  return { mode: "raw", raw: value };
}

function collectOperationParameters(version, operation, pathItem) {
  const merged = [...(pathItem.parameters || []), ...(operation.parameters || [])];
  if (version === 3 && operation.requestBody) return merged;
  return merged;
}

function deriveContentHeaders(version, operation, method) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return [];
  if (version === 3) {
    const mediaType = Object.keys(operation.requestBody?.content || {})[0];
    return mediaType ? [{ key: "Content-Type", value: mediaType, type: "text" }] : [];
  }

  const consumes = operation.consumes || [];
  return consumes[0] ? [{ key: "Content-Type", value: consumes[0], type: "text" }] : [];
}

function deriveExpectedStatus(responses) {
  const preferred = Object.keys(responses).find((code) => /^2\d\d$/.test(code));
  return preferred || Object.keys(responses)[0] || "";
}

function detectOpenApiVersion(spec) {
  if (spec.openapi) return 3;
  if (spec.swagger) return 2;
  throw new Error("Unsupported spec. Upload OpenAPI 3.x or Swagger 2.0 JSON.");
}

function deriveBaseUrl(spec, version) {
  if (version === 3) {
    const url = spec.servers?.[0]?.url || "";
    return url.replace(/\{([^}]+)\}/g, "{{$1}}");
  }

  const scheme = spec.schemes?.[0] || "https";
  const host = spec.host || "example.com";
  const basePath = spec.basePath || "";
  return `${scheme}://${host}${basePath}`;
}

function describeAuthSchemes(spec, version) {
  const schemes = version === 3 ? Object.keys(spec.components?.securitySchemes || {}) : Object.keys(spec.securityDefinitions || {});
  return schemes.length ? schemes.join(", ") : "none";
}

function getSecurityScheme(spec, version, schemeName) {
  if (version === 3) return spec.components?.securitySchemes?.[schemeName] || null;
  return spec.securityDefinitions?.[schemeName] || null;
}

function sampleValueFromParameter(spec, parameter) {
  if (parameter.example !== undefined) return String(parameter.example);
  const schema = parameter.schema || parameter;
  const sample = sampleFromSchema(spec, schema);
  return typeof sample === "object" ? JSON.stringify(sample) : String(sample);
}

function sampleFromSchema(spec, schema) {
  if (!schema) return "";
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.$ref) return sampleFromSchema(spec, resolveSchemaRef(spec, schema.$ref));
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === "string") {
    if (schema.format === "date-time") return "2026-03-21T10:00:00Z";
    if (schema.format === "email") return "qa@example.com";
    if (schema.format === "uuid") return "11111111-1111-1111-1111-111111111111";
    return "sample";
  }
  if (schema.type === "integer" || schema.type === "number") return 1;
  if (schema.type === "boolean") return true;
  if (schema.type === "array") return [sampleFromSchema(spec, schema.items)];
  if (schema.type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties || {}).map(([key, value]) => [key, sampleFromSchema(spec, value)])
    );
  }
  if (schema.allOf?.length) {
    return Object.assign({}, ...schema.allOf.map((part) => sampleFromSchema(spec, part)));
  }
  return "";
}

function resolveSchemaRef(spec, ref) {
  const parts = ref.replace(/^#\//, "").split("/");
  return parts.reduce((accumulator, part) => accumulator?.[part], spec);
}

function exportWorkspaceBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    sessions,
    sqlQueries,
    apiCases,
  };
  downloadText(`qa-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
  statusMessage.textContent = "Workspace backup exported as JSON.";
}

function importWorkspaceBackup(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      sessions = sortSessions(Array.isArray(payload.sessions) ? payload.sessions : []);
      sqlQueries = Array.isArray(payload.sqlQueries) ? payload.sqlQueries : [];
      apiCases = Array.isArray(payload.apiCases) ? payload.apiCases : [];
      currentSessionId = null;
      activeSqlId = null;
      activeApiId = null;
      persistSqlQueries();
      persistApiCases();
      localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      renderHistory();
      renderSqlQueries();
      renderApiCases();
      renderDashboard();
      statusMessage.textContent = "Workspace backup imported.";
    } catch {
      statusMessage.textContent = "Backup import failed. Use a JSON export created by this tool.";
    } finally {
      importDataInput.value = "";
    }
  };
  reader.readAsText(file);
}

function switchWorkspace(name) {
  const showHome = name === "home";
  const showExploratory = name === "exploratory";
  const showSql = name === "sql";
  const showApi = name === "api";

  homeWorkspace.classList.toggle("hidden-workspace", !showHome);
  exploratoryWorkspace.classList.toggle("hidden-workspace", !showExploratory);
  sqlWorkspace.classList.toggle("hidden-workspace", !showSql);
  apiWorkspace.classList.toggle("hidden-workspace", !showApi);

  showHomeBtn.classList.toggle("is-active", showHome);
  showExploratoryBtn.classList.toggle("is-active", showExploratory);
  showSqlBtn.classList.toggle("is-active", showSql);
  showApiBtn.classList.toggle("is-active", showApi);

  showHomeBtn.setAttribute("aria-selected", showHome ? "true" : "false");
  showExploratoryBtn.setAttribute("aria-selected", showExploratory ? "true" : "false");
  showSqlBtn.setAttribute("aria-selected", showSql ? "true" : "false");
  showApiBtn.setAttribute("aria-selected", showApi ? "true" : "false");
}
