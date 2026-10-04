"use strict";

const desktop = document;
const appWindowTemplate = desktop.getElementById("app-window-template");
const settingsWindow = desktop.getElementById("settings-window");
const notificationsWindow = desktop.getElementById("notifications-window");
const workspaceRenameDialog = desktop.getElementById("workspace-rename-dialog");
const workspaceRenameForm = desktop.getElementById("workspace-rename-form");
const workspaceNameInput = desktop.getElementById("workspace-name-input");
const appsMenu = desktop.getElementById("apps-menu");
const launcherBackdrop = desktop.getElementById("launcher-backdrop");
const settingsKey = "dorkops-os-settings";
const sessionKey = "dorkops-os-session";
const pinsKey = "dorkops-os-pinned-apps";
const recentsKey = "dorkops-os-recent-apps";
const dismissedNotificationsKey = "dorkops-os-dismissed-notifications";
const defaults = {
  wallpaper: "blue",
  tint: "blue",
  density: "comfortable",
  reducedMotion: false,
  googleMatchMode: "all",
  nmapScanType: "-sT",
  nmapTiming: "-T2",
  nmapTopPorts: false,
  passwordTool: "hydra",
  restoreSession: true
};
const apps = {
  dorking: { title: "Google Dorking Lab", icon: "scan-search", url: "dork-engine.html?embedded=1#p1", lab: 1 },
  images: { title: "Image Lookup", icon: "image", url: "dork-engine.html?embedded=1#p2", lab: 2 },
  nmap: { title: "Nmap Lab", icon: "radar", url: "dork-engine.html?embedded=1#p3", lab: 3 },
  passwords: { title: "Password Tools", icon: "key-round", url: "dork-engine.html?embedded=1#p4", lab: 4 },
  operators: { title: "Search Operators", icon: "list-filter", url: "search-operators.html?embedded=1" },
  "nmap-reference": { title: "Nmap Options", icon: "network", url: "nmap-reference.html?embedded=1" },
  "password-reference": { title: "Password Tool Options", icon: "book-open-check", url: "password-tools.html?embedded=1" },
  "kali-tools": { title: "Kali Tools", icon: "boxes", url: "kali-tools.html?embedded=1" }
};
const notifications = [
  {
    id: "project-star",
    title: "Enjoying Dork Ops? Star it on GitHub.",
    message: "A star helps others discover this project and encourages its continued development.",
    href: "https://github.com/sheakrajuu/DORK-OPS",
    link: "STAR DORK OPS ON GITHUB"
  },
  {
    id: "project-contribute",
    title: "Everyone is welcome to contribute.",
    message: "Help improve the labs, references, accessibility, and documentation.",
    href: "https://github.com/sheakrajuu/DORK-OPS",
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
  "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  "shield-check": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11"/><path d="m9 12 2 2 4-4"/>',
  "scan-search": '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="11" cy="11" r="3"/><path d="m16 16-2.2-2.2"/>',
  radar: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><path d="M12 12 18 6"/><circle cx="12" cy="12" r="1"/>',
  "list-filter": '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  "book-open-check": '<path d="M12 7v14"/><path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v8"/><path d="m16 19 2 2 4-4"/>',
  boxes: '<path d="M2.97 8.69a1 1 0 0 1 .55-.89l8-4a1 1 0 0 1 .9 0l8 4a1 1 0 0 1 .55.89v6.62a1 1 0 0 1-.55.89l-8 4a1 1 0 0 1-.9 0l-8-4a1 1 0 0 1-.55-.89z"/><path d="M3.27 8.5 12 13l8.73-4.5"/><path d="M12 22V13"/><path d="m7.5 6.5 9 4.5"/>'
};
let settings = readSettings();
let activeWorkspace = 1;
let zIndex = 10;
let maximized = new WeakMap();
let nextWindowId = 1;
const appWindows = [];
let workspaceNames = ["Workspace 1", "Workspace 2", "Workspace 3", "Workspace 4"];
let pinnedApps = readStoredIds(pinsKey);
let recentApps = readStoredIds(recentsKey).slice(0, 5);
let dismissedNotifications = readStoredIds(dismissedNotificationsKey);
let restoringSession = false;
let launcherOpener = null;
const focusReturn = new WeakMap();

function readStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
  } catch (error) {
    console.error(`Could not read saved Dork Ops data (${key}).`, error);
    return [];
  }
}

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    return {
      wallpaper: ["blue", "midnight", "violet"].includes(saved.wallpaper) ? saved.wallpaper : defaults.wallpaper,
      tint: ["blue", "teal", "violet"].includes(saved.tint) ? saved.tint : defaults.tint,
      density: ["comfortable", "compact"].includes(saved.density) ? saved.density : defaults.density,
      reducedMotion: saved.reducedMotion === true,
      restoreSession: saved.restoreSession !== false,
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
  launcherBackdrop.addEventListener("click", () => closeAppsMenu());
}

