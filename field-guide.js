"use strict";

if (new URLSearchParams(location.search).get("embedded") === "1" && window.parent !== window) {
  document.body.classList.add("embedded-app");
  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.data?.type !== "dorkops:settings") return;
    if (!event.data.settings || typeof event.data.settings !== "object") {
      console.error("Received invalid Dork Ops field-guide preferences.");
      return;
    }
    document.body.dataset.motion = event.data.settings.reducedMotion === true ? "reduced" : "full";
  });
}

const topics = [
  {
    id: "linux",
    title: "Linux permissions & processes",
    level: "FOUNDATIONS · 10 MIN",
    summary: "Read ownership and permission bits, inspect running processes, and make the smallest safe change.",
    objectives: ["Interpret owner, group, and other permission bits.", "Explain why least privilege matters.", "Inspect a process before stopping it."],
    scenario: "In a disposable local training folder, a fictional report.txt file should be readable by its owner and group, but not by everyone else.",
    steps: ["Inspect the owner and mode with ls -l report.txt.", "Use id to check which groups the current user belongs to.", "Review a process with ps before taking action.", "In the disposable folder only, run chmod 640 report.txt, then inspect the file again."],
    example: "Example mode: -rw-r----- means the owner can read/write, the group can read, and other users have no listed access.",
    expected: "The permission string and numeric mode agree (for example, 640). A process listing is an observation, not a reason by itself to terminate a process.",
    mistakes: "Using chmod 777 as a shortcut; changing permissions recursively without reviewing the target; or killing an unfamiliar system process.",
    question: "What access does mode 640 grant?",
    choices: ["Owner read/write, group read, others none", "Everyone read/write", "Owner execute, group write"],
    answer: 0,
    explanation: "The digits apply to owner, group, and others: 6 is read/write, 4 is read, and 0 grants no listed access."
  },
  {
    id: "network",
    title: "Networking & DNS",
    level: "FOUNDATIONS · 9 MIN",
    summary: "Trace how a name resolves, distinguish addresses from ports, and use read-only diagnostics.",
    objectives: ["Describe the role of DNS in name resolution.", "Distinguish an IP address from a transport port.", "Recognize that cached answers can be stale."],
    scenario: "A fictional training workstation cannot open training.example.org. Your task is to compare its configured resolver answer with a known training-lab record.",
    steps: ["Check the hostname spelling and your lab's documented DNS settings.", "Use a read-only lookup such as nslookup training.example.org.", "Compare the answer, record type, and TTL with the instructor's reference.", "If needed, check reachability separately; a DNS answer does not prove the service is available."],
    example: "A fictional A record can map training.example.org to 192.0.2.25. The documentation-only TEST-NET address is not a real target.",
    expected: "DNS returns records such as A (IPv4) or AAAA (IPv6). A valid answer confirms name resolution from that resolver, not that a host is online or authorized to scan.",
    mistakes: "Treating DNS as proof of service health; confusing a hostname with a port; or querying/sweeping systems outside the approved lab.",
    question: "What does a successful A-record lookup tell you?",
    choices: ["The resolver returned an IPv4 address for the name", "The host is definitely reachable and safe", "The website's TLS certificate is valid"],
    answer: 0,
    explanation: "An A record maps a name to an IPv4 address; reachability and service security are separate checks."
  },
  {
    id: "web",
    title: "HTTP & TLS",
    level: "FOUNDATIONS · 11 MIN",
    summary: "Understand requests, responses, status codes, and what a TLS connection does and does not establish.",
    objectives: ["Identify a request method, response status, and header.", "Explain the difference between HTTP and HTTPS.", "Avoid putting credentials or secrets in URLs."],
    scenario: "Review a provided, fictional capture for docs.example.org. Do not send requests to a real service as part of this reading exercise.",
    steps: ["Find the request method and path in the sample.", "Read the response status and content type.", "Check whether the URL uses HTTPS and whether the certificate name matches the intended host.", "Describe what the evidence confirms and what it does not."],
    example: "GET /guide HTTP/1.1 followed by HTTP/1.1 200 OK indicates a successful response in this sample; it does not prove the content is correct or safe.",
    expected: "HTTPS protects the connection in transit and authenticates a host according to certificate checks. It does not guarantee that the site, content, or application is trustworthy.",
    mistakes: "Treating 200 OK as proof of safe content; assuming a lock icon means a business is legitimate; or sharing tokens in URLs and screenshots.",
    question: "What does HTTPS primarily provide for a correctly validated connection?",
    choices: ["Encryption in transit and host authentication", "A guarantee that the website is harmless", "Proof that every page is up to date"],
    answer: 0,
    explanation: "TLS protects traffic in transit and validates the host identity under certificate rules; it is not a general trust or safety guarantee."
  },
  {
    id: "logs",
    title: "Log analysis",
    level: "DEFENSIVE PRACTICE · 10 MIN",
    summary: "Build a timeline from fictional events while preserving context and avoiding premature conclusions.",
    objectives: ["Normalize timestamps and note timezone.", "Separate an observed event from an interpretation.", "Correlate events without exposing personal data."],
    scenario: "An instructor-provided sample contains three fictional web-server events from lab-host-01. The sample has no real user data.",
    steps: ["Note the log source, collection time, and timezone.", "Sort the sample events chronologically.", "Compare status, path, and source labels for a pattern.", "Write one observation, one hypothesis, and one follow-up question."],
    example: "Sample: 10:02Z GET /health 200; 10:03Z GET /missing 404. Two events alone do not establish malicious behavior.",
    expected: "A useful note preserves timestamps and source, distinguishes facts from hypotheses, and states what additional evidence would be needed.",
    mistakes: "Calling a single failed request an attack; ignoring timezone differences; or copying sensitive query strings and personal data into reports.",
    question: "Which statement is an observation rather than a conclusion?",
    choices: ["The sample shows three 404 responses within one minute", "The user is malicious", "The server has definitely been compromised"],
    answer: 0,
    explanation: "Counts and timestamps are observable facts. Intent or compromise requires corroborating evidence."
  },
  {
    id: "triage",
    title: "Basic incident triage",
    level: "DEFENSIVE PRACTICE · 12 MIN",
    summary: "Prioritize safety, preserve evidence, communicate clearly, and follow the organization's response plan.",
    objectives: ["Recognize when to escalate promptly.", "Preserve evidence without altering the source.", "Record a concise, factual timeline."],
    scenario: "A fictional staff member reports an unexpected sign-in alert on a training account. Follow the organization's playbook; do not investigate a real account here.",
    steps: ["Record who reported the event, when, and how it was observed.", "Check the approved response playbook and notify the designated responder.", "Preserve the original alert and relevant timestamps; avoid forwarding secrets.", "Use approved containment steps only when directed, then document actions and handoff."],
    example: "A concise initial note states: 'Training account received an unrecognized sign-in alert at 14:05Z; responder notified at 14:08Z; source alert preserved.'",
    expected: "A good triage note is time-stamped, factual, minimal, and handed to the right responder. Follow local policy for severity, containment, and evidence handling.",
    mistakes: "Deleting messages or logs; confronting a suspected person; sharing credentials or personal data; or improvising containment that could destroy evidence.",
    question: "What is the best first response to a credible security alert?",
    choices: ["Follow the response plan, preserve the original evidence, and notify the designated responder", "Delete the alert and wait for a second one", "Post the account details in a public chat"],
    answer: 0,
    explanation: "Use the established response process, preserve evidence, and limit disclosure to the appropriate responders."
  }
];

