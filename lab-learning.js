"use strict";

const labLessons = {
  p1: {
    title: "Google Dorking",
    time: "10 min",
    objective: "Build focused public searches, explain what each operator does, and keep every query inside an approved scope.",
    scenario: "A fictional training team has approved a review of its public site. Practice with example.org, a reserved example domain; do not substitute a real organization without written permission.",
    steps: [
      "Confirm the domain and allowed public-data categories in the written scope.",
      "Use the builder to compare a site-limited search with a document-type search.",
      "Inspect the generated query before opening any external search provider.",
      "Record only relevant public URLs and report accidental exposure without downloading it."
    ],
    expected: "A query such as site:example.org filetype:pdf narrows public-index results by host and file type. Search providers may return no results or stale results; that does not prove content is absent.",
    mistakes: "Treating search results as proof of a vulnerability; omitting the site: scope; downloading sensitive files; or assuming an empty result means a clean bill of health."
  },
  p2: {
    title: "Image Lookup",
    time: "8 min",
    objective: "Compare image matches critically, distinguish a visual clue from verified provenance, and avoid privacy-invasive identification.",
    scenario: "A fictional communications team has permission to trace the publication history of its own landscape banner. Use a non-personal sample image and a URL you are allowed to share.",
    steps: [
      "Confirm ownership or permission to submit the image or its URL.",
      "Choose a non-personal image and note its original source and date.",
      "Compare matches across providers, checking crop, context, source page, and publication date.",
      "Document uncertainty; do not infer a person's identity from a visual match."
    ],
    expected: "A match can point to a visually similar image or source page. Differences in crop, context, and date can change the interpretation; the result alone does not prove who created or owns an image.",
    mistakes: "Submitting private images without permission; treating a similar crop as proof of origin; or using the workflow to identify a person."
  },
  p3: {
    title: "Nmap",
    time: "12 min",
    objective: "Explain the scope and effect of a basic port scan, read port states cautiously, and use only an explicitly authorized host.",
    scenario: "Practice planning a low-impact TCP connect scan against 127.0.0.1 on your own machine. The builder creates text only and never runs a scan.",
    steps: [
      "Check written scope, approved time window, and rate restrictions before any real assessment.",
      "For a local exercise, select TCP connect, T2 timing, and a small explicit port list.",
      "Review every generated flag and target before copying a command.",
      "Compare actual output with service-owner records; redact sensitive details from notes."
    ],
    expected: "A port state such as open, closed, or filtered describes what the scanner observed at that time. Results vary with host state, firewall rules, network path, and privileges.",
    mistakes: "Scanning a public address without approval; confusing filtered with closed; enabling broader discovery flags without scope; or treating a port number as proof of a particular application."
  },
  p4: {
    title: "Password Tools",
    time: "12 min",
    objective: "Distinguish online service testing from offline hash auditing and keep credentials, hash files, and wordlists inside an authorized isolated lab.",
    scenario: "Use a throwaway local training service or an instructor-provided sample hash file. Never use real accounts, shared infrastructure, or production credentials.",
    steps: [
      "Confirm the lab is isolated and the account or hash data is explicitly provided for practice.",
      "Choose the tool appropriate to the exercise: service testing is online; hash auditing reads local files.",
      "Review the generated command and local paths; this page never executes it or reads the files.",
      "Remove temporary lab data and report results without exposing recovered secrets."
    ],
    expected: "The builder produces a text example only. Hydra is fixed to loopback in this lab; John and Hashcat use local file paths. Tool output depends on the service, hash format, and provided data.",
    mistakes: "Pointing an online tool at a third-party service; using real credentials; guessing a hash format; or assuming a path exists because it appears in the example."
  }
};

window.DORK_OPS_LAB_LESSONS = labLessons;

function createLessonElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function addLessonCard(host, heading, content) {
  const card = createLessonElement("article", "lab-learning-card");
  card.append(createLessonElement("h3", "", heading), createLessonElement("p", "", content));
  host.appendChild(card);
}

