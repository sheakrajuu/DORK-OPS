"use strict";

const settingsStorageKey = "dorkops-os-settings";
const dismissedNotificationsKey = "dorkops-os-dismissed-notifications";
const defaultSettings = Object.freeze({
  wallpaper: "blue",
  tint: "blue",
  density: "comfortable",
  reducedMotion: false,
  notifications: true,
  googleMatchMode: "all",
  nmapScanType: "-sT",
  nmapTiming: "-T2",
  nmapTopPorts: false,
  passwordTool: "hydra"
});
const notificationItems = [
  {
    id: "project-star",
    title: "Enjoying Dork Ops? Star it on GitHub.",
    message: "A star helps others discover this project and encourages its continued development.",
    href: "https://github.com/sheakrajuu/DORK-OPS",
    linkText: "STAR DORK OPS ON GITHUB →"
  },
  {
    id: "project-contribute",
    title: "Everyone is welcome to contribute.",
    message: "Help improve the labs, references, accessibility, and documentation.",
    href: "https://github.com/sheakrajuu/DORK-OPS",
    linkText: "CONTRIBUTE ON GITHUB →"
  }
];

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsStorageKey) || "{}");
    return {
      wallpaper: ["blue", "midnight", "violet"].includes(saved.wallpaper) ? saved.wallpaper : defaultSettings.wallpaper,
      tint: ["blue", "teal", "violet"].includes(saved.tint) ? saved.tint : defaultSettings.tint,
      density: ["comfortable", "compact"].includes(saved.density) ? saved.density : defaultSettings.density,
      reducedMotion: saved.reducedMotion === true,
      notifications: saved.notifications !== false,
      googleMatchMode: ["all", "any"].includes(saved.googleMatchMode) ? saved.googleMatchMode : defaultSettings.googleMatchMode,
      nmapScanType: ["-sT", "-sS", "-sU"].includes(saved.nmapScanType) ? saved.nmapScanType : defaultSettings.nmapScanType,
      nmapTiming: ["-T2", "-T3"].includes(saved.nmapTiming) ? saved.nmapTiming : defaultSettings.nmapTiming,
      nmapTopPorts: saved.nmapTopPorts === true,
      passwordTool: ["hydra", "john", "hashcat"].includes(saved.passwordTool) ? saved.passwordTool : defaultSettings.passwordTool
    };
  } catch (error) {
    console.error("Could not read Dork Ops settings.", error);
    return { ...defaultSettings };
  }
}

let appSettings = loadSettings();

function makeSystemButton(label, className, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `system-button ${className || ""}`.trim();
  if (id) button.id = id;
  button.textContent = label;
  return button;
}

function createTopbar() {
  let topbar = document.querySelector(".dorkos-topbar");
  if (topbar) return topbar;

  topbar = document.createElement("header");
  topbar.className = "dorkos-topbar";
  const brand = document.createElement("a");
  brand.className = "dorkos-brand";
  brand.href = "dork-engine.html";
  brand.setAttribute("aria-label", "Dork Ops OS home");
  const logo = document.createElement("span");
  logo.className = "dorkos-logo";
  logo.setAttribute("aria-hidden", "true");
  logo.textContent = "DO";
  const name = document.createElement("span");
  const title = document.createElement("strong");
  title.textContent = "DORK OPS";
  const subtitle = document.createElement("small");
  subtitle.textContent = "SECURITY WORKSPACE";
  name.append(title, subtitle);
  brand.append(logo, name);
  const status = document.createElement("div");
  status.className = "dorkos-system-status";
  const dot = document.createElement("span");
  dot.className = "status-dot";
  status.append(dot, document.createTextNode(" LOCAL SESSION · AUTHORIZED USE ONLY"));
  const actions = document.createElement("div");
  actions.className = "dorkos-system-actions";
  const installButton = makeSystemButton("Install app", "install-button", "install-app");
  installButton.hidden = true;
  actions.appendChild(installButton);
  const clock = document.createElement("time");
  clock.id = "system-clock";
  clock.className = "system-clock";
  actions.appendChild(clock);
  topbar.append(brand, status, actions);

  const navigation = document.querySelector(".legacy-nav");
  if (navigation) navigation.before(topbar);
  else document.body.prepend(topbar);
  return topbar;
}