desktop.querySelectorAll("[data-icon]").forEach(element => {
  element.setAttribute("aria-hidden", "true");
  drawIcon(element, element.dataset.icon, 18);
});

function persistSettings() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    applySettings();
    if (!settings.restoreSession) {
      try {
        localStorage.removeItem(sessionKey);
      } catch (error) {
        console.error("Could not clear the saved desktop session.", error);
      }
    } else {
      saveSession();
    }
    const status = desktop.getElementById("settings-status");
    if (status) status.textContent = "Saved on this device.";
  } catch (error) {
    console.error("Could not save Dork Ops preferences.", error);
    const status = desktop.getElementById("settings-status");
    if (status) status.textContent = "Could not save preferences in browser storage.";
  }
}

function saveSession() {
  if (!settings.restoreSession || restoringSession) return;
  try {
    const session = {
      activeWorkspace,
      workspaceNames,
      windows: appWindows.map(entry => {
        const rect = entry.element.getBoundingClientRect();
        const dimension = (property, measured) => Number.parseFloat(entry.element.style[property]) || measured;
        return {
          appId: entry.appId,
          workspace: entry.workspace,
          left: Math.round(dimension("left", rect.left)),
          top: Math.round(dimension("top", rect.top)),
          width: Math.round(dimension("width", rect.width)),
          height: Math.round(dimension("height", rect.height)),
          minimized: entry.minimized,
          maximized: entry.element.classList.contains("max")
        };
      })
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
  } catch (error) {
    console.error("Could not save the Dork Ops desktop session.", error);
  }
}

function readSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(sessionKey) || "null");
    if (!saved || !Array.isArray(saved.windows)) return null;
    const names = Array.isArray(saved.workspaceNames) ? saved.workspaceNames : [];
    workspaceNames = workspaceNames.map((fallback, index) => {
      const name = names[index];
      return typeof name === "string" && name.trim() ? name.trim().slice(0, 24) : fallback;
    });
    return {
      activeWorkspace: Number.isInteger(saved.activeWorkspace) && saved.activeWorkspace >= 1 && saved.activeWorkspace <= 4
        ? saved.activeWorkspace : 1,
      windows: saved.windows.filter(item =>
        item && typeof item.appId === "string" && apps[item.appId] &&
        Number.isInteger(item.workspace) && item.workspace >= 1 && item.workspace <= 4
      ).slice(0, 24).map(item => ({
        appId: item.appId,
        workspace: item.workspace,
        left: Number.isFinite(item.left) ? Math.max(0, Math.min(innerWidth - 80, item.left)) : 20,
        top: Number.isFinite(item.top) ? Math.max(38, Math.min(innerHeight - 80, item.top)) : 48,
        width: Number.isFinite(item.width) ? Math.max(280, Math.min(innerWidth - 8, item.width)) : Math.max(280, innerWidth * 0.9),
        height: Number.isFinite(item.height) ? Math.max(220, Math.min(innerHeight - 46, item.height)) : Math.max(220, innerHeight * 0.88),
        minimized: item.minimized === true,
        maximized: item.maximized === true
      }))
    };
  } catch (error) {
    console.error("Could not restore the Dork Ops desktop session.", error);
    return null;
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
    const workspace = Number(button.dataset.workspace);
    const selected = workspace === activeWorkspace;
    const name = workspaceNames[workspace - 1];
    const openCount = appWindows.filter(entry => entry.workspace === workspace).length;
    button.classList.toggle("cur", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", `${name}${selected ? " (current)" : ""}`);
    button.title = `${name} · Double-click or press F2 to rename · ${openCount} open window${openCount === 1 ? "" : "s"}`;
    const label = button.querySelector(".workspace-name");
    if (label) label.textContent = name;
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
  if (!restoringSession) saveSession();
}

function showWindow(win) {
  win.hidden = false;
  win.classList.remove("hide");
  focusWindow(win);
  if (win.matches(".app-window")) {
    win.querySelector(".title").focus({ preventScroll: true });
    return;
  }
  const focusable = win.querySelector("input, select, button:not([data-min]):not([data-max]):not([data-close]), a[href]");
  if (focusable) focusable.focus({ preventScroll: true });
  else {
    const title = win.querySelector(".title");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
}

function hideWindow(win, restoreFocus = true) {
  win.hidden = true;
  win.classList.add("hide");
  const opener = focusReturn.get(win);
  if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
}

function toggleWindow(win, opener) {
  if (win.hidden) {
    if (opener) focusReturn.set(win, opener);
    showWindow(win);
  } else {
    hideWindow(win);
  }
}

function openApp(id, restored = null) {
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
  const workspace = restored?.workspace || activeWorkspace;
  win.dataset.workspace = String(workspace);
  win.querySelector("[data-window-title]").textContent = app.title;
  drawIcon(win.querySelector("[data-window-icon]"), app.icon, 17);
  const moveSelect = win.querySelector("[data-move-window]");
  workspaceNames.forEach((name, index) => {
    const option = desktop.createElement("option");
    option.value = String(index + 1);
    option.textContent = name;
    moveSelect.appendChild(option);
  });
  moveSelect.value = String(workspace);
  moveSelect.addEventListener("change", () => moveWindow(win, Number(moveSelect.value)));
  frame.title = app.title;
  frame.addEventListener("load", () => postSettings(frame, true));
  const visibleWindows = appWindows.filter(entry => entry.workspace === activeWorkspace);
  const offset = visibleWindows.length % 8;
  const width = Math.max(280, Math.min(1100, innerWidth - 16, Math.round(innerWidth * 0.9)));
  const top = Math.min(48 + offset * 20, Math.max(38, innerHeight - 240));
  const height = Math.max(220, Math.min(900, Math.round(innerHeight * 0.88), innerHeight - top - 8));
  win.style.width = `${restored?.width || width}px`;
  win.style.height = `${restored?.height || height}px`;
  win.style.left = `${restored?.left ?? Math.max(0, Math.min(innerWidth - width, 20 + offset * 28))}px`;
  win.style.top = `${restored?.top ?? top}px`;
  if (restored?.maximized) {
    maximized.set(win, { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height });
    win.classList.add("max");
    win.querySelector("[data-max]").setAttribute("aria-pressed", "true");
  }
  desktop.body.appendChild(win);
  const entry = {
    id: instanceId, appId: id, title: app.title, icon: app.icon, workspace,
    element: win, minimized: restored?.minimized === true
  };
  appWindows.push(entry);
  setupWindow(win, () => {
    const index = appWindows.indexOf(entry);
    if (index !== -1) appWindows.splice(index, 1);
    win.remove();
    renderWorkspace();
    appsToggle.focus({ preventScroll: true });
  });
  frame.src = app.url;
  if (!restored) recordRecentApp(id);
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
  launcherBackdrop.hidden = true;
  const activeTask = desktop.querySelector(`[data-window-id="${instanceId}"]`);
  if (activeTask) activeTask.setAttribute("aria-current", "true");
  if (!restored) win.querySelector(".title").focus({ preventScroll: true });
}

function moveWindow(win, workspace) {
  const entry = appWindows.find(item => item.element === win);
  if (!entry || !Number.isInteger(workspace) || workspace < 1 || workspace > 4) {
    console.error(`Could not move Dork Ops window to workspace ${workspace}.`);
    return;
  }
  entry.workspace = workspace;
  win.dataset.workspace = String(workspace);
  activeWorkspace = workspace;
  renderWorkspace();
  focusWindow(win);
  const status = desktop.getElementById("focus-status");
  status.textContent = `${entry.title} moved to ${workspaceNames[workspace - 1]}.`;
}

function saveAppIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch (error) {
    console.error(`Could not save Dork Ops app list (${key}).`, error);
  }
}

function recordRecentApp(id) {
  recentApps = [id, ...recentApps.filter(item => item !== id)].slice(0, 5);
  saveAppIds(recentsKey, recentApps);
  renderLauncherShortcuts();
}

function createAppTile(id) {
  const app = apps[id];
  const source = desktop.querySelector(`#apps-menu [data-app="${id}"]`);
  if (!app || !source) {
    console.error(`Could not create an application shortcut for ${id}.`);
    return null;
  }
  const wrapper = desktop.createElement("div");
  wrapper.className = "launcher-entry";
  const tile = desktop.createElement("button");
  tile.type = "button";
  tile.className = "launcher-tile";
  tile.dataset.app = id;
  const icon = desktop.createElement("span");
  icon.className = source.querySelector(".app-icon").className;
  icon.setAttribute("aria-hidden", "true");
  drawIcon(icon, app.icon, 18);
  const copy = desktop.createElement("span");
  copy.className = "launcher-copy";
  const title = desktop.createElement("strong");
  title.textContent = source.querySelector("strong").textContent;
  const description = desktop.createElement("small");
  description.textContent = source.querySelector("small").textContent;
  copy.append(title, description);
  tile.append(icon, copy);
  wrapper.append(tile);
  addPinButton(wrapper, id);
  wireAppTile(tile);
  return wrapper;
}

function wireAppTile(tile) {
  tile.addEventListener("click", () => {
    const id = tile.dataset.app;
    closeAppsMenu(false);
    openApp(id);
  });
}

function addPinButton(wrapper, id) {
  const pin = desktop.createElement("button");
  pin.type = "button";
  pin.className = "pin-toggle";
  pin.dataset.pin = id;
  pin.addEventListener("click", event => {
    event.stopPropagation();
    pinnedApps = pinnedApps.includes(id)
      ? pinnedApps.filter(item => item !== id)
      : [id, ...pinnedApps];
    saveAppIds(pinsKey, pinnedApps);
    renderLauncherShortcuts();
    updateLauncherFilter();
  });
  wrapper.append(pin);
  updatePinButton(pin);
}

function updatePinButton(button) {
  const pinned = pinnedApps.includes(button.dataset.pin);
  button.setAttribute("aria-pressed", String(pinned));
  button.setAttribute("aria-label", `${pinned ? "Unpin" : "Pin"} ${apps[button.dataset.pin].title}`);
  button.title = pinned ? "Unpin application" : "Pin application";
  button.textContent = pinned ? "★" : "☆";
}

function renderLauncherShortcuts() {
  const pinnedGroup = desktop.getElementById("pinned-group");
  const recentGroup = desktop.getElementById("recent-group");
  const pinnedList = pinnedApps.filter(id => apps[id]);
  const recentList = recentApps.filter(id => apps[id]);
  pinnedGroup.hidden = pinnedList.length === 0;
  recentGroup.hidden = recentList.length === 0;
  pinnedGroup.querySelector(".launcher-count").textContent = `${pinnedList.length} APP${pinnedList.length === 1 ? "" : "S"}`;
  recentGroup.querySelector(".launcher-count").textContent = `${recentList.length} APP${recentList.length === 1 ? "" : "S"}`;
  const fill = (container, ids) => {
    container.replaceChildren(...ids.map(createAppTile).filter(Boolean));
  };
  fill(desktop.getElementById("pinned-apps"), pinnedList);
  fill(desktop.getElementById("recent-apps"), recentList);
}

function updateLauncherFilter() {
  const query = desktop.getElementById("launcher-search").value.trim().toLocaleLowerCase();
  let matches = 0;
  appsMenu.querySelectorAll(".launcher-grid .launcher-entry").forEach(entry => {
    const visible = entry.textContent.toLocaleLowerCase().includes(query);
    entry.hidden = !visible;
    if (visible) matches += 1;
  });
  appsMenu.querySelectorAll(".launcher-grid .website-link").forEach(link => {
    const visible = link.textContent.toLocaleLowerCase().includes(query);
    link.hidden = !visible;
    if (visible) matches += 1;
  });
  appsMenu.querySelectorAll(".launcher-group:not(#pinned-group):not(#recent-group)").forEach(group => {
    group.hidden = !group.querySelector(".launcher-entry:not([hidden]), .website-link:not([hidden])");
  });
  desktop.getElementById("pinned-group").hidden =
    !desktop.querySelector("#pinned-apps .launcher-entry:not([hidden])");
  desktop.getElementById("recent-group").hidden =
    !desktop.querySelector("#recent-apps .launcher-entry:not([hidden])");
  const empty = desktop.getElementById("launcher-empty");
  empty.hidden = matches > 0;
}

function prepareLauncher() {
  appsMenu.querySelectorAll(".launcher-grid button[data-app]").forEach(tile => {
    const id = tile.dataset.app;
    const wrapper = desktop.createElement("div");
    wrapper.className = "launcher-entry";
    tile.parentNode.insertBefore(wrapper, tile);
    wrapper.append(tile);
    addPinButton(wrapper, id);
    wireAppTile(tile);
  });
  renderLauncherShortcuts();
  desktop.getElementById("launcher-search").addEventListener("input", updateLauncherFilter);
}

function switchWorkspace(workspace) {
  if (!Number.isInteger(workspace) || workspace < 1 || workspace > 4) {
    console.error(`Invalid Dork Ops workspace: ${workspace}`);
    return;
  }
  activeWorkspace = workspace;
  renderWorkspace();
}

function renameWorkspace(button) {
  const workspace = Number(button.dataset.workspace);
  workspaceBeingRenamed = workspace;
  workspaceNameInput.value = workspaceNames[workspace - 1];
  workspaceNameInput.setCustomValidity("");
  workspaceRenameDialog.showModal();
  workspaceNameInput.focus();
  workspaceNameInput.select();
}

let workspaceBeingRenamed = 0;
workspaceRenameForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = workspaceNameInput.value.trim().slice(0, 24);
  if (!name) {
    workspaceNameInput.setCustomValidity("Enter a workspace name.");
    workspaceNameInput.reportValidity();
    return;
  }
  workspaceNameInput.setCustomValidity("");
  const workspace = workspaceBeingRenamed;
  workspaceNames[workspace - 1] = name;
  appWindows.filter(entry => entry.workspace === workspace).forEach(entry => {
    const option = entry.element.querySelector(`[data-move-window] option[value="${workspace}"]`);
    if (option) option.textContent = name;
  });
  renderWorkspace();
  workspaceRenameDialog.close("save");
});
workspaceNameInput.addEventListener("input", () => workspaceNameInput.setCustomValidity(""));
desktop.getElementById("rename-cancel").addEventListener("click", () => workspaceRenameDialog.close("cancel"));