function addAppSectionHeading(host, kicker, title, description) {
  const heading = createLessonElement("div", "lab-app-section-heading");
  heading.append(
    createLessonElement("span", "lab-learning-kicker", kicker),
    createLessonElement("h3", "", title),
    createLessonElement("p", "", description)
  );
  host.appendChild(heading);
}

function addCopyableCommand(host, title, description, command) {
  const card = createLessonElement("article", "lab-command-card");
  card.append(
    createLessonElement("h4", "", title),
    createLessonElement("p", "", description)
  );
  const row = createLessonElement("div", "lab-command-example");
  const sample = createLessonElement("code", "", command);
  const copy = createLessonElement("button", "btn lab-command-copy", "Copy");
  copy.type = "button";
  copy.addEventListener("click", () => copyText(command, copy));
  row.append(sample, copy);
  card.appendChild(row);
  host.appendChild(card);
}

function addCommandSearch(host, id, placeholder) {
  const label = createLessonElement("label", "lab-command-search");
  label.htmlFor = id;
  const input = createLessonElement("input", "", "");
  input.id = id;
  input.type = "search";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.setAttribute("aria-label", placeholder);
  const status = createLessonElement("span", "lab-command-search-status");
  status.setAttribute("aria-live", "polite");
  label.append(input, status);
  host.appendChild(label);
  return { input, status };
}

function filterCommandCards(input, status, cards, groups = []) {
  const query = input.value.trim().toLocaleLowerCase();
  let visible = 0;
  cards.forEach(card => {
    card.hidden = Boolean(query) && !card.textContent.toLocaleLowerCase().includes(query);
    if (!card.hidden) visible++;
  });
  groups.forEach(group => {
    group.hidden = !group.querySelector(".lab-command-card:not([hidden])");
  });
  status.textContent = `${visible} ${visible === 1 ? "entry" : "entries"}`;
}

function renderGoogleCommandCatalog(host) {
  addAppSectionHeading(host, "PUBLIC SEARCH / QUERY FIELD NOTES", "Search command patterns", "These operator strings shape public-index queries; they do not verify a finding. Replace placeholders only with terms and domains inside your written scope.");
  const { input, status } = addCommandSearch(host, "google-command-search", "Filter query patterns");
  const list = createLessonElement("div", "lab-command-grid");
  host.appendChild(list);
  [
    ["Limit results to one authorized site", "Use when you have a specific domain in scope. Search results may be incomplete or stale.", "site:<authorized-domain> <search terms>"],
    ["Find a public document type", "Use a filetype filter to narrow an already approved public search. Do not download sensitive material.", "site:<authorized-domain> filetype:pdf <search terms>"],
    ["Match a phrase in a page title", "Use when a title phrase is a useful public discovery clue; it does not verify the page contents.", "site:<authorized-domain> intitle:<term> <search terms>"],
    ["Match a term in a URL", "Use to locate indexed paths containing a relevant public keyword.", "site:<authorized-domain> inurl:<term> <search terms>"],
    ["Search for an exact phrase", "Quote a phrase when its word order matters. Add a site restriction when the approved scope is a domain.", '"<exact phrase>" site:<authorized-domain>']
  ].forEach(([title, description, command]) => addCopyableCommand(list, title, description, command));
  const cards = Array.from(list.querySelectorAll(".lab-command-card"));
  input.addEventListener("input", () => filterCommandCards(input, status, cards));
  filterCommandCards(input, status, cards);
  const link = createLessonElement("a", "lab-app-reference-link", "Open the complete Search Operators reference →");
  link.href = "search-operators.html";
  host.appendChild(link);
}

