"use strict";

const desktop = document;
const appWindowTemplate = desktop.getElementById("app-window-template");
const settingsWindow = desktop.getElementById("settings-window");
const notificationsWindow = desktop.getElementById("notifications-window");
const appsMenu = desktop.getElementById("apps-menu");
const settingsKey = "dorkops-os-settings";
const defaults = {
  wallpaper: "blue",
  tint: "blue",
  density: "comfortable",
  reducedMotion: false,
  googleMatchMode: "all",
  nmapScanType: "-sT",
  nmapTiming: "-T2",
  nmapTopPorts: false,
  passwordTool: "hydra"
};
const apps = {
  dorking: { title: "Google Dorking Lab", icon: "search", url: "dork-engine.html?embedded=1#p1", lab: 1 },
  images: { title: "Image Lookup", icon: "image", url: "dork-engine.html?embedded=1#p2", lab: 2 },
  nmap: { title: "Nmap Lab", icon: "network", url: "dork-engine.html?embedded=1#p3", lab: 3 },
  passwords: { title: "Password Tools", icon: "key-round", url: "dork-engine.html?embedded=1#p4", lab: 4 },
  operators: { title: "Search Operators", icon: "search", url: "search-operators.html?embedded=1" },
  "nmap-reference": { title: "Nmap Options", icon: "network", url: "nmap-reference.html?embedded=1" },
  "password-reference": { title: "Password Tool Options", icon: "book-open", url: "password-tools.html?embedded=1" },
  "kali-tools": { title: "Kali Tools", icon: "layout-grid", url: "kali-tools.html?embedded=1" }
};
const notifications = [
  {
    id: "project-star",
    title: "Enjoying Dork Ops? Star it on GitHub.",
    message: "A star helps others discover this project and encourages its continued development.",
    link: "STAR DORK OPS ON GITHUB"
  },
  {
    id: "project-contribute",
    title: "Everyone is welcome to contribute.",
    message: "Help improve the labs, references, accessibility, and documentation.",
    link: "CONTRIBUTE ON GITHUB"
  }
];
const lucidePaths = {
  settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  network: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  "key-round": '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  "book-open": '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'
};
let settings = readSettings();
let activeWorkspace = 1;
let zIndex = 10;
let maximized = new WeakMap();
let nextWindowId = 1;
const appWindows = [];

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    return {
      wallpaper: ["blue", "midnight", "violet"].includes(saved.wallpaper) ? saved.wallpaper : defaults.wallpaper,
      tint: ["blue", "teal", "violet"].includes(saved.tint) ? saved.tint : defaults.tint,
      density: ["comfortable", "compact"].includes(saved.density) ? saved.density : defaults.density,
      reducedMotion: saved.reducedMotion === true,
      googleMatchMode: ["all", "any"].includes(saved.googleMatchMode) ? saved.googleMatchMode : defaults.googleMatchMode,
      nmapScanType: ["-sT", "-sS", "-sU"].includes(saved.nmapScanType) ? saved.nmapScanType : defaults.nmapScanType,
      nmapTiming: ["-T2", "-T3"].includes(saved.nmapTiming) ? saved.nmapTiming : defaults.nmapTiming,
      nmapTopPorts: saved.nmapTopPorts === true,
      passwordTool: ["hydra", "john", "hashcat"].includes(saved.passwordTool) ? saved.passwordTool : defaults.passwordTool
    };
  } catch (error) {
    console.error("Could not read Dork Ops preferences.", error);
    return { ...defaults };
  }
}

function drawIcon(container, iconName, size) {
  const paths = lucidePaths[iconName];
  if (!paths) {
    console.error(`Unknown Lucide icon in Dork Ops desktop: ${iconName}`);
    return;
  }
  const svg = desktop.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size || 18));
  svg.setAttribute("height", String(size || 18));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = paths;
  container.replaceChildren(svg);
}

function applySettings() {
  desktop.body.dataset.wallpaper = settings.wallpaper;
  desktop.body.dataset.tint = settings.tint;
  desktop.body.dataset.density = settings.density;
  desktop.body.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  desktop.querySelectorAll("[data-setting]").forEach(field => {
    const value = settings[field.dataset.setting];
    if (field.type === "checkbox") field.checked = value === true;
    else field.value = value;
  });
}

desktop.querySelectorAll("[data-icon]").forEach(element => {
  element.setAttribute("aria-hidden", "true");
  drawIcon(element, element.dataset.icon, 18);
});

function persistSettings() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    applySettings();
    const status = desktop.getElementById("settings-status");
    if (status) status.textContent = "Saved on this device.";
  } catch (error) {
    console.error("Could not save Dork Ops preferences.", error);
    const status = desktop.getElementById("settings-status");
    if (status) status.textContent = "Could not save preferences in browser storage.";
  }
}

