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
  const results = document.getElementById("nmap-result-recommendations");
  const textarea = document.getElementById("nmap-result-output");
  if (!section || !results || !textarea) return;

  const { target, scanType, timing } = event.detail;
  section.hidden = false;
  textarea.value = "";
  results.replaceChildren();
  textarea.oninput = () => {
    results.replaceChildren();
    const openPorts = extractOpenPorts(textarea.value);
    const protocols = Object.entries(openPorts).filter(([, ports]) => ports.length);
    if (!protocols.length) {
      addTextElement(results, "p", "recommendation-note", "No open TCP/UDP port rows recognized yet. Paste lines in the format “80/tcp open http”; closed and filtered ports are not included.");
      return;
    }

    protocols.forEach(([protocol, ports]) => {
      const scan = protocol === "udp" ? "-sU" : scanType;
      const command = `nmap ${scan} ${timing} -sV -p ${ports.join(",")} ${target}`;
      const card = document.createElement("article");
      card.className = "recommendation-card";
      addTextElement(card, "h4", "", `Open ${protocol.toUpperCase()} ports: ${ports.join(", ")}`);
      addTextElement(card, "p", "", "Recommended follow-up: check service/version details on only these observed, authorized ports. Review service banners with the system owner; version detection sends additional probes.");
      const code = addTextElement(card, "code", "recommendation-command", command);
      code.setAttribute("aria-label", "Suggested Nmap follow-up command");
      const confirmLabel = document.createElement("label");
      confirmLabel.className = "recommendation-confirm";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      addTextElement(confirmLabel, "span", "", "I confirm this host and these ports are authorized for the follow-up scan.");
      confirmLabel.prepend(checkbox);
      const copy = addTextElement(card, "button", "btn", "Copy follow-up command");
      copy.type = "button";
      copy.disabled = true;
      checkbox.addEventListener("change", () => { copy.disabled = !checkbox.checked; });
      copy.addEventListener("click", async () => {
        if (!checkbox.checked) return;
        try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard API unavailable.");
          await navigator.clipboard.writeText(command);
          copy.textContent = "Copied";
        } catch (error) {
          copy.textContent = "Copy failed";
          console.error("Could not copy the Nmap follow-up command.", error);
        }
      });
      card.appendChild(confirmLabel);
      results.appendChild(card);
    });
  };
});

document.addEventListener("dorkops:password-built", event => {
  const section = document.getElementById("pw-next-steps");
  const guidance = document.getElementById("pw-next-guidance");
  const link = document.getElementById("pw-next-link");
  if (!section || !guidance || !link) return;

  const followUps = {
    hydra: [
      "Run only against the isolated local service shown in the command. If a login succeeds, stop; do not reuse or share the credential. Notify the service owner so they can rotate it and review authentication logs.",
      "Review Hydra options",
      "password-tools.html"
    ],
    john: [
      "Run only against the authorized local hash file. If a password is recovered, protect the output, report it through the approved process, and have the account owner rotate it. Do not try recovered credentials on live accounts.",
      "Review John options",
      "password-tools.html"
    ],
    hashcat: [
      "Run only against the authorized local hash file and verify the selected hash mode. Treat recovered results as sensitive, report them through the approved process, and have the account owner rotate affected credentials.",
      "Review Hashcat options",
      "password-tools.html"
    ]
  };
  const [text, label, href] = followUps[event.detail.tool] || followUps.john;
  guidance.textContent = text;
  link.textContent = label;
  link.href = href;
  section.hidden = false;
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
      timing: document.getElementById("nmap-timing").value
    }
  }));
}
const passwordCommand = document.getElementById("pw-command");
if (passwordCommand && !passwordCommand.hidden) {
  document.dispatchEvent(new CustomEvent("dorkops:password-built", {
    detail: { tool: document.getElementById("pw-tool").value }
  }));
}