window.DORK_OPS_FIELD_GUIDE = topics;

if (document.getElementById("guide-topic-list") && document.getElementById("guide-lesson")) {
const topicList = document.getElementById("guide-topic-list");
const lessonHost = document.getElementById("guide-lesson");
const search = document.getElementById("guide-search");
const progressCount = document.getElementById("guide-progress-count");
const progressFill = document.getElementById("guide-progress-fill");
const completedKey = "dorkops-field-guide-completed";
let completed = readCompleted();
let activeTopic = topics.find(topic => topic.id === location.hash.slice(1)) || topics[0];

function readCompleted() {
  try {
    const stored = JSON.parse(localStorage.getItem(completedKey) || "[]");
    return Array.isArray(stored) ? stored.filter(id => topics.some(topic => topic.id === id)) : [];
  } catch (error) {
    console.error("Could not read Field Guide progress.", error);
    return [];
  }
}

function saveCompleted() {
  try {
    localStorage.setItem(completedKey, JSON.stringify(completed));
  } catch (error) {
    console.error("Could not save Field Guide progress.", error);
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function updateProgress() {
  progressCount.textContent = `${completed.length} / ${topics.length}`;
  progressFill.style.width = `${completed.length / topics.length * 100}%`;
  topicList.querySelectorAll("[data-topic]").forEach(button => {
    const done = completed.includes(button.dataset.topic);
    button.classList.toggle("is-complete", done);
    button.querySelector(".guide-topic-status").textContent = done ? "Complete" : "Start module";
  });
}

function renderTopicList(filter = "") {
  const normalizedFilter = filter.trim().toLowerCase();
  topicList.replaceChildren();
  topics.filter(topic => `${topic.title} ${topic.summary}`.toLowerCase().includes(normalizedFilter))
    .forEach(topic => {
      const button = element("button", "guide-topic-button");
      button.type = "button";
      button.dataset.topic = topic.id;
      button.setAttribute("aria-current", String(topic.id === activeTopic.id));
      button.append(element("span", "guide-topic-number", String(topics.indexOf(topic) + 1).padStart(2, "0")));
      const copy = element("span", "guide-topic-copy");
      copy.append(element("strong", "", topic.title), element("small", "guide-topic-status", completed.includes(topic.id) ? "Complete" : "Start module"));
      button.appendChild(copy);
      button.addEventListener("click", () => selectTopic(topic));
      topicList.appendChild(button);
    });
  if (!topicList.childElementCount) topicList.appendChild(element("p", "guide-no-results", "No topics match that search."));
  updateProgress();
}

function selectTopic(topic) {
  activeTopic = topic;
  history.replaceState(null, "", `#${topic.id}`);
  renderTopicList(search.value);
  renderLesson(topic);
}

function appendList(host, items, tag = "ul") {
  const list = document.createElement(tag);
  items.forEach(item => list.appendChild(element("li", "", item)));
  host.appendChild(list);
}

function renderLesson(topic) {
  lessonHost.replaceChildren();
  const heading = element("header", "lesson-heading");
  heading.append(element("p", "guide-eyebrow", topic.level), element("h2", "", topic.title), element("p", "lesson-summary", topic.summary));
  lessonHost.appendChild(heading);

  const tabs = element("nav", "guide-section-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", `${topic.title} sections`);
  const panels = ["learn", "practice", "check"].map(name => {
    const panel = element("section", "guide-section-panel");
    panel.id = `${topic.id}-${name}-panel`;
    panel.setAttribute("role", "tabpanel");
    panel.hidden = true;
    return panel;
  });
  const names = [["learn", "Learn"], ["practice", "Practice"], ["check", "Knowledge check"]];
  const tabButtons = names.map(([name, label], index) => {
    const button = element("button", "guide-section-tab", label);
    button.type = "button";
    button.id = `${topic.id}-${name}-tab`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panels[index].id);
    button.setAttribute("aria-selected", "false");
    button.tabIndex = -1;
    tabs.appendChild(button);
    button.addEventListener("click", () => activateSection(index));
    button.addEventListener("keydown", event => {
      const next = event.key === "ArrowRight" ? (index + 1) % tabButtons.length
        : event.key === "ArrowLeft" ? (index + tabButtons.length - 1) % tabButtons.length : -1;
      if (next >= 0) {
        event.preventDefault();
        activateSection(next);
        tabButtons[next].focus();
      }
    });
    return button;
  });
  panels.forEach((panel, index) => panel.setAttribute("aria-labelledby", tabButtons[index].id));

  function activateSection(index) {
    tabButtons.forEach((button, buttonIndex) => {
      const selected = index === buttonIndex;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      panels[buttonIndex].hidden = !selected;
    });
  }

  const learnPanel = panels[0];
  const objective = element("article", "guide-info-card");
  objective.append(element("h3", "", "What you'll learn"));
  appendList(objective, topic.objectives);
  const expected = element("article", "guide-info-card guide-info-highlight");
  expected.append(element("h3", "", "Expected result"));
  expected.append(element("p", "", topic.expected));
  const mistakes = element("article", "guide-info-card");
  mistakes.append(element("h3", "", "Common mistakes"));
  mistakes.append(element("p", "", topic.mistakes));
  const conceptGrid = element("div", "guide-info-grid");
  conceptGrid.append(objective, expected, mistakes);
  learnPanel.appendChild(conceptGrid);

  const practicePanel = panels[1];
  const scenario = element("div", "guide-scenario");
  scenario.append(element("span", "guide-eyebrow", "SAFE, FICTIONAL SCENARIO"), element("p", "", topic.scenario));
  const steps = element("article", "guide-info-card");
  steps.append(element("h3", "", "Step-by-step task"));
  appendList(steps, topic.steps, "ol");
  const example = element("article", "guide-example");
  example.append(element("h3", "", "Example / expected observation"), element("p", "", topic.example));
  practicePanel.append(scenario, steps, example);

  const checkPanel = panels[2];
  checkPanel.append(element("p", "guide-eyebrow", "QUICK KNOWLEDGE CHECK"), element("h3", "", topic.question));
  const fieldset = document.createElement("fieldset");
  fieldset.className = "guide-quiz-options";
  fieldset.appendChild(element("legend", "", "Choose one answer"));
  topic.choices.forEach((choice, index) => {
    const label = element("label", "guide-quiz-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `${topic.id}-answer`;
    input.value = String(index);
    label.append(input, element("span", "", choice));
    fieldset.appendChild(label);
  });
  const checkButton = element("button", "guide-check-button", "Check answer");
  checkButton.type = "button";
  const feedback = element("p", "guide-quiz-feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  checkButton.addEventListener("click", () => {
    const answer = fieldset.querySelector(`input[name="${topic.id}-answer"]:checked`);
    if (!answer) {
      feedback.textContent = "Choose an answer before checking.";
      feedback.dataset.result = "incomplete";
      return;
    }
    const correct = Number(answer.value) === topic.answer;
    feedback.textContent = `${correct ? "Correct." : "Not quite."} ${topic.explanation}`;
    feedback.dataset.result = correct ? "correct" : "incorrect";
    if (correct && !completed.includes(topic.id)) {
      completed.push(topic.id);
      saveCompleted();
      updateProgress();
    }
  });
  checkPanel.append(fieldset, checkButton, feedback);

  lessonHost.append(tabs, ...panels);
  activateSection(0);
}

search.addEventListener("input", () => renderTopicList(search.value));
window.addEventListener("hashchange", () => {
  const topic = topics.find(item => item.id === location.hash.slice(1));
  if (topic && topic.id !== activeTopic.id) {
    activeTopic = topic;
    renderTopicList(search.value);
    renderLesson(topic);
  }
});

renderTopicList();
renderLesson(activeTopic);
}