function createApplicationMenu(topbar) {
  let toggle = document.getElementById("applications-toggle");
  let menu = document.getElementById("applications-menu");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.id = "applications-toggle";
    toggle.type = "button";
    toggle.className = "applications-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "applications-menu");
    toggle.innerHTML = '<span class="applications-glyph" aria-hidden="true">◈</span><span>Applications</span>';
    const brand = topbar.querySelector(".dorkos-brand");
    brand.after(toggle);
  }
  if (!menu) {
    menu = document.createElement("section");
    menu.id = "applications-menu";
    menu.className = "applications-menu";
    menu.hidden = true;
    menu.setAttribute("aria-label", "Applications");
    const groups = [
      ["LABS", [
        ["Google Dorking Lab", "dork-engine.html#p1", "⌕"],
        ["Image Lookup", "dork-engine.html#p2", "▧"],
        ["Nmap Operators", "dork-engine.html#p3", "⌘"],
        ["Password Tools", "dork-engine.html#p4", "◇"]
      ]],
      ["LEARNING", [
        ["Linux & Security Field Guide", "field-guide.html", "▤"]
      ]],
      ["REFERENCE", [
        ["Search Operators", "search-operators.html", "⌗"],
        ["Nmap Operators", "dork-engine.html#p3", "≡"],
        ["Password Tool Options", "password-tools.html", "⚙"],
        ["Kali Tools", "kali-tools.html", "▦"]
      ]]
    ];
    groups.forEach(([heading, apps]) => {
      const group = document.createElement("div");
      group.className = "applications-group";
      const label = document.createElement("h2");
      label.textContent = heading;
      group.appendChild(label);
      apps.forEach(([name, href, icon]) => {
        const link = document.createElement("a");
        link.href = href;
        link.className = "application-item";
        const glyph = document.createElement("span");
        glyph.className = "application-item-icon";
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = icon;
        const title = document.createElement("span");
        title.textContent = name;
        link.append(glyph, title);
        group.appendChild(link);
      });
      menu.appendChild(group);
    });
    document.body.appendChild(menu);
  }

  const close = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !menu.hidden) {
      close();
      toggle.focus();
    }
  });
  document.addEventListener("click", event => {
    if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
}

function createWorkspaceBar(topbar) {
  const launcher = topbar.querySelector("#applications-toggle");
  const viewButtons = Array.from(document.querySelectorAll(".nav-btn[data-view]"));
  const workspaces = document.createElement("nav");
  workspaces.className = "workspace-switcher";
  workspaces.setAttribute("aria-label", "Lab workspaces");
  const names = ["Google Dorking Lab", "Image Lookup", "Nmap Operators", "Password Tools"];
  names.forEach((name, index) => {
    const view = index + 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workspace-button";
    button.textContent = String(view);
    button.title = name;
    button.setAttribute("aria-label", `Open ${name}`);
    button.setAttribute("aria-current", "false");
    button.addEventListener("click", () => {
      const target = viewButtons.find(item => Number(item.dataset.view) === view);
      if (target) {
        target.click();
        document.dispatchEvent(new Event("dorkops:restore-window"));
      } else {
        window.location.href = `dork-engine.html#p${view}`;
      }
    });
    workspaces.appendChild(button);
  });
  launcher.after(workspaces);
  document.querySelector(".sidebar")?.remove();

  const taskbar = document.createElement("div");
  taskbar.className = "taskbar-tasks";
  taskbar.setAttribute("aria-label", "Open app windows");
  const task = document.createElement("button");
  task.type = "button";
  task.className = "taskbar-task";
  task.id = "active-app-task";
  task.setAttribute("aria-pressed", "true");
  taskbar.appendChild(task);
  workspaces.after(taskbar);
}

function applySettings() {
  document.body.dataset.wallpaper = appSettings.wallpaper;
  document.body.dataset.tint = appSettings.tint;
  document.body.dataset.density = appSettings.density;
  document.body.dataset.motion = appSettings.reducedMotion ? "reduced" : "full";
  const notificationsButton = document.getElementById("notifications-toggle");
  if (notificationsButton) notificationsButton.hidden = !appSettings.notifications;
}

function saveSettings() {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(appSettings));
    applySettings();
    const status = document.getElementById("settings-save-status");
    if (status) status.textContent = "Preferences saved on this device.";
  } catch (error) {
    console.error("Could not save Dork Ops settings.", error);
    const status = document.getElementById("settings-save-status");
    if (status) status.textContent = "Could not save preferences. Check browser storage permissions.";
  }
}

