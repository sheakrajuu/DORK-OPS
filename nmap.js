"use strict";

const TARGET = "<target ip>";
const NMAP_SECTIONS = [
  {
    title: "Target selection",
    description: "Choose or exclude authorized targets. Review target lists carefully before scanning.",
    options: [
      ["Target argument", "A hostname, IP address, or CIDR network is given as a positional argument.", `nmap ${TARGET}`, "Basics"],
      ["-iL <file>", "Read targets from a newline-delimited input file.", `nmap -iL targets.txt`, "Basics"],
      ["--exclude <targets>", "Exclude comma-separated hosts or networks from the scan.", `nmap --exclude <excluded targets> ${TARGET}`, "Careful"],
      ["--excludefile <file>", "Read hosts or networks to exclude from a file.", `nmap --excludefile exclusions.txt ${TARGET}`, "Careful"]
    ]
  },
  {
    title: "Host discovery",
    description: "Determine which authorized targets appear online before port scanning.",
    options: [
      ["-sL", "List targets only; do not send packets to the target hosts.", `nmap -sL <authorized target or subnet>`, "Low impact"],
      ["-sn", "Host discovery only; disable the port scan phase.", `nmap -sn <authorized target or subnet>`, "Low impact"],
      ["-Pn", "Skip host discovery and treat targets as online; this can increase scan traffic.", `nmap -Pn -p 80 ${TARGET}`, "Careful"],
      ["-PS<ports>", "Use TCP SYN probes for host discovery on selected ports.", `nmap -PS80,443 -sn ${TARGET}`, "Careful"],
      ["-PA<ports>", "Use TCP ACK probes for host discovery on selected ports.", `nmap -PA80,443 -sn ${TARGET}`, "Careful"],
      ["-PE", "Use ICMP echo requests for host discovery.", `nmap -PE -sn ${TARGET}`, "Low impact"],
      ["-PP", "Use ICMP timestamp requests for host discovery.", `nmap -PP -sn ${TARGET}`, "Low impact"],
      ["-PM", "Use ICMP address-mask requests for host discovery.", `nmap -PM -sn ${TARGET}`, "Low impact"],
      ["-PU<ports>", "Use UDP probes for host discovery on selected ports.", `nmap -PU53,161 -sn ${TARGET}`, "Careful"],
      ["-PO<protocols>", "Use IP protocol probes for host discovery.", `nmap -PO -sn ${TARGET}`, "Careful"]
    ]
  },
  {
    title: "Scan techniques",
    description: "Select a transport scan type. The target’s firewall, network path, and local privileges affect results.",
    options: [
      ["-sT", "TCP connect scan using the operating system's connect call; broadly compatible.", `nmap -sT -p 80,443 ${TARGET}`, "Basics"],
      ["-sS", "TCP SYN scan; often requires raw-packet privileges. This is not an authorization bypass.", `nmap -sS -p 80,443 ${TARGET}`, "Careful"],
      ["-sU", "UDP port scan; can be slower and may produce open|filtered results.", `nmap -sU -p 53,123 ${TARGET}`, "Careful"],
      ["-sA", "TCP ACK scan used to study firewall filtering, not to identify open ports.", `nmap -sA -p 80,443 ${TARGET}`, "Careful"],
      ["-sW", "TCP Window scan; specialized and dependent on target TCP behavior.", `nmap -sW -p 80,443 ${TARGET}`, "Careful"],
      ["-sM", "TCP Maimon scan; specialized and often inconclusive on modern systems.", `nmap -sM -p 80,443 ${TARGET}`, "Careful"],
      ["-sY", "SCTP INIT scan; use only when SCTP assessment is explicitly in scope.", `nmap -sY -p 2905 ${TARGET}`, "Careful"],
      ["-sZ", "SCTP COOKIE-ECHO scan; specialized and may be inconclusive.", `nmap -sZ -p 2905 ${TARGET}`, "Careful"],
      ["-sO", "IP protocol scan; tests which IP protocols respond rather than TCP/UDP ports.", `nmap -sO ${TARGET}`, "Careful"]
    ]
  },
  {
    title: "Port selection and ordering",
    description: "Limit scans to the ports needed for the approved assessment.",
    options: [
      ["-p <ports>", "Specify ports and optional protocol prefixes, ranges, or comma-separated lists.", `nmap -p 22,80,443 ${TARGET}`, "Basics"],
      ["-p-", "Scan TCP ports 1 through 65535; this sends substantially more probes.", `nmap -p- -sT ${TARGET}`, "High volume"],
      ["-F", "Fast mode; scan fewer ports than the default scan.", `nmap -F ${TARGET}`, "Low impact"],
      ["--top-ports <n>", "Scan the n most common ports from Nmap's port-frequency data.", `nmap --top-ports 20 ${TARGET}`, "Low impact"],
      ["--port-ratio <ratio>", "Scan ports whose frequency is at least the specified ratio.", `nmap --port-ratio 0.1 ${TARGET}`, "Basics"],
      ["--exclude-ports <ports>", "Skip specified ports in otherwise selected scan ranges.", `nmap -p 1-1000 --exclude-ports 25,110 ${TARGET}`, "Basics"],
      ["-r", "Scan ports sequentially instead of randomizing their order.", `nmap -p 1-100 -r ${TARGET}`, "Basics"]
    ]
  },
  {
    title: "Service and version detection",
    description: "Probe open ports to identify the service and possible version; probes add traffic.",
    options: [
      ["-sV", "Enable service and version detection on discovered open ports.", `nmap -sV -p 80,443 ${TARGET}`, "Careful"],
      ["--version-light", "Limit version detection to the more likely probes.", `nmap -sV --version-light -p 80,443 ${TARGET}`, "Lower intensity"],
      ["--version-intensity <0–9>", "Set version-probe intensity; higher values try more probes.", `nmap -sV --version-intensity 2 -p 80,443 ${TARGET}`, "Careful"],
      ["--version-all", "Try every version-detection probe; this can increase traffic.", `nmap -sV --version-all -p 80 ${TARGET}`, "High intensity"]
    ]
  },
  {
    title: "Operating-system detection",
    description: "OS fingerprinting uses network probes and is more reliable when a host has an open and a closed port.",
    options: [
      ["-O", "Enable remote operating-system detection.", `nmap -O ${TARGET}`, "Careful"],
      ["--osscan-limit", "Limit OS detection to targets that appear suitable for fingerprinting.", `nmap -O --osscan-limit ${TARGET}`, "Careful"],
      ["--osscan-guess", "Make Nmap guess more aggressively when OS matches are uncertain.", `nmap -O --osscan-guess ${TARGET}`, "Higher intensity"]
    ]
  },
  {
    title: "Timing and impact controls",
    description: "Use conservative timing agreed with the network owner. Faster settings can increase load and packet loss.",
    options: [
      ["-T<0–5>", "Choose a timing template. T2 is generally slower; higher values are faster and less cautious.", `nmap -T2 -p 80,443 ${TARGET}`, "Tune carefully"],
      ["--max-retries <n>", "Cap retransmissions for port-scan probes.", `nmap --max-retries 2 -p 80,443 ${TARGET}`, "Tune carefully"],
      ["--host-timeout <time>", "Stop work on a host after the specified duration.", `nmap --host-timeout 2m ${TARGET}`, "Tune carefully"],
      ["--scan-delay <time>", "Wait at least the specified interval between probes to reduce scan rate.", `nmap --scan-delay 200ms -p 80,443 ${TARGET}`, "Lower impact"],
      ["--max-scan-delay <time>", "Set an upper bound on the delay Nmap may use between probes.", `nmap --max-scan-delay 1s -p 80,443 ${TARGET}`, "Tune carefully"],
      ["--max-rate <n>", "Set an upper bound on packet sending rate.", `nmap --max-rate 20 -p 80,443 ${TARGET}`, "Lower impact"],
      ["--min-rate <n>", "Set a minimum packet rate; may increase traffic and load, so use only if the owner approves.", `nmap --min-rate 5 -p 80,443 ${TARGET}`, "Higher impact"]
    ]
  },
  {
    title: "DNS, IPv6, and routing",
    description: "Control name resolution, address family, and path discovery for authorized targets.",
    options: [
      ["-n", "Disable reverse-DNS resolution; can make scans faster and quieter.", `nmap -n -sn ${TARGET}`, "Basics"],
      ["-R", "Always perform reverse-DNS resolution for targets.", `nmap -R -sn ${TARGET}`, "Basics"],
      ["--system-dns", "Use the operating system's resolver instead of Nmap's parallel resolver.", `nmap --system-dns -sn ${TARGET}`, "Basics"],
      ["-6", "Enable IPv6 scanning for IPv6 target addresses.", `nmap -6 -sn <target ip>`, "Basics"],
      ["--traceroute", "Trace the network path to each target; sends additional probes.", `nmap --traceroute -sn ${TARGET}`, "Careful"]
    ]
  },
  {
    title: "Output and result filtering",
    description: "Save scan results for review. Handle output files according to your organization's data policy.",
    options: [
      ["-oN <file>", "Write human-readable normal output to a file.", `nmap -sT -p 80,443 -oN scan.txt ${TARGET}`, "Basics"],
      ["-oX <file>", "Write results in XML format for structured processing.", `nmap -sT -p 80,443 -oX scan.xml ${TARGET}`, "Basics"],
      ["-oA <base>", "Write normal, XML, and grepable output using the supplied basename.", `nmap -sT -p 80,443 -oA scan-results ${TARGET}`, "Basics"],
      ["-oG <file>", "Write legacy grepable output; XML or normal output is preferred for most new workflows.", `nmap -sT -p 80,443 -oG scan.gnmap ${TARGET}`, "Legacy format"],
      ["-oS <file>", "Write humorous Script Kiddie output; provided for compatibility, not recommended for analysis.", `nmap -sT -p 80,443 -oS scan.nmap ${TARGET}`, "Legacy format"],
      ["--open", "Show only open or possibly open ports in the output.", `nmap --open -p 1-100 ${TARGET}`, "Basics"],
      ["--reason", "Show the probe reason for each reported port state.", `nmap --reason -p 80,443 ${TARGET}`, "Basics"],
      ["-v", "Increase verbosity; use -vv for more detail.", `nmap -v -sT -p 80,443 ${TARGET}`, "Basics"],
      ["-d", "Increase debugging level; use -dd for additional diagnostics.", `nmap -d -sT -p 80 ${TARGET}`, "Diagnostics"],
      ["--packet-trace", "Show sent and received packets; output can be very verbose.", `nmap --packet-trace -sT -p 80 ${TARGET}`, "Diagnostics"],
      ["--iflist", "List local network interfaces and routes; does not scan a remote target.", "nmap --iflist", "Local only"],
      ["--append-output", "Append results to output files rather than replacing them.", `nmap --append-output -oN scan.txt -p 80 ${TARGET}`, "Basics"],
      ["--resume <file>", "Resume an interrupted scan from a supported normal-output file.", `nmap --resume scan.txt`, "Basics"]
    ]
  },
  {
    title: "General and diagnostic options",
    description: "Display help and version information, or adjust execution assumptions.",
    options: [
      ["-A", "Enable OS detection, version detection, default NSE scripts, and traceroute. This is a high-impact bundle; use only when explicitly in scope.", `nmap -A -p 80 ${TARGET}`, "High intensity"],
      ["-sC", "Run Nmap's default NSE scripts; scripts send additional probes, so review script behavior and authorization first.", `nmap -sC -p 80 ${TARGET}`, "High intensity"],
      ["--script-help <scripts>", "Display help for selected NSE scripts or categories; this prints help rather than running a scan.", "nmap --script-help default", "Local help"],
      ["--privileged", "Tell Nmap to assume the user has raw-socket privileges.", `nmap --privileged -sS -p 80 ${TARGET}`, "Environment"],
      ["--unprivileged", "Tell Nmap to assume the user lacks raw-socket privileges.", `nmap --unprivileged -sT -p 80 ${TARGET}`, "Environment"],
      ["-V", "Print the Nmap version.", "nmap -V", "Local only"],
      ["-h", "Print a short usage summary.", "nmap -h", "Local only"]
    ]
  }
];