function updateClock() {
  const clock = desktop.getElementById("clock");
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderNotifications() {
  const list = desktop.getElementById("notification-list");
  const count = desktop.getElementById("notification-count");
  const visible = notifications.filter(item => !dismissedNotifications.includes(item.id));
  count.hidden = visible.length === 0;
  count.textContent = String(visible.length);
  count.setAttribute("aria-label", `${visible.length} active notification${visible.length === 1 ? "" : "s"}`);
  list.replaceChildren();
  if (visible.length === 0) {
    const empty = desktop.createElement("p");
    empty.textContent = "You're all caught up.";
    list.appendChild(empty);
    return;
  }
  const clear = desktop.createElement("button");
  clear.type = "button";
  clear.className = "btn notification-clear";
  clear.textContent = "Dismiss all";
  clear.addEventListener("click", () => {
    dismissedNotifications = notifications.map(item => item.id);
    saveAppIds(dismissedNotificationsKey, dismissedNotifications);
    renderNotifications();
    notificationsToggle.focus({ preventScroll: true });
  });
  list.append(clear);
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
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.link;
    footer.append(link);
    const dismiss = desktop.createElement("button");
    dismiss.type = "button";
    dismiss.className = "notification-dismiss";
    dismiss.setAttribute("aria-label", `Dismiss: ${item.title}`);
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => {
      dismissedNotifications = [...dismissedNotifications, item.id];
      saveAppIds(dismissedNotificationsKey, dismissedNotifications);
      renderNotifications();
      (list.querySelector(".notification-dismiss") || notificationsToggle).focus({ preventScroll: true });
    });
    card.append(heading, message, footer);
    card.append(dismiss);
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
      saveSession();
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
      saveSession();
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
    saveSession();
  });
  const title = win.querySelector(".title");
  title.addEventListener("dblclick", event => {
    if (!event.target.closest(".ctl,.move-control")) maximize.click();
  });
  let drag = null;
  title.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest(".ctl,.move-control") || win.classList.contains("max")) return;
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
    saveSession();
  };
  title.addEventListener("pointerup", stopDrag);
  title.addEventListener("pointercancel", stopDrag);
}