function renderImageCommandCatalog(host) {
  addAppSectionHeading(host, "VISUAL RECON / PROVIDER DIRECTORY", "Image lookup providers", "The provider receives an image URL only after you choose its link. Submit only material you are permitted to share; a visual match is a lead, not proof of identity or origin.");
  const { input, status } = addCommandSearch(host, "image-command-search", "Filter image providers");
  const list = createLessonElement("div", "lab-image-provider-catalog");
  list.id = "image-provider-catalog";
  host.appendChild(list);
  input.addEventListener("input", () => filterCommandCards(input, status, Array.from(list.querySelectorAll(".lab-command-card"))));
  filterCommandCards(input, status, []);
}

function populateImageProviderCatalog(host) {
  const output = document.getElementById("eng");
  if (!host || !output || output.hidden || !output.querySelector("a")) return;
  host.replaceChildren();
  Array.from(output.querySelectorAll("a")).forEach(link => {
    const card = createLessonElement("article", "lab-command-card");
    const heading = createLessonElement("h4", "", link.firstChild.textContent.trim());
    const description = createLessonElement("p", "", link.querySelector("span")?.textContent.trim() || "Open this external provider for a visual match.");
    const open = createLessonElement("a", "lab-app-reference-link", "Open provider ↗");
    open.href = link.href;
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    card.append(heading, description, open);
    host.appendChild(card);
  });
  const input = document.getElementById("image-command-search");
  const status = input?.parentElement.querySelector(".lab-command-search-status");
  if (input && status) filterCommandCards(input, status, Array.from(host.querySelectorAll(".lab-command-card")));
}

function renderPasswordCommandCatalog(host) {
  addAppSectionHeading(host, "CREDENTIAL AUDIT / OPTION REFERENCE", "Password-tool command patterns", "Examples use local lab files and placeholders. Hydra performs online login checks; John and Hashcat process local hash files. Confirm authorization, tool version, and local data handling first.");
  const { input, status } = addCommandSearch(host, "password-command-search", "Filter password tools, options, and examples");
  const groups = [];
  if (!Array.isArray(PASSWORD_TOOL_OPTIONS)) {
    host.appendChild(createLessonElement("p", "lab-command-empty", "The password-tool reference data is unavailable."));
    console.error("Password-tool command catalog data is unavailable.");
    return;
  }
  PASSWORD_TOOL_OPTIONS.forEach(group => {
    const section = createLessonElement("section", "lab-command-group");
    groups.push(section);
    const intro = createLessonElement("div", "lab-command-group-heading");
    intro.append(
      createLessonElement("h4", "", group.tool),
      createLessonElement("p", "", group.description)
    );
    const list = createLessonElement("div", "lab-command-grid");
    group.options.forEach(([flag, description, example]) => {
      addCopyableCommand(list, flag, description, example.replace(/<wordlist>/g, DEFAULT_WORDLIST_PATH));
    });
    const docs = createLessonElement("a", "lab-app-reference-link", `Official ${group.tool} documentation ↗`);
    docs.href = group.documentation;
    docs.target = "_blank";
    docs.rel = "noopener noreferrer";
    section.append(intro, list, docs);
    host.appendChild(section);
  });
  const cards = Array.from(host.querySelectorAll(".lab-command-card"));
  input.addEventListener("input", () => filterCommandCards(input, status, cards, groups));
  filterCommandCards(input, status, cards, groups);
}

