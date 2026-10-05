"use strict";

const GROUPS = {
  documents: ["Documents", "Publicly indexed reports, papers, spreadsheets and slides.", (query, domain, documentFormat) => {
    const formats = { pdf: "PDF", doc: "Word", docx: "Word", xls: "Excel", xlsx: "Excel", ppt: "PowerPoint", pptx: "PowerPoint", txt: "Text", csv: "CSV" };
    const types = documentFormat && documentFormat !== "all" ? [documentFormat] : Object.keys(formats);
    return types.map(type => [`${domain ? `site:${domain} ` : ""}${query} filetype:${type}`, `${formats[type]} documents matching the terms.`]);
  }],
  pages: ["Page matches", "Match terms in public page titles, URLs or body text.", (query, domain) => {
    const scope = domain ? `site:${domain} ` : "";
    return [
      [`${scope}intitle:${query}`, "Terms must appear in the page title."],
      [`${scope}inurl:${query}`, "Terms must appear in the web address."],
      [`${scope}intext:${query}`, "Terms must appear in the page text."]
    ];
  }],
  footprint: ["Domain footprint", "Publicly indexed pages and subdomain references for an authorized domain.", (query, domain) => domain ? [
    [`site:*.${domain} -www`, "Indexed pages on subdomains."],
    [`site:${domain}`, "Public pages indexed for this domain."],
    [`site:${domain} -www`, "Indexed pages excluding the www host."],
    [`site:${domain} intitle:about OR intitle:contact`, "Public organization and contact pages."]
  ] : []],
  docs: ["Site documentation", "Locate public sitemap, robots and service-status pages.", (query, domain) => domain ? [
    [`site:${domain} inurl:robots.txt`, "Robots exclusion policy, if indexed."],
    [`site:${domain} inurl:sitemap`, "Public sitemap references, if indexed."],
    [`site:${domain} intitle:status OR intitle:system status`, "Public service status pages."]
  ] : []],
  mentions: ["Mentions elsewhere", "Find public discussions and references to your terms.", (query, domain) => {
    const queries = [[query, "Plain search for all terms together."]];
    if (domain) queries.push([`${query} -site:${domain}`, "Mentions outside the target domain."]);
    queries.push([`${query} inurl:forum`, "Forum discussions."], [`${query} intitle:review`, "Review pages."], [`${query} site:news.google.com`, "News references."]);
    return queries;
  }],
  repositories: ["Public repositories", "Public project pages and developer documentation.", (query, domain) => {
    const queries = ["github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com"].map(host => [`site:${host} ${query}`, `Public ${host} pages matching the terms.`]);
    if (domain) queries.push([`site:github.com "${domain}"`, "Public GitHub pages mentioning the domain."]);
    return queries;
  }],
  archives: ["Archive references", "Older public pages and archived references.", (query, domain) => {
    const queries = [[`site:web.archive.org ${query}`, "Archived pages mentioning your terms."]];
    if (domain) queries.push([`site:web.archive.org ${domain}`, "Archived copies of the domain."]);
    return queries;
  }]
};

const selected = new Set(["documents", "pages", "footprint", "docs", "mentions", "repositories", "archives"]);
let generatedQueries = [];
let lastBuild = null;
let persistedQueryEdits = [];
const byId = id => document.getElementById(id);

function saveMainWorkspace(statusId = "google-save-status") {
  const state = {
    query: byId("q").value,
    matchMode: byId("keyword-match-mode").value,
    domain: byId("d").value,
    selectedGroups: Array.from(selected),
    lastBuild,
    queryEdits: persistedQueryEdits,
    imageUrl: byId("img").value
  };
  try {
    localStorage.setItem("dorkops-workspace", JSON.stringify(state));
    byId(statusId).textContent = "Saved on this device";
  } catch {
    byId(statusId).textContent = "Could not save on this device";
  }

}