desktop.querySelectorAll(".win").forEach(win => setupWindow(win));
prepareLauncher();
desktop.querySelectorAll(".ws").forEach(button => {
  button.addEventListener("click", () => switchWorkspace(Number(button.dataset.workspace)));
  button.addEventListener("dblclick", () => renameWorkspace(button));
  button.addEventListener("keydown", event => {
    if (event.key === "F2") {
      event.preventDefault();
      renameWorkspace(button);
    }
  });
});

const appsToggle = desktop.getElementById("apps-toggle");
const closeAppsMenu = (restoreFocus = true) => {
  if (appsMenu.hidden) return;
  appsMenu.hidden = true;
  launcherBackdrop.hidden = true;
  appsToggle.setAttribute("aria-expanded", "false");
  if (restoreFocus && launcherOpener?.isConnected) launcherOpener.focus({ preventScroll: true });
  launcherOpener = null;
};
appsToggle.addEventListener("click", () => {
  appsMenu.hidden = !appsMenu.hidden;
  launcherBackdrop.hidden = appsMenu.hidden;
  appsToggle.setAttribute("aria-expanded", String(!appsMenu.hidden));
  if (!appsMenu.hidden) {
    launcherOpener = desktop.activeElement;
    desktop.getElementById("launcher-search").focus({ preventScroll: true });
    updateLauncherFilter();
  } else {
    launcherOpener = null;
  }
});
appsMenu.querySelector(".launcher-close").addEventListener("click", () => {
  closeAppsMenu();
});
appsMenu.querySelectorAll(".website-link").forEach(link => link.addEventListener("click", () => closeAppsMenu()));
const settingsToggle = desktop.getElementById("settings-toggle");
const notificationsToggle = desktop.getElementById("notifications-toggle");
const welcomeWindow = desktop.getElementById("welcome-window");
settingsToggle.addEventListener("click", () => toggleWindow(settingsWindow, settingsToggle));
notificationsToggle.addEventListener("click", () => {
  renderNotifications();
  toggleWindow(notificationsWindow, notificationsToggle);
});
function openWelcome(opener) {
  closeAppsMenu(false);
  focusReturn.set(welcomeWindow, opener);
  showWindow(welcomeWindow);
  try {
    localStorage.setItem("dorkops-welcome-seen", "true");
  } catch (error) {
    console.error("Could not save the welcome-screen preference.", error);
  }
}
desktop.getElementById("welcome-open").addEventListener("click", () => openWelcome(appsToggle));
desktop.getElementById("welcome-apps").addEventListener("click", () => {
  hideWindow(welcomeWindow, false);
  appsToggle.focus({ preventScroll: true });
  appsToggle.click();
});
desktop.addEventListener("click", event => {
  if (!appsMenu.hidden && !appsMenu.contains(event.target) && !appsToggle.contains(event.target)) {
    closeAppsMenu(false);
  }
});
desktop.addEventListener("keydown", event => {
  if (event.key === "Escape" && !appsMenu.hidden) {
    closeAppsMenu();
    event.preventDefault();
    return;
  }
  if (event.key === "Escape") {
    const openPanels = [welcomeWindow, notificationsWindow, settingsWindow]
      .filter(win => !win.hidden)
      .sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0));
    if (openPanels.length) {
      hideWindow(openPanels[0]);
      event.preventDefault();
    }
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
const savedSession = settings.restoreSession ? readSession() : null;
if (savedSession) {
  restoringSession = true;
  activeWorkspace = savedSession.activeWorkspace;
  savedSession.windows.forEach(item => openApp(item.appId, item));
  restoringSession = false;
}
renderWorkspace();
try {
  if (localStorage.getItem("dorkops-welcome-seen") !== "true") openWelcome(appsToggle);
} catch (error) {
  console.error("Could not read the welcome-screen preference.", error);
}
window.setInterval(updateClock, 30_000);
if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  navigator.serviceWorker.register("./sw.js").catch(error => {
    console.error("Could not register Dork Ops offline support.", error);
  });
}
