"use strict";

const DEFAULT_WORDLIST_PATH = "/home/kali/wordlists/wordlist.txt";

const PASSWORD_TOOL_OPTIONS = [
  {
    tool: "THC Hydra",
    description: "Online login-testing utility. In these examples, replace <target ip> only with a loopback address for an isolated service you own. The lab builder is fixed to 127.0.0.1.",
    documentation: "https://github.com/vanhauser-thc/thc-hydra",
    options: [
      ["-l <login>", "Use one login name.", "hydra -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-L <file>", "Read login names from a file.", "hydra -L <test-users> -P <wordlist> <target ip> ssh"],
      ["-p <password>", "Try one specified password.", "hydra -l <test-user> -p <test-password> <target ip> ssh"],
      ["-P <file>", "Read candidate passwords from a file.", "hydra -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-C <file>", "Read colon-separated login/password pairs.", "hydra -C <test-combinations> <target ip> ssh"],
      ["-e <nsr>", "Try empty, login-as-password, or reversed-login checks.", "hydra -l <test-user> -e nsr <target ip> ssh"],
      ["-s <port>", "Use a non-default service port.", "hydra -l <test-user> -P <wordlist> -s <lab-port> <target ip> ssh"],
      ["-S", "Use TLS/SSL where supported by the selected module.", "hydra -S -l <test-user> -P <wordlist> <target ip> <tls-service>"],
      ["-t <tasks>", "Set parallel tasks per target; keep low in a test lab.", "hydra -t 1 -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-w <seconds>", "Set response timeout in seconds.", "hydra -w 5 -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-W <seconds>", "Set wait time between connections for each task.", "hydra -W 2 -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-c <seconds>", "Set delay between login/password attempts for each thread.", "hydra -c 2 -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-f", "Stop after the first valid credential pair is found for a target.", "hydra -f -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-F", "Stop after a valid credential pair is found on any target.", "hydra -F -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-V", "Show each login/password pair as it is tried.", "hydra -V -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-v / -d", "Show verbose output / debug information.", "hydra -v -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-o <file>", "Write findings to a file.", "hydra -o <lab-output> -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-b <format>", "Select output format (for example, json).", "hydra -b json -o <lab-output> -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-M <file>", "Read target hosts from a file; avoid outside a specifically approved lab.", "hydra -M <lab-hosts> -l <test-user> -P <wordlist> ssh"],
      ["-I", "Ignore an existing restore file and start a new session.", "hydra -I -l <test-user> -P <wordlist> <target ip> ssh"],
      ["-R", "Restore a previous Hydra session.", "hydra -R"],
      ["-U <module>", "Show help and supported options for one service module.", "hydra -U ssh"],
      ["-m <options>", "Pass module-specific options; see the module help first.", "hydra -l <test-user> -P <wordlist> -m <module-options> <target ip> <module>"],
      ["-4 / -6", "Force IPv4 / IPv6 mode.", "hydra -4 -l <test-user> -P <wordlist> <target ip> ssh"]
    ]
  },
  {
    tool: "John the Ripper",
    description: "Offline password-auditing tool. Point it only at a hash file you are authorized to inspect.",
    documentation: "https://www.openwall.com/john/doc/",
    options: [
      ["--wordlist=<file>", "Try candidates from a local wordlist.", "john --wordlist=<wordlist> <authorized-hash-file>"],
      ["--stdin", "Read candidate passwords from standard input.", "john --stdin <authorized-hash-file>"],
      ["--single", "Use the single-crack mode and account-derived candidate rules.", "john --single <authorized-hash-file>"],
      ["--incremental[=<mode>]", "Use incremental candidate generation; may be resource intensive.", "john --incremental=Digits <authorized-hash-file>"],
      ["--external=<mode>", "Use a configured external mode.", "john --external=<configured-mode> <authorized-hash-file>"],
      ["--rules[=<section>]", "Enable word mangling rules for wordlist candidates.", "john --wordlist=<wordlist> --rules <authorized-hash-file>"],
      ["--format=<name>", "Select a supported hash format.", "john --format=raw-md5 <authorized-hash-file>"],
      ["--users=<names>", "Limit processing to selected account names.", "john --users=<test-account> <authorized-hash-file>"],
      ["--groups=<names>", "Limit processing to selected group names.", "john --groups=<test-group> <authorized-hash-file>"],
      ["--salts=<count>", "Limit processing to hashes with a selected number of salts.", "john --salts=1 <authorized-hash-file>"],
      ["--fork=<n>", "Run multiple processes on supported systems; increases resource use.", "john --fork=2 --wordlist=<wordlist> <authorized-hash-file>"],
      ["--session=<name>", "Name a session so it can be resumed or inspected.", "john --session=<lab-session> --wordlist=<wordlist> <authorized-hash-file>"],
      ["--restore[=<name>]", "Restore a saved session.", "john --restore=<lab-session>"],
      ["--status[=<name>]", "Show status for a running or saved session.", "john --status=<lab-session>"],
      ["--show", "Display recovered passwords from the pot file for the supplied hash file.", "john --show <authorized-hash-file>"],
      ["--pot=<file>", "Use a specified pot file for recovered results.", "john --pot=<lab-results.pot> <authorized-hash-file>"],
      ["--list=formats", "List formats supported by the installed build.", "john --list=formats"],
      ["--test[=<seconds>]", "Benchmark supported formats; does not audit a supplied hash file.", "john --test=5"]
    ]
  },
  {
    tool: "Hashcat",
    description: "Offline password-recovery and audit tool. Examples use local test files and dictionary mode only.",
    documentation: "https://hashcat.net/wiki/doku.php?id=hashcat",
    options: [
      ["-m <mode>", "Select the hash type using its numeric mode identifier.", "hashcat -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["-a <mode>", "Select an attack mode; 0 is dictionary mode.", "hashcat -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["-r <file>", "Apply a rule file to wordlist candidates.", "hashcat -m 0 -a 0 -r <lab-rules> <authorized-hash-file> <wordlist>"],
      ["-o <file>", "Write recovered results to a file.", "hashcat -m 0 -a 0 -o <lab-output> <authorized-hash-file> <wordlist>"],
      ["--show", "Show recovered results from the potfile for the supplied hash file.", "hashcat -m 0 --show <authorized-hash-file>"],
      ["--left", "Show hashes from the input file that are not in the potfile.", "hashcat -m 0 --left <authorized-hash-file>"],
      ["--username", "Ignore a username field before the hash in each line.", "hashcat --username -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["--session=<name>", "Name a session for later status or restore operations.", "hashcat --session=<lab-session> -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["--restore", "Restore the previous session.", "hashcat --restore"],
      ["--status", "Show the status of the current session.", "hashcat --status"],
      ["--status-timer=<seconds>", "Set the interval for status updates.", "hashcat --status --status-timer=60"],
      ["--potfile-path=<file>", "Use an explicitly selected potfile.", "hashcat --potfile-path=<lab.pot> -m 0 --show <authorized-hash-file>"],
      ["--potfile-disable", "Do not read or write the potfile for this run.", "hashcat --potfile-disable -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["--outfile-format=<n>", "Choose fields written to the output file.", "hashcat --outfile-format=2 -m 0 -a 0 -o <lab-output> <authorized-hash-file> <wordlist>"],
      ["--separator=<char>", "Set the separator used when parsing hashes.", "hashcat --separator=: -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["--hex-salt", "Interpret salt values as hexadecimal.", "hashcat --hex-salt -m <salted-hash-mode> -a 0 <authorized-hash-file> <wordlist>"],
      ["--increment", "Enable increment mode when used with a compatible attack mode.", "hashcat -m 0 -a 3 --increment <authorized-test-hash-file>"],
      ["--increment-min / --increment-max", "Set minimum and maximum increment lengths.", "hashcat -m 0 -a 3 --increment --increment-min=1 --increment-max=4 <authorized-test-hash-file>"],
      ["--runtime=<seconds>", "Stop the session after a time limit.", "hashcat --runtime=60 -m 0 -a 0 <authorized-hash-file> <wordlist>"],
      ["--example-hashes", "Show example hashes for supported modes.", "hashcat --example-hashes"],
      ["--identify", "Try to identify possible hash types from input.", "hashcat --identify <authorized-hash-file>"],
      ["-I", "Show available backend devices and information.", "hashcat -I"],
      ["--machine-readable", "Print status in a machine-readable format.", "hashcat --status --machine-readable"]
    ]
  }
];

window.DORK_OPS_PASSWORD_TOOL_OPTIONS = PASSWORD_TOOL_OPTIONS;

function copyReferenceText(text, button) {
  const original = button.textContent;
  const setStatus = status => {
    button.textContent = status;
    button.setAttribute("aria-live", "polite");
    window.setTimeout(() => { button.textContent = original; }, status === "Copied" ? 1200 : 1800);
  };
  const fallback = () => {
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.left = "-9999px";
    document.body.appendChild(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    if (copied) setStatus("Copied");
    else {
      setStatus("Copy failed");
      console.error("Clipboard copy failed.");
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => setStatus("Copied"), error => {
      if (document.execCommand) fallback();
      else {
        setStatus("Copy failed");
        console.error("Clipboard copy failed.", error);
      }
    });
  } else {
    fallback();
  }
}

function renderPasswordOptions() {
  const host = document.getElementById("pw-catalog");
  host.replaceChildren();
  let optionCount = 0;
  PASSWORD_TOOL_OPTIONS.forEach(group => {
    optionCount += group.options.length;
    const section = document.createElement("section");
    section.className = "operator-section";
    const heading = document.createElement("h2");
    heading.textContent = group.tool;
    const intro = document.createElement("p");
    intro.className = "operator-intro";
    intro.textContent = group.description;
    const docs = document.createElement("a");
    docs.href = group.documentation;
    docs.target = "_blank";
    docs.rel = "noopener noreferrer";
    docs.textContent = "Official documentation";
    docs.className = "note";
    const list = document.createElement("div");
    list.className = "operator-list";
    group.options.forEach(([flag, description, example]) => {
      const renderedExample = example.replace(/<wordlist>/g, DEFAULT_WORDLIST_PATH);
      const card = document.createElement("article");
      card.className = "operator-card";
      const title = document.createElement("div");
      title.className = "operator-title";
      const code = document.createElement("code");
      code.textContent = flag;
      title.appendChild(code);
      const detail = document.createElement("p");
      detail.textContent = description;
      const query = document.createElement("div");
      query.className = "operator-query";
      const sample = document.createElement("code");
      sample.textContent = renderedExample;
      const actions = document.createElement("div");
      actions.className = "operator-actions";
      const copy = document.createElement("button");
      copy.className = "btn";
      copy.type = "button";
      copy.textContent = "Copy";
      copy.addEventListener("click", () => copyReferenceText(renderedExample, copy));
      actions.appendChild(copy);
      query.append(sample, actions);
      card.append(title, detail, query);
      list.appendChild(card);
    });
    section.append(heading, intro, docs, list);
    host.appendChild(section);
  });
  document.getElementById("pw-count").textContent = `${optionCount} OPTIONS`;
}

let passwordLabCommands = {};

function savePasswordLabState() {
  const state = {
    tool: document.getElementById("pw-tool").value,
    service: document.getElementById("hydra-service").value,
    username: document.getElementById("hydra-user").value,
    hydraWordlist: document.getElementById("hydra-wordlist").value,
    johnFormat: document.getElementById("john-format").value,
    johnHashFile: document.getElementById("john-hash-file").value,
    johnWordlist: document.getElementById("john-wordlist").value,
    hashcatMode: document.getElementById("hashcat-mode").value,
    hashcatHashFile: document.getElementById("hashcat-hash-file").value,
    hashcatWordlist: document.getElementById("hashcat-wordlist").value,
    commands: passwordLabCommands
  };
  try {
    localStorage.setItem("dorkops-password-lab", JSON.stringify(state));
    const status = document.getElementById("pw-save-status");
    if (status) status.textContent = "Saved on this device";
  } catch {
    const status = document.getElementById("pw-save-status");
    if (status) status.textContent = "Could not save on this device";
  }
}

function restorePasswordLabState() {
  let state;
  try {
    state = JSON.parse(localStorage.getItem("dorkops-password-lab") || "null");
  } catch {
    document.getElementById("pw-save-status").textContent = "Saved password lab could not be read";
    return;
  }
  if (!state || typeof state !== "object") return;
  const fields = [
    ["pw-tool", "tool", ["hydra", "john", "hashcat"]],
    ["hydra-service", "service", ["ssh", "ftp", "http-get"]],
    ["hydra-user", "username"],
    ["hydra-wordlist", "hydraWordlist"],
    ["john-format", "johnFormat", ["", "raw-md5", "raw-sha1", "nt"]],
    ["john-hash-file", "johnHashFile"],
    ["john-wordlist", "johnWordlist"],
    ["hashcat-mode", "hashcatMode", ["0", "100", "1000"]],
    ["hashcat-hash-file", "hashcatHashFile"],
    ["hashcat-wordlist", "hashcatWordlist"]
  ];
  function migrateWordlistPath(value) {
    const migrated = value.replace(/toy-wordlist/g, "wordlist");
    if (migrated === "wordlist.txt") return DEFAULT_WORDLIST_PATH;
    return migrated.replace(/(['"])wordlist\.txt\1/g, (_, quote) => `${quote}${DEFAULT_WORDLIST_PATH}${quote}`);
  }
  fields.forEach(([id, key, allowed]) => {
    const value = state[key];
    if (typeof value === "string" && (!allowed || allowed.includes(value))) {
      document.getElementById(id).value = key.toLowerCase().includes("wordlist") ? migrateWordlistPath(value) : value;
    }
  });
  if (state.commands && typeof state.commands === "object") {
    passwordLabCommands = {};
    Object.entries(state.commands).forEach(([tool, command]) => {
      if (["hydra", "john", "hashcat"].includes(tool) && typeof command === "string") {
        passwordLabCommands[tool] = migrateWordlistPath(command);
      }
    });
  }
  document.getElementById("pw-auth").checked = false;
  updatePasswordLabFields();
  document.getElementById("pw-save-status").textContent = "Restored from this device";
  const restoredTool = document.getElementById("pw-tool").value;
  if (typeof passwordLabCommands[restoredTool] === "string") {
    document.dispatchEvent(new CustomEvent("dorkops:password-built", { detail: { tool: restoredTool } }));
  }
}

function updatePasswordLabFields() {
  const tool = document.getElementById("pw-tool").value;
  document.getElementById("pw-next-steps").hidden = true;
  const explanations = {
    hydra: "Hydra checks a live service, which creates network requests and may lock accounts. This builder targets only 127.0.0.1, uses one task, and never connects on this page.",
    john: "John works offline: it reads an authorized local hash file and a candidate-list file. The format is optional; use it only when you know the exact format.",
    hashcat: "Hashcat works offline with a local hash file. Choose the matching hash format (mode); a wrong mode can make the results meaningless. This example uses dictionary mode."
  };
  document.getElementById("pw-tool-explanation").textContent = explanations[tool];
  document.getElementById("hydra-fields").hidden = tool !== "hydra";
  document.getElementById("hydra-user-fields").hidden = tool !== "hydra";
  document.getElementById("hydra-wordlist-fields").hidden = tool !== "hydra";
  document.getElementById("john-fields").hidden = tool !== "john";
  document.getElementById("john-files").hidden = tool !== "john";
  document.getElementById("hashcat-fields").hidden = tool !== "hashcat";
  document.getElementById("hashcat-files").hidden = tool !== "hashcat";
  const command = passwordLabCommands[tool];
  document.getElementById("pw-command-text").textContent = command || "";
  document.getElementById("pw-command").hidden = !command;
  document.getElementById("pw-warn").hidden = true;
  savePasswordLabState();
}

function isSafeCommandValue(value) {
  return /^[A-Za-z0-9_./\\: -]+$/.test(value) && !value.startsWith("-");
}

function shellQuote(value) {
  return `'${value}'`;
}

function buildPasswordLabCommand() {
  const warning = document.getElementById("pw-warn");
  const commandHost = document.getElementById("pw-command");
  warning.hidden = true;
  commandHost.hidden = true;
  document.getElementById("pw-next-steps").hidden = true;
  if (!document.getElementById("pw-auth").checked) {
    warning.textContent = "Confirm that this is an isolated lab or an authorized offline audit before building an example.";
    warning.hidden = false;
    return;
  }

  const tool = document.getElementById("pw-tool").value;
  let command;
  if (tool === "hydra") {
    const service = document.getElementById("hydra-service").value;
    const username = document.getElementById("hydra-user").value.trim();
    const wordlist = document.getElementById("hydra-wordlist").value.trim();
    if (!/^[A-Za-z0-9_.-]+$/.test(username) || !isSafeCommandValue(wordlist)) {
      warning.textContent = "Use a simple test username and a local wordlist path containing only letters, numbers, spaces, dots, underscores, hyphens, slashes, or colons.";
      warning.hidden = false;
      return;
    }
    command = `hydra -t 1 -f -l ${shellQuote(username)} -P ${shellQuote(wordlist)} 127.0.0.1 ${service}`;
  } else if (tool === "john") {
    const format = document.getElementById("john-format").value;
    const hashFile = document.getElementById("john-hash-file").value.trim();
    const wordlist = document.getElementById("john-wordlist").value.trim();
    if (!isSafeCommandValue(hashFile) || !isSafeCommandValue(wordlist)) {
      warning.textContent = "Use local file paths containing only letters, numbers, spaces, dots, underscores, hyphens, slashes, or colons.";
      warning.hidden = false;
      return;
    }
    command = `john --wordlist=${shellQuote(wordlist)}${format ? ` --format=${format}` : ""} ${shellQuote(hashFile)}`;
  } else {
    const mode = document.getElementById("hashcat-mode").value;
    const hashFile = document.getElementById("hashcat-hash-file").value.trim();
    const wordlist = document.getElementById("hashcat-wordlist").value.trim();
    if (!isSafeCommandValue(hashFile) || !isSafeCommandValue(wordlist)) {
      warning.textContent = "Use local file paths containing only letters, numbers, spaces, dots, underscores, hyphens, slashes, or colons.";
      warning.hidden = false;
      return;
    }
    command = `hashcat -m ${mode} -a 0 ${shellQuote(hashFile)} ${shellQuote(wordlist)}`;
  }
  document.getElementById("pw-command-text").textContent = command;
  commandHost.hidden = false;
  passwordLabCommands[tool] = command;
  savePasswordLabState();
  document.dispatchEvent(new CustomEvent("dorkops:password-built", {
    detail: { tool, command }
  }));
}

document.addEventListener("dorkops:password-promoted", event => {
  const { tool, command } = event.detail;
  if (!["hydra", "john", "hashcat"].includes(tool) || typeof command !== "string") return;
  passwordLabCommands[tool] = command;
  document.getElementById("pw-command-text").textContent = command;
  document.getElementById("pw-command").hidden = false;
  savePasswordLabState();
});

function persistPasswordLabInput(event) {
  document.getElementById("pw-auth").checked = false;
  if (event.target.id !== "pw-tool") {
    delete passwordLabCommands[document.getElementById("pw-tool").value];
    document.getElementById("pw-command").hidden = true;
    document.getElementById("pw-next-steps").hidden = true;
  }
  savePasswordLabState();
}

if (document.getElementById("pw-catalog")) {
  renderPasswordOptions();
}

if (document.getElementById("pw-tool")) {
  restorePasswordLabState();
  document.getElementById("pw-tool").addEventListener("change", updatePasswordLabFields);
  document.getElementById("pw-build").addEventListener("click", buildPasswordLabCommand);
  document.getElementById("pw-copy").addEventListener("click", event =>
    copyReferenceText(document.getElementById("pw-command-text").textContent, event.currentTarget));
  document.querySelectorAll("#p4 input:not(#pw-auth), #p4 select").forEach(field => {
    field.addEventListener("input", persistPasswordLabInput);
    field.addEventListener("change", persistPasswordLabInput);
    field.addEventListener("keydown", event => {
      if (event.key === "Enter" && field.matches("input")) buildPasswordLabCommand();
    });
  });
}