function parseTerms(raw) {
  const terms = raw.split(/(?:\s*,\s*|\s+and\s+)(?=(?:[^"]*"[^"]*")*[^"]*$)/i)
    .map(term => term.trim().replace(/^"([^"]+)"$/, "$1").trim())
    .filter(Boolean);
  return terms.filter((term, index) =>
    terms.findIndex(candidate => candidate.toLowerCase() === term.toLowerCase()) === index);
}

function cleanSearchIntent(term) {
  return term
    .replace(/^\s*(?:(?:i\s*(?:am|'m|m)?\s+)?(?:looking|searching)\s+for|find\s+me|search\s+for)\s+/i, "")
    .replace(/\bpdf\s+of\b/gi, " ")
    .replace(/\bpdf\b/gi, " ")
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1")
    .trim();
}

function resolveSearchInputs(raw, configuredDomain) {
  let terms = parseTerms(raw);
  let domain = cleanDomain(configuredDomain);
  let detectedDomain = "";
  for (const term of terms) {
    const candidate = cleanDomain(term.replace(/[.,!?;]+$/g, ""));
    if (candidate.includes(".") && isValidDomain(candidate)) {
      detectedDomain = candidate;
      break;
    }
  }
  if (detectedDomain && (!domain || domain === detectedDomain)) {
    domain = detectedDomain;
    terms = terms.filter(term => cleanDomain(term.replace(/[.,!?;]+$/g, "")) !== detectedDomain);
  }
  const wantsPdf = /\bpdf\b/i.test(raw);
  terms = terms.map(cleanSearchIntent).filter(Boolean);
  return { terms, domain, wantsPdf };
}

function quoteTerm(term) {
  const unquoted = term.replace(/^"(.*)"$/, "$1");
  return /\s/.test(unquoted) ? `"${unquoted}"` : unquoted;
}

function cleanDomain(value) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

function isValidDomain(domain) {
  return /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(domain) && !domain.includes("..") && !domain.includes(".-") && !domain.includes("-.");
}

function showParsed(terms) {
  const raw = byId("q").value.trim();
  const resolved = resolveSearchInputs(raw, byId("d").value);
  terms = resolved.terms;
  const parsed = byId("parsed");
  parsed.replaceChildren();
  parsed.hidden = terms.length === 0;
  terms.forEach((term, index) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    const text = document.createElement("span");
    text.textContent = term;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-term";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove keyword ${term}`);
    remove.addEventListener("click", () => {
      const inputs = resolveSearchInputs(byId("q").value.trim(), byId("d").value);
      const remaining = inputs.terms.filter((_, termIndex) => termIndex !== index);
      if (!byId("d").value.trim() && inputs.domain) byId("d").value = inputs.domain;
      byId("q").value = remaining.map(value => /\s|,/.test(value) ? `"${value}"` : value).join(", ");
      invalidateGoogleBuild();
      showParsed(remaining);
      saveMainWorkspace();
      byId("q").focus();
    });
    tag.append(text, remove);
    parsed.appendChild(tag);
  });
  byId("keyword-match-help").textContent = byId("keyword-match-mode").value === "any"
    ? "A page may match any one of the listed keywords or exact phrases."
    : "Every keyword or phrase must match.";
}

function setWarning(message, emptyMessage) {
  const warning = byId("warn");
  warning.textContent = message;
  warning.hidden = false;
  byId("out").innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = emptyMessage;
  byId("out").appendChild(empty);
}

function invalidateGoogleBuild() {
  generatedQueries = [];
  lastBuild = null;
  persistedQueryEdits = [];
  byId("auth").checked = false;
  byId("google-next-steps").hidden = true;
  byId("warn").hidden = true;
  byId("copyAll").hidden = true;
  byId("export").hidden = true;
  byId("count").textContent = "RESULTS / READY";
  byId("out").replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = "Update the scope, confirm authorization, then generate a fresh query set.";
  byId("out").appendChild(empty);
}

function addQueryGroup(name, description, queries) {
  const output = byId("out");
  const heading = document.createElement("div");
  heading.className = "grp";
  heading.textContent = name;
  output.appendChild(heading);
  const detail = document.createElement("div");
  detail.className = "gd";
  detail.textContent = description;
  output.appendChild(detail);

  queries.forEach(([query, explanation]) => {
    const index = generatedQueries.length;
    const initialQuery = typeof persistedQueryEdits[index] === "string"
      ? persistedQueryEdits[index]
      : query.replace(/\s+/g, " ").trim();
    generatedQueries.push(initialQuery);
    const item = document.createElement("div");
    item.className = "item";
    const editor = document.createElement("textarea");
    editor.className = "query-editor";
    editor.setAttribute("aria-label", `Edit query ${index + 1}`);
    editor.rows = 2;
    editor.value = initialQuery;
    editor.addEventListener("input", () => {
      generatedQueries[index] = editor.value;
      persistedQueryEdits[index] = editor.value;
      searchLink.href = `https://www.google.com/search?q=${encodeURIComponent(editor.value)}`;
      saveMainWorkspace();
    });
    const detailText = document.createElement("div");
    detailText.className = "d";
    detailText.textContent = explanation;
    const actions = document.createElement("div");
    actions.className = "acts";
    const copyButton = document.createElement("button");
    copyButton.className = "btn";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => copyText(editor.value, copyButton));
    const searchLink = document.createElement("a");
    searchLink.className = "btn";
    searchLink.textContent = "Search";
    searchLink.target = "_blank";
    searchLink.rel = "noopener noreferrer";
    searchLink.href = `https://www.google.com/search?q=${encodeURIComponent(editor.value)}`;
    actions.append(copyButton, searchLink);
    item.append(editor, detailText, actions);
    byId("out").appendChild(item);
  });
}

function build(restoring = false) {
  const inputs = resolveSearchInputs(byId("q").value.trim(), byId("d").value);
  const terms = inputs.terms;
  const domain = inputs.domain;
  const documentFormat = inputs.wantsPdf ? "pdf" : "all";
  if (!restoring && !byId("d").value.trim() && domain) byId("d").value = domain;
  const output = byId("out");
  byId("google-next-steps").hidden = true;
  generatedQueries = [];
  output.replaceChildren();
  byId("warn").hidden = true;
  byId("copyAll").hidden = true;
  byId("export").hidden = true;
  byId("count").textContent = "RESULTS / READY";
  showParsed(terms);

  if (!restoring && !byId("auth").checked) {
    setWarning("Confirm that you have authorization for this research scope before generating queries.", "No queries generated until authorization is confirmed.");
    return;
  }
  if (domain && !isValidDomain(domain)) {
    setWarning("Enter a domain name only, such as example.org. Search operators and URL paths are not accepted.", "The domain scope could not be validated.");
    return;
  }
  if (!terms.length && !domain) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Enter a keyword or authorized domain first.";
    output.appendChild(empty);
    return;
  }

  if (!restoring) persistedQueryEdits = [];
  const quotedTerms = terms.map(quoteTerm);
  const query = byId("keyword-match-mode").value === "any" && quotedTerms.length > 1
    ? `(${quotedTerms.join(" OR ")})`
    : quotedTerms.join(" ");
  Object.keys(GROUPS).forEach(key => {
    if (!selected.has(key) || (!terms.length && key !== "footprint" && key !== "docs")) return;
    const [name, description, createQueries] = GROUPS[key];
    addQueryGroup(name, description, createQueries(query, domain, documentFormat));
  });

  if (!generatedQueries.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Choose at least one applicable query module.";
    output.appendChild(empty);
    return;
  }
  byId("count").textContent = `${generatedQueries.length} QUERIES`;
  byId("copyAll").hidden = false;
  byId("export").hidden = false;
  if (!restoring) {
    lastBuild = {
      query: byId("q").value,
      domain: byId("d").value,
      matchMode: byId("keyword-match-mode").value,
      selectedGroups: Array.from(selected)
    };
    persistedQueryEdits = generatedQueries.slice();
    storeHistory(byId("q").value.trim(), domain, byId("keyword-match-mode").value);
    saveMainWorkspace();
  }
  document.dispatchEvent(new CustomEvent("dorkops:google-built", {
    detail: { domain, queries: generatedQueries.slice() }
  }));
}

function tab(number) {
  byId("p1").hidden = number !== 1;
  byId("p2").hidden = number !== 2;
  byId("p3").hidden = number !== 3;
  byId("p4").hidden = number !== 4;
  if (window.location.hash !== `#p${number}`) window.history.replaceState(null, "", `#p${number}`);
  document.querySelectorAll(".nav-btn[data-view]").forEach(button => {
    const active = Number(button.dataset.view) === number;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const views = {
    1: ["GOOGLE DORKING / 01", "Google Dorking Lab", "Compose precise search operators to review public pages and documents within an authorized research scope.", "PASSIVE SEARCH"],
    2: ["IMAGE LOOKUP / 02", "Image Lookup", "Compare a publicly reachable image URL using external visual search providers.", "EXTERNAL PROVIDERS"],
    3: ["NETWORK MAPPING / 03", "Nmap Operators", "Learn Nmap scan fundamentals, explore operator details, and build a local command for an authorized host.", "LOCAL COMMAND"],
    4: ["PASSWORD AUDITING / 04", "Password tools", "Learn common Hydra, John the Ripper, and Hashcat options with local-only command examples.", "LOCAL EXAMPLES"]
  };
  const [eyebrow, title, description, mode] = views[number];
  byId("view-eyebrow").textContent = eyebrow;
  byId("view-title").textContent = title;
  byId("view-description").textContent = description;
  byId("view-mode").textContent = mode;
}

function isValidNmapTarget(target) {
  if (!target || target.length > 253 || /[\s'"`;$|&<>\\]/.test(target)) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(target)) {
    return target.split(".").every(octet => Number(octet) <= 255);
  }
  if (target.includes(":")) {
    try {
      return new URL(`http://[${target}]/`).hostname.toLowerCase() === `[${target.toLowerCase()}]`;
    } catch {
      return false;
    }
  }
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*\.?$/i.test(target);
}

function isValidPortList(ports) {
  if (!ports) return true;
  const parts = ports.split(",");
  if (parts.length > 100) return false;
  return parts.every(part => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) return false;
    const first = Number(match[1]);
    const last = Number(match[2] || match[1]);
    return first >= 1 && last <= 65535 && first <= last;
  });
}

function buildNmapCommand() {
  const target = byId("nmap-target").value.trim();
  const ports = byId("nmap-ports").value.trim().replace(/\s*,\s*/g, ",");
  const warning = byId("nmap-warn");
  const commandHost = byId("nmap-command");
  byId("nmap-next-steps").hidden = true;
  warning.hidden = true;
  commandHost.hidden = true;

  if (!byId("nmap-auth").checked) {
    warning.textContent = "Confirm that this single host is within your authorized scan scope.";
    warning.hidden = false;
    return;
  }
  if (!isValidNmapTarget(target)) {
    warning.textContent = "Enter one valid hostname, IPv4 address, or IPv6 address. Shell syntax, lists, and network ranges are not accepted in this builder.";
    warning.hidden = false;
    return;
  }
  if (ports && !isValidPortList(ports)) {
    warning.textContent = "Enter ports as comma-separated numbers or ranges from 1 to 65535, such as 22,80,443 or 1-1000.";
    warning.hidden = false;
    return;
  }
  if (ports && byId("nmap-top-ports").checked) {
    warning.textContent = "Choose explicit ports or the top-100 preset, not both.";
    warning.hidden = false;
    return;
  }

  const flags = [];
  if (target.includes(":")) flags.push("-6");
  flags.push(byId("nmap-scan-type").value, byId("nmap-timing").value);
  if (ports) flags.push("-p", ports);
  else if (byId("nmap-top-ports").checked) flags.push("--top-ports", "100");
  if (byId("nmap-version").checked) flags.push("-sV");
  if (byId("nmap-os").checked) flags.push("-O");
  if (byId("nmap-open").checked) flags.push("--open");
  if (byId("nmap-reason").checked) flags.push("--reason");
  if (byId("nmap-output").checked) flags.push("-oN", "nmap-results.txt");
  byId("nmap-command-text").textContent = ["nmap", ...flags, target].join(" ");
  commandHost.hidden = false;
  saveNmapWorkspace();
  document.dispatchEvent(new CustomEvent("dorkops:nmap-built", {
    detail: {
      target,
      scanType: byId("nmap-scan-type").value,
      timing: byId("nmap-timing").value,
      ports,
      version: byId("nmap-version").checked,
      os: byId("nmap-os").checked,
      open: byId("nmap-open").checked,
      reason: byId("nmap-reason").checked,
      topPorts: byId("nmap-top-ports").checked,
      output: byId("nmap-output").checked,
      command: byId("nmap-command-text").textContent
    }
  }));
}

function saveNmapWorkspace() {
  const state = {
    target: byId("nmap-target").value,
    ports: byId("nmap-ports").value,
    scanType: byId("nmap-scan-type").value,
    timing: byId("nmap-timing").value,
    version: byId("nmap-version").checked,
    os: byId("nmap-os").checked,
    open: byId("nmap-open").checked,
    reason: byId("nmap-reason").checked,
    topPorts: byId("nmap-top-ports").checked,
    output: byId("nmap-output").checked,
    command: byId("nmap-command-text").textContent,
    commandVisible: !byId("nmap-command").hidden
  };
  try {
    localStorage.setItem("dorkops-nmap-lab", JSON.stringify(state));
    byId("nmap-save-status").textContent = "Saved on this device";
  } catch {
    byId("nmap-save-status").textContent = "Could not save on this device";
  }
}

document.addEventListener("dorkops:nmap-promoted", event => {
  const state = event.detail;
  byId("nmap-target").value = state.target;
  byId("nmap-ports").value = state.ports || "";
  if (["-sT", "-sS", "-sU"].includes(state.scanType)) byId("nmap-scan-type").value = state.scanType;
  if (["-T2", "-T3"].includes(state.timing)) byId("nmap-timing").value = state.timing;
  byId("nmap-version").checked = state.version === true;
  byId("nmap-os").checked = state.os === true;
  byId("nmap-open").checked = state.open === true;
  byId("nmap-reason").checked = state.reason === true;
  byId("nmap-top-ports").checked = state.topPorts === true;
  byId("nmap-output").checked = state.output === true;
  saveNmapWorkspace();
});

function restoreNmapWorkspace() {
  let state;
  try {
    state = JSON.parse(localStorage.getItem("dorkops-nmap-lab") || "null");
  } catch {
    byId("nmap-save-status").textContent = "Saved Nmap lab could not be read";
    return;
  }
  if (!state || typeof state !== "object") return;
  byId("nmap-target").value = typeof state.target === "string" ? state.target : "";
  byId("nmap-ports").value = typeof state.ports === "string" ? state.ports : "";
  if (["-sT", "-sS", "-sU"].includes(state.scanType)) byId("nmap-scan-type").value = state.scanType;
  if (["-T2", "-T3"].includes(state.timing)) byId("nmap-timing").value = state.timing;
  byId("nmap-version").checked = state.version === true;
  byId("nmap-os").checked = state.os === true;
  byId("nmap-open").checked = state.open === true;
  byId("nmap-reason").checked = state.reason === true;
  byId("nmap-top-ports").checked = state.topPorts === true;
  byId("nmap-output").checked = state.output === true;
  if (state.commandVisible === true && typeof state.command === "string") {
    byId("nmap-command-text").textContent = state.command;
    byId("nmap-command").hidden = false;
  }
  byId("nmap-auth").checked = false;
  byId("nmap-save-status").textContent = "Restored from this device";
  if (state.commandVisible === true && isValidNmapTarget(byId("nmap-target").value)) {
    document.dispatchEvent(new CustomEvent("dorkops:nmap-built", {
      detail: {
        target: byId("nmap-target").value.trim(),
        scanType: byId("nmap-scan-type").value,
        timing: byId("nmap-timing").value,
        ports: byId("nmap-ports").value.trim().replace(/\s*,\s*/g, ","),
        version: byId("nmap-version").checked,
        os: byId("nmap-os").checked,
        open: byId("nmap-open").checked,
        reason: byId("nmap-reason").checked,
        topPorts: byId("nmap-top-ports").checked,
        output: byId("nmap-output").checked,
        command: byId("nmap-command-text").textContent
      }
    }));
  }
}

async function copyText(text, button) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (clipboardError) {
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.left = "-9999px";
    document.body.appendChild(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    if (!copied) {
      button.textContent = "Copy failed";
      button.setAttribute("aria-live", "polite");
      window.setTimeout(() => { button.textContent = original; }, 1800);
      console.error("Clipboard copy failed.", clipboardError);
      return;
    }
  }
  button.textContent = "Copied";
  button.setAttribute("aria-live", "polite");
  window.setTimeout(() => { button.textContent = original; }, 1200);
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem("dorkops-history") || "[]"); }
  catch { return []; }
}

function renderHistory() {
  const host = byId("historyList");
  host.replaceChildren();
  const entries = getHistory();
  if (!entries.length) {
    const empty = document.createElement("span");
    empty.className = "note";
    empty.textContent = "Your recent searches will appear here.";
    host.appendChild(empty);
    return;
  }
  entries.forEach(entry => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-entry";
    button.textContent = `${entry.terms || "domain review"}${entry.domain ? ` · ${entry.domain}` : ""}`;
    button.title = "Reuse this scope";
    button.addEventListener("click", () => {
      byId("q").value = entry.terms || "";
      byId("d").value = entry.domain || "";
      byId("keyword-match-mode").value = entry.matchMode === "any" ? "any" : "all";
      byId("auth").checked = true;
      build();
    });
    host.appendChild(button);
  });
}

function storeHistory(terms, domain, matchMode) {
  const entry = { terms, domain, matchMode };
  try {
    const entries = getHistory().filter(item =>
      item.terms !== terms || item.domain !== domain ||
      (item.matchMode === "any" ? "any" : "all") !== matchMode);
    entries.unshift(entry);
    localStorage.setItem("dorkops-history", JSON.stringify(entries.slice(0, 6)));
  } catch { /* Local history is optional when storage is unavailable. */ }
  renderHistory();
}

function reverseImage() {
  const url = byId("img").value.trim();
  const results = byId("eng");
  byId("image-next-steps").hidden = true;
  results.replaceChildren();
  results.hidden = false;
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    parsedUrl = null;
  }
  if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
    const message = document.createElement("div");
    message.className = "empty";
    message.textContent = "Enter a valid public image URL using http or https, without a username or password.";
    results.appendChild(message);
    byId("image-save-status").textContent = "";
    return;
  }
  const encoded = encodeURIComponent(url);
  const providers = [
    ["Google Lens", "Similar images and source pages.", `https://lens.google.com/uploadbyurl?url=${encoded}`],
    ["Google Images", "Reverse image lookup.", `https://www.google.com/searchbyimage?image_url=${encoded}&client=app`],
    ["TinEye", "Exact copies and oldest known appearances.", `https://tineye.com/search?url=${encoded}`],
    ["Yandex Images", "Independent visual matching index.", `https://yandex.com/images/search?rpt=imageview&url=${encoded}`],
    ["Bing Visual Search", "Cross-check with another image index.", `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encoded}`]
  ];
  providers.forEach(([name, description, href], index) => {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (index === 0) link.className = "main";
    link.append(document.createTextNode(name));
    const detail = document.createElement("span");
    detail.textContent = description;
    link.appendChild(detail);
    results.appendChild(link);
  });
  saveMainWorkspace("image-save-status");
  document.dispatchEvent(new CustomEvent("dorkops:image-ready"));
}

const QUERY_TEMPLATES = {
  "public-documents": {
    query: "annual report",
    groups: ["documents", "pages", "mentions"]
  },
  "organization-footprint": {
    query: "about contact",
    domain: "example.org",
    groups: ["footprint", "docs", "pages"]
  },
  "news-mentions": {
    query: "public announcement",
    groups: ["mentions", "archives"]
  },
  "developer-references": {
    query: "project documentation",
    groups: ["repositories", "pages", "archives"]
  }
};

function applyQueryTemplate() {
  const template = QUERY_TEMPLATES[byId("query-template").value];
  if (!template) return;
  byId("q").value = template.query;
  byId("d").value = template.domain || "";
  byId("keyword-match-mode").value = "all";
  selected.clear();
  template.groups.forEach(group => selected.add(group));
  document.querySelectorAll("#chips .chip").forEach(button =>
    button.classList.toggle("on", selected.has(button.dataset.group)));
  invalidateGoogleBuild();
  showParsed(parseTerms(template.query));
  saveMainWorkspace();
  byId("q").focus();
}

function restoreMainWorkspace() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem("dorkops-workspace") || "null");
  } catch {
    byId("google-save-status").textContent = "Saved workspace could not be read";
    return;
  }
  if (!saved || typeof saved !== "object") return;
  byId("q").value = typeof saved.query === "string" ? saved.query : "";
  byId("d").value = typeof saved.domain === "string" ? saved.domain : "";
  byId("keyword-match-mode").value = saved.matchMode === "any" ? "any" : "all";
  byId("img").value = typeof saved.imageUrl === "string" ? saved.imageUrl : "";
  if (Array.isArray(saved.selectedGroups)) {
    selected.clear();
    saved.selectedGroups.filter(group => Object.prototype.hasOwnProperty.call(GROUPS, group)).forEach(group => selected.add(group));
  }
  document.querySelectorAll("#chips .chip").forEach(button =>
    button.classList.toggle("on", selected.has(button.dataset.group)));
  lastBuild = saved.lastBuild && typeof saved.lastBuild.query === "string" &&
    typeof saved.lastBuild.domain === "string" && Array.isArray(saved.lastBuild.selectedGroups)
    ? saved.lastBuild
    : null;
  persistedQueryEdits = Array.isArray(saved.queryEdits)
    ? saved.queryEdits.filter(query => typeof query === "string")
    : [];
  if (lastBuild) {
    const draftQuery = byId("q").value;
    const draftDomain = byId("d").value;
    const draftMatchMode = byId("keyword-match-mode").value;
    const draftGroups = Array.from(selected);
    byId("q").value = lastBuild.query;
    byId("d").value = lastBuild.domain;
    byId("keyword-match-mode").value = lastBuild.matchMode === "any" ? "any" : "all";
    selected.clear();
    lastBuild.selectedGroups.filter(group => Object.prototype.hasOwnProperty.call(GROUPS, group)).forEach(group => selected.add(group));
    build(true);
    byId("q").value = draftQuery;
    byId("d").value = draftDomain;
    byId("keyword-match-mode").value = draftMatchMode;
    selected.clear();
    draftGroups.forEach(group => selected.add(group));
    document.querySelectorAll("#chips .chip").forEach(button =>
      button.classList.toggle("on", selected.has(button.dataset.group)));
  }
  byId("auth").checked = false;
  showParsed(parseTerms(byId("q").value.trim()));
  byId("google-save-status").textContent = "Restored from this device";
  if (byId("img").value.trim()) {
    byId("image-save-status").textContent = "Saved image URL restored. Select Find Matches to prepare provider links.";
  }
}