function postSettings(frame, resetScroll = false) {
  if (!frame?.contentWindow) {
    console.error("Cannot send preferences: the app window has no loaded frame.");
    return;
  }
  try {
    const targetOrigin = window.location.protocol === "file:" ? "*" : window.location.origin;
    frame.contentWindow.postMessage({ type: "dorkops:settings", settings, resetScroll }, targetOrigin);
  } catch (error) {
    console.error("Could not send preferences to the active lab.", error);
  }
}

function storedLabState(storageKey) {
  try {
    return localStorage.getItem(storageKey);
  } catch (error) {
    console.error("Could not inspect saved lab settings.", error);
    return "unavailable";
  }
}

function applyLabDefaults() {
  appWindows.forEach(entry => postSettings(entry.element.querySelector(".app-frame")));
  desktop.getElementById("settings-status").textContent =
    "Defaults sent to open apps. Existing saved lab workspaces are preserved.";
}

function focusWindow(win) {
  zIndex += 1;
  win.style.zIndex = String(zIndex);
}

function renderWorkspace() {
  desktop.querySelectorAll(".ws").forEach(button => {
    const selected = Number(button.dataset.workspace) === activeWorkspace;
    const openCount = appWindows.filter(entry => entry.workspace === Number(button.dataset.workspace)).length;
    button.classList.toggle("cur", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.title = `Workspace ${button.dataset.workspace}${openCount ? ` · ${openCount} open window${openCount === 1 ? "" : "s"}` : ""}`;
  });
  appWindows.forEach(entry => {
    const isCurrent = entry.workspace === activeWorkspace;
    entry.element.hidden = !isCurrent || entry.minimized;
    entry.element.classList.toggle("hide", entry.element.hidden);
  });
  const tasks = desktop.getElementById("tasks");
  tasks.replaceChildren();
  appWindows.filter(entry => entry.workspace === activeWorkspace).forEach(entry => {
    const siblings = appWindows.filter(item => item.workspace === activeWorkspace && item.appId === entry.appId);
    const label = siblings.length > 1 ? `${entry.title} · ${siblings.indexOf(entry) + 1}` : entry.title;
    const button = desktop.createElement("button");
    button.type = "button";
    button.className = `tk${entry.minimized ? " mn" : entry.element.style.zIndex === String(zIndex) ? " on" : ""}`;
    button.dataset.windowId = String(entry.id);
    button.title = label;
    button.setAttribute("aria-label", `${label}${entry.minimized ? " (minimized)" : ""}`);
    button.setAttribute("aria-pressed", String(!entry.minimized));
    const icon = desktop.createElement("span");
    icon.className = "task-icon";
    drawIcon(icon, entry.icon, 13);
    const caption = desktop.createElement("span");
    caption.textContent = label;
    button.append(icon, caption);
    button.addEventListener("click", () => {
      entry.minimized = false;
      renderWorkspace();
      focusWindow(entry.element);
      renderWorkspace();
    });
    tasks.appendChild(button);
  });
}

function showWindow(win) {
  win.hidden = false;
  win.classList.remove("hide");
  focusWindow(win);
}

function hideWindow(win) {
  win.hidden = true;
  win.classList.add("hide");
}

function toggleWindow(win) {
  if (win.hidden) showWindow(win);
  else hideWindow(win);
}

function openApp(id) {
  const app = apps[id];
  if (!app) {
    console.error(`Unknown Dork Ops app: ${id}`);
    return;
  }
  const instanceId = nextWindowId++;
  const win = appWindowTemplate.content.firstElementChild.cloneNode(true);
  const frame = win.querySelector(".app-frame");
  win.id = `app-window-${instanceId}`;
  win.dataset.app = id;
  win.dataset.workspace = String(activeWorkspace);
  win.querySelector("[data-window-title]").textContent = app.title;
  drawIcon(win.querySelector("[data-window-icon]"), app.icon, 17);
  frame.title = app.title;
  frame.addEventListener("load", () => postSettings(frame, true));
  const visibleWindows = appWindows.filter(entry => entry.workspace === activeWorkspace);
  const offset = visibleWindows.length % 8;
  const width = Math.max(280, Math.min(860, innerWidth - 16, Math.round(innerWidth * 0.76)));
  const top = Math.min(52 + offset * 24, Math.max(38, innerHeight - 240));
  const height = Math.max(220, Math.min(680, Math.round(innerHeight * 0.78), innerHeight - top - 8));
  win.style.width = `${width}px`;
  win.style.height = `${height}px`;
  win.style.left = `${Math.max(0, Math.min(innerWidth - width, 20 + offset * 28))}px`;
  win.style.top = `${top}px`;
  desktop.body.appendChild(win);
  const entry = { id: instanceId, appId: id, title: app.title, icon: app.icon, workspace: activeWorkspace, element: win, minimized: false };
  appWindows.push(entry);
  setupWindow(win, () => {
    const index = appWindows.indexOf(entry);
    if (index !== -1) appWindows.splice(index, 1);
    win.remove();
    renderWorkspace();
  });
  frame.src = app.url;
  desktop.querySelectorAll("#apps-menu [data-app]").forEach(button => {
    const selected = button.dataset.app === id;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-current", selected ? "page" : "false");
  });
  renderWorkspace();
  showWindow(win);
  renderWorkspace();
  desktop.getElementById("apps-toggle").setAttribute("aria-expanded", "false");
  appsMenu.hidden = true;
  const activeTask = desktop.querySelector(`[data-window-id="${instanceId}"]`);
  if (activeTask) activeTask.setAttribute("aria-current", "true");
}

function switchWorkspace(workspace) {
  if (!Number.isInteger(workspace) || workspace < 1 || workspace > 4) {
    console.error(`Invalid Dork Ops workspace: ${workspace}`);
    return;
  }
  activeWorkspace = workspace;
  renderWorkspace();
}

function updateClock() {
  const clock = desktop.getElementById("clock");
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderNotifications() {
  const list = desktop.getElementById("notification-list");
  const count = desktop.getElementById("notification-count");
  const visible = notifications;
  count.hidden = visible.length === 0;
  count.textContent = String(visible.length);
  list.replaceChildren();
  if (visible.length === 0) {
    const empty = desktop.createElement("p");
    empty.textContent = "You're all caught up.";
    list.appendChild(empty);
    return;
  }
  visible.forEach(item => {
    const card = desktop.createElement("article");
    card.className = "notification";
    const heading = desktop.createElement("strong");
    heading.textContent = item.title;
    const message = desktop.createElement("p");
    message.textContent = item.message;
    const footer = desktop.createElement("div");
    footer.className = "notification-actions";
    const link = desktop.createElement("a");
    link.href = "https://github.com/sheakrajuu/DORK-OPS";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.link;
    footer.append(link);
    card.append(heading, message, footer);
    list.appendChild(card);
  });
}

function setupWindow(win, closeWindow = null) {
  win.addEventListener("pointerdown", () => {
    focusWindow(win);
    if (win.matches(".app-window")) renderWorkspace();
  });
  win.querySelector("[data-min]").addEventListener("click", () => {
    const entry = appWindows.find(item => item.element === win);
    if (entry) {
      entry.minimized = true;
      renderWorkspace();
    } else {
      hideWindow(win);
    }
  });
  win.querySelector("[data-close]").addEventListener("click", () => {
    if (closeWindow) closeWindow();
    else hideWindow(win);
  });
  const resizeHandle = win.querySelector(".resize-handle");
  if (resizeHandle) {
    let resize = null;
    resizeHandle.addEventListener("pointerdown", event => {
      if (event.button !== 0 || win.classList.contains("max")) return;
      event.preventDefault();
      focusWindow(win);
      renderWorkspace();
      const rect = win.getBoundingClientRect();
      resize = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, left: rect.left, top: rect.top };
      resizeHandle.setPointerCapture(event.pointerId);
    });
    resizeHandle.addEventListener("pointermove", event => {
      if (!resize || !resizeHandle.hasPointerCapture(event.pointerId)) return;
      const minWidth = Math.min(280, innerWidth - resize.left);
      const minHeight = Math.min(220, innerHeight - resize.top);
      const maxWidth = Math.max(minWidth, innerWidth - resize.left);
      const maxHeight = Math.max(minHeight, innerHeight - resize.top);
      win.style.width = `${Math.max(minWidth, Math.min(maxWidth, resize.width + event.clientX - resize.x))}px`;
      win.style.height = `${Math.max(minHeight, Math.min(maxHeight, resize.height + event.clientY - resize.y))}px`;
    });
    const stopResize = event => {
      if (!resize) return;
      if (resizeHandle.hasPointerCapture(event.pointerId)) resizeHandle.releasePointerCapture(event.pointerId);
      resize = null;
      renderWorkspace();
    };
    resizeHandle.addEventListener("pointerup", stopResize);
    resizeHandle.addEventListener("pointercancel", stopResize);
    resizeHandle.addEventListener("keydown", event => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) || win.classList.contains("max")) return;
      event.preventDefault();
      const rect = win.getBoundingClientRect();
      const step = event.shiftKey ? 40 : 12;
      if (event.key === "ArrowLeft") win.style.width = `${Math.max(280, rect.width - step)}px`;
      if (event.key === "ArrowRight") win.style.width = `${Math.min(innerWidth - rect.left, rect.width + step)}px`;
      if (event.key === "ArrowUp") win.style.height = `${Math.max(220, rect.height - step)}px`;
      if (event.key === "ArrowDown") win.style.height = `${Math.min(innerHeight - rect.top, rect.height + step)}px`;
    });
  }
  const maximize = win.querySelector("[data-max]");
  maximize.addEventListener("click", () => {
    const previous = maximized.get(win);
    if (win.classList.contains("max")) {
      win.classList.remove("max");
      if (previous) Object.assign(win.style, previous);
      maximize.setAttribute("aria-pressed", "false");
    } else {
      maximized.set(win, {
        left: win.style.left,
        top: win.style.top,
        width: win.style.width,
        height: win.style.height
      });
      win.classList.add("max");
      maximize.setAttribute("aria-pressed", "true");
    }
    focusWindow(win);
    if (win.matches(".app-window")) renderWorkspace();
  });
  const title = win.querySelector(".title");
  title.addEventListener("dblclick", event => {
    if (!event.target.closest(".ctl")) maximize.click();
  });
  let drag = null;
  title.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest(".ctl") || win.classList.contains("max")) return;
    const rect = win.getBoundingClientRect();
    drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    title.setPointerCapture(event.pointerId);
  });
  title.addEventListener("pointermove", event => {
    if (!drag || !title.hasPointerCapture(event.pointerId)) return;
    const left = Math.max(0, Math.min(innerWidth - 90, drag.left + event.clientX - drag.x));
    const top = Math.max(38, Math.min(innerHeight - 40, drag.top + event.clientY - drag.y));
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    win.style.transform = "none";
  });
  const stopDrag = event => {
    if (!drag) return;
    if (title.hasPointerCapture(event.pointerId)) title.releasePointerCapture(event.pointerId);
    drag = null;
  };
  title.addEventListener("pointerup", stopDrag);
  title.addEventListener("pointercancel", stopDrag);
}