function applyLabDefaults(force, selectedSettings = appSettings) {
  const applySelect = (id, value, storageKey) => {
    const field = document.getElementById(id);
    if (!field || (!force && localStorage.getItem(storageKey))) return;
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const applyCheckbox = (id, value, storageKey) => {
    const field = document.getElementById(id);
    if (!field || (!force && localStorage.getItem(storageKey))) return;
    field.checked = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };
  try {
    applySelect("keyword-match-mode", selectedSettings.googleMatchMode, "dorkops-workspace");
    applySelect("nmap-scan-type", selectedSettings.nmapScanType, "dorkops-nmap-lab");
    applySelect("nmap-timing", selectedSettings.nmapTiming, "dorkops-nmap-lab");
    applyCheckbox("nmap-top-ports", selectedSettings.nmapTopPorts, "dorkops-nmap-lab");
    applySelect("pw-tool", selectedSettings.passwordTool, "dorkops-password-lab");
  } catch (error) {
    console.error("Could not apply Dork Ops lab defaults.", error);
    const status = document.getElementById("settings-save-status");
    if (status) status.textContent = "Could not apply lab defaults. Check browser storage permissions.";
  }
}

function createSettings(topbar) {
  const actions = topbar.querySelector(".dorkos-system-actions");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "settings-toggle";
  toggle.className = "system-button settings-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "settings-panel");
  toggle.innerHTML = '<span aria-hidden="true">⚙</span><span>Settings</span>';
  actions.prepend(toggle);

  const panel = document.createElement("section");
  panel.id = "settings-panel";
  panel.className = "settings-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "settings-title");
  panel.innerHTML = `
    <header class="settings-header">
      <div><span class="settings-eyebrow">DORK OPS OS / PREFERENCES</span><h2 id="settings-title">Settings</h2></div>
      <button type="button" class="settings-close" aria-label="Close settings">×</button>
    </header>
    <div class="settings-content">
      <section class="settings-section">
        <h3>Desktop</h3>
        <div class="settings-fields">
          <label>Wallpaper
            <select data-setting="wallpaper">
              <option value="blue">Blue desktop</option><option value="midnight">Midnight</option><option value="violet">Violet dusk</option>
            </select>
          </label>
          <label>Interface tint
            <select data-setting="tint">
              <option value="blue">Ocean blue</option><option value="teal">Teal</option><option value="violet">Violet</option>
            </select>
          </label>
          <label>Interface density
            <select data-setting="density">
              <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
            </select>
          </label>
          <label class="settings-check"><input type="checkbox" data-setting="reducedMotion"><span>Reduce animation and motion</span></label>
          <label class="settings-check"><input type="checkbox" data-setting="notifications"><span>Show project notifications</span></label>
        </div>
      </section>
      <section class="settings-section">
        <h3>Google Dorking Lab</h3>
        <label>Default keyword matching
          <select data-setting="googleMatchMode"><option value="all">All terms (AND)</option><option value="any">Any term (OR)</option></select>
        </label>
      </section>
      <section class="settings-section">
        <h3>Nmap Operators</h3>
        <div class="settings-fields">
          <label>Default scan method
            <select data-setting="nmapScanType">
              <option value="-sT">TCP connect</option><option value="-sS">SYN (requires privileges)</option><option value="-sU">UDP</option>
            </select>
          </label>
          <label>Default timing
            <select data-setting="nmapTiming"><option value="-T2">T2 · considerate</option><option value="-T3">T3 · normal</option></select>
          </label>
          <label class="settings-check"><input type="checkbox" data-setting="nmapTopPorts"><span>Use top-100-port preset by default</span></label>
        </div>
      </section>
      <section class="settings-section">
        <h3>Password Tools Lab</h3>
        <label>Default tool
          <select data-setting="passwordTool">
            <option value="hydra">THC Hydra · local service lab</option>
            <option value="john">John the Ripper · offline audit</option>
            <option value="hashcat">Hashcat · offline audit</option>
          </select>
        </label>
      </section>
      <p class="settings-note">Preferences stay in this browser. App defaults do not change saved lab workspaces unless you choose “Apply defaults to apps”. Commands remain text-only and are never executed here.</p>
    </div>
    <footer class="settings-footer">
      <span id="settings-save-status" role="status" aria-live="polite"></span>
      <button type="button" class="btn" id="settings-reset">Restore defaults</button>
      <button type="button" class="btn settings-apply" id="settings-apply">Apply defaults to apps</button>
    </footer>`;
  document.body.appendChild(panel);

  panel.querySelectorAll("[data-setting]").forEach(field => {
    const name = field.dataset.setting;
    field.type === "checkbox" ? field.checked = appSettings[name] : field.value = appSettings[name];
    field.addEventListener("change", () => {
      appSettings = { ...appSettings, [name]: field.type === "checkbox" ? field.checked : field.value };
      saveSettings();
    });
  });
  applySettings();
  applyLabDefaults(false);

  const closeButton = panel.querySelector(".settings-close");
  const close = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  };
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) panel.querySelector("select").focus();
  });
  closeButton.addEventListener("click", close);
  panel.querySelector("#settings-reset").addEventListener("click", () => {
    appSettings = { ...defaultSettings };
    panel.querySelectorAll("[data-setting]").forEach(field => {
      field.type === "checkbox" ? field.checked = appSettings[field.dataset.setting] : field.value = appSettings[field.dataset.setting];
    });
    saveSettings();
  });
  panel.querySelector("#settings-apply").addEventListener("click", () => applyLabDefaults(true));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) close();
  });
  document.addEventListener("click", event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close();
  });
}

