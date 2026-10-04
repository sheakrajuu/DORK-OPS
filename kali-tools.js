"use strict";

const KALI_TOOL_GROUPS = [
  {
    title: "Network discovery and analysis",
    tools: [
      ["Nmap", "Network discovery and security auditing.", "nmap"],
      ["Wireshark", "Graphical network protocol analyzer.", "wireshark"],
      ["tcpdump", "Command-line packet capture and analysis.", "tcpdump"],
      ["hping3", "Packet crafting and network testing utility.", "hping3"]
    ]
  },
  {
    title: "Web application testing",
    tools: [
      ["Burp Suite", "Integrated platform for authorized web security testing.", "burpsuite"],
      ["OWASP ZAP", "Web application security testing proxy and scanner.", "zaproxy"],
      ["sqlmap", "Tool for testing SQL injection and database security.", "sqlmap"],
      ["Nikto", "Web server assessment tool.", "nikto"],
      ["Skipfish", "Active web application security reconnaissance tool.", "skipfish"],
      ["Gobuster", "Directory, DNS, and virtual-host discovery utility.", "gobuster"]
    ]
  },
  {
    title: "Password auditing",
    tools: [
      ["THC Hydra", "Parallelized login testing utility.", "hydra"],
      ["John the Ripper", "Password security auditing tool.", "john"],
      ["Hashcat", "Password recovery and hash-auditing utility.", "hashcat"]
    ]
  },
  {
    title: "Wireless security",
    tools: [
      ["Aircrack-ng", "Wireless network security assessment suite.", "aircrack-ng"],
      ["Kismet", "Wireless network and device detector.", "kismet"],
      ["Reaver", "WPS security assessment utility.", "reaver"]
    ]
  },
  {
    title: "Security testing frameworks",
    tools: [
      ["Metasploit Framework", "Framework for security validation and exploit research.", "metasploit-framework"],
      ["SearchSploit", "Command-line search interface for Exploit-DB.", "exploitdb"]
    ]
  },
  {
    title: "Digital forensics",
    tools: [
      ["Foremost", "Recover files from disk images using file structures.", "foremost"],
      ["Binwalk", "Analyze and extract firmware images.", "binwalk"],
      ["Autopsy", "Digital forensics platform.", "autopsy"],
      ["Volatility 3", "Memory forensics framework.", "volatility3"]
    ]
  },
  {
    title: "OSINT and reconnaissance",
    tools: [
      ["theHarvester", "Gather publicly available names, emails, and hosts for an authorized scope.", "theharvester"],
      ["Amass", "Attack surface mapping and asset discovery.", "amass"],
      ["Recon-ng", "Web-based reconnaissance framework.", "recon-ng"]
    ]
  }
];

const SHELL_OPERATORS = [
  ["&&", "Run the next command only if the previous command succeeds.", "nmap --version && printf 'Nmap is installed\\n'"],
  ["||", "Run the next command only if the previous command fails.", "command -v nmap >/dev/null || printf 'Nmap is not in PATH\\n'"],
  [";", "Run commands in sequence, regardless of the first command’s exit status.", "date; printf 'Check complete\\n'"],
  ["|", "Send one command’s standard output to another command as input.", "printf 'alpha\\nbeta\\n' | grep beta"],
  [">", "Redirect standard output to a file, replacing its existing contents.", "printf 'Lab note\\n' > lab-note.txt"],
  [">>", "Append standard output to a file.", "printf 'Another note\\n' >> lab-note.txt"],
  ["2>", "Redirect standard error to a file.", "nmap --version 2> command-errors.txt"],
  ["<", "Read a command’s standard input from a file.", "sort < lab-hosts.txt"],
  ["$(...)", "Substitute the output of a command inside another command.", "printf 'Today: %s\\n' \"$(date +%F)\""],
  ["*", "Match zero or more characters in a filename pattern.", "printf '%s\\n' *.pcap"]
];

const CLI_SYNTAX = [
  ["Short and long options", "A tool may provide a short form with one dash or a long form with two; names differ by tool.", "tool -h\ntool --help"],
  ["Option values", "Options that take values may use a space or an equals sign; follow that tool’s documented form.", "tool --output results.txt\ntool --output=results.txt"],
  ["Positional arguments", "Some tools take required files or targets after the options. Their order is tool-specific.", "tool [options] <input-file>"],
  ["Quoted values", "Quote arguments containing spaces so the shell passes each value as one argument.", "tool --output 'lab results.txt'"],
  ["End-of-options marker", "Many command-line programs treat -- as the end of options; confirm support in the tool’s manual.", "tool -- <filename-starting-with-dash>"]
];

