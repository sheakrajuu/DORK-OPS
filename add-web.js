"use strict";

const WEBSITE_STORAGE_KEY = "dorkops-saved-websites";
const websiteForm = document.getElementById("website-form");
const websiteName = document.getElementById("website-name");
const websiteUrl = document.getElementById("website-url");
const websiteDescription = document.getElementById("website-description");
const websiteList = document.getElementById("website-list");
const websiteCount = document.getElementById("website-count");
const websiteStatus = document.getElementById("website-status");
const websiteSubmit = document.getElementById("website-submit");
const websiteCancel = document.getElementById("website-cancel");
let websites = [];
let editingId = null;

function setWebsiteStatus(message, state = "") {
  websiteStatus.textContent = message;
  if (state) websiteStatus.dataset.state = state;
  else delete websiteStatus.dataset.state;
}

function validateWebsiteUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    return null;
  }
  return parsed.href;
}

function loadWebsites() {
  try {
    const stored = JSON.parse(localStorage.getItem(WEBSITE_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored) || stored.some(site =>
      !site || typeof site.id !== "string" || typeof site.name !== "string" ||
      typeof site.url !== "string" || typeof site.description !== "string" ||
      !validateWebsiteUrl(site.url)
    )) {
      throw new TypeError("Saved website data is not in the expected format.");
    }
    websites = stored;
    renderWebsites();
  } catch (error) {
    websites = [];
    renderWebsites();
    setWebsiteStatus("Saved websites could not be loaded. Browser storage may be unavailable or contain invalid data.", "error");
    console.error("Could not load saved website shortcuts.", error);
  }
}

function saveWebsites(nextWebsites) {
  try {
    localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(nextWebsites));
  } catch (error) {
    setWebsiteStatus("Could not save changes to this browser. Check available storage and try again.", "error");
    console.error("Could not save website shortcuts.", error);
    return false;
  }
  websites = nextWebsites;
  renderWebsites();
  notifyDesktop();
  setWebsiteStatus(editingId ? "Website shortcut updated." : "Website shortcut saved.", "success");
  return true;
}

function notifyDesktop() {
  if (window.parent === window || window.location.origin === "null") return;
  window.parent.postMessage({ type: "dorkops:websites-changed" }, window.location.origin);
}

function makeWebsiteButton(label, className, action, siteId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `web-button ${className}`;
  button.textContent = label;
  button.addEventListener("click", () => action(siteId));
  return button;
}

function renderWebsites() {
  websiteList.replaceChildren();
  websiteCount.textContent = `(${websites.length})`;
  if (websites.length === 0) {
    const empty = document.createElement("p");
    empty.className = "web-empty";
    empty.textContent = "No shortcuts saved yet. Add a website to see it here and in the Application Center.";
    websiteList.appendChild(empty);
    return;
  }
  websites.forEach(site => {
    const card = document.createElement("article");
    card.className = "web-site";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = site.name;
    const link = document.createElement("a");
    link.href = validateWebsiteUrl(site.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = site.url;
    const description = document.createElement("p");
    description.textContent = site.description;
    details.append(title, link);
    if (site.description) details.appendChild(description);
    const actions = document.createElement("div");
    actions.className = "web-site-actions";
    actions.append(
      makeWebsiteButton("Edit", "subtle", editWebsite, site.id),
      makeWebsiteButton("Remove", "danger", removeWebsite, site.id)
    );
    card.append(details, actions);
    websiteList.appendChild(card);
  });
}

function resetForm() {
  editingId = null;
  websiteForm.reset();
  websiteSubmit.textContent = "Save website";
  websiteCancel.hidden = true;
  document.getElementById("web-form-title").textContent = "Add a website";
  document.getElementById("web-form-description").textContent =
    "Save a name and a secure web address. Only HTTP and HTTPS links are accepted.";
}

function editWebsite(id) {
  const site = websites.find(item => item.id === id);
  if (!site) {
    setWebsiteStatus("That website shortcut is no longer available. Refresh the list and try again.", "error");
    return;
  }
  editingId = id;
  websiteName.value = site.name;
  websiteUrl.value = site.url;
  websiteDescription.value = site.description;
  websiteSubmit.textContent = "Update website";
  websiteCancel.hidden = false;
  document.getElementById("web-form-title").textContent = "Edit website";
  document.getElementById("web-form-description").textContent = "Update the saved shortcut details.";
  websiteName.focus();
}

function removeWebsite(id) {
  const site = websites.find(item => item.id === id);
  if (!site) {
    setWebsiteStatus("That website shortcut is no longer available. Refresh the list and try again.", "error");
    return;
  }
  const nextWebsites = websites.filter(item => item.id !== id);
  if (saveWebsites(nextWebsites)) {
    if (editingId === id) resetForm();
    setWebsiteStatus(`Removed "${site.name}".`, "success");
  }
}

websiteForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = websiteName.value.trim();
  const url = validateWebsiteUrl(websiteUrl.value.trim());
  const description = websiteDescription.value.trim();
  if (!name) {
    setWebsiteStatus("Enter a name for this website.", "error");
    websiteName.focus();
    return;
  }
  if (!url) {
    setWebsiteStatus("Enter a valid HTTP or HTTPS URL without embedded credentials.", "error");
    websiteUrl.focus();
    return;
  }
  const duplicate = websites.some(site => site.id !== editingId && site.url === url);
  if (duplicate) {
    setWebsiteStatus("That URL is already in your saved websites.", "error");
    websiteUrl.focus();
    return;
  }
  const current = websites.find(site => site.id === editingId);
  const site = {
    id: current?.id || (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: name.slice(0, 80),
    url,
    description: description.slice(0, 160)
  };
  const nextWebsites = editingId
    ? websites.map(item => item.id === editingId ? site : item)
    : [...websites, site];
  if (saveWebsites(nextWebsites)) resetForm();
});

websiteCancel.addEventListener("click", () => {
  resetForm();
  setWebsiteStatus("Edit canceled.");
});

window.addEventListener("storage", event => {
  if (event.key === WEBSITE_STORAGE_KEY) loadWebsites();
});

loadWebsites();