const catalog = document.getElementById("nmap-catalog");
const count = document.getElementById("nmap-count");
let optionCount = 0;

function copyText(text, button) {
  const original = button.textContent;
  function copied() {
    button.textContent = "Copied";
    button.setAttribute("aria-live", "polite");
    window.setTimeout(() => { button.textContent = original; }, 1200);
  }
  function failed(error) {
    button.textContent = "Copy failed";
    button.setAttribute("aria-live", "polite");
    console.error("Clipboard copy failed.", error);
    window.setTimeout(() => { button.textContent = original; }, 1800);
  }
  function fallback(error) {
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const success = document.execCommand("copy");
    field.remove();
    if (success) copied();
    else failed(error);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(copied).catch(fallback);
  } else {
    fallback(new Error("Clipboard API is unavailable."));
  }
}

NMAP_SECTIONS.forEach(section => {
  const container = document.createElement("section");
  container.className = "operator-section";
  const heading = document.createElement("h2");
  heading.textContent = section.title;
  const description = document.createElement("p");
  description.className = "operator-intro";
  description.textContent = section.description;
  const list = document.createElement("div");
  list.className = "operator-list";

  section.options.forEach(([option, summary, example, status]) => {
    optionCount += 1;
    const card = document.createElement("article");
    card.className = "operator-card nmap-card";
    const title = document.createElement("div");
    title.className = "operator-title";
    const optionCode = document.createElement("code");
    optionCode.textContent = option;
    const badge = document.createElement("span");
    badge.className = `operator-status ${status === "Local only" ? "documented" : "limited"}`;
    badge.textContent = status;
    title.append(optionCode, badge);

    const details = document.createElement("p");
    details.textContent = summary;
    const command = document.createElement("div");
    command.className = "operator-query";
    const commandCode = document.createElement("code");
    commandCode.textContent = example;
    const actions = document.createElement("div");
    actions.className = "operator-actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "btn";
    copyButton.textContent = "Copy example";
    copyButton.addEventListener("click", () => copyText(example, copyButton));
    actions.appendChild(copyButton);
    command.append(commandCode, actions);
    card.append(title, details, command);
    list.appendChild(card);
  });

  container.append(heading, description, list);
  catalog.appendChild(container);
});

count.textContent = `${optionCount} options`;

function setupMatrix() {
  const canvas = document.getElementById("rain");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

setupMatrix();