const KALI_HELP_COMMANDS = [
  ["Nmap", "nmap -h", "nmap"],
  ["Wireshark", "wireshark -h", "wireshark"],
  ["tcpdump", "man tcpdump", "tcpdump"],
  ["hping3", "hping3 -h", "hping3"],
  ["Burp Suite", null, "burpsuite"],
  ["OWASP ZAP", "zaproxy -h", "zaproxy"],
  ["sqlmap", "sqlmap -h", "sqlmap"],
  ["Nikto", "nikto -Help", "nikto"],
  ["Skipfish", "skipfish -h", "skipfish"],
  ["Gobuster", "gobuster --help", "gobuster"],
  ["THC Hydra", "hydra -h", "hydra"],
  ["John the Ripper", "john --help", "john"],
  ["Hashcat", "hashcat --help", "hashcat"],
  ["Aircrack-ng", "aircrack-ng --help", "aircrack-ng"],
  ["Kismet", "kismet --help", "kismet"],
  ["Reaver", "reaver -h", "reaver"],
  ["Metasploit Framework", "msfconsole -h", "metasploit-framework"],
  ["SearchSploit", "searchsploit -h", "exploitdb"],
  ["Foremost", "foremost -h", "foremost"],
  ["Binwalk", "binwalk --help", "binwalk"],
  ["Autopsy", "autopsy --help", "autopsy"],
  ["Volatility 3", "vol -h", "volatility3"],
  ["theHarvester", "theHarvester -h", "theharvester"],
  ["Amass", "amass -h", "amass"],
  ["Recon-ng", "recon-ng -h", "recon-ng"]
];

const catalog = document.getElementById("kali-tool-catalog");
const shellCatalog = document.getElementById("shell-operator-catalog");
const syntaxCatalog = document.getElementById("cli-syntax-catalog");
const cliCatalog = document.getElementById("kali-cli-catalog");
let totalTools = 0;

function makeCopyButton(text) {
  const button = document.createElement("button");
  button.className = "btn";
  button.type = "button";
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    const original = button.textContent;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard API unavailable.");
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch (error) {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      button.textContent = copied ? "Copied" : "Copy failed";
      if (!copied) console.error("Clipboard copy failed.", error);
    }
    button.setAttribute("aria-live", "polite");
    window.setTimeout(() => { button.textContent = original; }, button.textContent === "Copied" ? 1200 : 1800);
  });
  return button;
}

KALI_TOOL_GROUPS.forEach(group => {
  const section = document.createElement("section");
  section.className = "operator-section";
  const heading = document.createElement("h2");
  heading.textContent = group.title;
  const list = document.createElement("div");
  list.className = "operator-list";
  group.tools.forEach(([name, description, packageName]) => {
    totalTools += 1;
    const card = document.createElement("article");
    card.className = "operator-card";
    const title = document.createElement("div");
    title.className = "operator-title";
    const nameElement = document.createElement("span");
    nameElement.textContent = name;
    title.appendChild(nameElement);
    const detail = document.createElement("p");
    detail.textContent = description;
    const link = document.createElement("a");
    link.className = "btn";
    link.href = `https://www.kali.org/tools/${encodeURIComponent(packageName)}/`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Kali documentation";
    card.append(title, detail, link);
    list.appendChild(card);
  });
  section.append(heading, list);
  catalog.appendChild(section);
});

SHELL_OPERATORS.forEach(([operator, description, example]) => {
  const card = document.createElement("article");
  card.className = "operator-card";
  const title = document.createElement("div");
  title.className = "operator-title";
  const code = document.createElement("code");
  code.textContent = operator;
  const summary = document.createElement("span");
  summary.textContent = description;
  title.append(code, summary);
  const command = document.createElement("div");
  command.className = "operator-query";
  const exampleCode = document.createElement("code");
  exampleCode.textContent = example;
  const actions = document.createElement("div");
  actions.className = "operator-actions";
  actions.appendChild(makeCopyButton(example));
  command.append(exampleCode, actions);
  card.append(title, command);
  shellCatalog.appendChild(card);
});

CLI_SYNTAX.forEach(([syntax, description, example]) => {
  const card = document.createElement("article");
  card.className = "operator-card";
  const title = document.createElement("div");
  title.className = "operator-title";
  const syntaxName = document.createElement("span");
  syntaxName.textContent = syntax;
  const detail = document.createElement("p");
  detail.textContent = description;
  const exampleRow = document.createElement("div");
  exampleRow.className = "operator-query";
  const exampleCode = document.createElement("code");
  exampleCode.textContent = example;
  const actions = document.createElement("div");
  actions.className = "operator-actions";
  actions.appendChild(makeCopyButton(example));
  title.appendChild(syntaxName);
  exampleRow.append(exampleCode, actions);
  card.append(title, detail, exampleRow);
  syntaxCatalog.appendChild(card);
});

KALI_HELP_COMMANDS.forEach(([name, command, packageName]) => {
  const card = document.createElement("article");
  card.className = "operator-card";
  const title = document.createElement("div");
  title.className = "operator-title";
  const nameElement = document.createElement("span");
  nameElement.textContent = name;
  title.appendChild(nameElement);
  const commandRow = document.createElement("div");
  commandRow.className = "operator-query";
  const actions = document.createElement("div");
  actions.className = "operator-actions";
  if (command) {
    const commandCode = document.createElement("code");
    commandCode.textContent = command;
    commandRow.appendChild(commandCode);
    actions.appendChild(makeCopyButton(command));
  } else {
    const note = document.createElement("span");
    note.className = "operator-cli-note";
    note.textContent = "GUI application; see docs for launch options.";
    commandRow.appendChild(note);
  }
  const docs = document.createElement("a");
  docs.className = "btn";
  docs.href = `https://www.kali.org/tools/${encodeURIComponent(packageName)}/`;
  docs.target = "_blank";
  docs.rel = "noopener noreferrer";
  docs.textContent = "Docs";
  actions.appendChild(docs);
  commandRow.appendChild(actions);
  card.append(title, commandRow);
  cliCatalog.appendChild(card);
});

document.getElementById("kali-tool-count").textContent = `${totalTools} CURATED TOOLS`;
