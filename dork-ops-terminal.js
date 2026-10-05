"use strict";

const output = document.getElementById("terminal-output");
const commandForm = document.getElementById("command-form");
const commandInput = document.getElementById("command-input");
const history = [];
const activityLog = [];
const storageKey = "dorkops-saved-websites";
const themeStorageKey = "dorkops-terminal-theme";
const validSessionId = /^[a-z0-9-]{1,80}$/i;
const terminalSessionKey = getTerminalSessionKey();
const clearedFeedKey = terminalSessionKey ? `${terminalSessionKey}:cleared-feed` : null;
const recipesStorageKey = "dorkops-terminal-recipes";
const restorableTags = new Set(["section", "p", "code", "span"]);
const defaultLabPreferences = {
  nmapScanType: "-sT",
  nmapTiming: "-T2",
  nmapTopPorts: false
};
const colorPresets = {
  green: "#7ce5ba",
  cyan: "#70d8ef",
  blue: "#88aaff",
  amber: "#ffcf79",
  violet: "#c8a5ff",
  rose: "#ff92b8",
  red: "#ff867c",
  white: "#e6edf3"
};
const defaultTheme = {
  promptColor: colorPresets.green,
  inputColor: "#dce4e8",
  typedColor: "#e5edf2"
};
const modules = [
  { id: "dorking", title: "Google Dorking", aliases: ["dorking", "google dorking", "google"] },
  { id: "images", title: "Image Lookup", aliases: ["images", "image lookup", "reverse image"] },
  { id: "nmap", title: "Nmap Operators", aliases: ["nmap", "nmap operators", "network mapping"] },
  { id: "passwords", title: "Password Tools", aliases: ["passwords", "password tools"] },
  { id: "field-guide", title: "Linux & Security Field Guide", aliases: ["field guide", "linux guide", "security guide"] },
  { id: "operators", title: "Search Operators", aliases: ["search operators", "operator reference"] },
  { id: "password-options", title: "Password Options", aliases: ["password options", "password tool options"] },
  { id: "kali", title: "Kali Tools", aliases: ["kali", "kali tools", "tool directory"] },
  { id: "add-web", title: "Saved Websites", aliases: ["saved websites", "websites", "add web", "web manager"] }
];
const sections = [
  { id: "basic", label: "Basic starter", aliases: ["basic", "starter", "basic command", "starter command", "example"] },
  { id: "guide", label: "Learner's Guide", aliases: ["guide", "learn", "learner's guide", "learners guide"] },
  { id: "command", label: "Command", aliases: ["command", "make command", "make a command", "build a command"] },
  { id: "all", label: "All Commands", aliases: ["all", "commands", "all commands", "library"] }
];
const searchPatterns = [
  ["site:", "Limit results to one approved host.", "site:<authorized-domain> <search terms>"],
  ["filetype:", "Restrict results to a document type; do not download sensitive results.", "site:<authorized-domain> filetype:pdf <search terms>"],
  ["intitle:", "Match terms in a page title.", "site:<authorized-domain> intitle:<approved phrase>"],
  ["inurl:", "Match terms in a URL.", "site:<authorized-domain> inurl:<approved path term>"],
  ["intext:", "Match terms in indexed page text.", "site:<authorized-domain> intext:<approved phrase>"],
  ["exact phrase", "Search for a phrase as written.", 'site:<authorized-domain> "approved phrase"'],
  ["OR", "Match either of two approved alternatives; uppercase OR is required.", "site:<authorized-domain> term-one OR term-two"],
  ["-", "Exclude a term from matching results.", "site:<authorized-domain> approved-term -excluded-term"],
  ["before: / after:", "Limit indexed pages around dates; index dates can be incomplete.", "site:<authorized-domain> after:2024-01-01 before:2025-01-01"],
  ["related:", "Ask the provider for sites it considers related; results are approximate.", "related:<authorized-domain>"]
];
const searchOperators = [
  ["site:", "Limit results to a domain or host.", "site:example.org"],
  ["filetype:", "Limit results by indexed file extension or type.", "filetype:pdf"],
  ["intitle:", "Match a term in the page title.", "intitle:report"],
  ["allintitle:", "Require all listed terms in the title.", "allintitle:annual report"],
  ["inurl:", "Match a term in the URL.", "inurl:docs"],
  ["allinurl:", "Require all listed terms in the URL.", "allinurl:help center"],
  ["intext:", "Match a term in indexed page text.", "intext:transparency"],
  ["allintext:", "Require all listed terms in indexed text.", "allintext:privacy contact"],
  ["\"phrase\"", "Search for an exact phrase.", '"public report"'],
  ["OR", "Match one of several alternatives; write OR in uppercase.", "audit OR assessment"],
  ["-", "Exclude a word or phrase.", "training -jobs"],
  ["before: / after:", "Restrict by indexed date when supported.", "after:2024-01-01 before:2025-01-01"],
  ["related:", "Find sites the search provider considers related.", "related:example.org"],
  ["cache:", "May show a cached result when supported; availability varies.", "cache:example.org"],
  ["define:", "Look up a definition when supported.", "define:network"]
];
const imageProviders = [
  ["Google Lens", "Visual matching and related pages; results are not proof of ownership or identity.", "https://lens.google.com/uploadbyurl?url="],
  ["TinEye", "Reverse-image matching and appearance history; coverage varies.", "https://tineye.com/search?url="],
  ["Bing Visual Search", "Visual matches and related products or pages; provider behavior may change.", "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl="]
];
let activeModule = null;
let pendingModule = null;
let wizard = null;
let historyPosition = 0;
let currentOutputGroup = null;
let outputLineCount = 0;
let theme = { ...defaultTheme };
let lastBuild = null;
let lastRecommendation = null;
let terminalFeedCleared = false;

