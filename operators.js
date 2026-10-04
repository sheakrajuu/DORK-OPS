"use strict";

async function copyQuery(text, button) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (clipboardError) {
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.appendChild(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    if (!copied) {
      button.textContent = "Copy failed";
      button.setAttribute("aria-live", "polite");
      console.error("Clipboard copy failed.", clipboardError);
      window.setTimeout(() => { button.textContent = original; }, 1800);
      return;
    }
  }
  button.textContent = "Copied";
  button.setAttribute("aria-live", "polite");
  window.setTimeout(() => { button.textContent = original; }, 1200);
}

document.querySelectorAll(".operator-query").forEach(row => {
  const query = row.querySelector("code").textContent.trim();
  const searchLink = row.querySelector(".search-query");
  if (searchLink) {
    const imageSearch = searchLink.textContent.includes("Images");
    const newsSearch = searchLink.textContent.includes("News");
    searchLink.href = newsSearch
      ? `https://news.google.com/search?q=${encodeURIComponent(query)}`
      : `https://www.google.com/search?${imageSearch ? "tbm=isch&" : ""}q=${encodeURIComponent(query)}`;
  }
  row.querySelector(".copy-query").addEventListener("click", event => {
    copyQuery(query, event.currentTarget);
  });
});

const operatorCount = document.getElementById("operator-count");
const operatorCards = Array.from(document.querySelectorAll(".operator-card"));
const operatorSearch = document.getElementById("operator-search");
const operatorStatusFilter = document.getElementById("operator-status-filter");
const operatorFilterReset = document.getElementById("operator-filter-reset");
const operatorFavoritesToggle = document.getElementById("operator-favorites-toggle");
const operatorEmpty = document.getElementById("operator-empty");
const operatorStorageStatus = document.getElementById("operator-storage-status");
const FAVORITES_STORAGE_KEY = "dorkops-operator-favorites";
const favoriteKeys = new Set();
let favoritesOnly = false;

function readOperatorFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored) || stored.some(key => typeof key !== "string")) {
      throw new TypeError("Saved favorites have an invalid format.");
    }
    stored.forEach(key => favoriteKeys.add(key));
    return true;
  } catch (error) {
    operatorStorageStatus.textContent = "Could not load saved favorites on this device.";
    console.error("Could not load saved operator favorites.", error);
    return false;
  }
}

function saveOperatorFavorites() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteKeys)));
    operatorStorageStatus.textContent = "Favorites saved on this device.";
    return true;
  } catch (error) {
    operatorStorageStatus.textContent = "Could not save favorites on this device; changes will last only for this visit.";
    console.error("Could not save operator favorites.", error);
    return false;
  }
}

function updateFavoriteButton(card, button, key) {
  const isFavorite = favoriteKeys.has(key);
  button.textContent = isFavorite ? "★ Saved" : "☆ Save";
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${key} ${isFavorite ? "from" : "to"} favorites`);
  card.classList.toggle("is-favorite", isFavorite);
}

readOperatorFavorites();

operatorCards.forEach(card => {
  const key = Array.from(card.querySelectorAll(".operator-title > code"))
    .map(code => code.textContent.trim())
    .join(" ")
    .toLocaleLowerCase();
  const button = document.createElement("button");
  button.className = "operator-favorite";
  button.type = "button";
  button.addEventListener("click", () => {
    if (favoriteKeys.has(key)) favoriteKeys.delete(key);
    else favoriteKeys.add(key);
    updateFavoriteButton(card, button, key);
    saveOperatorFavorites();
    filterOperators();
  });
  card.querySelector(".operator-title").appendChild(button);
  updateFavoriteButton(card, button, key);
});

function filterOperators() {
  const query = operatorSearch.value.trim().toLocaleLowerCase();
  const status = operatorStatusFilter.value;
  let visibleCount = 0;
  const favoriteCount = favoriteKeys.size;

  operatorCards.forEach(card => {
    const statusBadge = card.querySelector(".operator-status");
    const key = Array.from(card.querySelectorAll(".operator-title > code"))
      .map(code => code.textContent.trim())
      .join(" ")
      .toLocaleLowerCase();
    const matchesStatus = status === "all" || statusBadge.classList.contains(status);
    const matchesQuery = !query || card.textContent.toLocaleLowerCase().includes(query);
    const matchesFavorite = !favoritesOnly || favoriteKeys.has(key);
    const visible = matchesStatus && matchesQuery && matchesFavorite;
    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  document.querySelectorAll(".operator-section").forEach(section => {
    section.hidden = !section.querySelector(".operator-card:not([hidden])");
  });
  operatorCount.textContent = `${visibleCount} of ${operatorCards.length} entries · ${favoriteCount} favorites`;
  operatorEmpty.hidden = visibleCount !== 0;
}

operatorSearch.addEventListener("input", filterOperators);
operatorStatusFilter.addEventListener("change", filterOperators);
operatorFavoritesToggle.addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  operatorFavoritesToggle.setAttribute("aria-pressed", String(favoritesOnly));
  operatorFavoritesToggle.textContent = favoritesOnly ? "Showing favorites" : "Show favorites";
  filterOperators();
});
operatorFilterReset.addEventListener("click", () => {
  operatorSearch.value = "";
  operatorStatusFilter.value = "all";
  favoritesOnly = false;
  operatorFavoritesToggle.setAttribute("aria-pressed", "false");
  operatorFavoritesToggle.textContent = "Show favorites";
  filterOperators();
  operatorSearch.focus();
});
filterOperators();

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