function enhanceLab(id, lesson) {
  const lab = document.getElementById(id);
  if (!lab) return;

  const practice = document.createElement("div");
  practice.dataset.labPanel = "practice";
  practice.className = "lab-practice-panel";
  while (lab.firstChild) practice.appendChild(lab.firstChild);

  const learning = createLessonElement("section", "lab-learning-panel");
  learning.dataset.labPanel = "learn";
  learning.setAttribute("aria-label", `${lesson.title} learner's guide`);
  const intro = createLessonElement("div", "lab-learning-intro");
  intro.append(createLessonElement("span", "lab-learning-kicker", `${lesson.time} · OPERATOR FIELD GUIDE`));
  intro.append(createLessonElement("h3", "", `${lesson.title} learner's guide`));
  intro.append(createLessonElement("p", "", lesson.objective));
  const scenario = createLessonElement("div", "lab-learning-scenario");
  scenario.append(createLessonElement("strong", "", "MISSION SCOPE / TRAINING ONLY"), createLessonElement("p", "", lesson.scenario));
  learning.append(intro, scenario);
  const steps = createLessonElement("section", "lab-learning-steps");
  steps.appendChild(createLessonElement("h3", "", "Operational procedure"));
  const list = document.createElement("ol");
  lesson.steps.forEach(step => list.appendChild(createLessonElement("li", "", step)));
  steps.appendChild(list);
  learning.appendChild(steps);
  const insights = createLessonElement("div", "lab-learning-grid");
  addLessonCard(insights, "Expected field signal", lesson.expected);
  addLessonCard(insights, "Operator pitfalls", lesson.mistakes);
  learning.appendChild(insights);

  const allCommands = createLessonElement("section", "lab-all-commands-panel");
  allCommands.dataset.labPanel = "all-commands";
  allCommands.setAttribute("aria-label", `${lesson.title} command library`);
  addAppSectionHeading(allCommands, "REFERENCE CACHE / FLAGS & PATTERNS", "All Commands", "Search the command patterns, flags, and references available in this module. The workspace never executes these examples.");

  const navigation = createLessonElement("nav", "lab-section-nav");
  navigation.setAttribute("aria-label", `${lesson.title} app sections`);
  navigation.setAttribute("role", "tablist");
  const panels = [learning, practice, allCommands];
  const tabs = [];
  const tabLabels = [
    ["learn", "Learner's Guide"],
    ["command", "Command"],
    ["all-commands", "All Commands"]
  ];
  tabLabels.forEach(([name, label], index) => {
    const button = createLessonElement("button", "lab-section-tab", label);
    button.type = "button";
    button.id = `${id}-${name}-tab`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", `${id}-${name}-panel`);
    button.setAttribute("aria-selected", String(index === 0));
    button.tabIndex = index === 0 ? 0 : -1;
    panels[index].id = `${id}-${name}-panel`;
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", button.id);
    panels[index].hidden = index !== 0;
    tabs.push(button);
    navigation.appendChild(button);
    button.addEventListener("click", () => activate(index));
    button.addEventListener("keydown", event => {
      const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
        : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : -1;
      if (next >= 0) {
        event.preventDefault();
        activate(next);
        tabs[next].focus();
      }
    });
  });

  function activate(index) {
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[tabIndex].hidden = !active;
    });
  }

  if (id === "p3") {
    const nmapGuide = practice.querySelector(".nmap-guide-panel");
    const nmapCatalog = practice.querySelector(".nmap-library-panel");
    if (nmapGuide) learning.appendChild(nmapGuide);
    if (nmapCatalog) allCommands.appendChild(nmapCatalog);
  } else if (id === "p1") {
    renderGoogleCommandCatalog(allCommands);
  } else if (id === "p2") {
    renderImageCommandCatalog(allCommands);
  } else if (id === "p4") {
    renderPasswordCommandCatalog(allCommands);
  }

  lab.prepend(navigation);
  lab.append(learning, practice, allCommands);
  const openAllCommands = practice.querySelector("#nmap-open-operators");
  if (openAllCommands) {
    openAllCommands.addEventListener("click", () => {
      activate(2);
      tabs[2].focus();
    });
  }
  if (id === "p2") {
    document.addEventListener("dorkops:image-ready", () => {
      populateImageProviderCatalog(document.getElementById("image-provider-catalog"));
    });
  }
}

if (document.getElementById("p1")) {
  Object.entries(labLessons).forEach(([id, lesson]) => enhanceLab(id, lesson));
}
