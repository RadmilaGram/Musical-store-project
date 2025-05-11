// src/store/persist.js

// Какие куски стейта мы хотим сохранить
const PERSISTED_KEYS = ["auth", "tradeIn", "cart"];

// Загрузить из localStorage весь сохранённый state
export function loadState() {
  try {
    const serialized = localStorage.getItem("appState");
    if (!serialized) return undefined;
    return JSON.parse(serialized);
  } catch (err) {
    console.warn("Не удалось загрузить state:", err);
    return undefined;
  }
}

// Сохранить в localStorage только нужные куски
export function saveState(state) {
  try {
    const toSave = {};
    PERSISTED_KEYS.forEach((key) => {
      toSave[key] = state[key];
    });
    localStorage.setItem("appState", JSON.stringify(toSave));
  } catch (err) {
    console.warn("Не удалось сохранить state:", err);
  }
}