desktop.querySelectorAll(".win").forEach(win => setupWindow(win));
desktop.querySelectorAll("[data-app]").forEach(button => {
  if (button.tagName === "BUTTON") button.addEventListener("click", () => openApp(button.dataset.app));
});
desktop.querySelectorAll(".ws").forEach(button => button.addEventListener("click", () => switchWorkspace(Number(button.dataset.workspace))));

const appsToggle = desktop.getElementById("apps-toggle");
const closeAppsMenu = () => {
  appsMenu.hidden = true;
  appsToggle.setAttribute("aria-expanded", "false");
};
appsToggle.addEventListener("click", () => {
  appsMenu.hidden = !appsMenu.hidden;
  appsToggle.setAttribute("aria-expanded", String(!appsMenu.hidden));
});
appsMenu.querySelector(".launcher-close").addEventListener("click", () => {
  closeAppsMenu();
  appsToggle.focus();
});
appsMenu.querySelectorAll(".website-link").forEach(link => link.addEventListener("click", closeAppsMenu));
desktop.getElementById("settings-toggle").addEventListener("click", () => toggleWindow(settingsWindow));
desktop.getElementById("notifications-toggle").addEventListener("click", () => {
  toggleWindow(notificationsWindow);
  renderNotifications();
});
desktop.addEventListener("click", event => {
  if (!appsMenu.hidden && !appsMenu.contains(event.target) && !appsToggle.contains(event.target)) {
    closeAppsMenu();
  }
});
desktop.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAppsMenu();
    appsToggle.focus();
  }
});

desktop.querySelectorAll("[data-setting]").forEach(field => {
  const key = field.dataset.setting;
  field.addEventListener("change", () => {
    settings[key] = field.type === "checkbox" ? field.checked : field.value;
    persistSettings();
  });
});
desktop.getElementById("settings-reset").addEventListener("click", () => {
  settings = { ...defaults };
  persistSettings();
});
desktop.getElementById("settings-apply").addEventListener("click", applyLabDefaults);
window.addEventListener("message", event => {
  const isAppWindow = appWindows.some(entry => entry.element.querySelector(".app-frame").contentWindow === event.source);
  if (!isAppWindow || event.origin !== window.location.origin) return;
  if (event.data?.type === "dorkops:active-app") {
    const matching = Object.entries(apps).find(([, app]) => app.title === event.data.title);
    if (matching) openApp(matching[0]);
  }
});

applySettings();
renderNotifications();
updateClock();
window.setInterval(updateClock, 30_000);
if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  navigator.serviceWorker.register("./sw.js").catch(error => {
    console.error("Could not register Dork Ops offline support.", error);
  });
}