function setupMatrix() {
  const canvas = byId("rain");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const fontSize = 15;
  const characters = "01アイウエオカキクケコサシスセソ<>/{}[]";
  let drops = [];
  let previousFrame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drops = Array(Math.ceil(window.innerWidth / fontSize)).fill(0).map(() => Math.random() * -40);
  }

  function draw(timestamp) {
    window.requestAnimationFrame(draw);
    if (timestamp - previousFrame < 70) return;
    previousFrame = timestamp;
    context.fillStyle = "rgba(17, 17, 17, .12)";
    context.fillRect(0, 0, window.innerWidth, window.innerHeight);
    context.font = `${fontSize}px monospace`;
    drops.forEach((drop, index) => {
      context.fillStyle = Math.random() > .97 ? "#a4e8ad" : "#568e60";
      context.fillText(characters[Math.floor(Math.random() * characters.length)], index * fontSize, drop * fontSize);
      if (drop * fontSize > window.innerHeight && Math.random() > .98) drops[index] = 0;
      else drops[index] += .45;
    });
  }

  resize();
  window.addEventListener("resize", resize);
  window.requestAnimationFrame(draw);
}

document.querySelectorAll("#chips .chip").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.group;
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    button.classList.toggle("on", selected.has(key));
    invalidateGoogleBuild();
    saveMainWorkspace();
  });
});
byId("selectAll").addEventListener("click", () => {
  Object.keys(GROUPS).forEach(key => selected.add(key));
  document.querySelectorAll("#chips .chip").forEach(button => button.classList.add("on"));
  invalidateGoogleBuild();
  saveMainWorkspace();
});
byId("clearAll").addEventListener("click", () => {
  selected.clear();
  document.querySelectorAll("#chips .chip").forEach(button => button.classList.remove("on"));
  invalidateGoogleBuild();
  saveMainWorkspace();
});
document.querySelectorAll(".nav-btn[data-view]").forEach(button => {
  button.addEventListener("click", () => tab(Number(button.dataset.view)));
  button.addEventListener("keydown", event => {
    const views = Array.from(document.querySelectorAll(".nav-btn[data-view]"));
    const current = views.indexOf(button);
    const next = event.key === "ArrowDown" || event.key === "ArrowRight" ? current + 1
      : event.key === "ArrowUp" || event.key === "ArrowLeft" ? current - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? views.length - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    const destination = views[(next + views.length) % views.length];
    destination.focus();
    tab(Number(destination.dataset.view));
  });
});
byId("go").addEventListener("click", () => build());
byId("q").addEventListener("input", () => {
  invalidateGoogleBuild();
  showParsed(parseTerms(byId("q").value.trim()));
  saveMainWorkspace();
});
byId("keyword-match-mode").addEventListener("change", () => {
  invalidateGoogleBuild();
  showParsed(parseTerms(byId("q").value.trim()));
  saveMainWorkspace();
});
byId("d").addEventListener("input", () => {
  invalidateGoogleBuild();
  saveMainWorkspace();
});
byId("img").addEventListener("input", () => {
  byId("image-next-steps").hidden = true;
  const results = byId("eng");
  results.replaceChildren();
  results.hidden = true;
  byId("image-save-status").textContent = "Image URL changed. Select Find Matches to prepare provider links.";
  saveMainWorkspace("image-save-status");
});
byId("apply-template").addEventListener("click", applyQueryTemplate);
byId("query-template").addEventListener("change", () => {
  if (byId("query-template").value) applyQueryTemplate();
});
["q", "d"].forEach(id => byId(id).addEventListener("keydown", event => { if (event.key === "Enter") build(); }));
byId("copyAll").addEventListener("click", event => copyText(generatedQueries.join("\n"), event.currentTarget));
byId("export").addEventListener("click", () => {
  if (!generatedQueries.length) return;
  const file = new Blob([generatedQueries.join("\r\n")], { type: "text/plain" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dork-ops-queries.txt";
  link.click();
  URL.revokeObjectURL(url);
});
byId("clearHistory").addEventListener("click", () => {
  try { localStorage.removeItem("dorkops-history"); } catch { /* Optional storage. */ }
  renderHistory();
});
byId("nmap-build").addEventListener("click", buildNmapCommand);
["nmap-target", "nmap-ports", "nmap-scan-type", "nmap-timing", "nmap-version", "nmap-os", "nmap-open", "nmap-reason", "nmap-top-ports", "nmap-output"].forEach(id => {
  const field = byId(id);
  field.addEventListener("input", () => {
    byId("nmap-command").hidden = true;
    byId("nmap-next-steps").hidden = true;
    if (field.id === "nmap-target") byId("nmap-auth").checked = false;
    saveNmapWorkspace();
    document.dispatchEvent(new CustomEvent("dorkops:nmap-plan-changed"));
  });
  field.addEventListener("change", () => {
    byId("nmap-command").hidden = true;
    byId("nmap-next-steps").hidden = true;
    if (field.id === "nmap-target") byId("nmap-auth").checked = false;
    saveNmapWorkspace();
    document.dispatchEvent(new CustomEvent("dorkops:nmap-plan-changed"));
  });
});
["nmap-target", "nmap-ports"].forEach(id => byId(id).addEventListener("keydown", event => {
  if (event.key === "Enter") buildNmapCommand();
}));
byId("nmap-copy").addEventListener("click", event => copyText(byId("nmap-command-text").textContent, event.currentTarget));
byId("rs").addEventListener("click", reverseImage);
byId("img").addEventListener("keydown", event => { if (event.key === "Enter") reverseImage(); });
function openViewFromHash() {
  const view = { "#p1": 1, "#p2": 2, "#p3": 3, "#p4": 4 }[window.location.hash];
  if (view) {
    tab(view);
    byId(`p${view}`).scrollIntoView({ block: "start" });
  }
}
window.addEventListener("hashchange", openViewFromHash);
openViewFromHash();
restoreMainWorkspace();
restoreNmapWorkspace();
renderHistory();
setupMatrix();