function getTerminalSessionKey() {
  const requestedId = new URLSearchParams(window.location.search).get("sessionId");
  if (requestedId && validSessionId.test(requestedId)) return `dorkops-terminal-session:${requestedId}`;
  try {
    let sessionId = sessionStorage.getItem("dorkops-terminal-session-id");
    if (!sessionId || !validSessionId.test(sessionId)) {
      sessionId = `standalone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      sessionStorage.setItem("dorkops-terminal-session-id", sessionId);
    }
    return `dorkops-terminal-session:${sessionId}`;
  } catch (error) {
    console.error("Could not identify this Terminal session for local recovery.", error);
    return null;
  }
}

function serializeTerminalNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return { text: node.nodeValue || "" };
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const tag = node.tagName.toLocaleLowerCase();
  if (!restorableTags.has(tag)) return null;
  const record = {
    tag,
    className: /^[a-z0-9 _-]{0,160}$/i.test(node.className) ? node.className : "",
    children: Array.from(node.childNodes, serializeTerminalNode).filter(Boolean)
  };
  if (node.getAttribute("role") === "group") record.role = "group";
  const label = node.getAttribute("aria-label");
  if (label && label.length <= 300) record.label = label;
  const moduleId = node.dataset.module;
  if (modules.some(item => item.id === moduleId)) record.moduleId = moduleId;
  if (/^#[0-9a-f]{6}$/i.test(node.style.color)) record.color = node.style.color;
  return record;
}

function restoreTerminalNode(record, depth = 0) {
  if (!record || depth > 5 || typeof record !== "object") return null;
  if (typeof record.text === "string") {
    return document.createTextNode(record.text.slice(0, 12_000));
  }
  if (!restorableTags.has(record.tag)) return null;
  const element = document.createElement(record.tag);
  if (typeof record.className === "string" && /^[a-z0-9 _-]{0,160}$/i.test(record.className)) {
    element.className = record.className;
  }
  if (record.role === "group") element.setAttribute("role", "group");
  if (typeof record.label === "string" && record.label.length <= 300) {
    element.setAttribute("aria-label", record.label);
  }
  if (modules.some(item => item.id === record.moduleId)) element.dataset.module = record.moduleId;
  if (typeof record.color === "string" && /^#[0-9a-f]{6}$/i.test(record.color)) {
    element.style.color = record.color;
  }
  if (Array.isArray(record.children)) {
    record.children.slice(0, 1000).forEach(child => {
      const restoredChild = restoreTerminalNode(child, depth + 1);
      if (restoredChild) element.appendChild(restoredChild);
    });
  }
  return element;
}

function saveTerminalSession() {
  if (!terminalSessionKey) return;
  try {
    const session = {
      version: 1,
      cleared: terminalFeedCleared,
      output: Array.from(output.children, serializeTerminalNode).filter(Boolean),
      history: history.slice(-200),
      activity: activityLog.slice(-200),
      draft: commandInput.value.slice(0, 3000)
    };
    localStorage.setItem(terminalSessionKey, JSON.stringify(session));
  } catch (error) {
    console.error("Could not save this Terminal's local recovery session.", error);
  }
}

function restoreTerminalSession() {
  if (!terminalSessionKey) return false;
  try {
    const saved = JSON.parse(localStorage.getItem(terminalSessionKey) || "null");
    if (!saved || saved.version !== 1 || !Array.isArray(saved.output)) return false;
    terminalFeedCleared = saved.cleared === true;
    saved.output.slice(0, 1000).forEach(record => {
      const restoredNode = restoreTerminalNode(record);
      if (restoredNode) output.appendChild(restoredNode);
    });
    if (Array.isArray(saved.history)) {
      history.push(...saved.history.filter(item => typeof item === "string").slice(-200));
      historyPosition = history.length;
    }
    if (Array.isArray(saved.activity)) {
      activityLog.push(...saved.activity.filter(item =>
        item && ["command", "generated"].includes(item.type) &&
        typeof item.text === "string" && item.text.length <= 3000 &&
        typeof item.label === "string" && item.label.length <= 120
      ).slice(-200));
    }
    commandInput.value = typeof saved.draft === "string" ? saved.draft.slice(0, 3000) : "";
    outputLineCount = output.querySelectorAll(".terminal-line").length;
    currentOutputGroup = output.lastElementChild;
    trimOutput();
    output.scrollTop = output.scrollHeight;
    return true;
  } catch (error) {
    console.error("Could not restore this Terminal's local recovery session.", error);
    return false;
  }
}

function recordActivity(type, label, text, moduleId = "") {
  activityLog.push({ type, label, text: text.slice(0, 3000), moduleId, time: new Date().toISOString() });
  if (activityLog.length > 200) activityLog.splice(0, activityLog.length - 200);
}

function updateWizardPreview() {
  if (!wizard?.preview) return;
  const preview = wizard.preview(wizard.answers);
  if (!preview) return;
  if (!wizard.previewLine) {
    wizard.previewLine = writeLine(`Preview only: ${preview}`, "wizard-preview");
  } else {
    wizard.previewLine.textContent = `Preview only: ${preview}`;
    output.scrollTop = output.scrollHeight;
    saveTerminalSession();
  }
}

function beginOutputGroup(className, label) {
  const group = document.createElement("section");
  group.className = `terminal-group ${className}`;
  group.setAttribute("role", "group");
  if (label) group.setAttribute("aria-label", label);
  output.appendChild(group);
  currentOutputGroup = group;
  return group;
}

function writeLine(text, kind = "", moduleId = "") {
  terminalFeedCleared = false;
  const line = document.createElement("p");
  const classes = ["terminal-line"];
  if (kind) classes.push(kind);
  if (kind === "module") classes.push("module-heading", `module-${moduleId}`);
  if (kind === "system" && text.includes(" — ")) classes.push("category-title");
  if (/^\s*(?:Example:|Provider URL:|Query:)/i.test(text)) classes.push("example-line");
  if (/^\s*(?:Objective|Scenario|Expected|Effect|Impact|When to use|What to expect|Common mistakes|Timing|Port scope):/i.test(text)) classes.push("fact-line");
  if (text.includes(" — ") && kind !== "system" && kind !== "module") classes.push("reference-line");
  if (/^Next step:/i.test(text)) classes.push("recommendation-line");
  line.className = classes.join(" ");
  line.textContent = text;
  if (kind === "module-listing") {
    const listing = text.trim().match(/^(\S+)\s{2,}(.+)$/);
    if (listing) {
      const commandName = document.createElement("code");
      commandName.className = "module-command";
      commandName.textContent = listing[1];
      const title = document.createElement("span");
      title.className = "module-title";
      title.textContent = listing[2];
      line.replaceChildren(commandName, document.createTextNode("  "), title);
    }
    line.dataset.module = moduleId;
  }
  if (kind === "command") line.style.color = theme.typedColor;
  if (kind === "command") beginOutputGroup("terminal-entry", "Terminal command");
  else if (kind === "module") beginOutputGroup(`terminal-section module-section module-${moduleId}`, text);
  else if (kind === "module-listing" && !currentOutputGroup?.classList.contains("module-list")) {
    beginOutputGroup("module-list", "Available modules");
  }
  (currentOutputGroup || output).appendChild(line);
  outputLineCount += 1;
  trimOutput();
  output.scrollTop = output.scrollHeight;
  saveTerminalSession();
  return line;
}

function trimOutput() {
  while (outputLineCount > 700) {
    const firstLine = output.querySelector(".terminal-line");
    if (!firstLine) {
      outputLineCount = 0;
      break;
    }
    const group = firstLine.parentElement;
    firstLine.remove();
    outputLineCount -= 1;
    if (group !== output && !group.children.length) {
      group.remove();
      if (currentOutputGroup === group) currentOutputGroup = null;
    }
  }
}

function showModules() {
  beginOutputGroup("module-list", "Available modules");
  writeLine("AVAILABLE MODULES", "system");
  modules.forEach(item => writeLine(`  ${item.id.padEnd(18)} ${item.title}`, "module-listing", item.id));
  writeLine("Try '<module> basic' for a starter, '<module> command' to build, or ask 'why' / 'recommend' after a result.", "muted");
}

function showSections(item) {
  activeModule = item;
  pendingModule = item;
  lastBuild = null;
  lastRecommendation = null;
  writeLine(`${item.title.toUpperCase()} / SECTIONS`, "module", item.id);
  writeLine(`  ${item.id} basic    Safe starter example`);
  writeLine(`  ${item.id} guide    Learner's Guide`);
  writeLine(`  ${item.id} command  Build a command or query`);
  writeLine(`  ${item.id} all      All Commands`);
  writeLine("After a build, ask `why`, ask `recommend`, or type `copy`. Output is text only; nothing is run.", "muted");
}

function normalizeSection(value) {
  const phrase = value.trim().toLocaleLowerCase();
  return sections.find(section => section.aliases.includes(phrase))?.id || null;
}

function findModuleCommand(value) {
  const normalized = value.toLocaleLowerCase();
  const candidates = modules.flatMap(item => [...item.aliases, item.id].map(alias => ({ item, alias })))
    .sort((left, right) => right.alias.length - left.alias.length);
  for (const candidate of candidates) {
    if (normalized === candidate.alias) return { item: candidate.item, remainder: "" };
    if (normalized.startsWith(`${candidate.alias} `)) {
      return { item: candidate.item, remainder: normalized.slice(candidate.alias.length).trim() };
    }
  }
  return null;
}

function lessonFor(item) {
  const lessonIds = { dorking: "p1", images: "p2", nmap: "p3", passwords: "p4" };
  const lesson = window.DORK_OPS_LAB_LESSONS?.[lessonIds[item.id]];
  if (lesson) return lesson;
  return null;
}

function showGuide(item) {
  const lesson = lessonFor(item);
  if (lesson) {
    writeLine(`${lesson.title.toUpperCase()} / LEARNER'S GUIDE · ${lesson.time}`, "module", item.id);
    writeLine(`Objective: ${lesson.objective}`);
    writeLine(`Scenario: ${lesson.scenario}`);
    lesson.steps.forEach((step, index) => writeLine(`${index + 1}. ${step}`));
    writeLine(`Expected: ${lesson.expected}`);
    writeLine(`Common mistakes: ${lesson.mistakes}`, "muted");
  } else if (item.id === "field-guide") {
    const topics = window.DORK_OPS_FIELD_GUIDE || [];
    writeLine("LINUX & SECURITY FIELD GUIDE / LEARNER'S GUIDE", "module", item.id);
    topics.forEach(topic => {
      writeLine(`${topic.title} — ${topic.summary}`);
      if (topic.objectives) topic.objectives.forEach(objective => writeLine(`  Objective: ${objective}`, "muted"));
      if (topic.steps) topic.steps.forEach((step, index) => writeLine(`  ${index + 1}. ${step}`, "muted"));
      if (topic.expected) writeLine(`  Expected: ${topic.expected}`, "muted");
      if (topic.mistakes) writeLine(`  Avoid: ${topic.mistakes}`, "muted");
    });
  } else if (item.id === "password-options") {
    writePasswordToolGuide();
  } else if (item.id === "operators") {
    writeLine("SEARCH OPERATORS / LEARNER'S GUIDE", "module", item.id);
    writeLine("Operators narrow a search query; they do not confirm that a result is accurate, current, exposed, or vulnerable.");
    writeLine("Use site: only for a domain inside written scope, inspect result URLs before opening them, and do not download sensitive files.");
    writeLine("For an authorized site-limited search, continue with: dorking command");
  } else if (item.id === "kali") {
    writeLine("KALI TOOLS / LEARNER'S GUIDE", "module", item.id);
    writeLine("Choose a tool by task, read its local help and official documentation, and verify authorization before active testing.");
    writeLine("This terminal lists tools and prints example text only; it does not execute shell commands or contact systems.");
    writeLine("The Field Guide covers Linux, networking, web protocols, log analysis, and incident triage.");
  } else {
    writeLine("SAVED WEBSITES / LEARNER'S GUIDE", "module", item.id);
    writeLine("Manage personal shortcuts stored only in this browser. Use complete HTTP or HTTPS URLs; embedded credentials are rejected.");
    writeLine("Type `web add`, `web edit <name>`, `web remove <name>`, or `web list`.");
  }
  recommendNext(item.id);
}

function writePasswordToolGuide() {
  const groups = window.DORK_OPS_PASSWORD_TOOL_OPTIONS || [];
  writeLine("PASSWORD TOOLS / LEARNER'S GUIDE", "module", "passwords");
  groups.forEach(group => writeLine(`${group.tool}: ${group.description}`));
  writeLine("Hydra is an online service-testing tool with potential lockout and service impact. Generated Hydra examples are fixed to 127.0.0.1 and one task.", "muted");
  writeLine("John and Hashcat read local hash files. Use only files and accounts explicitly provided for an isolated, authorized audit.", "muted");
}

function writeDorkCommands() {
  writeLine("GOOGLE DORKING / ALL COMMAND PATTERNS", "module", "dorking");
  searchPatterns.forEach(([name, purpose, pattern]) => {
    writeLine(`${name} — ${purpose}`);
    writeLine(`  ${pattern}`, "muted");
  });
  writeLine("Next: `operators all` lists related search syntax. Query strings are not sent anywhere by this terminal.", "muted");
}

function writeImageCommands() {
  writeLine("IMAGE LOOKUP / PROVIDERS", "module", "images");
  imageProviders.forEach(([name, purpose]) => {
    writeLine(`${name} — ${purpose}`);
  });
  writeLine("Next: `dorking guide` is useful when an authorized source domain is known. Do not submit private or identifying images without permission.", "muted");
}

function writeNmapCommands() {
  const groups = window.DORK_OPS_NMAP_SECTIONS || [];
  writeLine(`NMAP OPERATORS / ALL COMMANDS · ${groups.reduce((total, group) => total + group.options.length, 0)} OPTIONS`, "module", "nmap");
  groups.forEach(group => {
    writeLine(`${group.title} — ${group.description}`, "system");
    if (group.whenToUse) writeLine(`  When to use: ${group.whenToUse}`, "muted");
    if (group.whatToExpect) writeLine(`  What to expect: ${group.whatToExpect}`, "muted");
    if (group.impact) writeLine(`  Impact: ${group.impact}`, "muted");
    group.options.forEach(([option, description, example, status]) => {
      writeLine(`  ${option} [${status}] — ${description}`);
      writeLine(`    Example: ${example}`, "muted");
    });
  });
}

function writePasswordCommands() {
  const groups = window.DORK_OPS_PASSWORD_TOOL_OPTIONS || [];
  writeLine("PASSWORD TOOLS / ALL COMMAND OPTIONS", "module", "passwords");
  groups.forEach(group => {
    writeLine(`${group.tool} — ${group.description}`, "system");
    group.options.forEach(([option, description, example]) => {
      const safeExample = example.replace(/<target ip>/g, "127.0.0.1");
      writeLine(`  ${option} — ${description}`);
      writeLine(`    Example: ${safeExample}`, "muted");
    });
  });
}

function writeSearchOperators() {
  writeLine("SEARCH OPERATORS / ALL COMMAND PATTERNS", "module", "operators");
  searchOperators.forEach(([operator, description, example]) => {
    writeLine(`${operator} — ${description}`);
    writeLine(`  Example: ${example}`, "muted");
  });
  writeLine("For more detailed search patterns and query assembly, use `dorking all`.", "muted");
}

function writeKaliCommands() {
  const data = window.DORK_OPS_KALI_DATA;
  if (!data) {
    writeLine("Kali tool reference data is not available in this session.", "error");
    return;
  }
  writeLine("KALI TOOLS / CURATED DIRECTORY", "module", "kali");
  data.groups.forEach(group => {
    writeLine(group.title, "system");
    group.tools.forEach(([name, description, command]) => writeLine(`  ${name} (${command}) — ${description}`));
  });
  writeLine("SHELL OPERATOR REFERENCE");
  data.shellOperators.forEach(([operator, description, example]) => {
    writeLine(`  ${operator} — ${description}`);
    writeLine(`    ${example}`, "muted");
  });
  writeLine("CLI SYNTAX");
  data.syntax.forEach(([syntax, description, example]) => {
    writeLine(`  ${syntax} — ${description}`);
    writeLine(`    ${example.replace(/\n/g, " | ")}`, "muted");
  });
}

function showAllCommands(item) {
  if (item.id === "dorking") writeDorkCommands();
  else if (item.id === "images") writeImageCommands();
  else if (item.id === "nmap") writeNmapCommands();
  else if (item.id === "passwords" || item.id === "password-options") writePasswordCommands();
  else if (item.id === "operators") writeSearchOperators();
  else if (item.id === "kali") writeKaliCommands();
  else if (item.id === "field-guide") {
    writeLine("FIELD GUIDE / READ-ONLY EXAMPLES", "module", item.id);
    (window.DORK_OPS_FIELD_GUIDE || []).forEach(topic => {
      writeLine(`${topic.title}: ${topic.steps?.join(" | ") || topic.summary}`);
    });
    writeLine("These examples are learning material; apply commands only within an authorized local lab.", "muted");
  } else {
    writeLine("SAVED WEBSITE COMMANDS", "module", item.id);
    writeLine("web list · web add · web edit <name> · web remove <name>", "muted");
    listWebsites();
  }
  recommendNext(item.id);
}

function findModule(value) {
  const normalized = value.trim().toLocaleLowerCase();
  return modules.find(item => item.id === normalized || item.aliases.includes(normalized)) || null;
}

function startBeginnerFlow() {
  writeLine("START HERE / BEGINNER LAB", "module", "field-guide");
  writeLine("Pick a topic. I will show a safe starter first, then point you to its guide and builder.", "muted");
  const choices = modules.filter(item => ["dorking", "images", "nmap", "passwords"].includes(item.id));
  writeLine("Topics: dorking, images, nmap, passwords.", "muted");
  beginWizard([{
    prompt: "Which topic would you like to learn? (Enter starts with Nmap):",
    reason: "Choosing one subject keeps the first exercise focused. Nmap is the default starter, scoped to loopback and text-only.",
    validate(value) {
      const module = findModule(value || "nmap");
      return choices.includes(module)
        ? { value: module }
        : { error: "Choose dorking, images, nmap, or passwords." };
    }
  }], ([item]) => {
    showBasicExample(item);
    writeLine(`To learn the terms, type \`${item.id} guide\`. To build a variation, type \`${item.id} command\`.`, "muted");
  }, false, answers => `${(answers[0] || modules.find(item => item.id === "nmap")).id} basic`);
}

function moduleLimitations(moduleId) {
  const limitations = {
    dorking: "Search indexes are incomplete and may be stale. A matching page is not proof of ownership, exposure, or current availability.",
    images: "Visual matches can be false or incomplete. Similarity does not prove identity, ownership, origin, or permission to reuse an image.",
    nmap: "Results describe only the probes and ports tested at that time. `closed` and `filtered` differ; unselected ports have no result. Service and OS detection are estimates.",
    passwords: "Generated examples do not validate file contents or prove account security. Online tests can lock accounts; recovered values are sensitive.",
    operators: "Search engines vary in operator support and interpretation; verify each result at its source.",
    "password-options": "Option availability and behavior can vary by tool version and input format; confirm with the installed version's documentation.",
    kali: "This curated reference is not a substitute for each tool's current documentation, authorization, or safe lab validation.",
    "field-guide": "Guidance is educational; confirm commands, system state, permissions, and environment before applying it.",
    "add-web": "Saved shortcuts are local browser data and are not a security-verified list of destinations."
  };
  return limitations[moduleId] || "Examples are text-only and may not reflect the exact versions, network conditions, or policies in your environment.";
}

function explainLimitations() {
  const moduleId = lastBuild?.moduleId || activeModule?.id || pendingModule?.id;
  if (!moduleId) {
    writeLine("Choose a module or generate an example first, then type `limits`.", "muted");
    return;
  }
  const item = modules.find(module => module.id === moduleId);
  writeLine(`Limits of ${item?.title || "this example"}: ${moduleLimitations(moduleId)}`, "muted");
}

function readRecipes() {
  try {
    const saved = JSON.parse(localStorage.getItem(recipesStorageKey) || "[]");
    if (!Array.isArray(saved) || saved.length > 100 || saved.some(recipe =>
      !recipe || typeof recipe.name !== "string" || typeof recipe.text !== "string" ||
      typeof recipe.moduleId !== "string" || typeof recipe.explanation !== "string" ||
      typeof recipe.recommendation !== "string"
    )) {
      throw new TypeError("Saved recipe data has an invalid format.");
    }
    return saved;
  } catch (error) {
    console.error("Could not read saved Terminal recipes.", error);
    throw new Error("Saved recipe data is unreadable. It has not been overwritten.");
  }
}

function writeRecipes(recipes) {
  try {
    localStorage.setItem(recipesStorageKey, JSON.stringify(recipes));
    return true;
  } catch (error) {
    console.error("Could not save Terminal recipes.", error);
    writeLine("Could not save this recipe in browser storage.", "error");
    return false;
  }
}

function redactRecipeText(build) {
  let text = build.text;
  if (build.moduleId === "nmap") {
    text = text.replace(/(\s)(?:\d{1,3}\.){3}\d{1,3}$/, "$1<authorized-host>");
    text = text.replace(/(\s)([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,})(?=\s|$)/i, "$1<authorized-host>");
  } else if (build.moduleId === "dorking") {
    text = text.replace(/site:[^\s]+/i, "site:<approved-domain>");
  } else if (build.moduleId === "images") {
    text = text.replace(/([?&](?:url|imgurl)=)[^&]+/i, "$1%3Capproved-image-url%3E");
  }
  if (build.moduleId === "passwords" || build.moduleId === "password-options") {
    text = text.replace(/(-l\s+)[^\s]+/i, "$1<lab-user>");
    text = text.replace(/(-P\s+)'[^']*'/i, "$1'<authorized-local-wordlist>'");
  }
  for (const detail of build.details) {
    const key = detail.key;
    if (!key || key.startsWith("-") || ["provider", "URL", "site:", "filetype:"].includes(key)) continue;
    if (["nmap", "passwords", "password-options"].includes(build.moduleId) && key === "127.0.0.1") continue;
    if (["passwords", "password-options"].includes(build.moduleId) && ["ssh", "ftp"].includes(key)) continue;
    if (build.moduleId === "dorking" && key === build.text.match(/site:[^\s]+\s+(?:filetype:[^\s]+\s+)?(.+)/i)?.[1]) {
      text = text.replace(key, "<approved-search-terms>");
      continue;
    }
    if (key.length > 2) text = text.replaceAll(key, `<${build.moduleId === "nmap" ? "authorized" : "approved"}-value>`);
  }
  return text;
}

function validRecipeName(value) {
  const name = value.trim();
  return /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,39}$/u.test(name) ? name : null;
}

function saveCurrentRecipe(name) {
  if (!lastBuild) {
    writeLine("Generate a command or query before saving it as a recipe.", "muted");
    return;
  }
  let recipes;
  try {
    recipes = readRecipes();
  } catch (error) {
    writeLine(error.message, "error");
    return;
  }
  const existingIndex = recipes.findIndex(recipe => recipe.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  const store = overwrite => {
    if (existingIndex !== -1 && !overwrite) {
      writeLine(`Recipe "${name}" already exists. Use \`recipe save ${name}\` and confirm overwrite, or choose another name.`, "muted");
      return;
    }
    const recipe = {
      name,
      moduleId: lastBuild.moduleId,
      moduleTitle: lastBuild.moduleTitle,
      text: redactRecipeText(lastBuild),
      explanation: lastBuild.explanation.slice(0, 1200),
      recommendation: lastBuild.recommendation.slice(0, 1200),
      updatedAt: new Date().toISOString()
    };
    const next = [...recipes];
    if (existingIndex === -1) next.push(recipe);
    else next[existingIndex] = recipe;
    if (writeRecipes(next)) writeLine(`${existingIndex === -1 ? "Saved" : "Updated"} recipe "${name}" locally with target and input placeholders.`, "system");
  };
  if (existingIndex === -1) store(false);
  else beginWizard([{
    prompt: `Recipe "${name}" exists. Replace it with the latest generated example? (yes/no):`,
    validate(value) {
      const answer = value.trim().toLocaleLowerCase();
      return ["yes", "y", "no", "n"].includes(answer)
        ? { value: ["yes", "y"].includes(answer) }
        : { error: "Enter yes or no." };
    }
  }], ([confirmed]) => {
    if (confirmed) store(true);
    else writeLine("Existing recipe kept unchanged.", "muted");
  }, false);
}

function handleRecipeCommand(raw) {
  const match = raw.trim().match(/^recipe\s+(save|list|show|use|edit|delete)(?:\s+(.+))?$/i);
  if (!match) {
    if (/^recipes?$/i.test(raw.trim())) {
      writeLine("Try `recipe list`, `recipe save <name>`, `recipe show <name>`, `recipe use <name>`, or `recipe delete <name>`.", "muted");
      return true;
    }
    return false;
  }
  const action = match[1].toLocaleLowerCase();
  const argument = (match[2] || "").trim();
  if (action === "save" && !argument) {
    beginWizard([{
      prompt: "Name this local recipe (letters, numbers, spaces, _ or -; up to 40 characters):",
      validate(value) {
        const name = validRecipeName(value);
        return name ? { value: name } : { error: "Enter a name beginning with a letter or number, up to 40 characters." };
      }
    }], ([name]) => saveCurrentRecipe(name), false);
    return true;
  }
  if (action === "save") {
    const name = validRecipeName(argument);
    if (!name) {
      writeLine("Recipe names must start with a letter or number and contain at most 40 letters, numbers, spaces, underscores, or hyphens.", "error");
      return true;
    }
    saveCurrentRecipe(name);
    return true;
  }
  let recipes;
  try {
    recipes = readRecipes();
  } catch (error) {
    writeLine(error.message, "error");
    return true;
  }
  if (action === "list") {
    if (!recipes.length) writeLine("No saved recipes yet. Generate a command, then use `recipe save <name>`.", "muted");
    else recipes.forEach((recipe, index) => writeLine(`${index + 1}. ${recipe.name} — ${recipe.moduleTitle}`, "module-listing", recipe.moduleId));
    return true;
  }
  const name = validRecipeName(argument);
  if (!name) {
    writeLine(`Provide a recipe name: recipe ${action} <name>`, "error");
    return true;
  }
  const recipeIndex = recipes.findIndex(recipe => recipe.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (recipeIndex === -1) {
    writeLine(`No local recipe named "${name}". Use \`recipe list\` to see saved names.`, "error");
    return true;
  }
  const recipe = recipes[recipeIndex];
  if (action === "show") {
    writeLine(`${recipe.name} / ${recipe.moduleTitle}`, "module", recipe.moduleId);
    writeLine(`Template: ${recipe.text}`, "generated");
    writeLine(`What it does: ${recipe.explanation}`, "muted");
    writeLine(`Limits: ${moduleLimitations(recipe.moduleId)}`, "muted");
    writeLine(`Next step: ${recipe.recommendation}`, "recommendation");
  } else if (action === "use" || action === "edit") {
    commandInput.value = recipe.text;
    commandInput.focus();
    writeLine(`Recipe loaded into the input for editing. Replace every placeholder and review scope; this terminal will not execute it.`, "muted");
    saveTerminalSession();
  } else if (action === "delete") {
    beginWizard([{
      prompt: `Delete local recipe "${recipe.name}"? Type yes or no:`,
      validate(value) {
        const answer = value.trim().toLocaleLowerCase();
        return ["yes", "y", "no", "n"].includes(answer)
          ? { value: ["yes", "y"].includes(answer) }
          : { error: "Enter yes or no." };
      }
    }], ([confirmed]) => {
      if (!confirmed) {
        writeLine("Recipe kept.", "muted");
        return;
      }
      const next = [...recipes];
      next.splice(recipeIndex, 1);
      if (writeRecipes(next)) writeLine(`Deleted recipe "${recipe.name}".`, "system");
    }, false);
  }
  return true;
}

function showHistory(searchTerm = "") {
  const query = searchTerm.trim().toLocaleLowerCase();
  const matches = activityLog.map((entry, index) => ({ entry, number: index + 1 }))
    .filter(({ entry }) => !query || `${entry.type} ${entry.label} ${entry.text}`.toLocaleLowerCase().includes(query));
  if (!matches.length) {
    writeLine(query ? `No history entries match "${searchTerm.trim()}".` : "No Terminal history yet.", "muted");
    return;
  }
  matches.slice(-50).forEach(({ entry, number }) => {
    writeLine(`#${number} [${entry.type === "generated" ? "generated" : "entered"}] ${entry.label}: ${entry.text}`, "module-listing", entry.moduleId || "");
  });
}

function handleHistoryCommand(raw) {
  const match = raw.trim().match(/^history(?:\s+(search|run|use|copy)\s*(.*))?$/i);
  if (!match) return false;
  const action = (match[1] || "").toLocaleLowerCase();
  const argument = (match[2] || "").trim();
  if (!action) {
    showHistory();
    return true;
  }
  if (action === "search") {
    showHistory(argument);
    return true;
  }
  const number = Number(argument.replace(/^#/, ""));
  if (!Number.isInteger(number) || number < 1 || number > activityLog.length) {
    writeLine(`Provide a history number from 1 to ${activityLog.length}.`, "error");
    return true;
  }
  const entry = activityLog[number - 1];
  if (action === "run" && entry.type === "command" && /^history\s+run\b/i.test(entry.text)) {
    writeLine("A history command cannot rerun itself. Choose a different entry number.", "error");
    return true;
  }
  if (action === "copy") {
    if (!navigator.clipboard?.writeText) {
      writeLine("Clipboard access is unavailable; select the history line and copy it manually.", "error");
      return true;
    }
    navigator.clipboard.writeText(entry.text).then(
      () => writeLine(`History entry #${number} copied. Review placeholders and scope before use.`, "system"),
      error => {
        console.error("Could not copy the selected history entry.", error);
        writeLine("Could not copy the selected history entry. Copy it manually.", "error");
      }
    );
  } else if (action === "use") {
    commandInput.value = entry.text;
    commandInput.focus();
    writeLine(`History entry #${number} loaded into the input for editing; it was not run.`, "muted");
    saveTerminalSession();
  } else if (entry.type === "generated") {
    const item = modules.find(module => module.id === entry.moduleId);
    if (!item) {
      commandInput.value = entry.text;
      writeLine(`Generated history entry #${number} loaded into the input; it was not executed.`, "muted");
    } else {
      showSection(item, "command");
      writeLine(`Rebuilding the ${item.title} example from history #${number}; review all answers before copying.`, "muted");
    }
  } else {
    history.push(entry.text);
    historyPosition = history.length;
    recordActivity("command", `History rerun #${number}`, entry.text);
    dispatch(entry.text);
    saveTerminalSession();
  }
  return true;
}

function recommendNext(id) {
  const advice = {
    dorking: "Next step: if the work is about an approved visual asset, use `images guide`; otherwise review `operators all`. Search results alone do not authorize a network scan.",
    images: "Next step: use `dorking guide` only when a related source domain is within scope; visual similarity is not proof of identity or ownership.",
    nmap: "Next step: compare observed ports with the owner's inventory, then consult `field guide guide` for networking context before any separately approved follow-up.",
    passwords: "Next step: keep local hash files and recovered results protected; use `field guide guide` for incident-handling and safe evidence notes.",
    "field-guide": "Next step: choose a relevant lab, such as `nmap guide` for explicitly authorized network mapping or `dorking guide` for scoped public search.",
    operators: "Next step: use `dorking command` to assemble a site-limited query without sending it from this terminal.",
    "password-options": "Next step: use `passwords command` for a local-only sample; this terminal does not test accounts or hashes.",
    kali: "Next step: read the selected tool's official documentation; use `nmap guide` only when network mapping is explicitly authorized.",
    "add-web": "Next step: use `web list` to review locally saved shortcuts."
  };
  if (advice[id]) {
    lastRecommendation = {
      moduleId: id,
      text: advice[id],
      reason: recommendationReason(id)
    };
    writeLine(advice[id], "muted");
  }
}

function recommendationReason(id) {
  if (id === "nmap" && lastBuild?.moduleId === id) {
    const recommendation = lastBuild.recommendation.toLocaleLowerCase();
    if (recommendation.includes("loopback") || recommendation.includes("confirm the host")) {
      return "Keeping this preview on loopback or a specifically approved single host makes the exercise's scope explicit and avoids suggesting broader scanning.";
    }
  }
  const reasons = {
    dorking: "Search providers can return stale or incomplete results, so checking the source URL and narrowing queries one operator at a time reduces misinterpretation.",
    images: "Visual similarity is uncertain; comparing source, date, crop, and context avoids treating a match as proof of identity or provenance.",
    nmap: "Comparing observed ports with the authorized inventory helps validate findings before considering any additional probes.",
    passwords: "Local password-audit files and recovered values are sensitive, so authorization and data protection should be checked before further analysis.",
    "field-guide": "A relevant focused lab gives a practical way to apply the background topic without broadening the task unnecessarily.",
    operators: "Applying search syntax within an approved domain keeps research scoped, and verifying sources guards against unreliable results.",
    "password-options": "Tool options vary by version and data format, so checking documentation and using only approved local samples avoids misleading results.",
    kali: "Tool versions and options differ, so the official documentation is the best way to confirm exact behavior before using a command.",
    "add-web": "Reviewing saved shortcuts confirms the correct destination before opening it."
  };
  return reasons[id] || "This is a cautious follow-up related to the selected module.";
}

function rememberBuild(item, text, explanation, recommendation, details = [], label = "Generated") {
  lastRecommendation = null;
  lastBuild = { moduleId: item.id, moduleTitle: item.title, text, explanation, recommendation, details };
  recordActivity("generated", item.title, text, item.id);
  writeLine(`${label}: ${text}`, "generated");
  writeLine(`What it does: ${explanation}`, "muted");
  writeLine("Ask `why` for the reasoning, `recommend` for a next step, or `copy` to copy this line.", "muted");
}

function explainLastBuild(question = "") {
  const requestedDetail = question.trim().toLocaleLowerCase();
  if (lastRecommendation && /\b(recommend|recommendation|next|step)\b/.test(requestedDetail)) {
    writeLine(`Why this recommendation: ${lastRecommendation.reason}`, "muted");
    return;
  }
  if (!lastBuild) {
    if (wizard) {
      const currentQuestion = wizard.questions[wizard.index];
      writeLine(`Why I ask this: ${currentQuestion.reason || "This answer is used only to tailor and validate the text example; the terminal does not send it to a tool or service."}`, "muted");
      writeLine(`Current prompt: ${currentQuestion.prompt}`, "muted");
      return;
    }
    if (lastRecommendation) {
      writeLine(`Why this recommendation: ${lastRecommendation.reason}`, "muted");
      return;
    }
    writeLine("There is no generated command or query to explain yet. Choose a module and type `basic` or `command`.", "muted");
    return;
  }
  const detail = requestedDetail
    ? lastBuild.details.find(item => item.key.toLocaleLowerCase() === requestedDetail ||
      requestedDetail.includes(item.key.toLocaleLowerCase()))
    : null;
  if (detail) {
    writeLine(`Why ${detail.key}: ${detail.explanation}`, "muted");
    return;
  }
  writeLine(`Why this ${lastBuild.moduleTitle} example: ${lastBuild.explanation}`, "muted");
  if (requestedDetail) {
    writeLine(`The exact part "${question.trim()}" is not a named option in this example. Ask \`why <option>\` for one of its listed parts.`, "muted");
  }
  writeLine(`Example: ${lastBuild.text}`, "muted");
}

function showLastRecommendation() {
  if (!lastBuild) {
    if (activeModule) recommendNext(activeModule.id);
    else writeLine("Choose a module first, or generate a basic example so I can recommend a relevant next step.", "muted");
    return;
  }
  lastRecommendation = {
    moduleId: lastBuild.moduleId,
    text: lastBuild.recommendation,
    reason: recommendationReason(lastBuild.moduleId)
  };
  writeLine(`Next step for ${lastBuild.moduleTitle}: ${lastBuild.recommendation}`, "recommendation");
}

function copyLastBuild() {
  if (!lastBuild) {
    writeLine("There is no generated command or query to copy yet. Choose a module and type `basic` or `command`.", "muted");
    return;
  }
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    writeLine("Clipboard access is unavailable here. Select and copy the generated line manually.", "error");
    return;
  }
  navigator.clipboard.writeText(lastBuild.text).then(() => {
    writeLine("Generated line copied to the clipboard. Review its scope before using it.", "system");
  }).catch(error => {
    console.error("Could not copy the generated lab output.", error);
    writeLine("Could not copy the generated line. Select and copy it manually.", "error");
  });
}

function showBasicExample(item) {
  const examples = {
    dorking: {
      label: "Search query",
      text: "site:example.org <approved search terms>",
      explanation: "`site:` limits a public search to the reserved training domain. Replace the placeholder only with approved terms and a domain in your scope.",
      recommendation: "Try `dorking command` to build a query for an approved domain, or `operators all` to compare search operators.",
      details: [{ key: "site:", explanation: "This limits search results to pages indexed for the domain after it. It neither verifies the pages nor proves that unreturned pages do not exist." }]
    },
    images: {
      label: "Provider",
      text: "https://lens.google.com/",
      explanation: "Open the provider and choose an image or an authorized public image URL. The provider receives the image or URL; do not submit private images or use matches to identify a person.",
      recommendation: "Use a provider only for an image you have permission to analyze, then compare source, date, crop, and context.",
      details: [{ key: "provider", explanation: "Reverse-image providers compare visual signals and their indexed sources. Similarity is a lead, not proof of origin, ownership, or identity." }]
    },
    nmap: {
      label: "Command",
      text: "nmap -sT -T2 -p 22,80,443 127.0.0.1",
      explanation: "This checks three common TCP ports on this machine only. It uses a TCP connect scan and slower T2 timing; it does not identify software versions or assess overall security. The command is displayed, never run here.",
      recommendation: "Use this loopback-only example to learn the output. For an approved single host, type `nmap command` and review the scope with its owner before running anything.",
      details: [
        { key: "-sT", explanation: "Use TCP connect through the operating system, a broadly compatible scan method." },
        { key: "-T2", explanation: "Use Nmap's slower timing profile; this can take longer and is not a guarantee of zero impact." },
        { key: "-p", explanation: "Limit the scan to the listed TCP ports rather than a wider default selection." },
        { key: "127.0.0.1", explanation: "Loopback means this machine itself, avoiding a third-party target in the starter example." }
      ]
    },
    passwords: {
      label: "Local-only example",
      text: "john --wordlist=<authorized-local-wordlist> <authorized-local-hash-file>",
      explanation: "John the Ripper compares an explicitly authorized local hash file with an approved local wordlist. Replace both placeholders with files from an isolated lab; this terminal does not inspect the files or run the command.",
      recommendation: "Verify the hash format and file provenance first. Keep the inputs and any recovered values protected; type `passwords command` to select a tool-specific workflow.",
      details: [{ key: "john", explanation: "John the Ripper performs offline password auditing against supplied hashes. The example is only appropriate for files and accounts explicitly authorized for testing." }]
    },
    "password-options": {
      label: "Local-only example",
      text: "john --show <authorized-local-hash-file>",
      explanation: "This asks John to display results it has already recovered from a local hash file; it is not a scan or a command executed by this site. Recovered passwords are sensitive.",
      recommendation: "Review the John options in `password-options all`, and only use an authorized training hash file.",
      details: [{ key: "--show", explanation: "Show previously cracked entries from a local file; it does not start a new guessing session." }]
    },
    "field-guide": {
      label: "Local command",
      text: "ip addr",
      explanation: "On Linux, this displays the local machine's network interfaces and addresses. It does not probe remote systems; output can still contain information you should not share publicly.",
      recommendation: "Use `field-guide guide` to learn how to interpret interfaces and addresses before sharing diagnostic output.",
      details: [{ key: "ip addr", explanation: "The `ip` utility reports local network configuration; `addr` selects interface-address details." }]
    },
    operators: {
      label: "Search query",
      text: "site:example.org <approved search terms>",
      explanation: "`site:` limits results to the reserved training domain. Search operators shape a provider's results but cannot confirm that a result is accurate or current.",
      recommendation: "Try `dorking command` to build a scoped query, and treat search results as leads that need verification.",
      details: [{ key: "site:", explanation: "This requests results indexed under a domain; it is a search filter, not an access-control or authorization check." }]
    },
    kali: {
      label: "Local help command",
      text: "nmap --help",
      explanation: "If Nmap is installed, this prints its local help text. It does not scan a target; this terminal only prints the example.",
      recommendation: "Read the official documentation for the installed version, then use `nmap guide` to understand scope and scan impact.",
      details: [{ key: "--help", explanation: "Request the program's usage help instead of supplying a target to scan." }]
    },
    "add-web": {
      label: "Terminal command",
      text: "web list",
      explanation: "List website shortcuts saved in this browser. It does not contact those sites.",
      recommendation: "Use `web add` to save a named HTTP or HTTPS shortcut, or `web edit <name>` to update one.",
      details: [{ key: "web list", explanation: "Read the shortcut names and URLs saved in local browser storage." }]
    }
  };
  const example = examples[item.id];
  if (!example) {
    writeLine(`${item.title} is a reference module; use \`${item.id} guide\` for its safe starting point.`, "muted");
    recommendNext(item.id);
    return;
  }
  rememberBuild(item, example.text, example.explanation, example.recommendation, example.details, example.label);
  showLastRecommendation();
}

function safeDomain(value) {
  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (domain.length > 253 || !domain.includes(".")) return null;
  const valid = domain.split(".").every(label =>
    label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );
  return valid ? domain : null;
}

function safeHost(value) {
  const host = value.trim();
  if (host.toLowerCase() === "localhost") return host;
  const ipv4Parts = host.split(".");
  if (ipv4Parts.length === 4 && ipv4Parts.every(part => /^\d+$/.test(part))) {
    return ipv4Parts.every(part => part.length <= 3 && Number(part) <= 255) ? host : null;
  }
  const domain = safeDomain(host);
  return domain;
}

function safePorts(value) {
  const ports = value.trim();
  if (!/^\d{1,5}(?:-\d{1,5})?(?:,\d{1,5}(?:-\d{1,5})?)*$/.test(ports)) return false;
  return ports.split(",").every(item => {
    const [start, end = start] = item.split("-").map(Number);
    return start >= 1 && end <= 65535 && start <= end;
  });
}

function safeLocalPath(value) {
  const path = value.trim();
  return path.length > 0 && path.length <= 240 &&
    /^[a-zA-Z0-9_./:\\ -]+$/.test(path) && !path.includes("..") && !/^[a-zA-Z]+:\/\//.test(path);
}

function shellQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function beginWizard(questions, complete, recommend = true, preview = null) {
  wizard = { questions, answers: [], complete, index: 0, recommend, preview, previewLine: null };
  updateWizardPreview();
  askWizardQuestion();
}

function askWizardQuestion() {
  const question = wizard.questions[wizard.index];
  writeLine(question.prompt, "system");
  commandInput.placeholder = question.placeholder || "type your answer and press Enter";
  commandInput.focus();
}

function answerWizard(value) {
  const question = wizard.questions[wizard.index];
  const result = question.validate ? question.validate(value) : { value: value.trim() };
  if (result.error) {
    writeLine(result.error, "error");
    askWizardQuestion();
    return;
  }
  wizard.answers.push(result.value);
  wizard.index += 1;
  updateWizardPreview();
  if (wizard.index < wizard.questions.length) {
    askWizardQuestion();
    return;
  }
  const finished = wizard;
  wizard = null;
  commandInput.placeholder = "type help and press Enter";
  finished.complete(finished.answers);
  if (finished.recommend) {
    if (lastBuild?.moduleId === activeModule?.id) showLastRecommendation();
    else recommendNext(activeModule?.id);
  }
}

function readLabPreferences(candidate) {
  try {
    const saved = candidate || JSON.parse(localStorage.getItem("dorkops-os-settings") || "{}");
    return {
      nmapScanType: ["-sT", "-sS", "-sU"].includes(saved.nmapScanType)
        ? saved.nmapScanType
        : defaultLabPreferences.nmapScanType,
      nmapTiming: ["-T2", "-T3"].includes(saved.nmapTiming)
        ? saved.nmapTiming
        : defaultLabPreferences.nmapTiming,
      nmapTopPorts: saved.nmapTopPorts === true
    };
  } catch (error) {
    console.error("Could not read saved Nmap builder preferences.", error);
    return { ...defaultLabPreferences };
  }
}

let labPreferences = readLabPreferences();

window.addEventListener("message", event => {
  if (event.source !== window.parent || event.origin !== window.location.origin) return;
  if (event.data?.type === "dorkops:settings") {
    labPreferences = readLabPreferences(event.data.settings);
  }
});

function normalizeColor(value) {
  const color = value.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(colorPresets, color)) return colorPresets[color];
  return /^#[0-9a-f]{6}$/i.test(color) ? color : null;
}

function applyTerminalTheme() {
  const root = document.documentElement;
  root.style.setProperty("--prompt-color", theme.promptColor);
  root.style.setProperty("--input-color", theme.inputColor);
  root.style.setProperty("--typed-color", theme.typedColor);
  const prompt = document.querySelector(".prompt");
  if (prompt) prompt.style.color = theme.promptColor;
  commandInput.style.color = theme.inputColor;
}

function openTerminalSettings() {
  writeLine("TERMINAL COLOR SETTINGS", "system");
  writeLine("Choose a preset name or a custom #RRGGBB value. These prompts stay in this terminal.", "muted");
  writeLine("Presets: green, cyan, blue, amber, violet, rose, red, white.", "muted");
  const colorQuestion = label => ({
    prompt: `${label} color:`,
    validate(value) {
      const color = normalizeColor(value);
      return color ? { value: color } : { error: "Enter a listed color name or a six-digit hex color such as #6ee7b7." };
    }
  });
  beginWizard([
    colorQuestion("Prompt"),
    colorQuestion("Text while typing"),
    colorQuestion("Submitted command text")
  ], ([promptColor, inputColor, typedColor]) => {
    theme = { promptColor, inputColor, typedColor };
    applyTerminalTheme();
    try {
      localStorage.setItem(themeStorageKey, JSON.stringify(theme));
      writeLine("Terminal colors updated and saved on this device.", "system");
    } catch (error) {
      console.error("Could not save terminal color settings.", error);
      writeLine("Colors changed for this session but could not be saved in browser storage.", "error");
    }
  }, false);
}

function restoreTerminalTheme() {
  try {
    const stored = JSON.parse(localStorage.getItem(themeStorageKey) || "null");
    if (stored === null) return null;
    const restored = {
      promptColor: normalizeColor(stored.promptColor || ""),
      inputColor: normalizeColor(stored.inputColor || ""),
      typedColor: normalizeColor(stored.typedColor || "")
    };
    if (Object.values(restored).some(color => !color)) {
      throw new TypeError("Saved terminal colors contain an unsupported value.");
    }
    theme = restored;
    applyTerminalTheme();
    return null;
  } catch (error) {
    console.error("Could not restore terminal color settings.", error);
    return "Saved terminal colors could not be loaded; default colors are active.";
  }
}

function buildNmapCommand() {
  labPreferences = readLabPreferences();
  const preferences = labPreferences;
  const defaultPorts = preferences.nmapTopPorts ? "top100" : "22,80,443";
  const validScanTypes = ["-sT", "-sS", "-sU"];
  writeLine("This creates text only. Scan one host only when its owner has explicitly authorized the test.", "muted");
  beginWizard([
    {
      prompt: "Target hostname or IPv4 address (Enter defaults to 127.0.0.1; no CIDR ranges):",
      reason: "Nmap needs a single in-scope destination. Enter defaults to this machine so the starter is safe to review locally.",
      validate(value) {
        const host = safeHost(value || "127.0.0.1");
        return host ? { value: host } : { error: "Enter one hostname or IPv4 address; ranges and command syntax are not accepted." };
      }
    },
    {
      prompt: `Scan method (-sT TCP connect, -sS SYN, -sU UDP; Enter defaults to ${preferences.nmapScanType}):`,
      reason: "Scan methods use different probes. TCP connect is the broadly compatible starter; SYN may need elevated privileges, and UDP can be slower or inconclusive.",
      validate(value) {
        const requested = value.trim().toLocaleLowerCase();
        const aliases = {
          tcp: "-sT",
          "tcp connect": "-sT",
          syn: "-sS",
          udp: "-sU"
        };
        const scanType = value.trim() ? aliases[requested] || value.trim() : preferences.nmapScanType;
        return validScanTypes.includes(scanType) ? { value: scanType } : { error: "Choose -sT, -sS, or -sU." };
      }
    },
    {
      prompt: `Ports (list/range, web, mail, or top100; Enter defaults to ${defaultPorts}):`,
      reason: "`web` chooses TCP 80 and 443; `mail` chooses common mail ports; `top100` chooses 100 commonly used ports. A short selection makes scope clear.",
      validate(value) {
        const requested = (value.trim() || defaultPorts).toLocaleLowerCase().replace(/\s+/g, "");
        const presets = {
          web: "80,443",
          mail: "25,110,143,465,587,993,995",
          common: "22,53,80,443",
          top100: "top100"
        };
        const ports = presets[requested] || requested;
        return ports === "top100" || safePorts(ports)
          ? { value: ports }
          : { error: "Use ports/ranges such as 22,80,443, or enter web, mail, common, or top100." };
      }
    },
    {
      prompt: "Add service/version detection with -sV? (yes/no; Enter defaults to no):",
      reason: "Version detection sends additional probes to open ports, so it should be enabled only when the assessment scope allows it.",
      validate(value) {
        const requested = value.trim().toLocaleLowerCase();
        const answer = requested === "y" ? "yes" : requested === "n" ? "no" : requested || "no";
        return ["yes", "no"].includes(answer) ? { value: answer === "yes" } : { error: "Enter yes or no." };
      }
    }
  ], ([host, scanType, ports, detectVersions]) => {
    const timing = preferences.nmapTiming;
    const portOption = ports === "top100" ? "--top-ports 100" : `-p ${ports}`;
    const command = `nmap ${scanType} ${timing} ${portOption}${detectVersions ? " -sV" : ""} ${host}`;
    const scanDescriptions = {
      "-sT": "TCP connect uses the operating system's normal connection process.",
      "-sS": "SYN scan may require elevated privileges and sends TCP probes.",
      "-sU": "UDP scans may take longer and can report open|filtered when a service does not respond."
    };
    rememberBuild(activeModule, command,
      `${scanDescriptions[scanType]} ${timing} selects the timing profile. ${ports === "top100" ? "The top-100 preset selects 100 common ports." : `Only ports ${ports} are selected.`} ${detectVersions ? "Service/version detection adds probes to open ports." : "Service/version detection is off."} Results do not prove a service is secure.`,
      "Confirm the host and scan method are explicitly authorized. Keep the port list narrow; enable -sV only if additional service probes are in scope.",
      [
        { key: scanType, explanation: scanDescriptions[scanType] },
        { key: timing, explanation: "Selects Nmap's timing profile; slower timing takes longer but is not a guarantee of zero impact." },
        { key: ports === "top100" ? "--top-ports 100" : "-p", explanation: ports === "top100" ? "Selects Nmap's 100 most common ports." : `Limits the scan to ports ${ports}.` },
        ...(detectVersions ? [{ key: "-sV", explanation: "Adds service and version probes to open ports; this creates additional traffic." }] : []),
        { key: host, explanation: `This is the one host being scanned. Confirm its address belongs to the authorized scope.` }
      ]);
  }, true, answers => {
    const host = answers[0] || "127.0.0.1";
    const scanType = answers[1] || preferences.nmapScanType;
    const ports = answers[2] || defaultPorts;
    const detectVersions = answers[3] === true;
    const portOption = ports === "top100" ? "--top-ports 100" : `-p ${ports}`;
    return `nmap ${scanType} ${preferences.nmapTiming} ${portOption}${detectVersions ? " -sV" : ""} ${host}`;
  });
}

function buildDorkCommand() {
  writeLine("The query is printed locally and is not submitted to a search provider.", "muted");
  beginWizard([
    {
      prompt: "Approved domain (example.org is a reserved training domain):",
      reason: "The domain creates an explicit search boundary. The terminal only prints the query; check that you are allowed to research that domain.",
      validate(value) {
        const domain = safeDomain(value.replace(/^https?:\/\//i, "").replace(/\/.*$/, ""));
        return domain ? { value: domain } : { error: "Enter a valid domain name without a path or search operators." };
      }
    },
    {
      prompt: "Search terms inside the approved scope:",
      reason: "These terms become the query text, so the generated search is relevant to the task rather than a broad unscoped query.",
      validate(value) {
        const terms = value.trim();
        return terms.length > 0 && terms.length <= 100 && /^[\p{L}\p{N}\s._'-]+$/u.test(terms)
          ? { value: terms }
          : { error: "Use 1–100 letters, numbers, spaces, periods, underscores, apostrophes, or hyphens." };
      }
    },
    {
      prompt: "Optional file type (press Enter for none):",
      reason: "A file-type filter can narrow results to a format such as PDF. Leave it blank if that filter is not needed.",
      validate(value) {
        const type = value.trim().replace(/^\./, "");
        return !type || /^[a-zA-Z0-9]{1,12}$/.test(type)
          ? { value: type }
          : { error: "Enter a short extension such as pdf, or leave this blank." };
      }
    }
  ], ([domain, terms, fileType]) => {
    const query = `site:${domain}${fileType ? ` filetype:${fileType}` : ""} ${terms}`;
    rememberBuild(activeModule, query,
      `This query asks a search provider for pages on ${domain}${fileType ? ` that are indexed as ${fileType} files` : ""} and matching "${terms}". Results may be stale, incomplete, or unrelated.`,
      "Review the result URL and source before opening it. If you want a narrower search, add one operator at a time; do not download unexpected sensitive material.",
      [
        { key: "site:", explanation: `Restrict results to pages the provider associates with ${domain}; this does not prove ownership or completeness.` },
        ...(fileType ? [{ key: "filetype:", explanation: `Ask for results indexed as ${fileType} files; search providers may interpret or ignore this filter.` }] : []),
        { key: terms, explanation: "These are the terms you asked the search provider to look for." }
      ], "Query");
  }, true, answers => {
    const domain = answers[0] || "<approved-domain>";
    const terms = answers[1] || "<search terms>";
    const fileType = answers[2] || "";
    return `site:${domain}${fileType ? ` filetype:${fileType}` : ""} ${terms}`;
  });
}

function buildImageLookup() {
  writeLine("Only submit an image or URL you are permitted to share with the selected provider.", "muted");
  beginWizard([{
    prompt: "Authorized public image URL (private images are not accepted):",
    reason: "A provider needs an image URL it can access in order to search for visual matches. Submitting it shares the URL with that external provider.",
    validate(value) {
      try {
        const url = new URL(value.trim());
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
          throw new TypeError("invalid");
        }
        return { value: url.href };
      } catch {
        return { error: "Enter a complete HTTP or HTTPS URL without embedded credentials." };
      }
    }
  }], ([imageUrl]) => {
    const providerLinks = imageProviders.map(([name, purpose, endpoint]) => {
      const url = `${endpoint}${encodeURIComponent(imageUrl)}`;
      writeLine(`${name} — ${purpose}`);
      writeLine(`  Provider URL: ${url}`, "muted");
      return { name, url, purpose };
    });
    const firstProvider = providerLinks[0];
    rememberBuild(activeModule, firstProvider.url,
      `${firstProvider.name} receives the image URL and searches for visually similar indexed images. Provider results vary and are not proof of origin, ownership, or identity.`,
      "Compare source pages, dates, crops, and surrounding context. Do not use visual matches to identify a person, and do not send private images to external providers.",
      [
        { key: "provider", explanation: `${firstProvider.name} is the first provider link in the list. Providers receive the submitted URL and may process it under their own terms.` },
        { key: "URL", explanation: "The URL is encoded as a provider query parameter. The provider may access the image and learn that it was submitted." }
      ], "Provider URL");
  }, true, answers => {
    const imageUrl = answers[0] || "<approved-public-image-url>";
    return `${imageProviders[0][2]}${encodeURIComponent(imageUrl)}`;
  });
}

function buildPasswordCommand() {
  writeLine("Authorized isolated labs only. Hydra is fixed to loopback; John and Hashcat use local files. No tool is executed.", "muted");
  beginWizard([{
    prompt: "Choose hydra, john, or hashcat:",
    reason: "These tools have different inputs and risks: Hydra tests a local service, while John and Hashcat work with local hash files.",
    validate(value) {
      const tool = value.trim().toLowerCase();
      return ["hydra", "john", "hashcat"].includes(tool)
        ? { value: tool }
        : { error: "Choose hydra, john, or hashcat." };
    }
  }], ([tool]) => {
    if (tool === "hydra") buildHydraCommand();
    else if (tool === "john") buildJohnCommand();
    else buildHashcatCommand();
  }, false, answers => `Choose ${answers[0] || "<hydra|john|hashcat>"} local workflow`);
}

function buildHydraCommand() {
  beginWizard([
    {
      prompt: "Loopback lab service (ssh or ftp):",
      reason: "Hydra needs to know which local lab service protocol to address. This builder supports only SSH or FTP on loopback.",
      validate(value) {
        const service = value.trim().toLowerCase();
        return ["ssh", "ftp"].includes(service)
          ? { value: service }
          : { error: "Choose ssh or ftp for the local training service." };
      }
    },
    {
      prompt: "Throwaway lab username:",
      reason: "The username is inserted into the local-only example. Use a disposable lab account, never a real user's credentials.",
      validate(value) {
        return /^[a-zA-Z0-9._-]{1,48}$/.test(value.trim())
          ? { value: value.trim() }
          : { error: "Use 1–48 letters, numbers, periods, underscores, or hyphens." };
      }
    },
    {
      prompt: "Local wordlist path:",
      reason: "Hydra needs a local candidate list for the isolated exercise. This application does not open or inspect the file.",
      validate(value) {
        return safeLocalPath(value)
          ? { value: value.trim() }
          : { error: "Enter a local file path using letters, numbers, spaces, and / . _ - : characters." };
      }
    }
  ], ([service, username, wordlist]) => {
    const command = `hydra -t 1 -l ${username} -P ${shellQuote(wordlist)} 127.0.0.1 ${service}`;
    rememberBuild(activeModule, command,
      `Hydra makes online login attempts against the ${service} service at 127.0.0.1 using the supplied username and local wordlist. Even a single-threaded test can lock accounts or affect a service.`,
      "Run only against an isolated loopback lab service you control. Never change the loopback target to a third-party host; review the service's lockout and rate limits first.",
      [
        { key: "-t", explanation: "-t 1 restricts the example to one parallel task; it does not eliminate lockout or service-impact risk." },
        { key: "-l", explanation: `-l ${username} supplies the single lab username.` },
        { key: "-P", explanation: "Supply a local wordlist path for the isolated exercise." },
        { key: "127.0.0.1", explanation: "Loopback points to the same machine. This lab deliberately prevents using a remote host." },
        { key: service, explanation: `Select the ${service} service on the isolated host.` }
      ]);
  }, true, answers => {
    const [service = "<ssh|ftp>", username = "<lab-user>", wordlist = "<authorized-local-wordlist>"] = answers;
    return `hydra -t 1 -l ${username} -P ${shellQuote(wordlist)} 127.0.0.1 ${service}`;
  });
}

function buildJohnCommand() {
  beginWizard([
    {
      prompt: "Authorized local hash-file path:",
      reason: "John reads this local file as the authorized audit input. Its provenance and permission need to be verified by you.",
      validate(value) {
        return safeLocalPath(value)
          ? { value: value.trim() }
          : { error: "Enter a local hash-file path; URLs, shell syntax, and parent-directory traversal are rejected." };
      }
    },
    {
      prompt: "Local wordlist path:",
      reason: "This identifies the local candidate list John will read if you later run the command. This site does not inspect it.",
      validate(value) {
        return safeLocalPath(value)
          ? { value: value.trim() }
          : { error: "Enter a local wordlist path; URLs, shell syntax, and parent-directory traversal are rejected." };
      }
    }
  ], ([hashFile, wordlist]) => {
    const command = `john --wordlist=${shellQuote(wordlist)} ${shellQuote(hashFile)}`;
    rememberBuild(activeModule, command,
      "John the Ripper compares entries in the authorized local hash file against candidates in the local wordlist. Verify the hash format and protect any recovered values.",
      "Check that both files were explicitly provided for this audit and keep results protected. Use the official John documentation if the hash format is not known.",
      [
        { key: "--wordlist", explanation: "Use the named local wordlist as candidate input; John reads the file when the command is run." },
        { key: hashFile, explanation: "This is the local hash file being audited. Confirm its provenance and authorization." }
      ]);
  }, true, answers => {
    const [hashFile = "<authorized-local-hash-file>", wordlist = "<authorized-local-wordlist>"] = answers;
    return `john --wordlist=${shellQuote(wordlist)} ${shellQuote(hashFile)}`;
  });
}

function buildHashcatCommand() {
  beginWizard([
    {
      prompt: "Verified Hashcat numeric mode from the official reference:",
      reason: "Hashcat's numeric mode identifies the hash format. A wrong mode can make results misleading, so verify it for your authorized sample.",
      validate(value) {
        return /^\d{1,5}$/.test(value.trim())
          ? { value: value.trim() }
          : { error: "Enter the numeric hash mode verified for your authorized sample." };
      }
    },
    {
      prompt: "Authorized local hash-file path:",
      reason: "This local file contains the authorized hashes to test. Verify its source and keep it protected.",
      validate(value) {
        return safeLocalPath(value)
          ? { value: value.trim() }
          : { error: "Enter a local hash-file path; URLs, shell syntax, and parent-directory traversal are rejected." };
      }
    },
    {
      prompt: "Local wordlist path:",
      reason: "This is the approved local candidate list; Hashcat reads it only if the generated command is run outside this site.",
      validate(value) {
        return safeLocalPath(value)
          ? { value: value.trim() }
          : { error: "Enter a local wordlist path; URLs, shell syntax, and parent-directory traversal are rejected." };
      }
    }
  ], ([mode, hashFile, wordlist]) => {
    const command = `hashcat -m ${mode} -a 0 ${shellQuote(hashFile)} ${shellQuote(wordlist)}`;
    rememberBuild(activeModule, command,
      `Hashcat compares the authorized local hash file to the wordlist in straight mode (-a 0), using hash mode ${mode}. A mismatched mode can produce misleading results.`,
      `Verify mode ${mode} against the official Hashcat reference and confirm both local files are approved for this audit. Protect recovered values and evidence.`,
      [
        { key: "-m", explanation: `-m ${mode} selects the hash format. It must match the supplied sample exactly.` },
        { key: "-a", explanation: "-a 0 selects a straight wordlist attack mode; Hashcat evaluates candidates from the supplied wordlist." },
        { key: hashFile, explanation: "This is the local hash file being tested. Confirm authorization and keep it protected." },
        { key: wordlist, explanation: "This is the local wordlist supplying candidate values." }
      ]);
  }, true, answers => {
    const [mode = "<verified-mode>", hashFile = "<authorized-local-hash-file>", wordlist = "<authorized-local-wordlist>"] = answers;
    return `hashcat -m ${mode} -a 0 ${shellQuote(hashFile)} ${shellQuote(wordlist)}`;
  });
}

function readWebsites() {
  let sites;
  try {
    sites = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (error) {
    console.error("Could not read saved website shortcuts.", error);
    throw new Error("Saved website data is unreadable in this browser.");
  }
  if (!Array.isArray(sites) || sites.some(site =>
    !site || typeof site.id !== "string" || typeof site.name !== "string" ||
    typeof site.url !== "string" || typeof site.description !== "string"
  )) {
    throw new TypeError("Saved website data has an invalid format.");
  }
  return sites;
}

function saveWebsites(sites) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sites));
  } catch (error) {
    console.error("Could not save website shortcuts.", error);
    writeLine("The website list could not be saved to browser storage.", "error");
    return false;
  }
  const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
  window.parent.postMessage({ type: "dorkops:websites-changed" }, targetOrigin);
  return true;
}

function normalizedWebUrl(value) {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && url.hostname && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function listWebsites() {
  let sites;
  try {
    sites = readWebsites();
  } catch (error) {
    writeLine(error.message, "error");
    return;
  }
  if (!sites.length) {
    writeLine("No saved shortcuts. Type `web add` to create one.", "muted");
    return;
  }
  writeLine(`SAVED WEBSITES / ${sites.length}`, "system");
  sites.forEach(site => {
    writeLine(`${site.name}${site.description ? ` — ${site.description}` : ""}`);
    writeLine(`  ${site.url}`, "muted");
  });
}

function saveWebsite(name, url, description, existing = null) {
  let sites;
  try {
    sites = readWebsites();
  } catch (error) {
    writeLine(error.message, "error");
    return;
  }
  const website = {
    id: existing?.id || (crypto.randomUUID ? crypto.randomUUID() : `site-${Date.now()}`),
    name,
    url,
    description
  };
  const next = existing
    ? sites.map(site => site.id === existing.id ? website : site)
    : [...sites, website];
  if (saveWebsites(next)) writeLine(`${existing ? "Updated" : "Saved"} "${name}" locally.`, "system");
}

function startWebsiteAdd() {
  const nameValidation = value => value.trim().length > 0 && value.trim().length <= 60
    ? { value: value.trim() }
    : { error: "Enter a name between 1 and 60 characters." };
  beginWizard([
    { prompt: "Shortcut name:", validate: nameValidation },
    {
      prompt: "Complete HTTP or HTTPS URL (without username or password):",
      validate(value) {
        const url = normalizedWebUrl(value);
        return url ? { value: url } : { error: "Enter a complete HTTP or HTTPS URL without embedded credentials." };
      }
    },
    { prompt: "Description (optional; press Enter to skip):", validate: value => ({ value: value.trim().slice(0, 120) }) }
  ], ([name, url, description]) => saveWebsite(name, url, description));
}

function startWebsiteEdit(name) {
  let sites;
  try {
    sites = readWebsites();
  } catch (error) {
    writeLine(error.message, "error");
    return;
  }
  const existing = sites.find(site => site.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (!existing) {
    writeLine(`No saved shortcut named "${name}". Use \`web list\` to see exact names.`, "error");
    return;
  }
  beginWizard([
    {
      prompt: `New HTTP or HTTPS URL for "${existing.name}":`,
      validate(value) {
        const url = normalizedWebUrl(value);
        return url ? { value: url } : { error: "Enter a complete HTTP or HTTPS URL without embedded credentials." };
      }
    },
    { prompt: "New description (optional):", validate: value => ({ value: value.trim().slice(0, 120) }) }
  ], ([url, description]) => saveWebsite(existing.name, url, description, existing));
}

function startWebsiteRemove(name) {
  let sites;
  try {
    sites = readWebsites();
  } catch (error) {
    writeLine(error.message, "error");
    return;
  }
  const existing = sites.find(site => site.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (!existing) {
    writeLine(`No saved shortcut named "${name}". Use \`web list\` to see exact names.`, "error");
    return;
  }
  beginWizard([{
    prompt: `Remove "${existing.name}"? Type yes to confirm:`,
    validate(value) {
      return ["yes", "no"].includes(value.trim().toLowerCase())
        ? { value: value.trim().toLowerCase() }
        : { error: "Type yes or no." };
    }
  }], ([answer]) => {
    if (answer === "no") {
      writeLine("Removal cancelled.", "muted");
      return;
    }
    const next = sites.filter(site => site.id !== existing.id);
    if (saveWebsites(next)) writeLine(`Removed "${existing.name}" from this browser.`, "system");
  });
}

function showSection(item, section) {
  activeModule = item;
  pendingModule = item;
  lastBuild = null;
  lastRecommendation = null;
  if (section === "basic") showBasicExample(item);
  else if (section === "guide") showGuide(item);
  else if (section === "all") showAllCommands(item);
  else if (item.id === "nmap") buildNmapCommand();
  else if (item.id === "dorking") buildDorkCommand();
  else if (item.id === "images") buildImageLookup();
  else if (item.id === "passwords" || item.id === "password-options") buildPasswordCommand();
  else if (item.id === "add-web") {
    writeLine("Use `web add`, `web edit <name>`, `web remove <name>`, or `web list`.", "system");
    recommendNext(item.id);
  } else {
    writeLine(`${item.title} is a reference module; it does not generate or execute commands.`, "muted");
    recommendNext(item.id);
  }
}

function webCommand(value) {
  const match = value.match(/^web\s+(add|list|edit|remove)(?:\s+(.+))?$/i);
  if (!match) return false;
  const action = match[1].toLowerCase();
  const name = (match[2] || "").trim();
  if (action === "add") startWebsiteAdd();
  else if (action === "list") listWebsites();
  else if (!name) writeLine(`Provide a shortcut name: web ${action} <name>`, "error");
  else if (action === "edit") startWebsiteEdit(name);
  else startWebsiteRemove(name);
  return true;
}

function showHelp() {
  writeLine("DORK OPS TERMINAL / LOCAL NAVIGATION COMMANDS", "system");
  writeLine("help                         show this help");
  writeLine("modules                      list available modules");
  writeLine("start [topic]                beginner guided start (nmap, dorking, images, passwords)");
  writeLine("nmap                         select Nmap Operators");
  writeLine("nmap basic | guide | command | all  get a starter, guide, builder, or full reference");
  writeLine("limits                       explain the selected example's limitations");
  writeLine("dorking / images / passwords select a lab module");
  writeLine("<module> basic|guide|command|all  get a starter, guide, builder, or full reference");
  writeLine("why [option]                 explain the latest generated example");
  writeLine("recommend                    get a relevant next step");
  writeLine("copy                         copy the latest generated line");
  writeLine("history [search <term>]      find entered commands and generated examples");
  writeLine("history run|use|copy <#>     rerun local navigation, edit, or copy a history entry");
  writeLine("recipe list                  list locally saved command/query templates");
  writeLine("recipe save <name>           save the latest example with target placeholders");
  writeLine("recipe show|use|delete <name> inspect, edit, or remove a saved recipe");
  writeLine("web add | web list           manage personal website shortcuts");
  writeLine("web edit <name>              update a saved shortcut");
  writeLine("web remove <name>            remove a saved shortcut");
  writeLine("settings                     set prompt and typed-text colors");
  writeLine("theme reset                  restore default terminal colors");
  writeLine("back                         return to the previous builder question");
  writeLine("cancel                       cancel an active prompt");
  writeLine("clear                        hide the feed; use `restore` to bring it back");
  writeLine("restore                      restore the most recently cleared feed");
  writeLine("Nothing entered here is executed by your operating system; no scans or password tests are run.", "muted");
}

function clearTerminalFeed() {
  if (!output.children.length) return;
  if (clearedFeedKey) {
    try {
      localStorage.setItem(clearedFeedKey, JSON.stringify({
        version: 1,
        output: Array.from(output.children, serializeTerminalNode).filter(Boolean),
        history: history.slice(-200),
        activity: activityLog.slice(-200),
        draft: ""
      }));
    } catch (error) {
      console.error("Could not preserve the Terminal feed before clearing it.", error);
      writeLine("Could not safely clear the feed because its recovery copy could not be saved.", "error");
      return;
    }
  }
  wizard = null;
  activeModule = null;
  pendingModule = null;
  lastBuild = null;
  lastRecommendation = null;
  commandInput.placeholder = "type help and press Enter";
  output.replaceChildren();
  currentOutputGroup = null;
  outputLineCount = 0;
  terminalFeedCleared = true;
  saveTerminalSession();
}

function restoreClearedFeed() {
  if (!clearedFeedKey) {
    writeLine("This Terminal session has no local recovery storage.", "error");
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(clearedFeedKey) || "null");
    if (!saved || saved.version !== 1 || !Array.isArray(saved.output)) {
      writeLine("There is no recently cleared Terminal feed to restore.", "muted");
      return;
    }
    output.replaceChildren();
    saved.output.slice(0, 1000).forEach(record => {
      const restoredNode = restoreTerminalNode(record);
      if (restoredNode) output.appendChild(restoredNode);
    });
    if (Array.isArray(saved.history)) {
      history.length = 0;
      history.push(...saved.history.filter(item => typeof item === "string").slice(-200));
      historyPosition = history.length;
    }
    if (Array.isArray(saved.activity)) {
      activityLog.length = 0;
      activityLog.push(...saved.activity.filter(item =>
        item && ["command", "generated"].includes(item.type) &&
        typeof item.text === "string" && item.text.length <= 3000 &&
        typeof item.label === "string" && item.label.length <= 120
      ).slice(-200));
    }
    outputLineCount = output.querySelectorAll(".terminal-line").length;
    currentOutputGroup = output.lastElementChild;
    terminalFeedCleared = false;
    trimOutput();
    output.scrollTop = output.scrollHeight;
    localStorage.removeItem(clearedFeedKey);
    saveTerminalSession();
  } catch (error) {
    console.error("Could not restore the recently cleared Terminal feed.", error);
    writeLine("The saved Terminal recovery copy could not be restored.", "error");
  }
}

function dispatch(raw) {
  const value = raw.trim();
  const lower = value.toLocaleLowerCase();
  if (lower === "clear" || lower === "cls") {
    clearTerminalFeed();
    return;
  }
  if (lower === "restore") {
    restoreClearedFeed();
    return;
  }
  if (wizard) {
    if (lower === "back") {
      if (wizard.index > 0) {
        wizard.index -= 1;
        wizard.answers.pop();
        updateWizardPreview();
      }
      askWizardQuestion();
      return;
    } else if (lower === "cancel") {
      wizard = null;
      commandInput.placeholder = "type help and press Enter";
      writeLine("Prompt cancelled.", "muted");
      return;
    } else if (/^(why|explain)(?:\s+(.+))?$/.test(lower)) {
      const question = value.match(/^(?:why|explain)(?:\s+(.+))?$/i)?.[1] || "";
      explainLastBuild(question);
      askWizardQuestion();
      return;
    } else if (/^(recommend|recommendation|recommendations|next)(?:\s+step)?$/.test(lower)) {
      showLastRecommendation();
      askWizardQuestion();
      return;
    } else if (lower === "copy") {
      copyLastBuild();
      askWizardQuestion();
      return;
    } else {
      const routedCommand = lower.replace(/^(open|launch|use|select)\s+/, "");
      const startsAnotherFlow = /^(?:help|\?|help me|apps|modules|list apps|show modules|home|exit|basic|starter|basic command|starter command|make a command|make command|build a command|command|start|beginner|recipe|history|limits)\b/.test(lower)
        || Boolean(findModuleCommand(routedCommand));
      if (startsAnotherFlow) {
        wizard = null;
        commandInput.placeholder = "type help and press Enter";
        writeLine("Current builder cancelled; processing the new command.", "muted");
      } else {
        answerWizard(value);
        return;
      }
    }
  }
  if (!value) return;
  if (["help", "?", "help me"].includes(lower)) {
    showHelp();
    return;
  }
  if (["basic", "starter", "basic command", "starter command"].includes(lower)) {
    const selectedModule = activeModule || pendingModule;
    if (selectedModule) showSection(selectedModule, "basic");
    else {
      writeLine("Select a module before asking for a basic example.", "muted");
      showModules();
    }
    return;
  }
  const whyMatch = value.match(/^(?:why|explain)(?:\s+(.+))?$/i);
  if (whyMatch) {
    explainLastBuild(whyMatch[1] || "");
    return;
  }
  if (/^(recommend|recommendation|recommendations|next)(?:\s+step)?$/i.test(value)) {
    showLastRecommendation();
    return;
  }
  if (lower === "copy") {
    copyLastBuild();
    return;
  }
  if (["apps", "modules", "list apps", "show modules"].includes(lower)) {
    showModules();
    return;
  }
  if (lower === "start" || lower === "beginner" || lower === "beginner start") {
    startBeginnerFlow();
    return;
  }
  const startMatch = value.match(/^start\s+(.+)$/i);
  if (startMatch) {
    const item = findModule(startMatch[1]);
    if (item && ["dorking", "images", "nmap", "passwords"].includes(item.id)) {
      showBasicExample(item);
      writeLine(`To learn the terms, type \`${item.id} guide\`. To build a variation, type \`${item.id} command\`.`, "muted");
    } else {
      writeLine("Choose a beginner topic: dorking, images, nmap, or passwords.", "error");
    }
    return;
  }
  if (lower === "limits" || lower === "limitations" || lower === "caveats") {
    explainLimitations();
    return;
  }
  if (handleRecipeCommand(value)) return;
  if (handleHistoryCommand(value)) return;
  if (["settings", "theme", "colors", "colours", "theme settings"].includes(lower)) {
    openTerminalSettings();
    return;
  }
  if (lower === "theme reset") {
    theme = { ...defaultTheme };
    applyTerminalTheme();
    try {
      localStorage.removeItem(themeStorageKey);
      writeLine("Terminal colors reset to defaults.", "system");
    } catch (error) {
      console.error("Could not reset terminal color settings.", error);
      writeLine("Default colors are active, but saved settings could not be cleared.", "error");
    }
    return;
  }
  if (["back", "home", "exit"].includes(lower)) {
    activeModule = null;
    pendingModule = null;
    writeLine("Returned to the module prompt.", "system");
    showModules();
    return;
  }
  if (webCommand(value)) return;
  if (lower === "make a command" || lower === "make command" || lower === "build a command" || lower === "command") {
    if (activeModule) showSection(activeModule, "command");
    else {
      writeLine("Select a module before opening its command prompt.", "muted");
      showModules();
    }
    return;
  }
  if (pendingModule && normalizeSection(lower)) {
    showSection(pendingModule, normalizeSection(lower));
    return;
  }
  const routed = lower.replace(/^(open|launch|use|select)\s+/, "");
  const match = findModuleCommand(routed);
  if (match) {
    if (!match.remainder) {
      showSections(match.item);
      return;
    }
    const section = normalizeSection(match.remainder);
    if (section) {
      showSection(match.item, section);
      return;
    }
    const commandPhrase = match.remainder.replace(/\s+(operators|options|library|catalog)$/, " all");
    const adjustedSection = normalizeSection(commandPhrase);
    if (adjustedSection) {
      showSection(match.item, adjustedSection);
      return;
    }
    writeLine(`Unknown ${match.item.title} section: ${match.remainder}.`, "error");
    showSections(match.item);
    return;
  }
  if (lower === "cancel") {
    writeLine("There is no active prompt to cancel.", "muted");
    return;
  }
  writeLine(`Command not recognized: ${value}`, "error");
  writeLine("Try `help`, `apps`, or select `nmap`, `dorking`, `images`, or `passwords`.", "muted");
}

commandForm.addEventListener("submit", event => {
  event.preventDefault();
  const value = commandInput.value.trim();
  if (!value && !wizard) return;
  if (!wizard) {
    writeLine(`operator@dorkops:~$ ${value}`, "command");
    history.push(value);
    historyPosition = history.length;
    recordActivity("command", "Terminal command", value);
  } else {
    writeLine(value ? `> ${value}` : "> [blank]", "command");
  }
  commandInput.value = "";
  dispatch(value);
  saveTerminalSession();
});

commandInput.addEventListener("input", saveTerminalSession);

commandInput.addEventListener("keydown", event => {
  if (wizard) {
    if (event.key === "Enter") {
      event.preventDefault();
      commandForm.requestSubmit();
    }
    return;
  }
  if (event.key === "ArrowUp" && history.length) {
    event.preventDefault();
    historyPosition = Math.max(0, historyPosition - 1);
    commandInput.value = history[historyPosition];
    saveTerminalSession();
  } else if (event.key === "ArrowDown" && history.length) {
    event.preventDefault();
    historyPosition = Math.min(history.length, historyPosition + 1);
    commandInput.value = history[historyPosition] || "";
    saveTerminalSession();
  }
});

const themeRestoreError = restoreTerminalTheme();
const terminalSessionRestored = restoreTerminalSession();
if (terminalSessionRestored && !terminalFeedCleared) {
  writeLine("Previous Terminal work restored from this device. An unfinished command builder must be restarted with `<module> command`.", "muted");
} else if (!terminalSessionRestored) {
  writeLine("Local session ready. Try `nmap basic`, `dorking command`, or ask `why` after a result.", "muted");
}
if (themeRestoreError) writeLine(themeRestoreError, "error");
if (!terminalSessionRestored) showModules();
commandInput.focus();