function createNotifications(topbar) {
  const actions = topbar.querySelector(".dorkos-system-actions");
  let toggle = document.getElementById("notifications-toggle");
  if (!toggle) {
    toggle = makeSystemButton("Notifications", "", "notifications-toggle");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "notifications-panel");
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "♧";
    const label = document.createElement("span");
    label.textContent = "Notifications";
    const badge = document.createElement("span");
    badge.className = "notification-count";
    badge.id = "notification-count";
    badge.hidden = true;
    toggle.replaceChildren(icon, label, badge);
    actions.prepend(toggle);
  }

  let panel = document.getElementById("notifications-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "notifications-panel";
    panel.className = "notifications-panel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "notifications-title");
    panel.setAttribute("aria-live", "polite");
    const heading = document.createElement("div");
    heading.className = "notifications-heading";
    const title = document.createElement("h2");
    title.id = "notifications-title";
    title.textContent = "Notifications";
    heading.append(title);
    const list = document.createElement("div");
    list.className = "notifications-list";
    list.id = "notifications-list";
    panel.append(heading, list);
    document.body.appendChild(panel);
  }
  return { toggle, panel };
}

function updateClock() {
  const clock = document.getElementById("system-clock");
  if (!clock) return;
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);
}

function renderNotifications() {
  const list = document.getElementById("notifications-list");
  const badge = document.getElementById("notification-count");
  if (!list || !badge) return;
  list.replaceChildren();
  let dismissed = [];
  try {
    const saved = JSON.parse(localStorage.getItem(dismissedNotificationsKey) || "[]");
    if (Array.isArray(saved)) dismissed = saved.filter(id => typeof id === "string");
  } catch (error) {
    console.error("Could not read dismissed Dork Ops notifications.", error);
  }
  const visible = notificationItems.filter(item => !dismissed.includes(item.id));
  badge.hidden = visible.length === 0;
  badge.textContent = String(visible.length);
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "notifications-empty";
    empty.textContent = dismissed.length ? "All notifications dismissed." : "You're all caught up.";
    list.appendChild(empty);
    if (dismissed.length) {
      const restore = document.createElement("button");
      restore.type = "button";
      restore.className = "notification-restore";
      restore.textContent = "Restore dismissed notifications";
      restore.addEventListener("click", () => {
        try {
          localStorage.removeItem(dismissedNotificationsKey);
        } catch (error) {
          console.error("Could not restore Dork Ops notifications.", error);
          restore.textContent = "Could not restore notifications";
          return;
        }
        renderNotifications();
      });
      list.appendChild(restore);
    }
    return;
  }

  visible.forEach(item => {
    const card = document.createElement("article");
    card.className = "notification-card";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "notification-card-dismiss";
    dismiss.setAttribute("aria-label", `Dismiss notification: ${item.title}`);
    dismiss.title = "Dismiss notification";
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => {
      try {
        localStorage.setItem(dismissedNotificationsKey, JSON.stringify([...dismissed, item.id]));
      } catch (error) {
        console.error("Could not save dismissed Dork Ops notification.", error);
        dismiss.textContent = "!";
        dismiss.title = "Could not save notification dismissal";
        return;
      }
      renderNotifications();
      const nextDismiss = list.querySelector(".notification-card-dismiss");
      if (nextDismiss) nextDismiss.focus({ preventScroll: true });
      else badge.focus({ preventScroll: true });
    });
    const title = document.createElement("h3");
    title.textContent = item.title;
    const message = document.createElement("p");
    message.textContent = item.message;
    const link = document.createElement("a");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.linkText;
    card.append(dismiss, title, message, link);
    list.appendChild(card);
  });
}

