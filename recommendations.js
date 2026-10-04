"use strict";

function addTextElement(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function extractOpenPorts(text) {
  const ports = { tcp: new Set(), udp: new Set() };
  for (const match of text.matchAll(/\b(\d{1,5})\/(tcp|udp)\s+open\b/gi)) {
    const port = Number(match[1]);
    const protocol = match[2].toLowerCase();
    if (port >= 1 && port <= 65535) ports[protocol].add(port);
  }
  return Object.fromEntries(Object.entries(ports).map(([protocol, entries]) => [
    protocol,
    [...entries].sort((left, right) => left - right).slice(0, 20)
  ]));
}

function composeNmapCommand(state) {
  const flags = [];
  if (state.target.includes(":")) flags.push("-6");
  flags.push(state.scanType, state.timing);
  if (state.ports) flags.push("-p", state.ports);
  else if (state.topPorts) flags.push("--top-ports", "100");
  if (state.version) flags.push("-sV");
  if (state.os) flags.push("-O");
  if (state.open) flags.push("--open");
  if (state.reason) flags.push("--reason");
  if (state.output) flags.push("-oN", "nmap-results.txt");
  return ["nmap", ...flags, state.target].join(" ");
}

function renderList(host, items) {
  host.replaceChildren();
  items.forEach(text => addTextElement(host, "li", "", text));
}

function getNmapPlan(state) {
  const plans = [];
  if (!state.target) {
    plans.push("Step 1: Enter one authorized hostname or IP. This builder rejects lists and network ranges.");
  } else {
    plans.push(`Step 1: Scope is one host: ${state.target}. The generated command will not include a network range.`);
  }
  if (state.scanType === "-sU") {
    plans.push("Step 2: UDP scan selected. UDP checks can be slow and many services do not reply; use only with explicit scope approval.");
  } else if (state.scanType === "-sS") {
    plans.push("Step 2: SYN scan selected. It needs raw-packet privileges and may require elevated permissions.");
  } else {
    plans.push("Step 2: TCP connect scan selected. It uses the operating system's normal connection API and is broadly compatible.");
  }
  plans.push(state.timing === "-T2"
    ? "Timing: T2 is slower and more considerate, but takes longer."
    : "Timing: T3 is Nmap's normal timing profile; it may generate probes more quickly than T2.");
  if (state.ports) plans.push(`Port scope: only the explicit ports/ranges ${state.ports} are requested.`);
  else if (state.topPorts) plans.push(`Port scope: top 100 ports for the selected scan method (${state.scanType === "-sU" ? "UDP" : "TCP"}).`);
  else plans.push("Port scope: Nmap's default port selection; set explicit ports or choose the top-100 preset to narrow it.");
  if (state.version) plans.push("Service detection is on: Nmap sends additional probes to identify service versions.");
  if (state.os) plans.push("OS detection is on: Nmap makes an OS guess from network responses; it may need privileges and is not guaranteed.");
  if (state.open) plans.push("Open-only display is on: this filters displayed results, it does not reduce the ports scanned.");
  if (state.reason) plans.push("Port-state reasons are on: the output includes why Nmap classified each port state.");
  if (state.output) plans.push("Normal report output is on: results will be written to nmap-results.txt in the terminal's current directory.");
  plans.push("Expected result: Nmap prints host status and a port table. Review the scope and output before any follow-up.");
  return plans;
}

function renderNmapPlan() {
  const list = document.getElementById("nmap-scan-plan-items");
  if (!list) return;
  renderList(list, getNmapPlan({
    target: document.getElementById("nmap-target").value.trim(),
    scanType: document.getElementById("nmap-scan-type").value,
    timing: document.getElementById("nmap-timing").value,
    ports: document.getElementById("nmap-ports").value.trim().replace(/\s*,\s*/g, ","),
    topPorts: document.getElementById("nmap-top-ports").checked,
    version: document.getElementById("nmap-version").checked,
    os: document.getElementById("nmap-os").checked,
    open: document.getElementById("nmap-open").checked,
    reason: document.getElementById("nmap-reason").checked,
    output: document.getElementById("nmap-output").checked
  }));
}

function renderNmapBreakdown(state) {
  const items = ["nmap — starts the Nmap program."];
  if (state.target.includes(":")) items.push("-6 — use IPv6 for the target.");
  const methods = {
    "-sT": "-sT — TCP connect scan; broadly compatible, uses normal connections.",
    "-sS": "-sS — SYN scan; requires raw-packet privileges.",
    "-sU": "-sU — UDP scan; can be slow and needs explicit authorization."
  };
  items.push(methods[state.scanType] || `${state.scanType} — selected scan method.`);
  items.push(`${state.timing} — sets the probe timing profile.`);
  if (state.ports) items.push(`-p ${state.ports} — scans only the specified ports.`);
  else if (state.topPorts) items.push("--top-ports 100 — limits to 100 common ports for this scan method.");
  if (state.version) items.push("-sV — sends service probes to identify versions.");
  if (state.os) items.push("-O — attempts OS fingerprinting; results are an estimate.");
  if (state.open) items.push("--open — displays open (or possibly open) ports only; scanning scope is unchanged.");
  if (state.reason) items.push("--reason — includes the reason for each port-state classification.");
  if (state.output) items.push("-oN nmap-results.txt — writes a normal-format report to a local file.");
  items.push(`${state.target} — the single host being scanned.`);
  renderList(document.getElementById("nmap-command-breakdown-items"), items);
}

function makeRecommendationList(host, heading, recommendations, onPromote, requireAuthorization = false) {
  host.replaceChildren();
  if (!recommendations.length) return;
  addTextElement(host, "h3", "", heading);
  recommendations.forEach((recommendation, index) => {
    const card = document.createElement("article");
    card.className = "recommendation-card";
    addTextElement(card, "h4", "", `${index + 1}. ${recommendation.title}`);
    addTextElement(card, "p", "", recommendation.reason);
    const commandButton = addTextElement(card, "button", "recommendation-command", recommendation.command);
    commandButton.type = "button";
    commandButton.setAttribute("aria-label", `Make primary command: ${recommendation.command}`);
    commandButton.disabled = requireAuthorization;
    commandButton.addEventListener("click", () => {
      if (!commandButton.disabled) onPromote(recommendation);
    });
    if (requireAuthorization) {
      const label = document.createElement("label");
      label.className = "recommendation-confirm";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      addTextElement(label, "span", "", "I confirm this host and these ports are authorized for the follow-up scan.");
      label.prepend(checkbox);
      card.appendChild(label);
      checkbox.addEventListener("change", () => { commandButton.disabled = !checkbox.checked; });
    }
    host.appendChild(card);
  });
}

function getNmapRecommendations(state, primaryCommand) {
  const candidates = [];
  const add = (title, reason, changes) => {
    const next = { ...state, ...changes };
    const command = composeNmapCommand(next);
    if (command !== primaryCommand && !candidates.some(item => item.command === command)) {
      candidates.push({ title, reason, command, state: next });
    }
  };

  if (!state.version) {
    add("You can also identify detected services", "Adds service/version probes to the same authorized scope; review the additional traffic before running it.", { version: true });
  }
  if (!state.reason) {
    add("You can also see why each port state was reported", "Adds Nmap's port-state reason to the output without expanding the target scope.", { reason: true });
  }
  if (state.timing !== "-T2") {
    add("After this, use a slower timing profile", "T2 is more considerate than the normal T3 profile and can reduce the rate of probes.", { timing: "-T2" });
  }
  if (!state.ports && !state.topPorts) {
    add("You can narrow the scan to the top 100 ports", "Limits the scan to Nmap's most common ports for the selected scan method instead of its default port set.", { topPorts: true });
  }
  if (!state.output) {
    add("You can also save a local text report", "Adds a standard-output file named nmap-results.txt in the directory where you run Nmap.", { output: true });
  }

  const basicState = { ...state, version: false, os: false, open: false, reason: false, output: false };
  const basicCommand = composeNmapCommand(basicState);
  if (basicCommand !== primaryCommand && !candidates.some(item => item.command === basicCommand)) {
    candidates.push({
      title: "After this, use a basic inventory scan",
      reason: "Keeps the same host, port selection, scan method, and timing while leaving optional probes off.",
      command: basicCommand,
      state: basicState
    });
  }
  return candidates.slice(0, 4);
}

function renderNmapPrimaryRecommendations(state, primaryCommand) {
  const host = document.getElementById("nmap-command-recommendations");
  if (!host) return;
  const recommendations = getNmapRecommendations(state, primaryCommand);
  makeRecommendationList(host, "Choose a next command (each option shows why):", recommendations, recommendation => {
    const commandText = document.getElementById("nmap-command-text");
    commandText.textContent = recommendation.command;
    document.getElementById("nmap-command").hidden = false;
    document.dispatchEvent(new CustomEvent("dorkops:nmap-promoted", {
      detail: { ...recommendation.state, command: recommendation.command }
    }));
    Object.assign(state, recommendation.state);
    renderNmapBreakdown(state);
    renderNmapPrimaryRecommendations(recommendation.state, recommendation.command);
  });
}

function shellQuote(value) {
  return `'${value}'`;
}

function getPasswordRecommendations(tool, primaryCommand) {
  const recommendations = [];
  const add = (title, reason, command) => {
    if (command && command !== primaryCommand && !recommendations.some(item => item.command === command)) {
      recommendations.push({ title, reason, command });
    }
  };

  if (tool === "hydra") {
    const service = document.getElementById("hydra-service").value;
    const username = shellQuote(document.getElementById("hydra-user").value.trim());
    const wordlist = shellQuote(document.getElementById("hydra-wordlist").value.trim());
    const base = `hydra -t 1 -f -l ${username} -P ${wordlist} 127.0.0.1 ${service}`;
    const active = primaryCommand.includes(" 127.0.0.1 ") ? primaryCommand : base;
    if (!active.includes(" -w ")) {
      add("You can also add a response timeout", "Bounds how long Hydra waits for a response. This remains fixed to the loopback lab service.", active.replace(" 127.0.0.1 ", " -w 5 127.0.0.1 "));
    }
    if (!active.includes(" -c ")) {
      add("You can also add a delay between attempts", "Adds a two-second delay to reduce request rate in the isolated local lab.", active.replace(" 127.0.0.1 ", " -c 2 127.0.0.1 "));
    }
    add("Before running, inspect this service module's options", "Displays the selected module's help and does not attempt a login.", `hydra -U ${service}`);
    add("You can also review Hydra's general help", "Lists installed Hydra options and does not attempt a login.", "hydra -h");
  } else if (tool === "john") {
    const format = document.getElementById("john-format").value;
    const hashFile = shellQuote(document.getElementById("john-hash-file").value.trim());
    const wordlist = shellQuote(document.getElementById("john-wordlist").value.trim());
    const formatFlag = format ? ` --format=${format}` : "";
    add("You can also use wordlist rules", "Applies John rules to candidates from the same local wordlist and authorized hash file.", `john --wordlist=${wordlist} --rules${formatFlag} ${hashFile}`);
    add("After this, review recovered results locally", "Shows results already present in John's pot file; it does not contact a login service.", `john --show${formatFlag} ${hashFile}`);
    add("You can check the active audit status", "Useful while a John session is running; it does not start another audit.", "john --status");
  } else if (tool === "hashcat") {
    const mode = document.getElementById("hashcat-mode").value;
    const hashFile = shellQuote(document.getElementById("hashcat-hash-file").value.trim());
    add("After this, review recovered results locally", "Shows matching results from Hashcat's potfile for the selected hash mode and authorized file.", `hashcat -m ${mode} --show ${hashFile}`);
    add("You can check the active audit status", "Useful while a Hashcat session is running; it does not start another audit.", "hashcat --status");
    add("You can review hashes not yet recovered", "Lists hashes from the authorized file that are not present in the potfile.", `hashcat -m ${mode} --left ${hashFile}`);
  }
  return recommendations.slice(0, 4);
}

function renderPasswordRecommendations(tool, command) {
  const host = document.getElementById("pw-command-recommendations");
  if (!host) return;
  const recommendations = getPasswordRecommendations(tool, command);
  makeRecommendationList(host, "Recommended alternatives and next steps:", recommendations, recommendation => {
    document.getElementById("pw-command-text").textContent = recommendation.command;
    document.getElementById("pw-command").hidden = false;
    document.dispatchEvent(new CustomEvent("dorkops:password-promoted", {
      detail: { tool, command: recommendation.command }
    }));
    renderPasswordRecommendations(tool, recommendation.command);
  });
}

document.addEventListener("dorkops:google-built", () => {
  const section = document.getElementById("google-next-steps");
  if (section) section.hidden = false;
});

document.addEventListener("dorkops:image-ready", () => {
  const section = document.getElementById("image-next-steps");
  if (section) section.hidden = false;
});

document.addEventListener("dorkops:nmap-built", event => {
  const section = document.getElementById("nmap-next-steps");
  const textarea = document.getElementById("nmap-result-output");
  if (!section || !textarea) return;

  const state = {
    target: event.detail.target,
    scanType: event.detail.scanType,
    timing: event.detail.timing,
    ports: event.detail.ports || "",
    version: event.detail.version === true,
    os: event.detail.os === true,
    open: event.detail.open === true,
    reason: event.detail.reason === true,
    topPorts: event.detail.topPorts === true || (event.detail.command || "").includes(" --top-ports "),
    output: event.detail.output === true || (event.detail.command || "").includes(" -oN "),
  };
  const command = event.detail.command || document.getElementById("nmap-command-text").textContent;
  section.hidden = false;
  textarea.value = "";
  renderNmapPlan();
  renderNmapBreakdown(state);
  renderNmapPrimaryRecommendations(state, command);
  const results = document.getElementById("nmap-result-recommendations");
  results.replaceChildren();
  textarea.oninput = () => {
    results.replaceChildren();
    const openPorts = extractOpenPorts(textarea.value);
    const protocols = Object.entries(openPorts).filter(([, ports]) => ports.length);
    if (!protocols.length) {
      addTextElement(results, "p", "recommendation-note", "No open TCP/UDP port rows recognized yet. Paste lines in the format “80/tcp open http”; closed and filtered ports are not included.");
      return;
    }

    const followUps = [];
    protocols.forEach(([protocol, ports]) => {
      const scanType = protocol === "udp" ? "-sU" : state.scanType === "-sU" ? "-sT" : state.scanType;
      const portList = ports.join(",");
      const prefix = `nmap ${state.target.includes(":") ? "-6 " : ""}${scanType} -T2`;
      followUps.push({
        title: `After this, check services on the observed ${protocol.toUpperCase()} ports`,
        reason: `Limits service/version detection to the ${ports.length} open ${protocol.toUpperCase()} port${ports.length === 1 ? "" : "s"} you pasted. Confirm the host and ports remain in scope.`,
        command: `${prefix} -sV -p ${portList} ${state.target}`,
        state: { ...state, scanType, timing: "-T2", ports: portList, version: true, os: false, open: false, reason: false, topPorts: false, output: false }
      });
      followUps.push({
        title: `You can also record why each ${protocol.toUpperCase()} port is open`,
        reason: `Checks only the observed ${protocol.toUpperCase()} ports and includes Nmap's port-state reason.`,
        command: `${prefix} --reason -p ${portList} ${state.target}`,
        state: { ...state, scanType, timing: "-T2", ports: portList, version: false, os: false, open: false, reason: true, topPorts: false, output: false }
      });
    });
    const unique = followUps.filter((item, index, items) =>
      item.command !== document.getElementById("nmap-command-text").textContent &&
      items.findIndex(other => other.command === item.command) === index
    ).slice(0, 4);
    makeRecommendationList(results, "Choose an authorized follow-up:", unique, recommendation => {
      document.getElementById("nmap-command-text").textContent = recommendation.command;
      document.getElementById("nmap-command").hidden = false;
      document.dispatchEvent(new CustomEvent("dorkops:nmap-promoted", {
        detail: { ...recommendation.state, command: recommendation.command }
      }));
      Object.assign(state, recommendation.state);
      renderNmapBreakdown(state);
      renderNmapPrimaryRecommendations(recommendation.state, recommendation.command);
    }, true);
  };
});

document.addEventListener("dorkops:nmap-promoted", event => {
  const command = document.getElementById("nmap-command-text");
  if (command) command.textContent = event.detail.command;
  renderNmapPlan();
});

document.addEventListener("dorkops:nmap-plan-changed", renderNmapPlan);
renderNmapPlan();

document.addEventListener("dorkops:password-built", event => {
  const section = document.getElementById("pw-next-steps");
  const guidance = document.getElementById("pw-next-guidance");
  if (!section || !guidance) return;

  const tool = event.detail.tool;
  const guidanceByTool = {
    hydra: "Use only the isolated local service shown in the command. Stop when you have enough test data; do not reuse or share credentials. Review the service logs and rotate any test credential after the exercise.",
    john: "Use only the authorized local hash file. Treat recovered results as sensitive and report them through the approved process.",
    hashcat: "Verify the selected hash mode against the authorized local file. Treat recovered results as sensitive and report them through the approved process."
  };
  guidance.textContent = guidanceByTool[tool] || guidanceByTool.john;
  section.hidden = false;
  const command = event.detail.command || document.getElementById("pw-command-text").textContent;
  renderPasswordRecommendations(tool, command);
});

const googleLab = document.getElementById("p1");
if (googleLab && googleLab.querySelector(".query-editor")) {
  document.getElementById("google-next-steps").hidden = false;
}
const imageResults = document.getElementById("eng");
if (imageResults && !imageResults.hidden && imageResults.querySelector("a")) {
  document.getElementById("image-next-steps").hidden = false;
}
const nmapCommand = document.getElementById("nmap-command");
if (nmapCommand && !nmapCommand.hidden) {
  document.dispatchEvent(new CustomEvent("dorkops:nmap-built", {
    detail: {
      target: document.getElementById("nmap-target").value.trim(),
      scanType: document.getElementById("nmap-scan-type").value,
      timing: document.getElementById("nmap-timing").value,
      ports: document.getElementById("nmap-ports").value.trim().replace(/\s*,\s*/g, ","),
      version: document.getElementById("nmap-version").checked,
      os: document.getElementById("nmap-os").checked,
      open: document.getElementById("nmap-open").checked,
      reason: document.getElementById("nmap-reason").checked,
      command: document.getElementById("nmap-command-text").textContent
    }
  }));
}
const passwordCommand = document.getElementById("pw-command");
if (passwordCommand && !passwordCommand.hidden) {
  document.dispatchEvent(new CustomEvent("dorkops:password-built", {
    detail: {
      tool: document.getElementById("pw-tool").value,
      command: document.getElementById("pw-command-text").textContent
    }
  }));
}
