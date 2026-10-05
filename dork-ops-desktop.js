"use strict";

const desktop = document;
const appWindowTemplate = desktop.getElementById("app-window-template");
const settingsWindow = desktop.getElementById("settings-window");
const notificationsWindow = desktop.getElementById("notifications-window");
const appsToggle = desktop.getElementById("apps-toggle");
const settingsKey = "dorkops-os-settings";
const sessionKey = "dorkops-os-session";
const defaults = {
  wallpaper: "midnight",
  tint: "violet",
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
  terminal: { title: "Dork Ops Terminal", icon: "terminal", url: "terminal.html?embedded=1" }
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
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
  settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  "shield-check": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11"/><path d="m9 12 2 2 4-4"/>'
};
let settings = readSettings();
let zIndex = 10;
let maximized = new WeakMap();
let nextWindowId = 1;
const appWindows = [];
let restoringSession = false;
const focusReturn = new WeakMap();

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
      windows: appWindows.map(entry => {
        const rect = entry.element.getBoundingClientRect();
        const dimension = (property, measured) => Number.parseFloat(entry.element.style[property]) || measured;
        return {
          appId: entry.appId,
          sessionId: entry.sessionId,
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
    return {
      windows: saved.windows.filter(item =>
        item && typeof item.appId === "string" && apps[item.appId]
      ).slice(0, 24).map(item => ({
        appId: item.appId,
        sessionId: typeof item.sessionId === "string" && /^[a-z0-9-]{1,80}$/i.test(item.sessionId)
          ? item.sessionId
          : createSessionId(),
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

function createSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
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
    "Defaults sent to open Terminal windows.";
}

function focusWindow(win) {
  zIndex += 1;
  win.style.zIndex = String(zIndex);
}

function renderWindows() {
  appWindows.forEach(entry => {
    entry.element.hidden = entry.minimized;
    entry.element.classList.toggle("hide", entry.element.hidden);
  });
  const tasks = desktop.getElementById("tasks");
  tasks.replaceChildren();
  appWindows.forEach(entry => {
    const siblings = appWindows.filter(item => item.appId === entry.appId);
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
      renderWindows();
      focusWindow(entry.element);
      renderWindows();
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
  const sessionId = restored?.sessionId || createSessionId();
  const win = appWindowTemplate.content.firstElementChild.cloneNode(true);
  const frame = win.querySelector(".app-frame");
  win.id = `app-window-${instanceId}`;
  win.dataset.app = id;
  win.querySelector("[data-window-title]").textContent = app.title;
  drawIcon(win.querySelector("[data-window-icon]"), app.icon, 17);
  frame.title = app.title;
  frame.addEventListener("load", () => postSettings(frame, true));
  const visibleWindows = appWindows;
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
    id: instanceId, appId: id, title: app.title, icon: app.icon,
    element: win, minimized: restored?.minimized === true, sessionId
  };
  appWindows.push(entry);
  setupWindow(win, () => {
    const index = appWindows.indexOf(entry);
    if (index !== -1) appWindows.splice(index, 1);
    win.remove();
    renderWindows();
    appsToggle.focus({ preventScroll: true });
  });
  const appUrl = new URL(app.url, window.location.href);
  appUrl.searchParams.set("sessionId", sessionId);
  frame.src = appUrl.href;
  renderWindows();
  showWindow(win);
  renderWindows();
  const activeTask = desktop.querySelector(`[data-window-id="${instanceId}"]`);
  if (activeTask) activeTask.setAttribute("aria-current", "true");
  if (!restored) win.querySelector(".title").focus({ preventScroll: true });
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
  count.hidden = notifications.length === 0;
  count.textContent = String(notifications.length);
  count.setAttribute("aria-label", `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`);
  list.replaceChildren();
  notifications.forEach(item => {
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
    card.append(heading, message, footer);
    list.appendChild(card);
  });
}

function setupWindow(win, closeWindow = null) {
  win.addEventListener("pointerdown", () => {
    focusWindow(win);
    if (win.matches(".app-window")) renderWindows();
  });
  win.querySelector("[data-min]").addEventListener("click", () => {
    const entry = appWindows.find(item => item.element === win);
    if (entry) {
      entry.minimized = true;
      renderWindows();
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
      renderWindows();
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
      renderWindows();
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
    if (win.matches(".app-window")) renderWindows();
    saveSession();
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
    saveSession();
  };
  title.addEventListener("pointerup", stopDrag);
  title.addEventListener("pointercancel", stopDrag);
}

desktop.querySelectorAll(".win").forEach(win => setupWindow(win));
appsToggle.addEventListener("click", () => openApp("terminal"));
const settingsToggle = desktop.getElementById("settings-toggle");
const notificationsToggle = desktop.getElementById("notifications-toggle");
settingsToggle.addEventListener("click", () => toggleWindow(settingsWindow, settingsToggle));
notificationsToggle.addEventListener("click", () => {
  renderNotifications();
  toggleWindow(notificationsWindow, notificationsToggle);
});
desktop.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const openPanels = [notificationsWindow, settingsWindow]
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
  if (event.data?.type === "dorkops:open-app") {
    if (typeof event.data.appId === "string" && Object.prototype.hasOwnProperty.call(apps, event.data.appId)) {
      openApp(event.data.appId);
    }
    return;
  }
});

applySettings();
renderNotifications();
updateClock();
const savedSession = settings.restoreSession ? readSession() : null;
let restoredTerminalCount = 0;
if (savedSession) {
  restoringSession = true;
  savedSession.windows.forEach(item => {
    if (item.appId === "terminal") {
      openApp(item.appId, item);
      restoredTerminalCount += 1;
    }
  });
  restoringSession = false;
}
if (restoredTerminalCount === 0) openApp("terminal");
renderWindows();
window.setInterval(updateClock, 30_000);
if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  navigator.serviceWorker.register("./sw.js").catch(error => {
    console.error("Could not register Dork Ops offline support.", error);
  });
}