function setupNotificationControls(controls) {
  const { toggle, panel } = controls;
  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      closePanel();
      toggle.focus();
    }
  });
  document.addEventListener("click", event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) closePanel();
  });
}

function setupInstallPrompt() {
  const button = document.getElementById("install-app");
  if (!button) return;
  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });
  button.addEventListener("click", async () => {
    if (!installPrompt) {
      const message = window.matchMedia("(display-mode: standalone)").matches
        ? "Dork Ops is already installed."
        : "To install Dork Ops, use your browser's Install app option. Install is available over HTTPS or localhost.";
      button.textContent = message;
      window.setTimeout(() => { button.textContent = "Install app"; }, 4000);
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    button.hidden = true;
    button.textContent = "Installed";
  });
}

function setupServiceWorker() {
  if (!("serviceWorker" in navigator) || !["https:", "http:"].includes(window.location.protocol)) return;
  navigator.serviceWorker.register("./sw.js").catch(error => {
    console.error("Could not register the Dork Ops offline app.", error);
  });
}

function setupWindowTitle() {
  const appWindow = document.querySelector("main");
  if (!appWindow) return;
  let bar = appWindow.querySelector(".window-titlebar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "window-titlebar";
    const controls = document.createElement("span");
    controls.className = "window-controls";
    const controlDefinitions = [
      ["Minimize app window", "data-window-minimize"],
      ["Maximize app window", "data-window-maximize"],
      ["Close app window", "data-window-close"]
    ];
    controlDefinitions.forEach(([label, attribute]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute(attribute, "");
      button.setAttribute("aria-label", label);
      const mark = document.createElement("i");
      mark.setAttribute("aria-hidden", "true");
      button.appendChild(mark);
      controls.appendChild(button);
    });
    const appTitle = document.createElement("span");
    appTitle.className = "window-app-name";
    const context = document.createElement("span");
    context.className = "window-title-context";
    context.textContent = "DORK OPS OS";
    bar.append(controls, appTitle, context);
    appWindow.prepend(bar);
  }
  const title = bar.querySelector(".window-app-name");
  const currentView = document.getElementById("view-title");
  if (!title) return;
  const task = document.getElementById("active-app-task");
  let icon = bar.querySelector(".window-app-icon");
  if (!icon) {
    icon = document.createElement("span");
    icon.className = "window-app-icon";
    icon.setAttribute("aria-hidden", "true");
    bar.querySelector(".window-controls")?.after(icon);
  }
  const getApp = () => {
    if (currentView) {
      const apps = {
        "Google Dorking Lab": ["dorking", "⌕", "Google Dorking", "PUBLIC SEARCH / APP 01"],
        "Image Lookup": ["images", "▧", "Image Lookup", "VISUAL SEARCH / APP 02"],
        "Nmap Operators": ["nmap", "⌘", "Nmap Operators", "NETWORK MAPPING / APP 03"],
        "Password tools": ["passwords", "◇", "Password Audit", "LOCAL AUDIT / APP 04"]
      };
      return apps[currentView.textContent.trim()] || ["workspace", "◈", currentView.textContent.trim(), "DORK OPS / APPLICATION"];
    }
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith("search-operators.html")) return ["operators", "⌗", "Search Operators", "SEARCH REFERENCE / APP"];
    if (path.endsWith("nmap-reference.html")) return ["nmap", "⌘", "Nmap Operators", "NETWORK REFERENCE / APP"];
    if (path.endsWith("password-tools.html")) return ["passwords", "◇", "Password Tool Options", "AUDIT REFERENCE / APP"];
    if (path.endsWith("kali-tools.html")) return ["catalog", "▦", "Kali Tools Directory", "TOOL CATALOG / APP"];
    if (path.endsWith("about.html") || path.endsWith("terms.html")) return ["system", "◈", document.querySelector("main h1")?.textContent.trim() || "System information", "DORK OPS / SYSTEM"];
    return ["workspace", "◈", document.querySelector("main h1")?.textContent.trim() || "Workspace", "DORK OPS / WORKSPACE"];
  };
  const update = () => {
    const [app, glyph, appTitle] = getApp();
    const heading = currentView || document.querySelector("main h1");
    title.textContent = appTitle || heading?.textContent.trim() || "Workspace";
    icon.textContent = glyph;
    document.body.dataset.activeApp = app;
    const appLabel = appTitle || heading?.textContent.trim() || "Workspace";
    if (task) task.textContent = appLabel;
    document.querySelectorAll(".workspace-button").forEach((button, index) => {
      const active = currentView && Number(currentView.closest("section")?.id.slice(1)) === index + 1;
      button.setAttribute("aria-current", String(Boolean(active)));
      button.classList.toggle("active", Boolean(active));
    });
  };
  update();
  if (currentView) new MutationObserver(update).observe(currentView, { childList: true, characterData: true, subtree: true });

  const minimize = bar.querySelector("[data-window-minimize]");
  const maximize = bar.querySelector("[data-window-maximize]");
  const close = bar.querySelector("[data-window-close]");
  const taskButton = document.getElementById("active-app-task");
  const updateTask = () => {
    if (!taskButton) return;
    taskButton.setAttribute("aria-pressed", String(!appWindow.hidden));
    taskButton.classList.toggle("minimized", appWindow.hidden);
  };
  const restore = () => {
    appWindow.hidden = false;
    appWindow.classList.remove("window-maximized", "window-minimized");
    if (maximize) maximize.setAttribute("aria-pressed", "false");
    updateTask();
  };
  document.addEventListener("dorkops:restore-window", restore);
  taskButton?.addEventListener("click", () => {
    if (appWindow.hidden) {
      restore();
      return;
    }
    appWindow.hidden = true;
    appWindow.classList.add("window-minimized");
    appWindow.classList.remove("window-maximized");
    if (maximize) maximize.setAttribute("aria-pressed", "false");
    updateTask();
  });
  minimize?.addEventListener("click", () => {
    appWindow.hidden = true;
    appWindow.classList.add("window-minimized");
    appWindow.classList.remove("window-maximized");
    if (maximize) maximize.setAttribute("aria-pressed", "false");
    updateTask();
    taskButton?.focus();
  });
  close?.addEventListener("click", () => {
    appWindow.hidden = true;
    appWindow.classList.remove("window-minimized", "window-maximized");
    if (maximize) maximize.setAttribute("aria-pressed", "false");
    updateTask();
    taskButton?.focus();
  });
  maximize?.addEventListener("click", () => {
    const isMaximized = appWindow.classList.toggle("window-maximized");
    maximize.setAttribute("aria-pressed", String(isMaximized));
  });

  document.querySelectorAll(".nav-btn[data-view]").forEach(button => button.addEventListener("click", restore));
  document.querySelectorAll("[data-launch-view]").forEach(button => button.addEventListener("click", restore));
  document.querySelectorAll("#applications-menu a, .desktop-dock a").forEach(link => {
    if (link.href.includes("dork-engine.html")) link.addEventListener("click", restore);
  });
  window.addEventListener("hashchange", restore);
  appWindow.addEventListener("pointerdown", () => { appWindow.style.zIndex = "15"; });

  let dragOrigin = null;
  bar.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("button") || appWindow.classList.contains("window-maximized")) return;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(appWindow).transform);
    dragOrigin = { x: event.clientX, y: event.clientY, baseX: matrix.m41, baseY: matrix.m42 };
    bar.setPointerCapture(event.pointerId);
  });
  bar.addEventListener("pointermove", event => {
    if (!dragOrigin || !bar.hasPointerCapture(event.pointerId)) return;
    const x = Math.max(-appWindow.offsetWidth + 100, Math.min(window.innerWidth - 100, dragOrigin.baseX + event.clientX - dragOrigin.x));
    const y = Math.max(0, Math.min(window.innerHeight - 44, dragOrigin.baseY + event.clientY - dragOrigin.y));
    appWindow.style.transform = `translate(${x}px, ${y}px)`;
  });
  const stopDragging = event => {
    if (!dragOrigin) return;
    if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
    dragOrigin = null;
  };
  bar.addEventListener("pointerup", stopDragging);
  bar.addEventListener("pointercancel", stopDragging);
}

const embeddedApp = new URLSearchParams(window.location.search).get("embedded") === "1" && window.parent !== window;
if (embeddedApp) {
  document.documentElement.classList.add("embedded-app");
  document.body.classList.add("embedded-app");
  window.history.scrollRestoration = "manual";
  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.data?.type !== "dorkops:settings") return;
    if (!event.data.settings || typeof event.data.settings !== "object") {
      console.error("Received invalid Dork Ops lab preferences.");
      return;
    }
    applyLabDefaults(false, event.data.settings);
    if (event.data.resetScroll === true) {
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    }
  });
} else {
  const topbar = createTopbar();
  createApplicationMenu(topbar);
  createWorkspaceBar(topbar);
  createSettings(topbar);
  const notificationControls = createNotifications(topbar);
  setupNotificationControls(notificationControls);
  setupInstallPrompt();
  setupServiceWorker();
  setupWindowTitle();
  renderNotifications();
  updateClock();
  window.setInterval(updateClock, 30000);
}
