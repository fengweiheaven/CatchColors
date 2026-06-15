"use strict";

const BUILTIN_TEMPLATES = [
  ...templateVariants("brown-chopsticks", "棕色筷子", ["01", "02", "03", "04"]),
  ...templateVariants("yellow-rabbit", "黄色兔子", ["01", "03", "04"]),
  ...templateVariants("red-tanghulu", "红色糖葫芦", ["01", "02", "03", "04"]),
  ...templateVariants("red-firecracker", "红色爆竹", ["01", "03", "04"]),
  ...templateVariants("cream-dumpling", "米白色饺子", ["01", "02", "03", "04"]),
  ...templateVariants("white-crane", "白色仙鹤", ["01", "02", "03", "04"]),
  ...templateVariants("yellow-suona", "黄色唢呐", ["01", "02", "03", "04", "05"]),
  ...templateVariants("black-white-yinyang", "黑白阴阳鱼", ["02", "03"]),
  ...templateVariants("orange-drum", "橙色拨浪鼓", ["02", "03", "04"]),
  ...templateVariants("yellow-cloud", "黄色祥云", ["02", "03", "04"]),
];

const REFERENCE = {
  width: 622,
  height: 1146,
  slotCentersX: [58, 141, 224, 307, 390, 473, 556],
  slotCenterY: 207,
  slotSize: 76,
};

const VECTOR_SIZE = 40;
const NORMALIZED_PATTERN_SIZE = 24;
const NORMALIZED_PATTERN_SHIFT_RADIUS = 3;
const PATTERN_EDGE_TRIM = 2;
const PATTERN_BOTTOM_TRIM = 6;
const PATTERN_FRAME_MARGIN = 3;
const PATTERN_COMPONENT_MIN_AREA = 8;
const PATTERN_COMPONENT_CENTRAL_MIN_SHARE = 0.55;
const MIN_OCCUPIED_WHITE_RATIO = 0.1;
const MIN_CONTENT_RATIO = 0.018;
const MIN_COMPLETE_TILE_WHITE_RATIO = 0.18;
const MIN_UNKNOWN_SUBJECT_AREA = 18;
const MIN_UNKNOWN_SUBJECT_CENTRAL_AREA = 6;
const MIN_UNKNOWN_SUBJECT_DIMENSION = 4;
const UNKNOWN_BACKDROP_MIN_AREA = 520;
const UNKNOWN_BACKDROP_MAX_SUBJECT_SHARE = 0.08;
const UNKNOWN_EDGE_FRAGMENT_MAX_AREA = 70;
const NON_TILE_FRAGMENT_WHITE_RATIO = 0.28;
const NON_TILE_FRAGMENT_COOL_RATIO = 0.72;
const NON_TILE_FRAGMENT_BOTTOM_WHITE_SHARE = 0.56;
const TILE_CORNER_WHITE_SHARE = 0.22;
const MIN_COMPLETE_TILE_WHITE_CORNERS = 3;
const PARTIAL_CORNER_MIN_WHITE_RATIO = 0.42;
const EDGE_SLAB_MAX_WHITE_RATIO = 0.42;
const EDGE_TEXT_FRAGMENT_BOTTOM_SHARE = 0.36;
const EDGE_TEXT_FRAGMENT_TOP_SHARE = 0.22;
const THUMBNAIL_REPLACE_MARGIN = 0.08;
const THUMBNAIL_LOW_QUALITY_REPLACE_MARGIN = 0.03;
const THUMBNAIL_LOW_QUALITY_SCORE = 0.58;
const BUILTIN_DIRECT_MATCH_THRESHOLD = 0.87;
const BUILTIN_DIRECT_MATCH_THRESHOLD_OVERRIDES = {
  "yellow-cloud": 0.8,
};
const BUILTIN_COLOR_MISMATCH_SCORE_THRESHOLD = 0.9;
const BUILTIN_COLOR_MISMATCH_SCORE_OVERRIDES = {
  "white-crane": 0.84,
};
const BUILTIN_COLOR_COMPATIBLE_MARGIN = 0.08;
const SAME_PATTERN_MERGE_THRESHOLD = 0.88;
const SAME_PATTERN_SOFT_DIRECT_THRESHOLD = 0.86;
const NORMALIZED_PATTERN_MERGE_THRESHOLD = 0.84;
const NORMALIZED_PATTERN_COLOR_THRESHOLD = 0.9;
const NORMALIZED_PATTERN_SHAPE_THRESHOLD = 0.68;
const SOFT_DIRECT_PATTERN_SHAPE_THRESHOLD = 0.62;
const SOFT_DIRECT_PATTERN_CONTAINMENT_THRESHOLD = 0.78;
const PARTIAL_PATTERN_SCORE_THRESHOLD = 0.72;
const PARTIAL_PATTERN_COLOR_THRESHOLD = 0.86;
const PARTIAL_PATTERN_SHAPE_THRESHOLD = 0.58;
const PARTIAL_PATTERN_CONTAINMENT_THRESHOLD = 0.78;
const PARTIAL_PATTERN_MAX_AREA_RATIO = 0.72;
const EVENT_COOLDOWN_SECONDS = 0.55;
const VISUAL_EVENT_DEDUPE_SECONDS = 2.4;
const SAME_ID_ANIMATION_DEDUPE_SECONDS = 2.2;
const UNKNOWN_VISUAL_EVENT_DEDUPE_SECONDS = 1.8;
const VISUAL_PRESENCE_GAP_SECONDS = 1.5;
const UNKNOWN_VISUAL_PRESENCE_GAP_SECONDS = 1.3;
const VISUAL_RECORD_MAX_AGE_SECONDS = 20;
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const POST_EVENT_IGNORE_SECONDS = 0.85;
const BOARD_SCAN_INTERVAL_SECONDS = 0.9;
const BOARD_BURST_COOLDOWN_SECONDS = 1.25;
const BOARD_FALLBACK_INTERVAL_SECONDS = 1.5;
const BOARD_FALLBACK_DROP_WINDOW_SECONDS = 8;
const BOARD_FALLBACK_MIN_EVENT_DROPS = 3;
const BOARD_FALLBACK_MAX_EVENT_DROPS = 3;
const BOARD_FALLBACK_THRESHOLD = 0.76;
const FINAL_SINGLE_WINDOW_SECONDS = 2.4;
const SHATTER_HISTORY_SECONDS = 1.2;
const SHATTER_RECENT_SECONDS = 0.55;
const NO_TRAY_FALLBACK_AFTER_SECONDS = 10;
const NO_TRAY_FALLBACK_MIN_FRAMES = 24;
const TRAY_CENTER_SCAN = {
  yStart: 150,
  yEnd: 345,
  step: 4,
  minDarkSlots: 4,
  minScore: 8,
};
const TRAY_TILE_CROP_Y_OFFSETS = [-24, -16, -8, 0, 8, 16, 24, 32];
// 托盘占用计数器参数
const OCCUPANCY_STABLE_FRAMES = 2;   // 瓦片在槽中连续出现同 id 多少帧后确认(避开滑入动画)
const OCCUPANCY_CLEAR_DROP = 2;      // 占用数相对峰值骤降达此值即判一次消除
const OCCUPANCY_CLEAR_MIN_GAP = 0.5; // 两次消除最小间隔(秒)，去抖
const BOARD_FALLBACK_CROP_Y_OFFSETS = [-24, -16, -8, 0, 8, 16, 24];
const ENABLE_BOARD_BURST_SCAN = false;
const ENABLE_BOARD_FALLBACK_SCAN = true;
const DEBUG_PARAMS = new URLSearchParams(window.location.search);
const DEBUG_MODE = DEBUG_PARAMS.has("debug");
const DEBUG_FOCUS_START = Number(DEBUG_PARAMS.get("debugStart") || "0");
const DEBUG_FOCUS_END = Number(DEBUG_PARAMS.get("debugEnd") || String(Number.POSITIVE_INFINITY));
const OLD_OPENAI_DEFAULT_NAMING_API_BASE = "https://api.openai.com/v1";
const DEFAULT_NAMING_API_BASE = "https://lumos.diandian.info/winky/openai/v1";
const DEFAULT_NAMING_MODEL = "gpt-5.5";
const NAMING_BATCH_SIZE = 1;
const EVENT_DEDUPE_SECONDS = 1.05;
const ANONYMOUS_PATTERN_MODE = true;
const SAVED_DICTIONARY_STORAGE_KEY = "levelCounterSavedPatternDictionaryV1";
const SAVED_DICTIONARY_MATCH_THRESHOLD = 0.93;
const SAVED_DICTIONARY_COLOR_MARGIN = 0.01;
const OBJECT_DEFAULT_COLORS = {
  兔子: "黄色",
  糖葫芦: "红色",
  筷子: "棕色",
  爆竹: "红色",
  饺子: "米白色",
  仙鹤: "白色",
  唢呐: "黄色",
  阴阳鱼: "黑白",
  拨浪鼓: "橙色",
  祥云: "黄色",
  芒果: "黄色",
  梨子: "黄色",
  桃子: "粉色",
  樱桃: "红色",
  叶子: "绿色",
  花朵: "红色",
};

let patternDictionary = Array.isArray(window.PATTERN_DICTIONARY) ? window.PATTERN_DICTIONARY : [];

const BOARD_SCAN = {
  xStart: 45,
  xEnd: 590,
  yStart: 285,
  yEnd: 870,
  step: 28,
  tileSize: 76,
  threshold: 0.84,
  nmsDistance: 42,
};

const BOARD_FALLBACK_SCAN = {
  xStart: 45,
  xEnd: 590,
  yStart: 260,
  yEnd: 900,
  step: 52,
  tileSize: 76,
  nmsDistance: 42,
};

const els = {
  videoInput: document.getElementById("videoInput"),
  dropZone: document.getElementById("dropZone"),
  fileMeta: document.getElementById("fileMeta"),
  video: document.getElementById("videoPreview"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  sampleInterval: document.getElementById("sampleInterval"),
  matchThreshold: document.getElementById("matchThreshold"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  apiBaseInput: document.getElementById("apiBaseInput"),
  modelInput: document.getElementById("modelInput"),
  nameBtn: document.getElementById("nameBtn"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  statusText: document.getElementById("statusText"),
  totalGroups: document.getElementById("totalGroups"),
  totalKinds: document.getElementById("totalKinds"),
  resultRows: document.getElementById("resultRows"),
  plainOutput: document.getElementById("plainOutput"),
  copyBtn: document.getElementById("copyBtn"),
  eventList: document.getElementById("eventList"),
  eventCount: document.getElementById("eventCount"),
  templateGrid: document.getElementById("templateGrid"),
  templateCount: document.getElementById("templateCount"),
  frameCanvas: document.getElementById("frameCanvas"),
};

const state = {
  objectUrl: "",
  templates: [],
  unknowns: [],
  levelEntries: new Map(),
  savedDictionary: [],
  results: [],
  events: [],
  analyzing: false,
  paused: false,
  naming: false,
  analysisTask: null,
  resultsDirty: false,
  debugFrames: [],
  patternNames: new Map(),
  nextPatternNumber: 1,
  namesLocked: false,
  recentVisualRecords: [],
};

window.__levelCounterState = state;

const frameCtx = els.frameCanvas.getContext("2d", { willReadFrequently: true });
const vectorCanvas = document.createElement("canvas");
vectorCanvas.width = VECTOR_SIZE;
vectorCanvas.height = VECTOR_SIZE;
const vectorCtx = vectorCanvas.getContext("2d", { willReadFrequently: true });

init();

async function init() {
  bindEvents();
  restoreNamingSettings();
  applyAnonymousModeUi();
  loadSavedDictionary();
  setProgress(0);
  await loadPatternDictionary();
  await loadTemplates();
  renderTemplateGrid();
  loadPresetVideoFromQuery();
}

function applyAnonymousModeUi() {
  if (!ANONYMOUS_PATTERN_MODE) return;
  els.nameBtn.textContent = "重新命名";
  els.statusText.textContent = "匿名花色模式：先记录消除，完成后可重新命名";
}

async function loadPatternDictionary() {
  if (patternDictionary.length) {
    window.__patternDictionary = patternDictionary;
    return;
  }
  try {
    const response = await fetch("./pattern-dictionary.json");
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data)) patternDictionary = data;
  } catch (error) {
    console.warn("花色命名词库加载失败", error);
  }
  window.__patternDictionary = patternDictionary;
}

function loadSavedDictionary() {
  try {
    const raw = localStorage.getItem(SAVED_DICTIONARY_STORAGE_KEY);
    if (!raw) {
      state.savedDictionary = [];
      return;
    }
    const data = JSON.parse(raw);
    const items = Array.isArray(data?.items) ? data.items : [];
    state.savedDictionary = dedupeSavedDictionaryEntries(items.map(deserializeSavedDictionaryEntry).filter(Boolean));
  } catch (error) {
    console.warn("花色留存字典加载失败", error);
    state.savedDictionary = [];
  }
}

function saveSavedDictionary() {
  try {
    state.savedDictionary = dedupeSavedDictionaryEntries(state.savedDictionary);
    const items = state.savedDictionary.map(serializeSavedDictionaryEntry);
    localStorage.setItem(SAVED_DICTIONARY_STORAGE_KEY, JSON.stringify({ version: 1, items }));
  } catch (error) {
    console.warn("花色留存字典保存失败", error);
    els.statusText.innerHTML = `<span class="error-text">花色字典保存失败：浏览器本地空间可能已满</span>`;
  }
}

function serializeSavedDictionaryEntry(entry) {
  return {
    id: entry.id,
    label: entry.label,
    thumb: entry.thumb,
    colorName: entry.colorName,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    features: serializeFeatures(entry.features),
  };
}

function deserializeSavedDictionaryEntry(entry) {
  if (!entry?.id || !entry?.label || !entry?.features) return null;
  const features = deserializeFeatures(entry.features);
  if (!features) return null;
  return {
    id: entry.id,
    label: entry.label,
    thumb: entry.thumb || vectorCanvasFromFeatures(features).toDataURL("image/png"),
    colorName: entry.colorName || safeColorName(colorNameFromLabel(entry.label) || colorNameFromFeatures(features)),
    createdAt: entry.createdAt || Date.now(),
    updatedAt: entry.updatedAt || Date.now(),
    features,
    saved: true,
    builtin: false,
  };
}

function serializeFeatures(features) {
  if (!features) return null;
  return {
    width: features.width || VECTOR_SIZE,
    height: features.height || VECTOR_SIZE,
    rgb: uint8ToBase64(features.rgb),
    mask: uint8ToBase64(features.mask),
    whiteRatio: features.whiteRatio,
    contentRatio: features.contentRatio,
  };
}

function deserializeFeatures(features) {
  try {
    const rgb = base64ToUint8(features.rgb);
    const mask = base64ToUint8(features.mask);
    if (rgb.length !== VECTOR_SIZE * VECTOR_SIZE * 3 || mask.length !== VECTOR_SIZE * VECTOR_SIZE) return null;
    return {
      width: features.width || VECTOR_SIZE,
      height: features.height || VECTOR_SIZE,
      rgb,
      mask,
      whiteRatio: Number(features.whiteRatio) || 0,
      contentRatio: Number(features.contentRatio) || 0,
    };
  } catch {
    return null;
  }
}

function uint8ToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToUint8(value) {
  const binary = atob(value || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function templateVariants(group, label, suffixes) {
  return suffixes.map((suffix) => ({
    id: `${group}-${suffix}`,
    group,
    label,
    src: `templates/${group}-${suffix}.png`,
  }));
}

function bindEvents() {
  els.videoInput.addEventListener("change", () => {
    const [file] = els.videoInput.files;
    if (file) loadVideo(file);
  });

  ["dragenter", "dragover"].forEach((type) => {
    els.dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    els.dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropZone.classList.remove("dragging");
    });
  });

  els.dropZone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    if (file) loadVideo(file);
  });

  els.video.addEventListener("loadedmetadata", () => {
    els.statusText.textContent = `已载入 ${formatDuration(els.video.duration)}`;
    updateRunControls();
  });

  els.analyzeBtn.addEventListener("click", () => {
    analyzeVideo().catch((error) => {
      console.error(error);
      els.statusText.innerHTML = `<span class="error-text">${escapeHtml(userFacingAnalysisError(error))}</span>`;
      state.analyzing = false;
      state.paused = false;
      state.analysisTask = null;
      updateRunControls();
    });
  });

  els.pauseBtn.addEventListener("click", togglePause);

  els.resetBtn.addEventListener("click", reset);

  els.copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.plainOutput.value);
    els.copyBtn.textContent = "已复制";
    setTimeout(() => {
      els.copyBtn.textContent = "复制结果";
    }, 1000);
  });

  els.apiKeyInput.addEventListener("input", () => {
    sessionStorage.setItem("levelCounterOpenAIKey", els.apiKeyInput.value.trim());
    updateRunControls();
  });

  els.apiBaseInput.addEventListener("input", () => {
    localStorage.setItem("levelCounterNamingApiBase", els.apiBaseInput.value.trim());
  });

  els.modelInput.addEventListener("input", () => {
    localStorage.setItem("levelCounterNamingModel", els.modelInput.value.trim());
  });

  els.nameBtn.addEventListener("click", () => {
    nameResultsWithVision({ force: true }).catch((error) => {
      console.error(error);
      state.naming = false;
      els.statusText.innerHTML = `<span class="error-text">${escapeHtml(error?.message || "视觉命名失败")}</span>`;
      updateRunControls();
    });
  });
}

function restoreNamingSettings() {
  els.apiKeyInput.value = sessionStorage.getItem("levelCounterOpenAIKey") || "";
  els.apiBaseInput.value = restoredNamingApiBase();
  els.modelInput.value = localStorage.getItem("levelCounterNamingModel") || DEFAULT_NAMING_MODEL;
}

function restoredNamingApiBase() {
  const stored = (localStorage.getItem("levelCounterNamingApiBase") || "").trim().replace(/\/+$/, "");
  if (!stored || stored === OLD_OPENAI_DEFAULT_NAMING_API_BASE) {
    localStorage.setItem("levelCounterNamingApiBase", DEFAULT_NAMING_API_BASE);
    return DEFAULT_NAMING_API_BASE;
  }
  return stored;
}

function userFacingAnalysisError(error) {
  const message = error?.message || String(error || "");
  if (/tainted|cross-origin|getImageData|CanvasRenderingContext2D/i.test(message)) {
    return (
      "无法读取视频画面：浏览器把当前视频或模板当作跨来源资源。请用 http://127.0.0.1:8778/ 打开工具，" +
      "并通过“上传视频”选择本地文件；不要直接双击 index.html 用 file:// 打开。"
    );
  }
  return message || "分析失败";
}

function loadVideo(file) {
  cancelAnalysis();
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = URL.createObjectURL(file);
  els.video.src = state.objectUrl;
  els.video.load();
  els.fileMeta.textContent = `${file.name} · ${formatBytes(file.size)}`;
  clearLevelVocabulary();
  clearResults();
  renderTemplateGrid();
  setProgress(0);
  els.analyzeBtn.disabled = true;
  els.pauseBtn.disabled = true;
  els.statusText.textContent = "读取视频信息";
}

async function loadVideoUrl(src) {
  cancelAnalysis();
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  els.fileMeta.textContent = src.split("/").pop() || src;
  clearLevelVocabulary();
  clearResults();
  renderTemplateGrid();
  setProgress(0);
  els.analyzeBtn.disabled = true;
  els.pauseBtn.disabled = true;
  els.statusText.textContent = "读取视频信息";
  const response = await fetch(src);
  if (!response.ok) throw new Error(`视频加载失败：${response.status}`);
  const contentType = response.headers.get("content-type") || "video/mp4";
  const buffer = await response.arrayBuffer();
  const blob = new Blob([buffer], { type: contentType.includes("video") ? contentType : "video/mp4" });
  state.objectUrl = URL.createObjectURL(blob);
  els.video.src = state.objectUrl;
  els.video.load();
  els.fileMeta.textContent = `${src.split("/").pop() || src} · ${formatBytes(blob.size)}`;
}

function loadPresetVideoFromQuery() {
  const videoParam = new URLSearchParams(window.location.search).get("video");
  if (!videoParam) return;
  loadVideoUrl(videoParam).catch((error) => {
    console.error(error);
    els.statusText.innerHTML = `<span class="error-text">${escapeHtml(error.message || "视频加载失败")}</span>`;
  });
}

async function loadTemplates() {
  state.templates = await Promise.all(
    BUILTIN_TEMPLATES.map(async (item) => {
      const image = await loadImage(item.src);
      const features = featuresFromDrawable(image, image.naturalWidth, image.naturalHeight);
      return { ...item, image, features, thumb: item.src, builtin: true };
    }),
  );
}

function renderTemplateGrid() {
  const dictionaryEntries = dictionaryDisplayEntries();
  const entries = dictionaryEntries.length ? dictionaryEntries : templateGroups();
  if (dictionaryEntries.length) {
    els.templateCount.textContent = `${state.savedDictionary.length} 个留存 · ${state.results.length} 个本关`;
  } else {
    els.templateCount.textContent = `${entries.length} 个参考模板`;
  }
  els.templateGrid.innerHTML = entries
    .map(
      (item) => `
        <div class="template-item ${item.saved ? "saved-dictionary-item" : ""}">
          <img class="tile-thumb" src="${item.thumb}" alt="" />
          <span>${escapeHtml(item.label)}</span>
          ${
            item.saved
              ? `<button class="dictionary-delete" type="button" data-id="${escapeAttr(item.id)}" aria-label="删除">×</button>`
              : ""
          }
        </div>
      `,
    )
    .join("");

  els.templateGrid.querySelectorAll(".dictionary-delete").forEach((button) => {
    button.addEventListener("click", () => {
      deleteSavedDictionaryEntry(button.dataset.id);
    });
  });
}

function dictionaryDisplayEntries() {
  const entries = ANONYMOUS_PATTERN_MODE ? [] : state.savedDictionary.map((item) => ({ ...item, saved: true }));
  for (const result of state.results) {
    const entry = findLevelEntryById(result.id) || result;
    if (entries.some((item) => isSameDictionaryEntry(item, entry))) continue;
    entries.push({
      id: entry.id,
      label: result.label || entry.label,
      thumb: result.thumb || entry.thumb,
      features: entry.features,
      saved: false,
    });
  }
  return entries;
}

function isSameDictionaryEntry(a, b) {
  if (!a || !b) return false;
  if (a.id === b.id) return true;
  if (a.label && b.label && a.label === b.label) return true;
  if (a.label === b.label && a.features && b.features && compareFeatures(a.features, b.features) >= SAME_PATTERN_MERGE_THRESHOLD) {
    return true;
  }
  return false;
}

function dedupeSavedDictionaryEntries(entries) {
  const output = [];
  for (const entry of entries) {
    if (!entry?.label || !entry.features) continue;
    const existing = output.find((item) => isSameDictionaryEntry(item, entry));
    if (existing) {
      existing.label = entry.label || existing.label;
      existing.thumb = entry.thumb || existing.thumb;
      existing.colorName = entry.colorName || existing.colorName;
      existing.features = entry.features || existing.features;
      existing.updatedAt = Math.max(existing.updatedAt || 0, entry.updatedAt || 0, Date.now());
      continue;
    }
    output.push(entry);
  }
  return output;
}

function mergeCurrentResultsIntoSavedDictionary() {
  if (ANONYMOUS_PATTERN_MODE) return;
  if (!state.results.length) return;
  let changed = false;
  for (const row of state.results) {
    const entry = findLevelEntryById(row.id) || row;
    if (!entry?.features || !entry.label) continue;
    const saved = findSavedDictionaryEntryFor(entry);
    if (saved) {
      if (saved.label !== entry.label || saved.thumb !== entry.thumb) {
        saved.label = entry.label;
        saved.thumb = entry.thumb || saved.thumb;
        saved.colorName = entry.colorName || saved.colorName;
        saved.updatedAt = Date.now();
        changed = true;
      }
      continue;
    }
    state.savedDictionary.push({
      id: createSavedDictionaryId(),
      label: entry.label,
      thumb: entry.thumb,
      colorName: entry.colorName || safeColorName(colorNameFromLabel(entry.label) || colorNameFromFeatures(entry.features)),
      features: entry.features,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      saved: true,
      builtin: false,
    });
    changed = true;
  }
  if (changed) saveSavedDictionary();
}

function findSavedDictionaryEntryFor(entry) {
  if (!entry?.features) return state.savedDictionary.find((item) => item.id === entry?.id) || null;
  const byId = state.savedDictionary.find((item) => item.id === entry.id);
  if (byId) return byId;
  const byLabel = state.savedDictionary.find((item) => item.label === entry.label);
  if (byLabel) return byLabel;
  let best = null;
  for (const item of state.savedDictionary) {
    if (!item.features) continue;
    const score = compareFeatures(entry.features, item.features);
    if (score < SAME_PATTERN_MERGE_THRESHOLD) continue;
    if (!areColorNamesCompatible(colorNameFromLabel(item.label), colorNameFromLabel(entry.label)) && score < 0.94) continue;
    if (!best || score > best.score) best = { item, score };
  }
  return best?.item || null;
}

function createSavedDictionaryId() {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function deleteSavedDictionaryEntry(id) {
  const before = state.savedDictionary.length;
  state.savedDictionary = state.savedDictionary.filter((item) => item.id !== id);
  if (state.savedDictionary.length === before) return;
  saveSavedDictionary();
  renderTemplateGrid();
  renderResults();
}

async function nameResultsWithVision(options = {}) {
  if (!state.results.length) {
    updateRunControls();
    return;
  }

  const apiKey = getNamingApiKey();

  const targets = state.results.filter((row) => {
    const entry = findLevelEntryById(row.id);
    return options.force || !entry?.visionNamed;
  });
  if (!targets.length) {
    updateRunControls();
    return;
  }

  state.naming = true;
  updateRunControls();

  try {
    const namedIds = new Set();
    for (let start = 0; start < targets.length; start += NAMING_BATCH_SIZE) {
      const batch = targets.slice(start, start + NAMING_BATCH_SIZE);
      els.statusText.textContent = `正在图像命名 ${Math.min(start + batch.length, targets.length)} / ${targets.length}`;
      const items = await Promise.all(batch.map((row) => buildNamingItem(row)));
      const namedItems = await requestVisionNames(items, apiKey);
      const appliedIds = applyVisionNames(namedItems, batch.map((row) => row.id));
      for (const id of appliedIds) namedIds.add(id);
      await idle();
    }
    const unnamed = resultsNeedingVisionNames();
    if (unnamed.length) {
      els.statusText.innerHTML = `<span class="error-text">重新命名未完成：还有 ${unnamed.length} 个花色没有成功命名，请再点一次重新命名。</span>`;
    } else {
      els.statusText.textContent = `重新命名完成：已命名 ${namedIds.size} 个花色`;
    }
  } finally {
    state.naming = false;
    updateRunControls();
  }
}

async function ensureNameBeforeRecording(id) {
  if (ANONYMOUS_PATTERN_MODE) return;
  const entry = findLevelEntryById(id);
  if (!entry || entry.visionNamed || !entry.needsVisionName) return;

  entry.label = localNameForEntry(entry);
  entry.visionNamed = true;
  entry.needsVisionName = false;
}

function hasActiveNamingTasks() {
  if (ANONYMOUS_PATTERN_MODE) return false;
  return levelEntries().some((entry) => Boolean(entry.namingPromise));
}

function refreshLocalNames() {
  if (ANONYMOUS_PATTERN_MODE) {
    refreshAnonymousNames();
    return;
  }
  for (const entry of levelEntries()) {
    entry.label = localNameForEntry(entry);
    entry.visionNamed = true;
    entry.needsVisionName = false;
  }
  for (const unknown of state.unknowns) {
    const entry = findLevelEntryById(unknown.id);
    if (entry) unknown.label = entry.label;
  }
  for (const event of state.events) {
    const entry = findLevelEntryById(event.id);
    if (entry) event.label = entry.label;
  }
  state.results = summarizeEvents(state.events);
  mergeCurrentResultsIntoSavedDictionary();
  renderResults();
  renderTemplateGrid();
  els.statusText.textContent = "已本地重命名";
}

function localNameForEntry(entry) {
  if (ANONYMOUS_PATTERN_MODE) return assignedAnonymousPatternName(entry.id) || entry.label || "花色?";
  if (entry.builtin && entry.label) return entry.label;
  const localShapeName = localShapeNameFromFeatures(entry.features);
  if (localShapeName) return localShapeName;
  return provisionalNameFromFeatures(entry.features, entry.colorName);
}

function refreshAnonymousNames() {
  state.events = normalizeEvents(state.events);
  state.results = summarizeEvents(state.events);
  renderResults();
  renderTemplateGrid();
  els.statusText.textContent = "已刷新匿名花色编号";
}

function bestLocalObjectTemplate(features) {
  if (!features) return null;
  let best = null;
  for (const template of state.templates) {
    const score = compareFeatures(features, template.features);
    if (!best || score > best.score) {
      best = {
        id: template.group || template.id,
        label: template.label,
        score,
        known: true,
        variant: template.id,
      };
    }
  }
  return best;
}

function getNamingApiKey() {
  return els.apiKeyInput.value.trim();
}

function getNamingApiBase() {
  return (els.apiBaseInput.value.trim() || DEFAULT_NAMING_API_BASE).replace(/\/+$/, "");
}

function getNamingApiRoot() {
  const base = getNamingApiBase();
  return base.replace(/\/(?:responses|chat\/completions)$/i, "").replace(/\/+$/, "");
}

function getPreferredNamingMode() {
  const base = getNamingApiBase().toLowerCase();
  return /lumos\.diandian\.info|\/chat\/completions$/i.test(base) ? "chat" : "responses";
}

function getNamingEndpoint(mode) {
  const base = getNamingApiBase();
  if (mode === "chat") {
    return /\/chat\/completions$/i.test(base) ? base : `${getNamingApiRoot()}/chat/completions`;
  }
  return /\/responses$/i.test(base) ? base : `${getNamingApiRoot()}/responses`;
}

function getNamingModel() {
  return els.modelInput.value.trim() || DEFAULT_NAMING_MODEL;
}

async function buildNamingItem(row) {
  const entry = findLevelEntryById(row.id);
  return buildNamingItemFromEntry({
    id: row.id,
    label: row.label,
    thumb: row.thumb,
    colorName: entry?.colorName || colorNameFromLabel(row.label),
  });
}

async function buildNamingItemFromEntry(entry) {
  return {
    id: entry.id,
    currentName: entry.label,
    colorName: safeColorName(entry.colorName || colorNameFromLabel(entry.label)),
    imageUrl: await thumbToVisionDataUrl(entry.thumb),
  };
}

async function requestVisionNames(items, apiKey) {
  const preferredMode = getPreferredNamingMode();
  const modes = preferredMode === "chat" ? ["chat"] : ["responses", "chat"];
  let firstError = "";

  for (const mode of modes) {
    const endpoint = getNamingEndpoint(mode);
    validateNamingCredentials(apiKey, endpoint);
    const body = buildVisionNamingRequest(items, mode);

    const response = await fetchNamingApi(endpoint, apiKey, body);

    if (!response.ok) {
      const message = await readableNamingError(response, mode);
      if (shouldRetryWithChat(mode, response.status)) {
        firstError = message;
        continue;
      }
      throw new Error(firstError ? `${message}（已自动改试 /chat/completions）` : message);
    }

    const data = await response.json();
    const text = mode === "chat" ? chatCompletionText(data) : responseOutputText(data);
    const parsed = parseNamingJson(text);
    const extracted = extractNamingItems(parsed, items, text);
    if (extracted.length) return extracted;
    firstError = `视觉命名失败：API 返回内容没有可用名字。返回片段：${sanitizeApiError(text).slice(0, 160)}`;
    continue;
  }

  throw new Error(firstError || "视觉命名失败：API 未返回有效结果");
}

async function fetchNamingApi(endpoint, apiKey, body) {
  const hasApiKey = Boolean(apiKey);
  const shouldProxy = shouldUseNamingProxy(endpoint);
  if (shouldProxy) {
    const proxyResponse = await fetchNamingProxy(endpoint, apiKey, body);
    if (proxyResponse) return proxyResponse;
    throw new Error(
      "视觉命名失败：本地代理不可用。请用 http://127.0.0.1:8778/ 打开工具，并确认 video-level-counter/server.py 正在运行。",
    );
  }

  const directHeaders = {
    "Content-Type": "application/json",
  };
  if (hasApiKey) directHeaders.Authorization = `Bearer ${apiKey}`;

  const directOptions = {
    method: "POST",
    headers: directHeaders,
    body: JSON.stringify(body),
  };

  if (!hasApiKey) {
    throw new Error("视觉命名失败：请填写视觉命名 Key，或在本地服务环境变量中配置 OPENAI_API_KEY / LUMOS_API_KEY。");
  }

  try {
    return await fetch(endpoint, directOptions);
  } catch (error) {
    throw new Error(readableNetworkError(error));
  }
}

async function fetchNamingProxy(endpoint, apiKey, body) {
  let lastError = null;
  for (const proxyEndpoint of namingProxyEndpoints()) {
    try {
      const proxyResponse = await fetch(proxyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint, apiKey, body }),
      });
      return proxyResponse;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) console.warn("视觉命名本地代理不可用", lastError);
  return null;
}

function namingProxyEndpoints() {
  const endpoints = [];
  if (/^https?:$/i.test(window.location.protocol)) {
    endpoints.push(new URL("/api/vision-name", window.location.href).href);
  }
  endpoints.push("http://127.0.0.1:8778/api/vision-name");
  endpoints.push("http://localhost:8778/api/vision-name");
  return [...new Set(endpoints)];
}

function shouldUseNamingProxy(endpoint) {
  try {
    const target = new URL(endpoint);
    if (!/^https?:$/i.test(target.protocol)) return false;
    if (!/^https?:$/i.test(window.location.protocol)) return true;
    return target.origin !== window.location.origin;
  } catch {
    return true;
  }
}

function readableNetworkError(error) {
  const message = error?.message || "网络请求失败";
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "视觉命名失败：浏览器无法直连该 API，通常是跨域限制或网络不可达。请用 video-level-counter/server.py 启动本工具后重试。";
  }
  return `视觉命名失败：${sanitizeApiError(message)}`;
}

function buildVisionNamingRequest(items, mode) {
  if (mode === "chat") {
    return {
      model: getNamingModel(),
      messages: [
        {
          role: "user",
          content: buildChatVisionNamingContent(items),
        },
      ],
      max_completion_tokens: 320,
    };
  }

  return {
    model: getNamingModel(),
    input: [
      {
        role: "user",
        content: buildVisionNamingContent(items),
      },
    ],
    max_output_tokens: 320,
    store: false,
  };
}

function shouldRetryWithChat(mode, status) {
  return mode === "responses" && [400, 404, 405].includes(status);
}

function validateNamingCredentials(apiKey, endpoint) {
  const key = apiKey.toLowerCase();
  const url = endpoint.toLowerCase();
  if (key.startsWith("lumos-") && url.includes("api.openai.com")) {
    throw new Error("视觉命名失败：检测到 Lumos Key，但 API 地址仍是 OpenAI 默认地址。请在 API 地址填 Lumos 的 OpenAI 兼容 Base URL（通常以 /v1 结尾），或直接填完整 /chat/completions 地址。");
  }
}

async function readableNamingError(response, mode) {
  const rawText = await response.text();
  let detail = rawText;
  try {
    const json = JSON.parse(rawText);
    detail = json?.error?.message || json?.message || rawText;
  } catch {
    detail = rawText;
  }

  if (response.status === 401) {
    return "视觉命名失败：401，Key 无效或 API 地址不匹配。OpenAI Key 请使用 sk-...；如果是 Lumos/其它平台 Key，请填写对应平台的 API 地址。";
  }
  if (/upstream request timeout|timeout/i.test(detail)) {
    return `视觉命名失败：${response.status} Lumos 上游请求超时。已改为单张命名，请稍后再点“重新命名”继续剩余花色。`;
  }
  if (response.status === 404) {
    const path = mode === "chat" ? "/chat/completions" : "/responses";
    return `视觉命名失败：404，API 地址不支持 ${path}。请检查 API 地址是否填到正确的 OpenAI 兼容入口。`;
  }
  return `视觉命名失败：${response.status} ${sanitizeApiError(detail).slice(0, 180)}`;
}

function sanitizeApiError(text) {
  return String(text || "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer ***")
    .replace(/\b(?:sk|lumos|sess|key|api)[-_][A-Za-z0-9*._-]{4,}/gi, "***")
    .replace(/[A-Za-z0-9_-]{6}\*{6,}[A-Za-z0-9_-]*/g, "***");
}

function buildVisionNamingContent(items) {
  const content = [
    {
      type: "input_text",
      text: [
        "你是休闲消除游戏棋子图案命名助手。请根据每张小图直接识别图案，返回“颜色+具体物品/图案名”。",
        "临时名可能是错的，只能作为弱参考；如果临时名颜色或形态与图片不一致，必须忽略临时名。",
        "颜色必须以图片估计主色为准，名称必须描述图片里的真实物体或形态。",
        "每个图片 id 都必须返回一项；每个 name 必须是“颜色+具体图形名字”，例如“黄色辣椒”，不要只写颜色或只写物体。",
        "不要输出“花色”“图案”“未知”“待识别”，不要使用编号或代称。",
        "不要把明确物体泛称为“晶石”“饰物”“物件”“长条”“竖饰”；只有图片确实是宝石/水晶时才可用水晶或宝石。",
        "如果像两根细长餐具，请命名为筷子；如果像动物、食物、器物、云纹、植物、果实，要写出具体类别。",
        "优先从候选词库中选择最相近的物品名；如果候选词库没有合适项，可以自己命名。",
        "名称示例：粉色树莓、紫色风信子、绿色豌豆荚、黄色祥云、红色糖葫芦。",
        "只返回 JSON，格式为：{\"items\":[{\"id\":\"原 id\",\"name\":\"颜色+名称\",\"confidence\":0.0}]}。",
        `候选词库：${candidateTextForItems(items)}`,
      ].join("\n"),
    },
  ];

  for (const item of items) {
    content.push({
      type: "input_text",
      text: `图片 id：${item.id}；当前临时名：${item.currentName}；估计主色：${item.colorName}`,
    });
    content.push({
      type: "input_image",
      image_url: item.imageUrl,
    });
  }

  return content;
}

function buildChatVisionNamingContent(items) {
  return buildVisionNamingContent(items).map((part) => {
    if (part.type === "input_image") {
      return {
        type: "image_url",
        image_url: { url: part.image_url },
      };
    }
    return {
      type: "text",
      text: part.text,
    };
  });
}

function candidateTextForItems(items) {
  const keys = new Set(items.map((item) => colorKeyFromName(item.colorName)).filter(Boolean));
  const candidates = patternDictionary.filter((entry) => dictionaryColorMatches(entry.color, keys));
  const scoped = candidates.length ? candidates : patternDictionary;
  return scoped
    .slice(0, 180)
    .map((entry) => {
      const name = displayNameFromDictionary(entry);
      const detail = [entry.theme, entry.features].filter(Boolean).join("，");
      return detail ? `${name}（${detail}）` : name;
    })
    .join("、");
}

function responseOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
      if (typeof content.output_text === "string") chunks.push(content.output_text);
    }
  }
  return chunks.join("\n");
}

function chatCompletionText(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      return part?.text || part?.content || "";
    })
    .join("\n");
}

function parseNamingJson(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? { items: parsed } : parsed;
  } catch {
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    const match = objectMatch || arrayMatch;
    if (!match) return { items: [] };
    try {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? { items: parsed } : parsed;
    } catch {
      return { items: [] };
    }
  }
}

function extractNamingItems(parsed, expectedItems = [], rawText = "") {
  const expected = expectedItems.map((item) => ({
    id: String(item.id || ""),
    currentName: String(item.currentName || ""),
  }));
  const output = [];

  const arrays = [];
  if (Array.isArray(parsed)) arrays.push(parsed);
  if (Array.isArray(parsed?.items)) arrays.push(parsed.items);
  if (Array.isArray(parsed?.data)) arrays.push(parsed.data);
  if (Array.isArray(parsed?.results)) arrays.push(parsed.results);
  if (Array.isArray(parsed?.names)) arrays.push(parsed.names);

  for (const array of arrays) {
    array.forEach((item, index) => {
      const normalized = normalizeNamingResponseItem(item);
      if (!normalized.name) return;
      const fallback = expected[index];
      output.push({
        id: normalized.id || fallback?.id || "",
        name: normalized.name,
        confidence: normalized.confidence,
      });
    });
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const expectedItem of expected) {
      const value =
        parsed[expectedItem.id] ??
        parsed[expectedItem.currentName] ??
        parsed.names?.[expectedItem.id] ??
        parsed.names?.[expectedItem.currentName] ??
        parsed.results?.[expectedItem.id] ??
        parsed.results?.[expectedItem.currentName];
      const name = namingValueToName(value);
      if (name) output.push({ id: expectedItem.id, name });
    }
  }

  if (!output.length && rawText) {
    output.push(...extractNamingItemsFromPlainText(rawText, expected));
  }

  return dedupeNamingItems(fillMissingNamingIdsByOrder(output, expected));
}

function normalizeNamingResponseItem(item) {
  if (typeof item === "string") return { id: "", name: item };
  if (!item || typeof item !== "object") return { id: "", name: "" };
  const id = String(item.id ?? item.ID ?? item.编号 ?? item.花色 ?? item.key ?? item.currentName ?? "").trim();
  const name = namingValueToName(
    item.name ?? item.label ?? item.title ?? item.名称 ?? item.名字 ?? item.命名 ?? item.result ?? item.value,
  );
  if (name) return { id, name, confidence: item.confidence };

  const entries = Object.entries(item).filter(([key]) => !/^(id|ID|编号|花色|key|confidence|score)$/i.test(key));
  if (entries.length === 1) return { id: id || String(entries[0][0]), name: namingValueToName(entries[0][1]) };
  return { id, name: "" };
}

function namingValueToName(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return namingValueToName(value.name ?? value.label ?? value.title ?? value.名称 ?? value.名字 ?? value.命名 ?? value.result ?? value.value);
}

function extractNamingItemsFromPlainText(text, expected) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const output = [];
  for (const expectedItem of expected) {
    const line = lines.find((item) => item.includes(expectedItem.id) || (expectedItem.currentName && item.includes(expectedItem.currentName)));
    if (!line) continue;
    const parts = line.split(/[:：,，\s]+/).filter(Boolean);
    const candidate = parts.reverse().find((part) => !part.includes(expectedItem.id) && part !== expectedItem.currentName);
    if (candidate) output.push({ id: expectedItem.id, name: candidate });
  }
  return output;
}

function dedupeNamingItems(items) {
  const byId = new Map();
  for (const item of items) {
    if (!item?.id || !item.name) continue;
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function fillMissingNamingIdsByOrder(items, expected) {
  let expectedIndex = 0;
  return items.map((item) => {
    if (item.id) return item;
    while (expectedIndex < expected.length && items.some((other) => other.id === expected[expectedIndex].id)) {
      expectedIndex += 1;
    }
    const id = expected[expectedIndex]?.id || "";
    expectedIndex += 1;
    return { ...item, id };
  });
}

function applyVisionNames(namedItems, expectedIds = []) {
  let changed = false;
  const appliedIds = new Set();
  const expected = new Set(expectedIds.map(String));
  const labelToExpectedId = new Map(
    expectedIds.map((id) => {
      const entry = findLevelEntryById(id);
      const row = state.results.find((item) => item.id === id);
      return [String(entry?.label || row?.label || anonymousPatternNameForId(id) || id), String(id)];
    }),
  );
  for (let index = 0; index < namedItems.length; index += 1) {
    const item = namedItems[index];
    const rawId = String(item?.id || "");
    const id = expected.has(rawId) ? rawId : labelToExpectedId.get(rawId) || String(expectedIds[index] || "");
    if (!id || (expected.size && !expected.has(id))) continue;
    const normalized = normalizeVisionName(item.name, id);
    if (!normalized) continue;

    const entry = findLevelEntryById(id);
    if (entry) {
      entry.label = normalized;
      entry.visionNamed = true;
      entry.needsVisionName = false;
      entry.namingError = "";
    }
    const unknown = state.unknowns.find((unknownItem) => unknownItem.id === id);
    if (unknown) unknown.label = normalized;
    for (const event of state.events) {
      if (event.id === id) event.label = normalized;
    }
    appliedIds.add(id);
    changed = true;
  }

  if (!changed) return appliedIds;
  state.namesLocked = true;
  state.events = normalizeEvents(state.events);
  state.results = summarizeEvents(state.events);
  mergeCurrentResultsIntoSavedDictionary();
  renderResults();
  renderTemplateGrid();
  return appliedIds;
}

function resultsNeedingVisionNames() {
  return state.results.filter((row) => {
    const entry = findLevelEntryById(row.id);
    const label = entry?.label || row.label || "";
    return !entry?.visionNamed || isAnonymousPatternLabel(label);
  });
}

function normalizeVisionName(value, id) {
  let name = String(value || "").trim();
  name = name.replace(/^["'“”‘’]+|["'“”‘’。；;，,\s]+$/g, "");
  name = name.replace(/\s+/g, "");
  name = expandColorObjectName(name);
  if (!name || /花色|图案|未知|待识别/.test(name)) return "";
  if (name.length > 16) name = name.slice(0, 16);

  const entry = findLevelEntryById(id);
  const returnedColor = colorNameFromLabel(name);
  if (!returnedColor && !startsWithAnyColor(name)) {
    const colorName = safeColorName(entry?.colorName || colorNameFromLabel(name));
    name = `${colorName}${name}`;
  }
  return name;
}

function correctNameByDetectedShape(name, entry) {
  if (!entry?.features) return name;
  const shape = visualShapeName(entry.features, entry.colorName);
  if (shape === "筷子" && !/筷子/.test(name)) {
    return `${shapeAwareColorName(entry.colorName, shape)}筷子`;
  }
  if (shape === "筷子" && colorNameFromLabel(name) === "橙色") {
    return `棕色${stripColorPrefix(name)}`;
  }
  return name;
}

async function thumbToVisionDataUrl(src) {
  if (String(src || "").startsWith("data:image/")) return upscaleImageDataUrl(src, 112);
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = 112;
  canvas.height = 112;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 8, 8, 96, 96);
  return canvas.toDataURL("image/png");
}

async function upscaleImageDataUrl(dataUrl, size) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

function hasUnresolvedNames() {
  if (ANONYMOUS_PATTERN_MODE) return false;
  const resultIds = new Set(state.results.map((row) => row.id));
  return levelEntries().some((entry) => resultIds.has(entry.id) && entry.needsVisionName && !entry.visionNamed);
}

async function analyzeVideo() {
  if (!els.video.src || state.analyzing) return;

  await ensureMetadata();
  state.analyzing = true;
  state.paused = false;
  clearLevelVocabulary();
  clearResults();
  renderTemplateGrid();
  setProgress(0);
  updateRunControls();
  els.statusText.textContent = "正在抽帧";
  prepareFrameCanvas();

  const task = createAnalysisTask();
  state.analysisTask = task;

  try {
    await runAnalysisLoop(task);
  } finally {
    if (state.analysisTask === task) {
      state.analyzing = false;
      state.paused = false;
      state.analysisTask = null;
      updateRunControls();
    }
  }
}

function createAnalysisTask() {
  const duration = els.video.duration;
  const interval = Number(els.sampleInterval.value);
  return {
    canceled: false,
    paused: false,
    resumeResolvers: [],
    duration,
    interval,
    threshold: Number(els.matchThreshold.value),
    totalSteps: Math.max(1, Math.ceil(duration / interval)),
    step: 0,
    candidateHistory: [],
    trayPending: new Map(),
    finalSinglePending: new Map(),
    lastBoardSnapshot: null,
    lastBoardScanTime: -Infinity,
    shatterActive: false,
    trayEvidenceFrames: 0,
    noTrayFallbackFrames: 0,
    forceBoardFallback: false,
    trayCenterY: REFERENCE.slotCenterY,
    trayCenterYLocked: false,
    trayCenterYSamples: [],
    // 占用计数器状态
    slotTrack: Array.from({ length: REFERENCE.slotCentersX.length }, () => ({ id: null, stable: 0 })),
    confirmedSlots: new Array(REFERENCE.slotCentersX.length).fill(null),
    prevOccCount: 0,
    lastAddedId: null,
    lastAddedThumb: "",
    lastAddedLabel: "",
    lastClearTime: -Infinity,
    collectCount: 0,
  };
}

async function runAnalysisLoop(task) {
  for (; task.step <= task.totalSteps; task.step += 1) {
    if (task.canceled) return;
    await waitIfPaused(task);
    if (task.canceled) return;

    const time = Math.min(task.duration, task.step * task.interval);
    await seekVideo(time);
    drawFrame();
    updateTaskTrayCenterY(task);

    const shatter = detectTrayShatter(task.trayCenterY);
    // 逐槽检测：每个被占用的托盘格返回 {slot,id,thumb,score,...}
    const detections = detectTrayTiles(task.threshold, {
      allowUnknown: true,
      createUnknown: true,
      trayCenterY: task.trayCenterY,
    });

    // 占用计数：新瓦片稳定入槽=一次收集并定型；占用骤降/碎裂=消除一组
    await updateOccupancyCounter(task, detections, shatter, time);

    recordDebugFrame(task, time, detections, { shatter });

    if (DEBUG_MODE && (detections.length > 0 || shatter || task.step % 25 === 0)) {
      console.log(JSON.stringify({
        time: Number(time.toFixed(2)),
        detections: detections.map((d) => ({ slot: d.slot, id: d.id, score: Number((d.score || 0).toFixed(2)) })),
        shatter,
        confirmed: task.confirmedSlots,
        prevOcc: task.prevOccCount,
        lastAdded: task.lastAddedId,
        groups: state.events.length,
      }));
    }

    flushLiveResults();

    if (task.step % 8 === 0 || task.step === task.totalSteps) {
      setProgress(task.step / task.totalSteps);
      els.statusText.textContent = `正在分析 ${formatDuration(time)} / ${formatDuration(task.duration)}`;
      await idle();
    }
  }

  flushLiveResults(true);
  mergeCurrentResultsIntoSavedDictionary();
  renderTemplateGrid();
  setProgress(1);
  els.statusText.textContent = hasUnresolvedNames() ? "分析完成，部分名称可手动精修" : "分析完成";
}

// 托盘占用计数器：核心思路见 catchcolors-progress 记忆。
// 1) 每槽独立做稳定确认：瓦片在槽中静止数帧后才"确认"，避开滑入动画导致的 id 抖动；
//    每确认一个新瓦片即记 lastAddedId（完成三连的那张=被消花色）。
// 2) 占用数相对峰值骤降 >=2，或检测到白色碎裂 => 判定一次消除（一组），按 lastAddedId 记账并复位。
//    不再要求"多个同 id 多帧共存"，因此对开局/快速消除也不漏。
async function updateOccupancyCounter(task, detections, shatter, time) {
  const idBySlot = new Array(REFERENCE.slotCentersX.length).fill(null);
  const detBySlot = new Array(REFERENCE.slotCentersX.length).fill(null);
  for (const d of detections) {
    idBySlot[d.slot] = d.id;
    detBySlot[d.slot] = d;
  }
  const rawCount = detections.length;

  for (let s = 0; s < REFERENCE.slotCentersX.length; s += 1) {
    const obs = idBySlot[s];
    const tr = task.slotTrack[s];
    if (obs && obs === tr.id) {
      tr.stable += 1;
    } else {
      tr.id = obs;
      tr.stable = obs ? 1 : 0;
    }
    if (obs && tr.stable >= OCCUPANCY_STABLE_FRAMES && task.confirmedSlots[s] !== obs) {
      // 该槽稳定出现一个"新"已确认 id => 一次收集，记为最近加入的花色（完成三连者）
      task.confirmedSlots[s] = obs;
      const d = detBySlot[s];
      task.lastAddedId = obs;
      task.lastAddedThumb = d?.thumb || task.lastAddedThumb;
      task.lastAddedLabel = d?.label || task.lastAddedLabel;
      task.collectCount += 1;
    } else if (!obs) {
      task.confirmedSlots[s] = null;
    }
  }

  // 边沿检测：消除 = 占用数相对上一帧"突然下跌"≥阈值（该游戏托盘是累积式，
  // 不是每组清空，因此必须用相邻帧的跌沿，而非与历史峰值比较）。碎裂作辅助证据。
  const drop = task.prevOccCount - rawCount;
  const isClear = (drop >= OCCUPANCY_CLEAR_DROP || (shatter && task.prevOccCount >= 2));

  if (isClear && task.lastAddedId && time - task.lastClearTime > OCCUPANCY_CLEAR_MIN_GAP) {
    await emitGroupEvent(task.lastAddedId, task.lastAddedThumb, task.lastAddedLabel, time);
    task.lastClearTime = time;
  }
  task.prevOccCount = rawCount;
}

// 轻量事件登记：绕开 addEvent 的视觉命名门槛（匿名模式下会吞掉未命名事件），
// 仅做"同 id 近窗"去重，直接产出与汇总/记录渲染兼容的事件对象。
async function emitGroupEvent(id, thumb, label, time) {
  if (!id) return false;
  if (state.events.some((e) => e.id === id && Math.abs(e.time - time) < OCCUPANCY_CLEAR_MIN_GAP)) {
    return false;
  }
  const entry = findLevelEntryById(id);
  state.events.push({
    id,
    time,
    count: 3,
    label: entry?.label || label || id,
    thumb: entry?.thumb || thumb || "",
    source: "tray-occupancy",
    score: 0,
    maxCount: 3,
    matchSource: "",
  });
  state.resultsDirty = true;
  recordDebugDecision("event-add", time, { id, label }, "tray-occupancy");
  return true;
}

function shouldRecordDebugTime(time) {
  return DEBUG_MODE && time >= DEBUG_FOCUS_START && time <= DEBUG_FOCUS_END;
}

function compactDetection(item) {
  return {
    slot: item.slot,
    id: item.id,
    label: item.label,
    score: Number((item.score || 0).toFixed(3)),
    known: Boolean(item.known),
    variant: item.variant,
    relaxedColorMismatch: Boolean(item.relaxedColorMismatch),
    frameCount: item.frameCount,
    recentFrameCount: item.recentFrameCount,
    count: item.count,
    maxCount: item.maxCount,
    recentMaxCount: item.recentMaxCount,
    source: item.source,
  };
}

function compactMapItems(map) {
  return [...map.values()].map((item) => ({
    id: item.id,
    label: item.label,
    count: item.count,
    maxCount: item.maxCount,
    frameCount: item.frameCount,
    relaxedColorMismatch: Boolean(item.relaxedColorMismatch),
    score: Number((item.score || 0).toFixed(3)),
    maxScore: Number((item.maxScore || 0).toFixed(3)),
    startTime: Number((item.startTime || 0).toFixed(2)),
    lastTime: Number((item.lastTime || 0).toFixed(2)),
  }));
}

function recordDebugFrame(task, time, detections, flags) {
  if (!shouldRecordDebugTime(time)) return;
  state.debugFrames.push({
    type: "frame",
    time: Number(time.toFixed(2)),
    ...flags,
    detections: detections.map(compactDetection),
    trayPending: compactMapItems(task.trayPending),
    finalSinglePending: compactMapItems(task.finalSinglePending),
    history: task.candidateHistory.slice(-8).map(compactDetection),
    events: state.events.slice(-4).map(compactDetection),
    trayCenterY: task.trayCenterY,
    diagnostics: diagnoseTraySlots(task.threshold, task.trayCenterY).map((slot) => ({
      slot: slot.slot,
      occupied: slot.occupied,
      whiteRatio: slot.whiteRatio,
      contentRatio: slot.contentRatio,
      color: slot.color,
      shape: slot.shape,
      maskShape: slot.maskShape,
      colorProfile: slot.colorProfile,
      best: slot.best
        ? {
            id: slot.best.id,
            label: slot.best.label,
            score: Number((slot.best.score || 0).toFixed(3)),
          }
        : null,
      passes: slot.passes,
    })),
  });
  writeDebugFrames();
}

function recordDebugDecision(type, time, candidate, reason = "") {
  if (!shouldRecordDebugTime(time)) return;
  state.debugFrames.push({
    type,
    time: Number(time.toFixed(2)),
    reason,
    candidate: candidate ? compactDetection(candidate) : null,
  });
  writeDebugFrames();
}

function writeDebugFrames() {
  let target = document.getElementById("debugFrameData");
  if (!target) {
    target = document.createElement("script");
    target.type = "application/json";
    target.id = "debugFrameData";
    document.body.appendChild(target);
  }
  target.textContent = JSON.stringify(state.debugFrames.slice(-320));
}

function flushLiveResults(force = false) {
  if (!force && !state.resultsDirty) return;
  const before = state.events.length;
  state.events = normalizeEvents(state.events);
  state.results = summarizeEvents(state.events);
  renderResults();
  if (state.events.length !== before) renderTemplateGrid();
  state.resultsDirty = false;
}

function togglePause() {
  const task = state.analysisTask;
  if (!task || !state.analyzing) return;

  if (task.paused) {
    resumeAnalysis(task);
    return;
  }

  task.paused = true;
  state.paused = true;
  els.statusText.textContent = `已暂停 ${formatProgressPosition(task)}`;
  updateRunControls();
}

function resumeAnalysis(task = state.analysisTask) {
  if (!task) return;
  task.paused = false;
  state.paused = false;
  const resolvers = task.resumeResolvers.splice(0);
  for (const resolve of resolvers) resolve();
  els.statusText.textContent = `继续分析 ${formatProgressPosition(task)}`;
  updateRunControls();
}

function waitIfPaused(task) {
  if (!task.paused) return Promise.resolve();
  return new Promise((resolve) => {
    task.resumeResolvers.push(resolve);
  });
}

function cancelAnalysis() {
  const task = state.analysisTask;
  if (!task) return;
  task.canceled = true;
  task.paused = false;
  const resolvers = task.resumeResolvers.splice(0);
  for (const resolve of resolvers) resolve();
  state.analysisTask = null;
  state.analyzing = false;
  state.paused = false;
  updateRunControls();
}

function updateRunControls() {
  const hasVideo = Boolean(els.video.src);
  els.analyzeBtn.disabled = !hasVideo || state.analyzing;
  els.pauseBtn.disabled = !state.analyzing;
  els.nameBtn.disabled = state.analyzing || state.naming || state.results.length === 0;
  els.pauseBtn.textContent = state.paused ? "继续" : "暂停";
  els.sampleInterval.disabled = state.analyzing;
  els.matchThreshold.disabled = state.analyzing;
  els.apiKeyInput.disabled = state.naming;
  els.apiBaseInput.disabled = state.naming;
  els.modelInput.disabled = state.naming;
}

function formatProgressPosition(task) {
  const time = Math.min(task.duration, task.step * task.interval);
  return `${formatDuration(time)} / ${formatDuration(task.duration)}`;
}

function prepareFrameCanvas() {
  els.frameCanvas.width = els.video.videoWidth;
  els.frameCanvas.height = els.video.videoHeight;
}

function drawFrame() {
  frameCtx.drawImage(els.video, 0, 0, els.frameCanvas.width, els.frameCanvas.height);
}

function updateTaskTrayCenterY(task) {
  if (!task) return;
  // 每帧尝试检测空托盘的暗槽带中点；只在能检出时累积样本。
  // 用中位数做稳健估计，避免开局横幅/动画帧把托盘 Y 锁错。
  // 一旦样本足够多且收敛即标记 locked（仅用于 hasTrayEvidence 判定，不再阻止后续微调）。
  const detected = detectTrayCenterFromFrame();
  if (!detected) return;

  const samples = task.trayCenterYSamples;
  samples.push(detected.centerY);
  if (samples.length > 41) samples.shift();
  const sorted = samples.slice().sort((a, b) => a - b);
  task.trayCenterY = sorted[Math.floor(sorted.length / 2)];
  if (samples.length >= 5) task.trayCenterYLocked = true;
}

function detectTrayCenterYFromFrame() {
  return detectTrayCenterFromFrame();
}

// 扫描每个 refY 的暗槽数，找出"≥minDarkSlots 暗槽"的最长连续区间，返回其中点。
// 空托盘的暗槽带很高(本例 refY 210~326)，旧逻辑取最接近默认 207 的那行=带顶，
// 导致裁切比真实瓦片中心高出 ~50px。取带中点可自动居中，且对托盘位于 207 的旧关卡向后兼容。
function detectTrayCenterFromFrame() {
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const scale = Math.min(scaleX, scaleY);
  const slotSize = REFERENCE.slotSize * scale;

  const rows = [];
  for (let refY = TRAY_CENTER_SCAN.yStart; refY <= TRAY_CENTER_SCAN.yEnd; refY += TRAY_CENTER_SCAN.step) {
    let darkSlots = 0;
    let score = 0;
    for (const refX of REFERENCE.slotCentersX) {
      const sx = clamp(Math.round(refX * scaleX - slotSize / 2), 0, els.frameCanvas.width - 1);
      const sy = clamp(Math.round(refY * scaleY - slotSize / 2), 0, els.frameCanvas.height - 1);
      const sw = Math.min(Math.max(1, Math.round(slotSize)), els.frameCanvas.width - sx);
      const sh = Math.min(Math.max(1, Math.round(slotSize)), els.frameCanvas.height - sy);
      const profile = traySlotPixelProfile(sx, sy, sw, sh);
      if (profile.darkRatio >= 0.18) {
        darkSlots += 1;
        score += 1.8 + Math.min(1.6, profile.darkRatio * 3);
      } else if (profile.darkRatio >= 0.1 && profile.coolDarkRatio >= 0.14) {
        score += 0.7;
      }
    }
    rows.push({ refY, darkSlots, score });
  }

  // 找最长连续的"达标"区间
  let bestRun = null;
  let runStart = -1;
  let runScore = 0;
  for (let i = 0; i <= rows.length; i += 1) {
    const ok = i < rows.length && rows[i].darkSlots >= TRAY_CENTER_SCAN.minDarkSlots;
    if (ok) {
      if (runStart < 0) { runStart = i; runScore = 0; }
      runScore += rows[i].score;
    } else if (runStart >= 0) {
      const run = { start: runStart, end: i - 1, len: i - runStart, score: runScore };
      if (!bestRun || run.len > bestRun.len || (run.len === bestRun.len && run.score > bestRun.score)) {
        bestRun = run;
      }
      runStart = -1;
    }
  }
  if (!bestRun) return null;

  const midRow = rows[Math.floor((bestRun.start + bestRun.end) / 2)];
  const totalScore = rows.slice(bestRun.start, bestRun.end + 1).reduce((s, r) => s + r.score, 0);
  if (totalScore < TRAY_CENTER_SCAN.minScore) return null;
  return { centerY: midRow.refY, darkSlots: midRow.darkSlots, score: midRow.score, bandLen: bestRun.len };
}

function traySlotPixelProfile(sx, sy, sw, sh) {
  const crop = frameCtx.getImageData(sx, sy, sw, sh);
  let total = 0;
  let dark = 0;
  let coolDark = 0;
  let white = 0;
  const stride = crop.width > 46 || crop.height > 46 ? 2 : 1;

  for (let y = 0; y < crop.height; y += stride) {
    for (let x = 0; x < crop.width; x += stride) {
      const p = (y * crop.width + x) * 4;
      const r = crop.data[p];
      const g = crop.data[p + 1];
      const b = crop.data[p + 2];
      total += 1;
      if (r > 205 && g > 205 && b > 200) white += 1;
      const darkSlotPixel = r <= 82 && g >= 32 && g <= 128 && b >= 42 && b <= 150 && b >= r + 6;
      const coolDarkPixel = r <= 98 && g <= 138 && b >= 54 && b <= 164 && b >= g - 18;
      if (darkSlotPixel) dark += 1;
      if (coolDarkPixel) coolDark += 1;
    }
  }

  return {
    darkRatio: dark / Math.max(1, total),
    coolDarkRatio: coolDark / Math.max(1, total),
    whiteRatio: white / Math.max(1, total),
  };
}

function bestTileCropAtReferenceY(refX, baseRefY, refSize, yOffsets, scaleX, scaleY, scale) {
  let best = null;
  for (const yOffset of yOffsets) {
    const centerY = baseRefY + yOffset;
    const crop = tileCropAtReferenceCenter(refX, centerY, refSize, scaleX, scaleY, scale);
    const quality = tileCropSelectionQuality(crop.features);
    if (!best || quality > best.quality) {
      best = { ...crop, centerY, yOffset, quality };
    }
  }
  return best;
}

function tileCropAtReferenceCenter(refX, refY, refSize, scaleX, scaleY, scale) {
  const cropSize = refSize * scale;
  const x = refX * scaleX - cropSize / 2;
  const y = refY * scaleY - cropSize / 2;
  const sx = clamp(Math.round(x), 0, els.frameCanvas.width - 1);
  const sy = clamp(Math.round(y), 0, els.frameCanvas.height - 1);
  const sw = Math.min(Math.max(1, Math.round(cropSize)), els.frameCanvas.width - sx);
  const sh = Math.min(Math.max(1, Math.round(cropSize)), els.frameCanvas.height - sy);
  return {
    sx,
    sy,
    sw,
    sh,
    features: featuresFromFrameCrop(sx, sy, sw, sh),
  };
}

function tileCropSelectionQuality(features) {
  if (!features || !isLikelyOccupied(features)) return -Infinity;
  const shape = analyzeMaskShape(features);
  if (!shape) return -Infinity;

  const completeScore = isCompleteTileCandidate(features) ? 2.4 : isLikelyTileCandidate(features) ? 0.8 : 0;
  const subject = foregroundSubjectProfile(features);
  const tileBackground = tileBackgroundProfile(features);
  const whiteScore = Math.min(0.7, features.whiteRatio * 1.4);
  const contentScore = Math.min(0.8, features.contentRatio * 1.2);
  const shapeScore = Math.min(0.6, shape.area / 900) + Math.min(0.35, shape.fillRatio * 0.45);
  const framePenalty = Math.min(0.7, shape.edgeContact);

  let subjectScore = 0;
  if (subject) {
    subjectScore =
      Math.min(0.75, subject.area / 260) +
      Math.min(0.55, subject.centralShare * 0.8) -
      Math.min(0.55, subject.edgeContact * 0.9);
  }

  return (
    completeScore +
    whiteScore +
    contentScore +
    shapeScore +
    subjectScore +
    tileBackground.whiteCorners * 0.18 -
    framePenalty
  );
}

function detectTrayTiles(threshold, options = {}) {
  const allowUnknown = options.allowUnknown !== false;
  const createUnknown = options.createUnknown !== false;
  const detections = [];
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const scale = Math.min(scaleX, scaleY);
  const trayCenterY = options.trayCenterY || REFERENCE.slotCenterY;

  for (let index = 0; index < REFERENCE.slotCentersX.length; index += 1) {
    const crop = bestTileCropAtReferenceY(
      REFERENCE.slotCentersX[index],
      trayCenterY,
      REFERENCE.slotSize,
      TRAY_TILE_CROP_Y_OFFSETS,
      scaleX,
      scaleY,
      scale,
    );
    const features = crop.features;
    if (!isLikelyOccupied(features) || !isLikelyTileCandidate(features)) continue;

    const match = matchTemplate(features, threshold, { allowUnknown, createUnknown });
    if (match) {
      detections.push({ slot: index, cropYOffset: crop.yOffset, ...match });
    }
  }

  return detections;
}

function detectTrayShatter(trayCenterY = REFERENCE.slotCenterY) {
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const slotSize = REFERENCE.slotSize * Math.min(scaleX, scaleY);
  const y = trayCenterY * scaleY - slotSize / 2;
  let shatterSlots = 0;

  for (let index = 0; index < REFERENCE.slotCentersX.length; index += 1) {
    const x = REFERENCE.slotCentersX[index] * scaleX - slotSize / 2;
    const crop = frameCtx.getImageData(
      clamp(Math.round(x), 0, els.frameCanvas.width - 1),
      clamp(Math.round(y), 0, els.frameCanvas.height - 1),
      clamp(Math.round(slotSize), 1, els.frameCanvas.width),
      clamp(Math.round(slotSize), 1, els.frameCanvas.height),
    );
    const features = featuresFromImageData(crop);
    if (features.whiteRatio > 0.24 && features.contentRatio < 0.045) {
      shatterSlots += 1;
    }
  }

  return shatterSlots >= 2;
}

function detectTrayTransition(trayCenterY = REFERENCE.slotCenterY) {
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const slotSize = REFERENCE.slotSize * Math.min(scaleX, scaleY);
  const y = trayCenterY * scaleY - slotSize / 2;
  let transitionSlots = 0;

  for (let index = 0; index < REFERENCE.slotCentersX.length; index += 1) {
    const x = REFERENCE.slotCentersX[index] * scaleX - slotSize / 2;
    const crop = frameCtx.getImageData(
      clamp(Math.round(x), 0, els.frameCanvas.width - 1),
      clamp(Math.round(y), 0, els.frameCanvas.height - 1),
      clamp(Math.round(slotSize), 1, els.frameCanvas.width),
      clamp(Math.round(slotSize), 1, els.frameCanvas.height),
    );
    const features = featuresFromImageData(crop);
    if (features.whiteRatio > 0.72 && features.contentRatio < 0.17) {
      transitionSlots += 1;
    }
  }

  return transitionSlots >= 2;
}

function detectBoardBurst() {
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const x = 0;
  const y = Math.round(250 * scaleY);
  const width = Math.round(360 * scaleX);
  const height = Math.round(430 * scaleY);
  const crop = frameCtx.getImageData(
    x,
    clamp(y, 0, els.frameCanvas.height - 1),
    clamp(width, 1, els.frameCanvas.width),
    clamp(height, 1, els.frameCanvas.height),
  );
  let bright = 0;
  for (let i = 0; i < crop.data.length; i += 4) {
    const r = crop.data[i];
    const g = crop.data[i + 1];
    const b = crop.data[i + 2];
    if (r > 235 && g > 235 && b > 230) bright += 1;
  }

  return bright / (crop.width * crop.height) > 0.16;
}

function diagnoseTraySlots(threshold, trayCenterY = REFERENCE.slotCenterY) {
  const diagnostics = [];
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const slotSize = REFERENCE.slotSize * Math.min(scaleX, scaleY);
  const y = trayCenterY * scaleY - slotSize / 2;

  for (let index = 0; index < REFERENCE.slotCentersX.length; index += 1) {
    const x = REFERENCE.slotCentersX[index] * scaleX - slotSize / 2;
    const crop = frameCtx.getImageData(
      clamp(Math.round(x), 0, els.frameCanvas.width - 1),
      clamp(Math.round(y), 0, els.frameCanvas.height - 1),
      clamp(Math.round(slotSize), 1, els.frameCanvas.width),
      clamp(Math.round(slotSize), 1, els.frameCanvas.height),
    );
    const features = featuresFromImageData(crop);
    const completeTile = isCompleteTileCandidate(features);
    const scores = state.templates
      .map((template) => ({
        id: template.id,
        label: template.label,
        score: compareFeatures(features, template.features),
      }))
      .sort((a, b) => b.score - a.score);
    diagnostics.push({
      slot: index,
      occupied: isLikelyOccupied(features),
      completeTile,
      whiteRatio: Number(features.whiteRatio.toFixed(3)),
      contentRatio: Number(features.contentRatio.toFixed(3)),
      color: safeColorName(colorNameFromFeatures(features)),
      shape: visualShapeName(features, colorNameFromFeatures(features)),
      maskShape: compactMaskShape(analyzeMaskShape(features)),
      colorProfile: contentColorProfile(features),
      best: scores[0],
      passes: scores[0]?.score >= threshold,
    });
  }

  return diagnostics;
}

function compactMaskShape(shape) {
  if (!shape) return null;
  return {
    width: shape.width,
    height: shape.height,
    area: shape.area,
    aspect: Number(shape.aspect.toFixed(2)),
    roundness: Number(shape.roundness.toFixed(2)),
    fillRatio: Number(shape.fillRatio.toFixed(2)),
    pcaAspect: Number(shape.pcaAspect.toFixed(2)),
    edgeContact: Number(shape.edgeContact.toFixed(2)),
  };
}

function isLikelyOccupied(features) {
  return features.whiteRatio >= MIN_OCCUPIED_WHITE_RATIO && features.contentRatio >= MIN_CONTENT_RATIO;
}

function candidateTileShape(features) {
  const shape = analyzeMaskShape(features);
  if (!shape) return null;
  if (features.whiteRatio < MIN_COMPLETE_TILE_WHITE_RATIO) return null;
  if (shape.area < 34) return null;
  if (shape.edgeContact >= 0.62) return null;
  if (shape.width < 6 || shape.height < 6) return null;
  if (isLikelyNonTileFragment(features, shape)) return null;
  return shape;
}

function isLikelyTileCandidate(features) {
  return Boolean(candidateTileShape(features));
}

function isCompleteTileCandidate(features) {
  const shape = candidateTileShape(features);
  if (!shape) return false;
  if (!hasRecordableUnknownSubject(features, shape)) return false;
  const profile = contentColorProfile(features);
  const dominantKnownColorRatio = Math.max(profile.yellowOrangeRatio, profile.greenRatio, profile.redPinkRatio);
  if (shape.area >= 980 && shape.fillRatio >= 0.64 && shape.roundness <= 0.22 && dominantKnownColorRatio < 0.46) {
    return false;
  }
  return true;
}

function hasRecordableUnknownSubject(features, shape) {
  const subject = foregroundSubjectProfile(features);
  if (!subject) return false;
  if (subject.area < MIN_UNKNOWN_SUBJECT_AREA) return false;
  if (subject.width < MIN_UNKNOWN_SUBJECT_DIMENSION || subject.height < MIN_UNKNOWN_SUBJECT_DIMENSION) return false;
  if (subject.centralArea < MIN_UNKNOWN_SUBJECT_CENTRAL_AREA && subject.centralShare < 0.35) return false;
  const tileBackground = tileBackgroundProfile(features);
  if (!hasCompleteTileBackground(features, subject, tileBackground)) return false;

  const subjectShare = subject.area / Math.max(1, shape.area);
  return !isLikelyBackdropSubjectFragment(features, shape, subject, subjectShare);
}

function hasCompleteTileBackground(features, subject, tileBackground) {
  const hasEnoughWhiteCorners = tileBackground.whiteCorners >= MIN_COMPLETE_TILE_WHITE_CORNERS;
  const strongCenteredSubject = isStrongCenteredTileSubject(features, subject);

  const edgeSlab =
    subject.sideContacts >= 2 &&
    subject.fillRatio >= 0.5 &&
    subject.centralShare < 0.72 &&
    features.whiteRatio < EDGE_SLAB_MAX_WHITE_RATIO &&
    tileBackground.whiteCorners < 4;
  if (edgeSlab && !strongCenteredSubject) return false;

  if (!hasEnoughWhiteCorners && features.whiteRatio < PARTIAL_CORNER_MIN_WHITE_RATIO && !strongCenteredSubject) {
    return false;
  }
  return true;
}

function isStrongCenteredTileSubject(features, subject) {
  if (!features || !subject) return false;
  const subjectShare = subject.area / Math.max(1, countMaskPixels(features.mask));
  return (
    subject.area >= 34 &&
    subjectShare >= 0.18 &&
    subject.centralArea >= 12 &&
    subject.centralShare >= 0.42 &&
    subject.edgeContact < 0.28 &&
    subject.fillRatio < 0.72
  );
}

function isLikelyBackdropSubjectFragment(features, shape, subject, subjectShare) {
  if (isEdgeTextOrBannerFragment(features, subject)) return true;

  if (
    shape.area >= UNKNOWN_BACKDROP_MIN_AREA &&
    shape.fillRatio >= 0.45 &&
    subjectShare < UNKNOWN_BACKDROP_MAX_SUBJECT_SHARE
  ) {
    return true;
  }

  if (
    subject.area <= UNKNOWN_EDGE_FRAGMENT_MAX_AREA &&
    subject.sideContacts >= 1 &&
    subject.centralShare < 0.45 &&
    subjectShare < 0.18
  ) {
    return true;
  }

  const whiteProfile = whitePixelProfile(features);
  const coolRatio = coolContentRatio(features);
  return (
    features.whiteRatio < NON_TILE_FRAGMENT_WHITE_RATIO &&
    coolRatio >= NON_TILE_FRAGMENT_COOL_RATIO &&
    whiteProfile.bottomShare >= NON_TILE_FRAGMENT_BOTTOM_WHITE_SHARE &&
    whiteProfile.edgeShare >= 0.34 &&
    subject.sideContacts >= 1 &&
    subject.centralShare < 0.55
  );
}

function isEdgeTextOrBannerFragment(features, subject) {
  if (!features || !subject) return false;
  const anchoredSide = subject.minX <= 5 || subject.maxX >= VECTOR_SIZE - 6;
  const anchoredBottom = subject.maxY >= VECTOR_SIZE - (PATTERN_BOTTOM_TRIM + 5);
  const lowerHeavy =
    subject.bottomShare >= EDGE_TEXT_FRAGMENT_BOTTOM_SHARE &&
    subject.topShare <= EDGE_TEXT_FRAGMENT_TOP_SHARE;
  const sideHeavy = Math.max(subject.leftShare, subject.rightShare) >= 0.28;
  const stripLike = subject.width >= 14 && subject.height <= 18 && subject.fillRatio < 0.68;
  const coolOrTextLike = coolContentRatio(features) >= 0.45 || subject.fillRatio < 0.48;

  return anchoredSide && anchoredBottom && lowerHeavy && sideHeavy && (stripLike || coolOrTextLike);
}

function foregroundSubjectProfile(features) {
  const mask = innerPatternMask(features, PATTERN_BOTTOM_TRIM + 3);
  const bounds = maskBounds(mask);
  if (!bounds) return null;

  let centralArea = 0;
  let edgeArea = 0;
  let topArea = 0;
  let bottomArea = 0;
  let leftArea = 0;
  let rightArea = 0;
  for (let y = 0, index = 0; y < VECTOR_SIZE; y += 1) {
    for (let x = 0; x < VECTOR_SIZE; x += 1, index += 1) {
      if (!mask[index]) continue;
      if (x >= 7 && x <= VECTOR_SIZE - 8 && y >= 5 && y <= VECTOR_SIZE - 10) centralArea += 1;
      if (x <= 2 || y <= 2 || x >= VECTOR_SIZE - 3 || y >= VECTOR_SIZE - 3) edgeArea += 1;
      if (y <= 15) topArea += 1;
      if (y >= 24) bottomArea += 1;
      if (x <= 8) leftArea += 1;
      if (x >= VECTOR_SIZE - 9) rightArea += 1;
    }
  }

  return {
    ...bounds,
    centralArea,
    centralShare: centralArea / Math.max(1, bounds.area),
    edgeContact: edgeArea / Math.max(1, bounds.area),
    topShare: topArea / Math.max(1, bounds.area),
    bottomShare: bottomArea / Math.max(1, bounds.area),
    leftShare: leftArea / Math.max(1, bounds.area),
    rightShare: rightArea / Math.max(1, bounds.area),
    fillRatio: bounds.area / Math.max(1, bounds.width * bounds.height),
    sideContacts:
      (bounds.minX <= 4 ? 1 : 0) +
      (bounds.maxX >= VECTOR_SIZE - 5 ? 1 : 0) +
      (bounds.minY <= 4 ? 1 : 0) +
      (bounds.maxY >= VECTOR_SIZE - 5 ? 1 : 0),
  };
}

function isLikelyNonTileFragment(features, shape) {
  const thinHorizontalFragment =
    features.whiteRatio < NON_TILE_FRAGMENT_WHITE_RATIO &&
    shape.width >= 26 &&
    shape.height <= 16 &&
    (shape.aspect >= 2.2 || shape.pcaAspect >= 3.2);
  if (thinHorizontalFragment) return true;

  const whiteProfile = whitePixelProfile(features);
  const coolRatio = coolContentRatio(features);
  return (
    features.whiteRatio < NON_TILE_FRAGMENT_WHITE_RATIO &&
    coolRatio >= NON_TILE_FRAGMENT_COOL_RATIO &&
    whiteProfile.bottomShare >= NON_TILE_FRAGMENT_BOTTOM_WHITE_SHARE &&
    whiteProfile.edgeShare >= 0.34
  );
}

function whitePixelProfile(features) {
  let total = 0;
  let bottom = 0;
  let edge = 0;

  for (let index = 0, p = 0; index < features.rgb.length / 3; index += 1, p += 3) {
    const r = features.rgb[p];
    const g = features.rgb[p + 1];
    const b = features.rgb[p + 2];
    if (r <= 205 || g <= 205 || b <= 200) continue;

    total += 1;
    const x = index % VECTOR_SIZE;
    const y = Math.floor(index / VECTOR_SIZE);
    if (y >= VECTOR_SIZE * 0.7) bottom += 1;
    if (x <= 2 || y <= 2 || x >= VECTOR_SIZE - 3 || y >= VECTOR_SIZE - 3) edge += 1;
  }

  if (!total) return { bottomShare: 0, edgeShare: 0 };
  return {
    bottomShare: bottom / total,
    edgeShare: edge / total,
  };
}

function tileBackgroundProfile(features) {
  const zones = [
    { x1: 4, y1: 4, x2: 12, y2: 12, row: "top" },
    { x1: 28, y1: 4, x2: 36, y2: 12, row: "top" },
    { x1: 4, y1: 26, x2: 12, y2: 34, row: "bottom" },
    { x1: 28, y1: 26, x2: 36, y2: 34, row: "bottom" },
  ];
  let whiteCorners = 0;
  let topWhiteCorners = 0;
  let bottomWhiteCorners = 0;
  const shares = [];

  for (const zone of zones) {
    let white = 0;
    let total = 0;
    for (let y = zone.y1; y < zone.y2; y += 1) {
      for (let x = zone.x1; x < zone.x2; x += 1) {
        const offset = (y * VECTOR_SIZE + x) * 3;
        if (isTileBackgroundPixel(features.rgb[offset], features.rgb[offset + 1], features.rgb[offset + 2])) {
          white += 1;
        }
        total += 1;
      }
    }
    const share = total ? white / total : 0;
    shares.push(share);
    if (share >= TILE_CORNER_WHITE_SHARE) {
      whiteCorners += 1;
      if (zone.row === "top") topWhiteCorners += 1;
      if (zone.row === "bottom") bottomWhiteCorners += 1;
    }
  }

  return { shares, whiteCorners, topWhiteCorners, bottomWhiteCorners };
}

function isTileBackgroundPixel(r, g, b) {
  return r > 205 && g > 205 && b > 200;
}

function coolContentRatio(features) {
  let content = 0;
  let cool = 0;

  for (let index = 0, p = 0; index < features.mask.length; index += 1, p += 3) {
    if (!features.mask[index]) continue;
    content += 1;
    const r = features.rgb[p];
    const g = features.rgb[p + 1];
    const b = features.rgb[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = (max - min) / Math.max(max, 1);
    const brightness = max / 255;
    const hue = rgbHue(r, g, b);
    if (hue >= 205 && hue <= 295 && saturation > 0.18 && brightness > 0.22) cool += 1;
  }

  return content ? cool / content : 0;
}

function matchTemplate(features, threshold, options = {}) {
  if (typeof options === "boolean") options = { allowUnknown: options };
  const allowUnknown = options.allowUnknown !== false;
  const createUnknown = options.createUnknown !== false;
  let best = null;
  for (const template of state.templates) {
    const score = compareFeatures(features, template.features);
    if (!best || score > best.score) {
      const group = template.group || template.id;
      best = {
        id: group,
        label: template.label,
        score,
        known: true,
        variant: template.id,
      };
    }
  }

  const colorCompatibleBest = best ? isBuiltinColorCompatible(best, features) : false;
  const relaxedColorMismatch =
    best &&
    !colorCompatibleBest &&
    best.score >= builtinColorMismatchScoreThreshold(best) &&
    best.score < BUILTIN_COLOR_MISMATCH_SCORE_THRESHOLD;
  const shapeCompatibleBest = best ? isBuiltinShapeCompatible(best, features) : false;
  const builtinDirectThreshold = best ? Math.max(threshold, builtinDirectMatchThreshold(best)) : BUILTIN_DIRECT_MATCH_THRESHOLD;
  const shapeCompatibleBuiltin =
    shapeCompatibleBest &&
    best &&
    ((best.score >= builtinDirectThreshold && isAcceptableBuiltinMatch(best, features)) ||
      (colorCompatibleBest &&
        best.score >= Math.max(threshold - BUILTIN_COLOR_COMPATIBLE_MARGIN, builtinDirectMatchThreshold(best))));

  if (shapeCompatibleBuiltin) {
    const localLabel = localNameFromTemplateMatch(best, features);
    const entry = ensureLevelEntry(best.id, features, {
      builtin: true,
      fallbackLabel: localLabel,
    });
    entry.needsVisionName = false;
    entry.visionNamed = true;
    return {
      id: entry.id,
      label: entry.label,
      thumb: entry.thumb,
      score: best.score,
      known: true,
      variant: best.variant,
      relaxedColorMismatch,
      matchSource: "builtin",
    };
  }
  if (!ANONYMOUS_PATTERN_MODE) {
    const localShapeMatch = localShapeCandidate(features);
    if (localShapeMatch) return localShapeMatch;
    const savedDictionaryMatch = matchSavedDictionary(features);
    if (savedDictionaryMatch) return savedDictionaryMatch;
  }
  if (!allowUnknown) return null;
  if (!isCompleteTileCandidate(features)) return null;

  let unknownBest = null;
  for (const unknown of state.unknowns) {
    if (!roughPatternComparable(features, unknown.features)) continue;
    const match = samePatternFeatureMatch(features, unknown.features, { allowPartial: false });
    if (!match.matched) continue;
    if (!unknownBest || match.score > unknownBest.score) {
      unknownBest = {
        id: unknown.id,
        label: unknown.label,
        thumb: unknown.thumb,
        score: match.score,
        known: false,
        matchSource: match.source,
      };
    }
  }

  if (unknownBest) {
    const entry = findLevelEntryById(unknownBest.id);
    updateLevelEntryThumbnail(entry, features);
    return {
      ...unknownBest,
      label: entry?.label || unknownBest.label,
      thumb: entry?.thumb || unknownBest.thumb,
    };
  }
  if (!createUnknown) return null;

  const unknown = createUnknownTemplate(features);
  state.unknowns.push(unknown);
  return { id: unknown.id, label: unknown.label, thumb: unknown.thumb, score: 1, known: false, matchSource: "new-unknown" };
}

function localShapeCandidate(features) {
  const localShape = localShapeObjectFromFeatures(features);
  if (!localShape) return null;

  const entry = ensureLevelEntry(`shape-${localShape.id}`, features, {
      builtin: false,
    fallbackLabel: localShape.label,
  });
  entry.needsVisionName = false;
  entry.visionNamed = true;
  return {
    id: entry.id,
    label: entry.label,
    thumb: entry.thumb,
    score: 1,
    known: true,
    localShape: localShape.id,
  };
}

function localShapeNameFromFeatures(features) {
  return localShapeObjectFromFeatures(features)?.label || "";
}

function localShapeObjectFromFeatures(features) {
  if (isLeafLikeFeatures(features)) return { id: "leaf", label: "绿色叶子" };
  if (isMangoLikeFeatures(features)) return { id: "mango", label: "黄色芒果" };
  const stemmedFruit = stemmedFruitObjectFromFeatures(features);
  if (stemmedFruit) {
    return {
      id: stemmedFruitObjectId(stemmedFruit),
      label: `${OBJECT_DEFAULT_COLORS[stemmedFruit] || safeColorName(colorNameFromFeatures(features))}${stemmedFruit}`,
      objectName: stemmedFruit,
    };
  }
  if (isFlowerLikeFeatures(features)) {
    const colorName = flowerColorName(features);
    return { id: `flower-${colorIdFromColorName(colorName)}`, label: `${colorName}花朵`, objectName: "花朵" };
  }
  return null;
}

function matchSavedDictionary(features) {
  if (!features || !state.savedDictionary.length) return null;
  let best = null;
  for (const item of state.savedDictionary) {
    if (!item.features) continue;
    const score = compareFeatures(features, item.features);
    if (!best || score > best.score) best = { item, score };
  }
  if (!best) return null;

  const detectedColor = colorNameFromFeatures(features);
  const savedColor = colorNameFromLabel(best.item.label) || best.item.colorName;
  const colorCompatible = areColorNamesCompatible(detectedColor, savedColor);
  const threshold = colorCompatible
    ? SAVED_DICTIONARY_MATCH_THRESHOLD - SAVED_DICTIONARY_COLOR_MARGIN
    : SAVED_DICTIONARY_MATCH_THRESHOLD;
  if (best.score < threshold) return null;
  if (!isSavedDictionaryShapeCompatible(best.item, features)) return null;

  const entry = ensureLevelEntry(best.item.id, features, {
    builtin: false,
    fallbackLabel: best.item.label,
    thumb: best.item.thumb,
  });
  entry.needsVisionName = false;
  entry.visionNamed = true;
  return {
    id: entry.id,
    label: entry.label,
    thumb: entry.thumb,
    score: best.score,
    known: true,
    savedDictionary: true,
  };
}

function isAcceptableBuiltinMatch(match, features) {
  if (isBuiltinColorCompatible(match, features)) return true;
  return match.score >= builtinColorMismatchScoreThreshold(match);
}

function builtinColorMismatchScoreThreshold(match) {
  return BUILTIN_COLOR_MISMATCH_SCORE_OVERRIDES[match.id] || BUILTIN_COLOR_MISMATCH_SCORE_THRESHOLD;
}

function builtinDirectMatchThreshold(match) {
  return BUILTIN_DIRECT_MATCH_THRESHOLD_OVERRIDES[match.id] || BUILTIN_DIRECT_MATCH_THRESHOLD;
}

function isBuiltinShapeCompatible(match, features) {
  const objectName = objectNameFromTemplateLabel(match.label);
  if (objectName === "兔子" && isMangoLikeFeatures(features)) return false;
  return true;
}

function isBuiltinColorCompatible(match, features) {
  const detectedColor = colorNameFromFeatures(features);
  const templateColor = colorNameFromLabel(match.label);
  return areColorNamesCompatible(detectedColor, templateColor);
}

function localNameFromTemplateMatch(match, features) {
  const objectName = objectNameFromTemplateLabel(match.label);
  const colorName = localColorNameForObject(features, objectName);
  return `${colorName}${objectName}`;
}

function objectNameFromTemplateLabel(label) {
  return stripColorPrefix(label).replace(/^色/, "") || "物件";
}

function isSavedDictionaryShapeCompatible(item, features) {
  const localShape = localShapeObjectFromFeatures(features);
  if (!localShape?.objectName) return true;
  const savedObject = objectNameFromTemplateLabel(item.label);
  if (!savedObject || isGenericShapeName(savedObject)) return false;
  return areObjectNamesCompatible(savedObject, localShape.objectName);
}

function isGenericShapeName(name) {
  return /物件|饰物|晶石|水晶|圆饰|竖饰|长条|果实|宝石/.test(name || "");
}

function areObjectNamesCompatible(a, b) {
  const nameA = normalizeObjectName(a);
  const nameB = normalizeObjectName(b);
  if (!nameA || !nameB) return true;
  if (nameA === nameB) return true;
  const aliasGroups = [
    ["樱桃", "车厘子"],
    ["叶子", "叶片", "绿叶"],
    ["花朵", "花"],
    ["梨子", "梨"],
    ["桃子", "水蜜桃"],
    ["芒果"],
  ];
  return aliasGroups.some((group) => group.includes(nameA) && group.includes(nameB));
}

function normalizeObjectName(name) {
  return String(name || "")
    .trim()
    .replace(/^色/, "")
    .replace(/儿$/, "子");
}

function localColorNameForObject(features, objectName) {
  if (OBJECT_DEFAULT_COLORS[objectName]) return OBJECT_DEFAULT_COLORS[objectName];
  return safeColorName(colorNameFromFeatures(features));
}

function createUnknownTemplate(features) {
  const id = `unknown-${state.unknowns.length + 1}`;
  const entry = ensureLevelEntry(id, features, { builtin: false });
  return {
    id,
    label: entry.label,
    thumb: entry.thumb,
    features,
    builtin: false,
  };
}

function ensureLevelEntry(id, features, options = {}) {
  const existing = state.levelEntries.get(id);
  if (existing) {
    updateLevelEntryThumbnail(existing, features);
    return existing;
  }

  const colorName = safeColorName(colorNameFromFeatures(features));
  const fallbackLabel = options.fallbackLabel || "";
  const label = ANONYMOUS_PATTERN_MODE ? assignedAnonymousPatternName(id) || "花色?" : fallbackLabel || provisionalNameFromFeatures(features, colorName);
  const entry = {
    id,
    label,
    thumb: features ? vectorCanvasFromFeatures(features).toDataURL("image/png") : options.thumb || "",
    features,
    thumbQuality: thumbnailQualityScore(features),
    colorName,
    builtin: Boolean(options.builtin),
    fallbackLabel,
    visionNamed: Boolean(fallbackLabel),
    needsVisionName: !fallbackLabel,
    namingPromise: null,
    namingError: "",
  };
  state.levelEntries.set(id, entry);
  return entry;
}

function updateLevelEntryThumbnail(entry, features) {
  if (!entry || !features) return false;

  const nextQuality = thumbnailQualityScore(features);
  const currentQuality = Number.isFinite(entry.thumbQuality)
    ? entry.thumbQuality
    : thumbnailQualityScore(entry.features);
  if (!shouldReplaceThumbnail(currentQuality, nextQuality, entry)) return false;

  entry.features = features;
  entry.thumb = vectorCanvasFromFeatures(features).toDataURL("image/png");
  entry.thumbQuality = nextQuality;
  entry.colorName = safeColorName(colorNameFromFeatures(features));

  const unknown = state.unknowns.find((item) => item.id === entry.id);
  if (unknown) {
    unknown.features = features;
    unknown.thumb = entry.thumb;
    unknown.label = entry.label;
    unknown.thumbQuality = nextQuality;
  }

  let changedEventThumb = false;
  for (const event of state.events) {
    if (event.id !== entry.id) continue;
    event.thumb = entry.thumb;
    event.label = entry.label;
    changedEventThumb = true;
  }
  if (changedEventThumb) state.resultsDirty = true;
  return true;
}

function shouldReplaceThumbnail(currentQuality, nextQuality, entry) {
  if (!Number.isFinite(nextQuality)) return false;
  if (!entry.thumb || !entry.features) return true;
  if (!Number.isFinite(currentQuality)) return true;
  if (nextQuality >= currentQuality + THUMBNAIL_REPLACE_MARGIN) return true;
  return currentQuality < THUMBNAIL_LOW_QUALITY_SCORE && nextQuality >= currentQuality + THUMBNAIL_LOW_QUALITY_REPLACE_MARGIN;
}

function thumbnailQualityScore(features) {
  if (!features) return -Infinity;
  if (Number.isFinite(features._thumbnailQuality)) return features._thumbnailQuality;

  const shape = analyzeMaskShape(features);
  const subject = foregroundSubjectProfile(features);
  if (!shape) {
    features._thumbnailQuality = -Infinity;
    return features._thumbnailQuality;
  }

  const shapeAreaScore = clamp((shape.area - 40) / 560, 0, 1);
  const whiteScore = clamp((features.whiteRatio - MIN_COMPLETE_TILE_WHITE_RATIO) / 0.34, 0, 1);
  const tileBackground = tileBackgroundProfile(features);
  const cornerScore = clamp(tileBackground.whiteCorners / 4, 0, 1);
  const contentScore = clamp((features.contentRatio - MIN_CONTENT_RATIO) / 0.24, 0, 1);
  const framePenalty = clamp(shape.edgeContact / 0.62, 0, 1);

  let subjectScore = 0.25;
  let centerScore = 0.25;
  let subjectEdgePenalty = 0.35;
  if (subject) {
    const subjectShare = subject.area / Math.max(1, shape.area);
    const sizeScore = clamp(Math.min(subject.width, subject.height) / 14, 0, 1);
    subjectScore = 0.55 * clamp((subjectShare - 0.04) / 0.28, 0, 1) + 0.45 * sizeScore;
    centerScore = clamp(subject.centralShare / 0.72, 0, 1);
    subjectEdgePenalty = clamp(subject.edgeContact / 0.34, 0, 1);
  }

  const transitionPenalty =
    (features.whiteRatio > 0.72 && features.contentRatio < 0.17) ||
    (features.whiteRatio > 0.24 && features.contentRatio < 0.045)
      ? 0.2
      : 0;

  features._thumbnailQuality =
    0.2 * whiteScore +
    0.18 * contentScore +
    0.18 * shapeAreaScore +
    0.16 * cornerScore +
    0.22 * subjectScore +
    0.18 * centerScore -
    0.16 * framePenalty -
    0.18 * subjectEdgePenalty -
    transitionPenalty;
  return features._thumbnailQuality;
}

function assignedAnonymousPatternName(id) {
  const key = String(id || "");
  return state.patternNames.get(key) || "";
}

function setAnonymousPatternName(id, name) {
  const key = String(id || "");
  if (!key || !name) return;
  state.patternNames.set(key, name);
  const entry = findLevelEntryById(key);
  if (entry) entry.label = name;
  const unknown = state.unknowns.find((item) => item.id === key);
  if (unknown) unknown.label = name;
}

function anonymousPatternNameForId(id) {
  const existing = assignedAnonymousPatternName(id);
  if (existing) return existing;
  const name = `花色${state.nextPatternNumber}`;
  state.nextPatternNumber += 1;
  setAnonymousPatternName(id, name);
  return name;
}

function provisionalNameFromFeatures(features, colorName) {
  const shape = visualShapeName(features, colorName);
  if (OBJECT_DEFAULT_COLORS[shape]) return `${OBJECT_DEFAULT_COLORS[shape]}${shape}`;
  return `${shapeAwareColorName(colorName, shape)}${shape}`;
}

function shapeAwareColorName(colorName, shape) {
  const safe = safeColorName(colorName);
  if (shape === "筷子" && ["橙色", "黄色", "红色", "黑色"].includes(safe)) return "棕色";
  return safe;
}

function visualShapeName(features, colorName) {
  const shape = analyzeMaskShape(features);
  if (!shape) return "物件";

  const colorKey = colorKeyFromName(colorName);
  if (isLeafLikeFeatures(features, shape)) return "叶子";
  if (isMangoLikeFeatures(features)) return "芒果";
  const stemmedFruit = stemmedFruitObjectFromFeatures(features, shape, colorName);
  if (stemmedFruit) return stemmedFruit;
  if (isFlowerLikeFeatures(features, shape)) return "花朵";
  if (isChopstickLikeShape(shape, colorKey)) return "筷子";
  if (["紫", "蓝", "绿", "青"].includes(colorKey) && shape.angularity > 0.32) return "水晶";
  if (["红", "粉"].includes(colorKey) && shape.roundness > 0.58) return "果实";
  if (shape.aspect > 1.65 || shape.pcaAspect > 5.5) return "长条";
  if (shape.aspect < 0.62) return "竖饰";
  if (shape.roundness > 0.68) return "圆饰";
  if (shape.angularity > 0.36) return "晶石";
  return "饰物";
}

function isChopstickLikeShape(shape, colorKey) {
  const warmOrDark = ["棕", "橙", "黄", "红", "黑"].includes(colorKey);
  if (!warmOrDark) return false;
  if (shape.pcaAspect >= 7.2 && shape.fillRatio < 0.48) return true;
  if (shape.aspect >= 1.55 && shape.fillRatio < 0.45 && shape.area >= 55) return true;
  return false;
}

function isMangoLikeFeatures(features, shape = analyzeMaskShape(features)) {
  if (!features || !shape) return false;
  const profile = contentColorProfile(features);
  const compactFruitShape =
    shape.area >= 80 &&
    shape.roundness >= 0.34 &&
    shape.aspect >= 0.55 &&
    shape.aspect <= 1.55 &&
    shape.pcaAspect <= 2.7;
  return (
    compactFruitShape &&
    profile.yellowOrangeRatio >= 0.42 &&
    profile.greenRatio >= 0.018 &&
    profile.greenTopRatio >= 0.008
  );
}

function stemmedFruitObjectId(objectName) {
  return (
    {
      芒果: "mango",
      梨子: "pear",
      桃子: "peach",
      樱桃: "cherry",
    }[objectName] || `fruit-${objectName}`
  );
}

function colorIdFromColorName(colorName) {
  return (
    {
      红: "red",
      粉: "pink",
      橙: "orange",
      黄: "yellow",
      绿: "green",
      蓝: "blue",
      紫: "purple",
      青: "cyan",
      白: "white",
      黑: "black",
      棕: "brown",
      灰: "gray",
      彩: "color",
    }[colorKeyFromName(colorName)] || "color"
  );
}

function flowerColorName(features) {
  const colorName = safeColorName(colorNameFromFeatures(features));
  return areColorNamesCompatible(colorName, "红色") ? "红色" : colorName;
}

function stemmedFruitObjectFromFeatures(features, shape = analyzeMaskShape(features), colorName = colorNameFromFeatures(features)) {
  if (!features || !shape) return "";
  if (isCherryLikeFeatures(features, shape)) return "樱桃";

  const profile = contentColorProfile(features);
  if (!hasGreenTopAccent(features, profile)) return "";
  if (profile.greenRatio > 0.42) return "";

  const colorKey = colorKeyFromName(colorName);
  const compactFruit =
    shape.area >= 80 &&
    shape.area <= 900 &&
    shape.aspect >= 0.48 &&
    shape.aspect <= 1.65 &&
    shape.pcaAspect <= 2.9 &&
    shape.fillRatio >= 0.18 &&
    shape.edgeContact <= 0.5;
  if (!compactFruit) return "";

  if (["粉", "红"].includes(colorKey) && profile.redPinkRatio >= 0.28) {
    return colorKey === "粉" ? "桃子" : "樱桃";
  }

  if (["黄", "橙"].includes(colorKey) && profile.yellowOrangeRatio >= 0.24) {
    const pearLike = shape.aspect <= 1.18 && shape.pcaAspect <= 2.05 && shape.roundness >= 0.34;
    return pearLike ? "梨子" : "芒果";
  }

  return "";
}

function isCherryLikeFeatures(features, shape = analyzeMaskShape(features)) {
  if (!features || !shape) return false;
  const profile = contentColorProfile(features);
  const compactPair =
    shape.area >= 95 &&
    shape.area <= 900 &&
    shape.aspect >= 0.55 &&
    shape.aspect <= 1.75 &&
    shape.pcaAspect <= 2.8 &&
    shape.fillRatio >= 0.18 &&
    shape.edgeContact <= 0.5;
  if (!compactPair || profile.redPinkRatio < 0.3) return false;
  if (!hasGreenTopAccent(features, profile)) return false;

  const redComponents = colorComponents(features, isRedPinkPixel, 8).filter((component) => component.area >= 10);
  const redArea = redComponents.reduce((sum, component) => sum + component.area, 0);
  const majorRedComponents = redComponents.filter((component) => component.area >= Math.max(12, redArea * 0.14));
  const pairedRedBlobs =
    majorRedComponents.length >= 2 &&
    majorRedComponents.length <= 4 &&
    majorRedComponents[0].area <= majorRedComponents[1].area * 4.2 &&
    Math.abs(majorRedComponents[0].centerY - majorRedComponents[1].centerY) <= 16;

  const mergedCherrySilhouette = profile.redPinkRatio >= 0.46 && shape.roundness >= 0.34 && shape.pcaAspect <= 2.05;
  return pairedRedBlobs || mergedCherrySilhouette;
}

function hasGreenTopAccent(features, profile = contentColorProfile(features)) {
  if (profile.greenTopRatio >= 0.012) return true;
  return colorComponents(features, isGreenPixel, 3).some(
    (component) => component.area >= 3 && component.area <= 90 && component.centerY <= VECTOR_SIZE * 0.56,
  );
}

function isLeafLikeFeatures(features, shape = analyzeMaskShape(features)) {
  if (!features || !shape) return false;
  const profile = contentColorProfile(features);
  const organicGreenShape =
    shape.area >= 150 &&
    shape.area <= 820 &&
    shape.aspect >= 0.65 &&
    shape.aspect <= 1.35 &&
    shape.pcaAspect <= 1.75 &&
    shape.edgeContact <= 0.16;
  return organicGreenShape && profile.greenRatio >= 0.72 && profile.yellowOrangeRatio <= 0.08;
}

function isFlowerLikeFeatures(features, shape = analyzeMaskShape(features)) {
  if (!features || !shape) return false;
  if (isCherryLikeFeatures(features, shape)) return false;
  const profile = contentColorProfile(features);
  const compactPetalShape =
    shape.area >= 430 &&
    shape.area <= 900 &&
    shape.aspect >= 0.78 &&
    shape.aspect <= 1.25 &&
    shape.pcaAspect <= 1.38 &&
    shape.edgeContact <= 0.2 &&
    shape.fillRatio >= 0.3;
  return compactPetalShape && profile.redPinkRatio >= 0.56 && profile.greenRatio <= 0.12;
}

function colorComponents(features, pixelTest, minArea = 1) {
  if (!features?.mask?.length) return [];
  const visited = new Uint8Array(features.mask.length);
  const components = [];
  const stack = [];

  for (let start = 0; start < features.mask.length; start += 1) {
    if (visited[start] || !isFeaturePixelMatch(features, start, pixelTest)) continue;

    let area = 0;
    let minX = VECTOR_SIZE;
    let minY = VECTOR_SIZE;
    let maxX = -1;
    let maxY = -1;
    let sumX = 0;
    let sumY = 0;
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;

    while (stack.length) {
      const index = stack.pop();
      const x = index % VECTOR_SIZE;
      const y = Math.floor(index / VECTOR_SIZE);
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      sumX += x;
      sumY += y;

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= VECTOR_SIZE || ny >= VECTOR_SIZE) continue;
          const nextIndex = ny * VECTOR_SIZE + nx;
          if (visited[nextIndex] || !isFeaturePixelMatch(features, nextIndex, pixelTest)) continue;
          visited[nextIndex] = 1;
          stack.push(nextIndex);
        }
      }
    }

    if (area < minArea) continue;
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    components.push({
      area,
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centerX: sumX / area,
      centerY: sumY / area,
      fillRatio: area / Math.max(1, width * height),
      aspect: width / Math.max(1, height),
    });
  }

  return components.sort((a, b) => b.area - a.area);
}

function isFeaturePixelMatch(features, index, pixelTest) {
  if (!features.mask[index]) return false;
  const offset = index * 3;
  return pixelTest(features.rgb[offset], features.rgb[offset + 1], features.rgb[offset + 2], index);
}

function isRedPinkPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = max / 255;
  const saturation = (max - min) / Math.max(max, 1);
  const hue = rgbHue(r, g, b);
  return (hue <= 18 || hue >= 330) && saturation > 0.18 && brightness > 0.26;
}

function isGreenPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = max / 255;
  const saturation = (max - min) / Math.max(max, 1);
  const hue = rgbHue(r, g, b);
  return hue >= 75 && hue <= 165 && saturation > 0.18 && brightness > 0.22;
}

function contentColorProfile(features) {
  let content = 0;
  let yellowOrange = 0;
  let green = 0;
  let greenTop = 0;
  let redPink = 0;

  for (let index = 0, p = 0; index < features.mask.length; index += 1, p += 3) {
    if (!features.mask[index]) continue;
    content += 1;
    const r = features.rgb[p];
    const g = features.rgb[p + 1];
    const b = features.rgb[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const brightness = max / 255;
    const saturation = (max - min) / Math.max(max, 1);
    const hue = rgbHue(r, g, b);
    if (hue >= 18 && hue <= 78 && saturation > 0.18 && brightness > 0.34) yellowOrange += 1;
    if ((hue <= 18 || hue >= 300) && saturation > 0.16 && brightness > 0.28) redPink += 1;
    if (hue >= 75 && hue <= 165 && saturation > 0.16 && brightness > 0.22) {
      green += 1;
      if (Math.floor(index / VECTOR_SIZE) < VECTOR_SIZE * 0.45) greenTop += 1;
    }
  }

  if (!content) {
    return { yellowOrangeRatio: 0, greenRatio: 0, greenTopRatio: 0, redPinkRatio: 0 };
  }
  return {
    yellowOrangeRatio: yellowOrange / content,
    greenRatio: green / content,
    greenTopRatio: greenTop / content,
    redPinkRatio: redPink / content,
  };
}

function analyzeMaskShape(features) {
  if (!features?.mask?.length) return null;

  let minX = VECTOR_SIZE;
  let minY = VECTOR_SIZE;
  let maxX = -1;
  let maxY = -1;
  let area = 0;
  let border = 0;
  let outerEdgeArea = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  for (let y = 0; y < VECTOR_SIZE; y += 1) {
    for (let x = 0; x < VECTOR_SIZE; x += 1) {
      const index = y * VECTOR_SIZE + x;
      if (!features.mask[index]) continue;
      area += 1;
      sumX += x;
      sumY += y;
      sumXX += x * x;
      sumYY += y * y;
      sumXY += x * y;
      if (x <= 1 || y <= 1 || x >= VECTOR_SIZE - 2 || y >= VECTOR_SIZE - 2) outerEdgeArea += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const edge =
        x === 0 ||
        y === 0 ||
        x === VECTOR_SIZE - 1 ||
        y === VECTOR_SIZE - 1 ||
        !features.mask[index - 1] ||
        !features.mask[index + 1] ||
        !features.mask[index - VECTOR_SIZE] ||
        !features.mask[index + VECTOR_SIZE];
      if (edge) border += 1;
    }
  }

  if (!area || maxX < minX || maxY < minY) return null;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const fillRatio = area / Math.max(1, width * height);
  const aspect = width / Math.max(1, height);
  const roundness = Math.min(1, (4 * Math.PI * area) / Math.max(1, border * border));
  const angularity = Math.max(0, 1 - roundness) * Math.min(1, fillRatio + 0.25);
  const edgeContact = outerEdgeArea / Math.max(1, area);
  const meanX = sumX / area;
  const meanY = sumY / area;
  const covXX = sumXX / area - meanX * meanX;
  const covYY = sumYY / area - meanY * meanY;
  const covXY = sumXY / area - meanX * meanY;
  const trace = covXX + covYY;
  const determinant = covXX * covYY - covXY * covXY;
  const discriminant = Math.max(0, trace * trace - 4 * determinant);
  const major = Math.max(0.0001, (trace + Math.sqrt(discriminant)) / 2);
  const minor = Math.max(0.0001, (trace - Math.sqrt(discriminant)) / 2);
  const pcaAspect = Math.sqrt(major / minor);

  return { minX, minY, maxX, maxY, width, height, area, fillRatio, aspect, roundness, angularity, edgeContact, pcaAspect };
}

function findLevelEntryById(id) {
  return state.levelEntries.get(id);
}

function levelEntries() {
  return [...state.levelEntries.values()];
}

function clearLevelVocabulary() {
  state.unknowns = [];
  state.levelEntries = new Map();
  state.patternNames = new Map();
  state.nextPatternNumber = 1;
  state.namesLocked = false;
  state.recentVisualRecords = [];
}

function colorNameFromFeatures(features) {
  const color = averageContentColor(features);
  if (!color) return "未知";

  const { r, g, b } = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = max / 255;
  const saturation = (max - min) / Math.max(max, 1);
  const hue = rgbHue(r, g, b);

  if (brightness < 0.24) return "黑色";
  if (saturation < 0.13) {
    if (brightness > 0.78) return "白色";
    if (brightness > 0.58 && r >= b * 1.04) return "米白色";
    return "灰色";
  }
  if ((hue < 12 || hue >= 345) && brightness > 0.62 && b > g * 0.92) return "粉色";
  if (hue < 15 || hue >= 345) return "红色";
  if (hue < 42) return brightness < 0.5 ? "棕色" : "橙色";
  if (hue < 72) return "黄色";
  if (hue < 165) return "绿色";
  if (hue < 200) return "青色";
  if (hue < 250) return "蓝色";
  if (hue < 305) return "紫色";
  return "粉色";
}

function colorNameFromLabel(label) {
  const match = String(label || "").match(/^(黑白|米白|白色|黑色|灰色|红色|粉色|橙色|黄色|绿色|青色|蓝色|紫色|棕色|彩色)/);
  return match ? match[1] : "";
}

function safeColorName(colorName) {
  const value = String(colorName || "").trim();
  if (!value || value === "未知") return "彩色";
  return value.endsWith("色") || value === "黑白" || value === "米白" ? value : `${value}色`;
}

function stripColorPrefix(name) {
  return String(name || "").replace(/^(黑白|米白|白色|黑色|灰色|红色|粉色|橙色|黄色|绿色|青色|蓝色|紫色|棕色|彩色)/, "") || "物件";
}

function startsWithAnyColor(name) {
  return /^(黑白|米白|白色|黑色|灰色|红色|粉色|橙色|黄色|绿色|青色|蓝色|紫色|棕色|彩色)/.test(name);
}

function colorKeyFromName(colorName) {
  const value = String(colorName || "").replace(/色$/, "");
  const pairs = [
    ["米白", "白"],
    ["黑白", "黑/白"],
    ["白", "白"],
    ["黑", "黑"],
    ["灰", "灰"],
    ["红", "红"],
    ["粉", "粉"],
    ["橙", "橙"],
    ["黄", "黄"],
    ["绿", "绿"],
    ["青", "蓝"],
    ["蓝", "蓝"],
    ["紫", "紫"],
    ["棕", "棕"],
    ["彩", "彩"],
  ];
  return pairs.find(([prefix]) => value.startsWith(prefix))?.[1] || "";
}

function areColorNamesCompatible(a, b) {
  const keyA = colorKeyFromName(a);
  const keyB = colorKeyFromName(b);
  if (!keyA || !keyB) return true;
  if (keyA === keyB) return true;
  if (keyA === "彩" || keyB === "彩") return true;
  const partsA = keyA.split("/");
  const partsB = keyB.split("/");
  if (partsA.some((part) => partsB.includes(part))) return true;

  const nearPairs = new Set([
    "蓝|青",
    "青|蓝",
    "白|米白",
    "米白|白",
    "红|粉",
    "粉|红",
    "黄|橙",
    "橙|黄",
  ]);
  return nearPairs.has(`${keyA}|${keyB}`);
}

function dictionaryColorMatches(color, keys) {
  if (!keys.size) return true;
  const value = String(color || "").replace(/色/g, "");
  if (!value) return false;
  if (value.includes("彩")) return true;
  for (const key of keys) {
    if (key.includes("/")) {
      if (key.split("/").some((part) => value.includes(part))) return true;
    } else if (value.includes(key)) {
      return true;
    }
  }
  return false;
}

function displayNameFromDictionary(entry) {
  const prefix = colorPrefixFromDictionary(entry.color);
  const name = expandColorObjectName(String(entry.name || "").trim());
  if (!prefix || name.startsWith(prefix) || startsWithAnyColor(name)) return name;
  return `${prefix}${name}`;
}

function colorPrefixFromDictionary(color) {
  const value = String(color || "").replace(/色/g, "");
  if (!value) return "";
  if (value.includes("/")) return value.replace(/\//g, "");
  if (value === "彩") return "彩色";
  if (value === "米白") return "米白色";
  return `${value}色`;
}

function expandColorObjectName(name) {
  return String(name || "")
    .replace(/^紫水晶/, "紫色水晶")
    .replace(/^紫晶/, "紫色水晶")
    .replace(/^蓝宝石/, "蓝色宝石")
    .replace(/^红宝石/, "红色宝石")
    .replace(/^祖母绿/, "绿色宝石");
}

function averageContentColor(features) {
  if (!features) return null;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0, p = 0; i < features.mask.length; i += 1, p += 3) {
    if (!features.mask[i]) continue;
    r += features.rgb[p];
    g += features.rgb[p + 1];
    b += features.rgb[p + 2];
    count += 1;
  }

  if (!count) return null;
  return { r: r / count, g: g / count, b: b / count };
}

function roughPatternProfile(features) {
  if (!features) return null;
  if (features._roughPatternProfile !== undefined) return features._roughPatternProfile;

  const color = averageContentColor(features);
  const shape = analyzeMaskShape(features);
  if (!color || !shape) {
    features._roughPatternProfile = null;
    return features._roughPatternProfile;
  }

  features._roughPatternProfile = {
    r: color.r,
    g: color.g,
    b: color.b,
    area: shape.area,
    aspect: shape.aspect,
    pcaAspect: shape.pcaAspect,
    whiteRatio: features.whiteRatio,
    contentRatio: features.contentRatio,
  };
  return features._roughPatternProfile;
}

function roughPatternComparable(a, b) {
  const profileA = roughPatternProfile(a);
  const profileB = roughPatternProfile(b);
  if (!profileA || !profileB) return true;

  const colorDistance =
    (Math.abs(profileA.r - profileB.r) + Math.abs(profileA.g - profileB.g) + Math.abs(profileA.b - profileB.b)) / 3;
  if (colorDistance > 92) return false;

  const areaRatio = Math.min(profileA.area, profileB.area) / Math.max(profileA.area, profileB.area, 1);
  if (areaRatio < 0.22) return false;

  const aspectRatio = Math.min(profileA.aspect, profileB.aspect) / Math.max(profileA.aspect, profileB.aspect, 0.001);
  const pcaAspectRatio = Math.min(profileA.pcaAspect, profileB.pcaAspect) / Math.max(profileA.pcaAspect, profileB.pcaAspect, 0.001);
  if (aspectRatio < 0.2 && pcaAspectRatio < 0.24 && areaRatio < 0.45) return false;

  if (Math.abs(profileA.whiteRatio - profileB.whiteRatio) > 0.55) return false;
  if (Math.abs(profileA.contentRatio - profileB.contentRatio) > 0.55) return false;
  return true;
}

function rgbHue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

function countDetections(detections) {
  const counts = new Map();
  for (const detection of detections) {
    counts.set(detection.id, (counts.get(detection.id) || 0) + 1);
  }
  return counts;
}

function groupDetections(detections) {
  const groups = new Map();
  for (const detection of detections) {
    const current = groups.get(detection.id) || {
      id: detection.id,
      label: detection.label,
      thumb: detection.thumb,
      count: 0,
      score: 0,
      maxScore: 0,
      relaxedColorMismatch: false,
      matchSource: "",
    };
    current.count += 1;
    current.score += detection.score || 0;
    current.maxScore = Math.max(current.maxScore, detection.score || 0);
    current.relaxedColorMismatch = current.relaxedColorMismatch || Boolean(detection.relaxedColorMismatch);
    current.matchSource = current.matchSource || detection.matchSource || "";
    groups.set(detection.id, current);
  }
  return groups;
}

function updateTrayPending(events, pending, detections, time) {
  const groups = groupDetections(detections);
  for (const item of groups.values()) {
    if (item.count < 2) continue;
    const current = pending.get(item.id) || {
      id: item.id,
      label: item.label,
      thumb: item.thumb,
      count: 0,
      maxCount: 0,
      score: 0,
      maxScore: 0,
      frameCount: 0,
      relaxedColorMismatch: false,
      matchSource: item.matchSource || "",
      startTime: time,
      lastTime: time,
    };
    current.count += item.count;
    current.maxCount = Math.max(current.maxCount, item.count);
    current.score += item.score;
    current.maxScore = Math.max(current.maxScore, item.maxScore);
    current.frameCount += 1;
    current.thumb = item.thumb || current.thumb;
    current.label = item.label || current.label;
    current.relaxedColorMismatch = current.relaxedColorMismatch || Boolean(item.relaxedColorMismatch);
    current.matchSource = current.matchSource || item.matchSource || "";
    current.lastTime = time;
    pending.set(item.id, current);
  }
}

async function settleTrayPending(events, pending, detections, time, transitionFrame) {
  const groups = groupDetections(detections);
  for (const [id, item] of pending.entries()) {
    const currentCount = groups.get(id)?.count || 0;
    if (currentCount >= 2) continue;

    if (item.relaxedColorMismatch && (item.frameCount || 0) < 2) {
      recordDebugDecision("event-skip", time, item, "unstable-relaxed-color");
      pending.delete(id);
      continue;
    }

    if (!isStableTrayDropCandidate(item, transitionFrame)) {
      recordDebugDecision("event-skip", time, item, "unstable-tray-drop");
      pending.delete(id);
      continue;
    }

    if (transitionFrame || time - item.lastTime <= 0.65) {
      await addEvent(events, item, time, "tray-drop", { sameWindow: 1.05 });
    }
    pending.delete(id);
  }
}

function isStableTrayDropCandidate(item, transitionFrame) {
  const frameCount = item.frameCount || 0;
  const maxCount = item.maxCount || 0;
  const maxScore = item.maxScore || 0;
  if (frameCount >= 2) return true;
  if (maxCount >= 3 && maxScore >= 0.86) return true;
  if (maxScore >= 0.9) return true;
  return transitionFrame && maxScore >= 0.88;
}

async function updateFinalSingles(events, pending, detections, time, duration) {
  if (duration - time > FINAL_SINGLE_WINDOW_SECONDS) return;

  const groups = groupDetections(detections);
  for (const [id, item] of pending.entries()) {
    const currentCount = groups.get(id)?.count || 0;
    if (currentCount >= 1) continue;
    if ((item.maxCount || 0) < 2) {
      pending.delete(id);
      continue;
    }

    if (time - item.lastTime <= 0.75) {
      await addEvent(events, item, time, "final-single", {
        sameWindow: 0.45,
        anyWindow: 0.2,
        skipAnimationDedupe: true,
        skipVisualDedupe: true,
      });
    }
    pending.delete(id);
  }

  for (const item of groups.values()) {
    if (item.count < 1) continue;
    const current = pending.get(item.id) || {
      id: item.id,
      label: item.label,
      thumb: item.thumb,
      count: 0,
      maxCount: 0,
      score: 0,
      maxScore: 0,
      frameCount: 0,
      matchSource: item.matchSource || "",
      startTime: time,
      lastTime: time,
    };
    current.count += item.count;
    current.maxCount = Math.max(current.maxCount, item.count);
    current.score += item.score;
    current.maxScore = Math.max(current.maxScore, item.maxScore);
    current.frameCount += 1;
    current.thumb = item.thumb || current.thumb;
    current.label = item.label || current.label;
    current.matchSource = current.matchSource || item.matchSource || "";
    current.lastTime = time;
    pending.set(item.id, current);
  }
}

async function finalizePendingAtVideoEnd(task) {
  const time = task.duration;
  const byId = new Map();
  for (const item of [...task.trayPending.values(), ...task.finalSinglePending.values()]) {
    if (!isStableEndOfVideoCandidate(item, time)) continue;
    const current = byId.get(item.id);
    if (!current) {
      byId.set(item.id, { ...item });
      continue;
    }
    current.count = Math.max(current.count || 0, item.count || 0);
    current.maxCount = Math.max(current.maxCount || 0, item.maxCount || 0);
    current.frameCount = Math.max(current.frameCount || 0, item.frameCount || 0);
    current.score = Math.max(current.score || 0, item.score || 0);
    current.maxScore = Math.max(current.maxScore || 0, item.maxScore || 0);
    current.thumb = item.thumb || current.thumb;
    current.label = item.label || current.label;
    current.startTime = Math.min(current.startTime || item.startTime || time, item.startTime || time);
    current.lastTime = Math.max(current.lastTime || 0, item.lastTime || 0);
  }

  const candidates = [...byId.values()]
    .sort((a, b) => {
      if ((b.maxCount || 0) !== (a.maxCount || 0)) return (b.maxCount || 0) - (a.maxCount || 0);
      if ((b.frameCount || 0) !== (a.frameCount || 0)) return (b.frameCount || 0) - (a.frameCount || 0);
      return (b.maxScore || 0) - (a.maxScore || 0);
    });

  for (const candidate of candidates) {
    const groupCount = endOfVideoGroupCount(candidate);
    for (let index = 0; index < groupCount; index += 1) {
      const eventTime = Math.max(0, time - (groupCount - index - 1) * 0.24);
      await addEvent(state.events, candidate, eventTime, "final-end", { sameWindow: 0.2, anyWindow: 0 });
    }
  }

  task.trayPending.clear();
  task.finalSinglePending.clear();
}

function endOfVideoGroupCount(item) {
  return Math.max(1, Math.floor((item.maxCount || item.count || 0) / 2));
}

function isStableEndOfVideoCandidate(item, time) {
  if (!item?.id) return false;
  if (time - (item.lastTime || 0) > Math.max(0.35, Number(els.sampleInterval.value) * 2.5)) return false;
  if ((item.relaxedColorMismatch || false) && (item.frameCount || 0) < 2) return false;
  if ((item.frameCount || 0) >= 2 && (item.maxCount || 0) >= 2) return true;
  if ((item.maxCount || 0) >= 3 && (item.maxScore || 0) >= 0.86) return true;
  if ((item.maxCount || 0) >= 2 && (item.maxScore || 0) >= 0.9) return true;
  return false;
}

function latestEventTime(events) {
  return events.length ? events[events.length - 1].time : -Infinity;
}

function isUnknownId(id) {
  return String(id || "").startsWith("unknown-");
}

async function addEvent(events, candidate, time, source, options = {}) {
  if (!candidate?.id) return false;

  const sameWindow = Math.max(0.2, Math.min(options.sameWindow ?? EVENT_DEDUPE_SECONDS, EVENT_DEDUPE_SECONDS));
  const anyWindow = options.anyWindow ?? EVENT_COOLDOWN_SECONDS;
  if (events.some((event) => event.id === candidate.id && Math.abs(event.time - time) < sameWindow)) {
    recordDebugDecision("event-skip", time, candidate, "same-id-window");
    return false;
  }
  if (events.some((event) => Math.abs(event.time - time) < anyWindow)) {
    recordDebugDecision("event-skip", time, candidate, "global-cooldown");
    return false;
  }
  if (!options.skipAnimationDedupe && isSameAnimationDuplicateEvent(events, candidate, time, source)) {
    recordDebugDecision("event-skip", time, candidate, "same-animation-window");
    return false;
  }
  if (!options.skipVisualDedupe && isRecentVisualDuplicateEvent(events, candidate, time, source)) {
    recordDebugDecision("event-skip", time, candidate, "same-visual-window");
    return false;
  }

  const entry = findLevelEntryById(candidate.id);
  if (entry?.needsVisionName && !isRecordableUnconfirmedCandidate(candidate)) {
    recordDebugDecision("event-skip", time, candidate, "unconfirmed");
    return false;
  }

  if (events === state.events) {
    await ensureNameBeforeRecording(candidate.id);
  }

  events.push({
    id: candidate.id,
    time,
    count: candidate.count || candidate.maxCount || 3,
    label: entry?.label || candidate.label || candidate.id,
    thumb: entry?.thumb || candidate.thumb || "",
    source,
    score: candidate.maxScore || candidate.score || 0,
    span: candidate.lastTime && candidate.startTime ? candidate.lastTime - candidate.startTime : 0,
    maxCount: candidate.maxCount || candidate.count || 0,
    matchSource: candidate.matchSource || "",
  });
  if (isSuppressibleVisualRepeat(candidate.id, source)) {
    rememberRecentVisualRecord(candidate.id, time);
  }
  if (events === state.events) state.resultsDirty = true;
  recordDebugDecision("event-add", time, candidate, source);
  return true;
}

function filterRecentVisualDuplicateDetections(detections, time) {
  pruneRecentVisualRecords(time);
  if (!state.recentVisualRecords.length || !detections.length) return detections;

  return detections.filter((detection) => {
    if (!isSuppressibleVisualId(detection.id)) return true;
    const record = findMatchingRecentVisualRecord(detection.id);
    if (!record) return true;

    const stillPresent = time - record.lastSeenTime <= visualPresenceGapForId(record.id);
    if (!stillPresent) return true;

    record.lastSeenTime = time;
    return false;
  });
}

function rememberRecentVisualRecord(id, time) {
  const entry = findLevelEntryById(id);
  if (!entry?.features || entry.builtin) return;

  pruneRecentVisualRecords(time);
  const existing = findMatchingRecentVisualRecord(id);
  if (existing) {
    existing.id = id;
    existing.features = entry.features;
    existing.eventTime = time;
    existing.lastSeenTime = time;
    return;
  }

  state.recentVisualRecords.push({
    id,
    features: entry.features,
    eventTime: time,
    lastSeenTime: time,
  });
}

function findMatchingRecentVisualRecord(id) {
  const entry = findLevelEntryById(id);
  const features = entry?.features;
  if (!features || entry.builtin) return null;

  return (
    state.recentVisualRecords.find((record) => record.id === id) ||
    state.recentVisualRecords.find((record) => record.features && sameVisualRepeatFeatureMatch(features, record.features).matched) ||
    null
  );
}

function pruneRecentVisualRecords(time) {
  state.recentVisualRecords = state.recentVisualRecords.filter((record) => time - record.eventTime <= VISUAL_RECORD_MAX_AGE_SECONDS);
}

function isRecentVisualDuplicateEvent(events, candidate, time, source) {
  if (!isSuppressibleVisualRepeat(candidate.id, source)) return false;
  const candidateEntry = findLevelEntryById(candidate.id);
  const candidateFeatures = candidateEntry?.features;
  if (!candidateFeatures) return false;

  return events.some((event) => {
    if (!isSuppressibleVisualRepeat(event.id, event.source)) return false;
    if (Math.abs(event.time - time) > Math.max(visualDedupeWindowForId(candidate.id), visualDedupeWindowForId(event.id))) {
      return false;
    }
    if (event.id === candidate.id) return true;
    const eventEntry = findLevelEntryById(event.id);
    if (!eventEntry?.features) return false;
    return sameVisualRepeatFeatureMatch(candidateFeatures, eventEntry.features).matched;
  });
}

function isSameAnimationDuplicateEvent(events, candidate, time, source) {
  if (!isAnimationEventSource(source)) return false;
  return events.some(
    (event) =>
      event.id === candidate.id &&
      isAnimationEventSource(event.source) &&
      Math.abs(event.time - time) <= SAME_ID_ANIMATION_DEDUPE_SECONDS,
  );
}

function isSuppressibleRepeatSource(source) {
  return source === "tray-shatter" || source === "tray-drop" || source === "final-single" || source === "board-fallback";
}

function isAnimationEventSource(source) {
  return source === "tray-shatter" || source === "tray-drop" || source === "final-single" || source === "board-fallback";
}

function isSuppressibleVisualRepeat(id, source) {
  return isSuppressibleRepeatSource(source) && isSuppressibleVisualId(id);
}

function isSuppressibleVisualId(id) {
  const entry = findLevelEntryById(id);
  return Boolean(entry?.features && !entry.builtin);
}

function visualDedupeWindowForId(id) {
  return isSuppressibleVisualId(id) ? UNKNOWN_VISUAL_EVENT_DEDUPE_SECONDS : VISUAL_EVENT_DEDUPE_SECONDS;
}

function visualPresenceGapForId(id) {
  return isSuppressibleVisualId(id) ? UNKNOWN_VISUAL_PRESENCE_GAP_SECONDS : VISUAL_PRESENCE_GAP_SECONDS;
}

function isRecordableUnconfirmedCandidate(candidate) {
  const score = candidate.maxScore || candidate.score || 0;
  const count = candidate.maxCount || candidate.count || 0;
  return score >= 0.9 || (count >= 3 && score >= 0.86);
}

function detectBoardSnapshot(time) {
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const scale = Math.min(scaleX, scaleY);
  const tileSize = BOARD_SCAN.tileSize * scale;
  const detections = [];

  for (let refY = BOARD_SCAN.yStart; refY <= BOARD_SCAN.yEnd; refY += BOARD_SCAN.step) {
    for (let refX = BOARD_SCAN.xStart; refX <= BOARD_SCAN.xEnd; refX += BOARD_SCAN.step) {
      const x = refX * scaleX - tileSize / 2;
      const y = refY * scaleY - tileSize / 2;
      const sx = clamp(Math.round(x), 0, els.frameCanvas.width - 1);
      const sy = clamp(Math.round(y), 0, els.frameCanvas.height - 1);
      const sw = Math.min(Math.max(1, Math.round(tileSize)), els.frameCanvas.width - sx);
      const sh = Math.min(Math.max(1, Math.round(tileSize)), els.frameCanvas.height - sy);
      const crop = frameCtx.getImageData(sx, sy, sw, sh);
      const features = featuresFromImageData(crop);
      if (features.whiteRatio < 0.18 || features.contentRatio < 0.05) continue;

      const match = matchTemplate(features, BOARD_SCAN.threshold, false);
      if (!match) continue;
      detections.push({
        ...match,
        x: refX,
        y: refY,
      });
    }
  }

  detections.sort((a, b) => b.score - a.score);
  const kept = [];
  for (const detection of detections) {
    const duplicate = kept.some(
      (item) =>
        item.id === detection.id &&
        (item.x - detection.x) ** 2 + (item.y - detection.y) ** 2 < BOARD_SCAN.nmsDistance ** 2,
    );
    if (!duplicate) kept.push(detection);
  }

  const byId = new Map();
  for (const item of kept) {
    const current = byId.get(item.id) || {
      id: item.id,
      label: item.label,
      thumb: item.thumb,
      count: 0,
      score: 0,
      maxScore: 0,
    };
    current.count += 1;
    current.score += item.score || 0;
    current.maxScore = Math.max(current.maxScore, item.score || 0);
    byId.set(item.id, current);
  }

  return { time, byId, items: kept };
}

async function runBoardFallbackAnalysis(task) {
  clearLevelVocabulary();
  clearResults();
  renderTemplateGrid();
  setProgress(0);
  els.statusText.textContent = "固定槽未检测到消除，正在扫描棋盘变化";

  const interval = Math.max(BOARD_FALLBACK_INTERVAL_SECONDS, Number(els.sampleInterval.value) * 2);
  const totalSteps = Math.max(1, Math.ceil(task.duration / interval));
  let previous = null;
  const pending = new Map();

  for (let step = 0; step <= totalSteps; step += 1) {
    if (task.canceled) return;
    await waitIfPaused(task);
    if (task.canceled) return;

    const time = Math.min(task.duration, step * interval);
    await seekVideo(time);
    drawFrame();

    const beforeEventCount = state.events.length;
    const current = detectBoardFallbackSnapshot(time);
    await updateBoardFallbackDrops(state.events, pending, previous, current, time);
    previous = current;
    const eventCountChanged = state.events.length !== beforeEventCount;
    if (eventCountChanged) flushLiveResults();

    if (eventCountChanged || step % 3 === 0 || step === totalSteps) {
      setProgress(step / totalSteps);
      els.statusText.textContent = `固定槽未检测到消除，正在扫描棋盘 ${formatDuration(time)} / ${formatDuration(task.duration)}，已找到 ${state.events.length} 条`;
      await idle();
    }
  }

  state.resultsDirty = true;
}

function detectBoardFallbackSnapshot(time) {
  const scaleX = els.video.videoWidth / REFERENCE.width;
  const scaleY = els.video.videoHeight / REFERENCE.height;
  const scale = Math.min(scaleX, scaleY);
  const tileSize = BOARD_FALLBACK_SCAN.tileSize * scale;
  const candidates = [];

  for (let refY = BOARD_FALLBACK_SCAN.yStart; refY <= BOARD_FALLBACK_SCAN.yEnd; refY += BOARD_FALLBACK_SCAN.step) {
    for (let refX = BOARD_FALLBACK_SCAN.xStart; refX <= BOARD_FALLBACK_SCAN.xEnd; refX += BOARD_FALLBACK_SCAN.step) {
      const x = refX * scaleX - tileSize / 2;
      const y = refY * scaleY - tileSize / 2;
      const sx = clamp(Math.round(x), 0, els.frameCanvas.width - 1);
      const sy = clamp(Math.round(y), 0, els.frameCanvas.height - 1);
      const sw = Math.min(Math.max(1, Math.round(tileSize)), els.frameCanvas.width - sx);
      const sh = Math.min(Math.max(1, Math.round(tileSize)), els.frameCanvas.height - sy);
      const features = featuresFromFrameCrop(sx, sy, sw, sh);
      const quality = boardFallbackTileQuality(features);
      if (quality <= 0) continue;
      candidates.push({ x: refX, y: refY, features, quality });
    }
  }

  candidates.sort((a, b) => b.quality - a.quality);
  const kept = [];
  for (const candidate of candidates) {
    const duplicate = kept.some(
      (item) =>
        (item.x - candidate.x) ** 2 + (item.y - candidate.y) ** 2 < BOARD_FALLBACK_SCAN.nmsDistance ** 2,
    );
    if (!duplicate) kept.push(candidate);
  }

  const items = [];
  const refinedKept = kept.map((item) => refineBoardFallbackCrop(item, scaleX, scaleY, scale));
  for (const item of refinedKept) {
    const match = matchTemplate(item.features, BOARD_FALLBACK_THRESHOLD, {
      allowUnknown: true,
      createUnknown: true,
    });
    if (!match) continue;
    items.push({
      ...match,
      x: item.x,
      y: item.y,
      cropYOffset: item.cropYOffset || 0,
      features: item.features,
      quality: item.quality,
    });
  }

  const byId = new Map();
  for (const item of items) {
    const current = byId.get(item.id) || {
      id: item.id,
      label: item.label,
      thumb: item.thumb,
      count: 0,
      score: 0,
      maxScore: 0,
      firstTime: time,
      lastTime: time,
    };
    current.count += 1;
    current.score += item.score || 0;
    current.maxScore = Math.max(current.maxScore, item.score || 0);
    current.thumb = item.thumb || current.thumb;
    current.label = item.label || current.label;
    current.lastTime = time;
    byId.set(item.id, current);
  }

  return { time, byId, items };
}

function refineBoardFallbackCrop(item, scaleX, scaleY, scale) {
  const refined = bestTileCropAtReferenceY(
    item.x,
    item.y,
    BOARD_FALLBACK_SCAN.tileSize,
    BOARD_FALLBACK_CROP_Y_OFFSETS,
    scaleX,
    scaleY,
    scale,
  );
  if (!refined || refined.quality <= item.quality) return item;
  return {
    ...item,
    y: refined.centerY,
    features: refined.features,
    quality: refined.quality,
    cropYOffset: refined.yOffset,
  };
}

function boardFallbackTileQuality(features) {
  if (!features || !isLikelyOccupied(features) || !isCompleteTileCandidate(features)) return 0;
  const shape = candidateTileShape(features);
  if (!shape) return 0;
  if (shape.area >= 1450 && features.whiteRatio < 0.12) return 0;
  const centerBonus = 1 - Math.min(0.5, shape.edgeContact);
  const whiteScore = Math.min(0.45, features.whiteRatio);
  const contentScore = Math.min(0.7, features.contentRatio);
  return whiteScore + contentScore + centerBonus * 0.25;
}

async function updateBoardFallbackDrops(events, pending, previous, current, time) {
  pruneBoardFallbackPending(pending, time);
  if (!previous || !current || current.time - previous.time > BOARD_FALLBACK_INTERVAL_SECONDS * 2.6) return;

  for (const [id, before] of previous.byId.entries()) {
    const afterCount = current.byId.get(id)?.count || 0;
    const drop = before.count - afterCount;
    if (drop <= 0 || before.maxScore < BOARD_FALLBACK_THRESHOLD) continue;

    const pendingItem = findBoardFallbackPending(pending, before) || {
      id,
      label: before.label,
      thumb: before.thumb,
      count: 0,
      maxCount: 0,
      score: 0,
      maxScore: 0,
      startTime: previous.time,
      lastTime: previous.time,
      matchSource: "board-fallback",
    };
    const usableDrop = Math.min(drop, BOARD_FALLBACK_MAX_EVENT_DROPS);
    pendingItem.count += usableDrop;
    pendingItem.maxCount = Math.max(pendingItem.maxCount, before.count);
    pendingItem.score += before.score || before.maxScore || 0;
    pendingItem.maxScore = Math.max(pendingItem.maxScore, before.maxScore || 0);
    pendingItem.lastTime = time;
    pendingItem.thumb = before.thumb || pendingItem.thumb;
    pendingItem.label = before.label || pendingItem.label;
    pending.set(pendingItem.id, pendingItem);

    while (pendingItem.count >= BOARD_FALLBACK_MIN_EVENT_DROPS) {
      const candidate = {
        ...pendingItem,
        count: BOARD_FALLBACK_MIN_EVENT_DROPS,
        maxCount: Math.max(BOARD_FALLBACK_MIN_EVENT_DROPS, pendingItem.maxCount),
      };
      const added = await addEvent(events, candidate, time, "board-fallback", {
        sameWindow: 0.75,
        anyWindow: 0.35,
      });
      if (!added) break;
      pendingItem.count -= BOARD_FALLBACK_MIN_EVENT_DROPS;
      pendingItem.startTime = time;
    }

    if (pendingItem.count <= 0) pending.delete(pendingItem.id);
  }
}

function findBoardFallbackPending(pending, candidate) {
  if (pending.has(candidate.id)) return pending.get(candidate.id);
  const entry = findLevelEntryById(candidate.id);
  if (!entry?.features) return null;

  for (const item of pending.values()) {
    const itemEntry = findLevelEntryById(item.id);
    if (!itemEntry?.features) continue;
    if (sameVisualIdentityFeatureMatch(entry.features, itemEntry.features).matched) return item;
  }
  return null;
}

function pruneBoardFallbackPending(pending, time) {
  for (const [id, item] of pending.entries()) {
    if (time - item.lastTime > BOARD_FALLBACK_DROP_WINDOW_SECONDS) pending.delete(id);
  }
}

function chooseBoardBurstCandidate(previous, current) {
  if (!previous || !current || current.time - previous.time > 1.35) return null;

  const candidates = [];
  for (const [id, before] of previous.byId.entries()) {
    const afterCount = current.byId.get(id)?.count || 0;
    const drop = before.count - afterCount;
    if (drop < 1 || before.maxScore < BOARD_SCAN.threshold + 0.04) continue;
    candidates.push({
      id,
      label: before.label,
      thumb: before.thumb,
      count: drop,
      maxCount: before.count,
      score: before.score,
      maxScore: before.maxScore,
      lastTime: previous.time,
    });
  }

  return candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
    return b.score - a.score;
  })[0];
}

function framePotentials(detections, time) {
  const byId = new Map();
  for (const detection of detections) {
    const item = byId.get(detection.id) || {
      id: detection.id,
      label: detection.label,
      thumb: detection.thumb,
      count: 0,
      score: 0,
      maxScore: 0,
      time,
    };
    item.count += 1;
    item.score += detection.score || 0;
    item.maxScore = Math.max(item.maxScore, detection.score || 0);
    item.thumb = detection.thumb || item.thumb;
    item.label = detection.label || item.label;
    byId.set(detection.id, item);
  }
  return [...byId.values()];
}

function chooseEventCandidate(history, time) {
  const byId = new Map();
  for (const item of history) {
    const age = Math.max(0, time - item.time);
    if (age > SHATTER_HISTORY_SECONDS) continue;
    const recency = Math.max(0.15, 1 - age / SHATTER_HISTORY_SECONDS);
    const recent = age <= SHATTER_RECENT_SECONDS;
    const current = byId.get(item.id) || {
      id: item.id,
      label: item.label,
      thumb: item.thumb,
      count: 0,
      maxCount: 0,
      frameCount: 0,
      recentCount: 0,
      recentFrameCount: 0,
      recentMaxCount: 0,
      score: 0,
      maxScore: 0,
      startTime: item.time,
      lastTime: item.time,
    };
    current.count += item.count;
    current.maxCount = Math.max(current.maxCount, item.count);
    current.frameCount += 1;
    if (recent) {
      current.recentCount += item.count;
      current.recentFrameCount += 1;
      current.recentMaxCount = Math.max(current.recentMaxCount, item.count);
    }
    current.maxScore = Math.max(current.maxScore, item.maxScore || item.score || 0);
    current.score += (item.count * item.count * 4 + item.score) * recency;
    current.thumb = item.thumb || current.thumb;
    current.label = item.label || current.label;
    current.startTime = Math.min(current.startTime, item.time);
    current.lastTime = Math.max(current.lastTime, item.time);
    byId.set(item.id, current);
  }

  return [...byId.values()]
    .filter((item) => isStableShatterCandidate(item, time))
    .sort((a, b) => {
      if (b.maxCount !== a.maxCount) return b.maxCount - a.maxCount;
      if (b.recentMaxCount !== a.recentMaxCount) return b.recentMaxCount - a.recentMaxCount;
      if (b.recentFrameCount !== a.recentFrameCount) return b.recentFrameCount - a.recentFrameCount;
      if (b.frameCount !== a.frameCount) return b.frameCount - a.frameCount;
      if (b.score !== a.score) return b.score - a.score;
      if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
      return b.lastTime - a.lastTime;
    })[0];
}

function isStableShatterCandidate(item, time) {
  if (time - item.lastTime > SHATTER_RECENT_SECONDS) return false;
  if (item.recentMaxCount >= 3) return true;
  if (item.recentMaxCount >= 2 && item.recentFrameCount >= 2) return true;
  if (item.maxCount >= 3 && item.frameCount >= 2 && item.recentFrameCount >= 1) return true;
  if (item.maxCount >= 2 && item.frameCount >= 3 && item.maxScore >= 0.9 && item.recentFrameCount >= 1) return true;
  return false;
}

function strongestPotential(detections, time) {
  const byId = new Map();
  for (const detection of detections) {
    const item = byId.get(detection.id) || {
      id: detection.id,
      label: detection.label,
      thumb: detection.thumb,
      count: 0,
      score: 0,
      time,
    };
    item.count += 1;
    item.score += detection.score || 0;
    byId.set(detection.id, item);
  }

  return [...byId.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.score - a.score;
  })[0];
}

function summarizeEvents(events) {
  const groups = [];
  for (const event of events) {
    const entry = findLevelEntryById(event.id);
    const current = findVisualResultGroup(groups, event, entry);
    if (current) {
      current.count += 1;
      current.label = preferredMergedLabel(current, event.label, entry);
      current.thumb = entry?.thumb || current.thumb || event.thumb;
      if (!current.features && entry?.features) current.features = entry.features;
      if (entry?.builtin) current.builtin = true;
      if (entry?.visionNamed) current.visionNamed = true;
      continue;
    }

    groups.push({
      id: event.id,
      label: event.label,
      thumb: entry?.thumb || event.thumb,
      count: 0,
      features: entry?.features || null,
      builtin: Boolean(entry?.builtin),
      visionNamed: Boolean(entry?.visionNamed),
    });
    groups[groups.length - 1].count += 1;
  }

  const rows = groups.map(({ features, builtin, visionNamed, ...row }) => row);
  if (ANONYMOUS_PATTERN_MODE) {
    return rows.sort((a, b) => anonymousPatternIndex(a.label) - anonymousPatternIndex(b.label));
  }
  return rows.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, "zh-Hans-CN");
  });
}

function anonymousPatternIndex(label) {
  const match = String(label || "").match(/^花色(\d+)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function findVisualResultGroup(groups, event, entry) {
  const label = event.label || event.id;
  const byLabel = groups.find((group) => group.label === label);
  if (byLabel) return byLabel;

  if (!entry?.features) return null;
  let best = null;
  for (const group of groups) {
    if (!group.features) continue;
    if (group.builtin && entry.builtin && group.label !== label) continue;
    const match = samePatternFeatureMatch(entry.features, group.features);
    if (!match.matched) continue;
    if (!areColorNamesCompatible(colorNameFromLabel(group.label), colorNameFromLabel(label)) && match.score < 0.94) continue;
    if (!best || match.score > best.score) best = { group, score: match.score };
  }
  return best?.group || null;
}

function preferredMergedLabel(group, candidateLabel, entry) {
  if (ANONYMOUS_PATTERN_MODE) return group.label || candidateLabel;
  if (entry?.visionNamed) return entry.label;
  if (group.visionNamed) return group.label;
  if (isProvisionalShapeLabel(group.label) && !isProvisionalShapeLabel(candidateLabel)) return candidateLabel;
  return group.label || candidateLabel;
}

function isProvisionalShapeLabel(label) {
  return /物件|饰物|晶石|圆饰|竖饰|长条|果实/.test(label || "");
}

function eventEditableEntries() {
  const entries = new Map();
  for (const row of state.results) {
    entries.set(row.id, row);
  }
  for (const event of state.events) {
    if (!entries.has(event.id)) {
      entries.set(event.id, {
        id: event.id,
        label: event.label,
        thumb: event.thumb,
      });
    }
  }
  if (!ANONYMOUS_PATTERN_MODE) {
    for (const item of state.savedDictionary) {
      if (!entries.has(item.id)) {
        entries.set(item.id, {
          id: item.id,
          label: item.label,
          thumb: item.thumb,
        });
      }
    }
  }
  return [...entries.values()];
}

function normalizeEvents(events) {
  if (!ANONYMOUS_PATTERN_MODE) return events;
  return normalizeAnonymousEvents(events);
}

function normalizeAnonymousEvents(events) {
  state.patternNames = new Map();
  state.nextPatternNumber = 1;

  if (!events.length) return events;

  const items = events.map((event, index) => {
    const entry = findLevelEntryById(event.id);
    return {
      event,
      entry,
      index,
      features: entry?.features || null,
      builtin: Boolean(entry?.builtin),
    };
  });
  const parent = items.map((_, index) => index);

  const find = (index) => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return;
    parent[Math.max(rootA, rootB)] = Math.min(rootA, rootB);
  };

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[i].event.id === items[j].event.id) {
        union(i, j);
        continue;
      }
      if (!items[i].features || !items[j].features) continue;
      if (items[i].builtin && items[j].builtin) continue;
      const match = sameVisualIdentityFeatureMatch(items[i].features, items[j].features);
      const closeRepeatMatch =
        !match.matched &&
        Math.abs(items[i].event.time - items[j].event.time) <= UNKNOWN_VISUAL_EVENT_DEDUPE_SECONDS &&
        sameVisualRepeatFeatureMatch(items[i].features, items[j].features).matched;
      if (closeRepeatMatch) {
        union(i, j);
        continue;
      }
      if (match.matched) union(i, j);
    }
  }

  const clusters = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const root = find(index);
    const cluster = clusters.get(root) || {
      root,
      firstIndex: index,
      representative: items[index],
      thumb: items[index].event.thumb || items[index].entry?.thumb || "",
      eventIds: new Set(),
    };
    cluster.firstIndex = Math.min(cluster.firstIndex, index);
    if (index === cluster.firstIndex) cluster.representative = items[index];
    if (!cluster.thumb) cluster.thumb = items[index].event.thumb || items[index].entry?.thumb || "";
    cluster.eventIds.add(items[index].event.id);
    clusters.set(root, cluster);
  }

  const orderedClusters = [...clusters.values()].sort((a, b) => a.firstIndex - b.firstIndex);
  const clusterByRoot = new Map();
  for (const cluster of orderedClusters) {
    const id = cluster.representative.event.id;
    const label = state.namesLocked ? visualLabelForAnonymousCluster(cluster, id) : anonymousPatternNameForId(id);
    for (const eventId of cluster.eventIds) {
      setAnonymousPatternName(eventId, label);
      const entry = findLevelEntryById(eventId);
      if (entry) entry.label = label;
    }
    const representativeEntry = findLevelEntryById(id);
    if (representativeEntry) representativeEntry.label = label;
    cluster.id = id;
    cluster.label = label;
    clusterByRoot.set(cluster.root, cluster);
  }

  const normalizedEvents = items.map((item, index) => {
    const cluster = clusterByRoot.get(find(index));
    return {
      ...item.event,
      id: cluster.id,
      label: cluster.label,
      thumb: item.event.thumb || cluster.thumb || item.entry?.thumb || "",
    };
  });
  return dedupeVisualDuplicateEvents(normalizedEvents);
}

function visualLabelForAnonymousCluster(cluster, fallbackId) {
  for (const eventId of cluster.eventIds) {
    const entry = findLevelEntryById(eventId);
    if (entry?.visionNamed && entry.label && !isAnonymousPatternLabel(entry.label)) return entry.label;
  }
  const representativeLabel = cluster.representative?.event?.label || "";
  if (representativeLabel && !isAnonymousPatternLabel(representativeLabel)) return representativeLabel;
  return anonymousPatternNameForId(fallbackId);
}

function isAnonymousPatternLabel(label) {
  return /^花色\d+$/.test(String(label || ""));
}

function dedupeVisualDuplicateEvents(events) {
  const output = [];
  const recent = [];
  for (const event of events) {
    const entry = findLevelEntryById(event.id);
    const duplicateRecord = isSuppressibleVisualRepeat(event.id, event.source)
      ? recent.find((record) => {
          const stillPresent = event.time - record.lastSeenTime <= visualPresenceGapForId(record.id);
          const withinMinimumWindow = event.time - record.eventTime <= visualDedupeWindowForId(record.id);
          if (!stillPresent && !withinMinimumWindow) return false;
          if (record.id === event.id) return true;
          return entry?.features && record.features && sameVisualRepeatFeatureMatch(entry.features, record.features).matched;
        })
      : null;
    if (duplicateRecord) {
      duplicateRecord.lastSeenTime = event.time;
      continue;
    }

    output.push(event);
    if (isSuppressibleVisualRepeat(event.id, event.source) && entry?.features) {
      recent.push({
        id: event.id,
        features: entry.features,
        eventTime: event.time,
        lastSeenTime: event.time,
      });
    }
  }
  return output;
}

function findAnonymousEventGroup(groups, event, entry) {
  const byId = groups.find((group) => group.id === event.id);
  if (byId) return byId;
  if (!entry?.features) return null;

  let best = null;
  for (const group of groups) {
    if (!group.features) continue;
    if (group.builtin && entry.builtin && group.id !== event.id) continue;
    const match = samePatternFeatureMatch(entry.features, group.features);
    if (!match.matched) continue;
    if (!best || match.score > best.score) best = { group, score: match.score };
  }
  return best?.group || null;
}

function renderResults() {
  els.totalGroups.textContent = String(state.events.length);
  els.totalKinds.textContent = String(state.results.length);
  els.eventCount.textContent = `${state.events.length} 条`;
  els.copyBtn.disabled = state.results.length === 0;

  if (!state.results.length) {
    els.resultRows.innerHTML = '<tr class="empty-row"><td colspan="3">暂无结果</td></tr>';
    els.eventList.innerHTML = "";
    els.plainOutput.value = "";
    updateRunControls();
    return;
  }

  const resultBadge = ANONYMOUS_PATTERN_MODE ? "已记录" : "可改名";
  const resultInputAttrs = ANONYMOUS_PATTERN_MODE ? ' readonly aria-readonly="true"' : "";

  els.resultRows.innerHTML = state.results
    .map(
      (row) => `
        <tr data-id="${row.id}">
          <td>
            <div class="tile-cell">
              <img class="tile-thumb" src="${row.thumb}" alt="" />
              <span class="badge">${resultBadge}</span>
            </div>
          </td>
          <td><input class="name-input" value="${escapeAttr(row.label)}" data-id="${row.id}"${resultInputAttrs} /></td>
          <td><strong>${row.count}</strong></td>
        </tr>
      `,
    )
    .join("");

  els.resultRows.querySelectorAll(".name-input").forEach((input) => {
    input.addEventListener("input", () => {
      renameResult(input.dataset.id, input.value.trim());
    });
  });

  const eventOptions = eventEditableEntries()
    .map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`)
    .join("");

  els.eventList.innerHTML = state.events
    .map(
      (event, index) => `
        <div class="event-item" data-source="${escapeAttr(event.source || "")}" data-score="${escapeAttr(event.score || "")}" data-span="${escapeAttr(event.span || "")}" data-max-count="${escapeAttr(event.maxCount || "")}" data-match-source="${escapeAttr(event.matchSource || "")}">
          <span class="event-time">${formatDuration(event.time)}</span>
          <select class="event-select" data-index="${index}">
            ${eventOptions}
          </select>
          <button class="event-delete" type="button" data-index="${index}" aria-label="删除">×</button>
        </div>
      `,
    )
    .join("");

  els.eventList.querySelectorAll(".event-select").forEach((select) => {
    const event = state.events[Number(select.dataset.index)];
    select.value = event.id;
    select.addEventListener("change", () => {
      const template = findTemplateById(select.value);
      const entry = findLevelEntryById(select.value) || template;
      if (!entry) return;
      event.id = entry.group || entry.id;
      event.label = entry.label;
      event.thumb = entry.thumb;
      rebuildResultsFromEvents();
    });
  });

  els.eventList.querySelectorAll(".event-delete").forEach((button) => {
    button.addEventListener("click", () => {
      state.events.splice(Number(button.dataset.index), 1);
      rebuildResultsFromEvents();
    });
  });

  renderPlainOutput();
  updateRunControls();
}

function rebuildResultsFromEvents() {
  state.events = normalizeEvents(state.events);
  state.results = summarizeEvents(state.events);
  mergeCurrentResultsIntoSavedDictionary();
  renderResults();
  renderTemplateGrid();
}

function renameResult(id, label) {
  if (!label) return;
  const result = state.results.find((item) => item.id === id);
  const previousLabel = result?.label || "";
  if (result) result.label = label;

  const entry = findLevelEntryById(id);
  if (entry) entry.label = label;

  const unknown = state.unknowns.find((item) => item.id === id);
  if (unknown) unknown.label = label;

  for (const event of state.events) {
    if (event.id === id || (previousLabel && event.label === previousLabel)) event.label = label;
  }

  const previousCount = state.results.length;
  state.results = summarizeEvents(state.events);
  mergeCurrentResultsIntoSavedDictionary();
  if (state.results.length !== previousCount) {
    renderResults();
    renderTemplateGrid();
    return;
  }
  els.totalKinds.textContent = String(state.results.length);
  renderPlainOutput();
  renderTemplateGrid();
}

function renderPlainOutput() {
  const lines = [
    `总花色组数${state.events.length}`,
    ...state.results.map((row) => (ANONYMOUS_PATTERN_MODE ? `${row.label}：${row.count}` : `${row.label}${row.count}`)),
  ];
  els.plainOutput.value = lines.join("\n");
}

function clearResults() {
  state.results = [];
  state.events = [];
  if (ANONYMOUS_PATTERN_MODE) {
    state.patternNames = new Map();
    state.nextPatternNumber = 1;
  }
  state.namesLocked = false;
  state.debugFrames = [];
  state.resultsDirty = false;
  els.totalGroups.textContent = "0";
  els.totalKinds.textContent = "0";
  els.eventCount.textContent = "0 条";
  els.resultRows.innerHTML = '<tr class="empty-row"><td colspan="3">暂无结果</td></tr>';
  els.eventList.innerHTML = "";
  els.plainOutput.value = "";
  const debugFrameData = document.getElementById("debugFrameData");
  if (debugFrameData) debugFrameData.textContent = "[]";
  els.copyBtn.disabled = true;
  updateRunControls();
}

function reset() {
  cancelAnalysis();
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = "";
  els.video.removeAttribute("src");
  els.video.load();
  els.videoInput.value = "";
  els.fileMeta.textContent = "MP4 / MOV / WebM";
  els.analyzeBtn.disabled = true;
  els.pauseBtn.disabled = true;
  els.statusText.textContent = "等待上传视频";
  clearLevelVocabulary();
  clearResults();
  renderTemplateGrid();
  setProgress(0);
}

function featuresFromDrawable(drawable, width, height) {
  vectorCtx.clearRect(0, 0, VECTOR_SIZE, VECTOR_SIZE);
  vectorCtx.drawImage(drawable, 0, 0, width, height, 0, 0, VECTOR_SIZE, VECTOR_SIZE);
  return featuresFromImageData(vectorCtx.getImageData(0, 0, VECTOR_SIZE, VECTOR_SIZE), true);
}

function featuresFromFrameCrop(sx, sy, sw, sh) {
  vectorCtx.clearRect(0, 0, VECTOR_SIZE, VECTOR_SIZE);
  vectorCtx.drawImage(els.frameCanvas, sx, sy, sw, sh, 0, 0, VECTOR_SIZE, VECTOR_SIZE);
  return featuresFromImageData(vectorCtx.getImageData(0, 0, VECTOR_SIZE, VECTOR_SIZE), true);
}

function featuresFromImageData(imageData, alreadyScaled = false) {
  let data;
  if (alreadyScaled) {
    data = imageData;
  } else {
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    sourceCtx.putImageData(imageData, 0, 0);
    vectorCtx.clearRect(0, 0, VECTOR_SIZE, VECTOR_SIZE);
    vectorCtx.drawImage(sourceCanvas, 0, 0, VECTOR_SIZE, VECTOR_SIZE);
    data = vectorCtx.getImageData(0, 0, VECTOR_SIZE, VECTOR_SIZE);
  }

  const rgb = new Uint8Array(VECTOR_SIZE * VECTOR_SIZE * 3);
  const mask = new Uint8Array(VECTOR_SIZE * VECTOR_SIZE);
  let whitePixels = 0;
  let contentPixels = 0;

  for (let i = 0, p = 0, m = 0; i < data.data.length; i += 4, p += 3, m += 1) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    rgb[p] = r;
    rgb[p + 1] = g;
    rgb[p + 2] = b;

    if (r > 205 && g > 205 && b > 200) whitePixels += 1;
    if (isContentPixel(r, g, b)) {
      mask[m] = 1;
      contentPixels += 1;
    }
  }

  const total = VECTOR_SIZE * VECTOR_SIZE;
  return {
    width: VECTOR_SIZE,
    height: VECTOR_SIZE,
    rgb,
    mask,
    whiteRatio: whitePixels / total,
    contentRatio: contentPixels / total,
  };
}

function isContentPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = (max - min) / Math.max(max, 1);
  const brightness = max / 255;
  const nearWhite = r > 226 && g > 226 && b > 220;
  const trayPurple = b > 70 && r > 35 && r < 135 && g < 90;
  if (nearWhite || trayPurple) return false;
  return (saturation > 0.16 && brightness > 0.26) || brightness < 0.42;
}

function compareFeatures(a, b) {
  let diff = 0;
  let compared = 0;

  for (let i = 0, p = 0; i < a.mask.length; i += 1, p += 3) {
    if (!a.mask[i] && !b.mask[i]) continue;
    diff += Math.abs(a.rgb[p] - b.rgb[p]);
    diff += Math.abs(a.rgb[p + 1] - b.rgb[p + 1]);
    diff += Math.abs(a.rgb[p + 2] - b.rgb[p + 2]);
    compared += 3;
  }

  if (compared < 90) return 0;
  return 1 - diff / (compared * 255);
}

function comparePatternFeatures(a, b) {
  return samePatternFeatureMatch(a, b).score;
}

function samePatternFeatureMatch(a, b, options = {}) {
  const allowPartial = options.allowPartial !== false;
  const directScore = compareFeatures(a, b);
  if (directScore >= SAME_PATTERN_MERGE_THRESHOLD) {
    return { matched: true, score: directScore, source: "direct" };
  }

  const normalized = normalizedPatternSimilarity(a, b);
  const normalizedMatch =
    normalized.score >= NORMALIZED_PATTERN_MERGE_THRESHOLD &&
    normalized.colorScore >= NORMALIZED_PATTERN_COLOR_THRESHOLD &&
    normalized.shapeScore >= NORMALIZED_PATTERN_SHAPE_THRESHOLD;
  const softDirectMatch =
    directScore >= SAME_PATTERN_SOFT_DIRECT_THRESHOLD &&
    normalized.colorScore >= NORMALIZED_PATTERN_COLOR_THRESHOLD &&
    normalized.shapeScore >= SOFT_DIRECT_PATTERN_SHAPE_THRESHOLD &&
    normalized.containmentScore >= SOFT_DIRECT_PATTERN_CONTAINMENT_THRESHOLD;
  const partialMatch =
    allowPartial &&
    normalized.score >= PARTIAL_PATTERN_SCORE_THRESHOLD &&
    normalized.areaRatio <= PARTIAL_PATTERN_MAX_AREA_RATIO &&
    normalized.colorScore >= PARTIAL_PATTERN_COLOR_THRESHOLD &&
    normalized.shapeScore >= PARTIAL_PATTERN_SHAPE_THRESHOLD &&
    normalized.containmentScore >= PARTIAL_PATTERN_CONTAINMENT_THRESHOLD;

  return {
    matched: normalizedMatch || softDirectMatch || partialMatch,
    score: Math.max(directScore, normalized.score),
    source: normalizedMatch ? "normalized" : softDirectMatch ? "soft-direct" : partialMatch ? "partial-normalized" : "",
  };
}

function sameVisualIdentityFeatureMatch(a, b, options = {}) {
  const strict = samePatternFeatureMatch(a, b, options);
  if (strict.matched) return strict;

  const upper = upperPatternSimilarity(a, b);
  const upperMatch =
    upper.score >= 0.72 &&
    upper.colorScore >= 0.87 &&
    upper.shapeScore >= 0.52 &&
    upper.containmentScore >= 0.72;
  if (upperMatch) {
    return { matched: true, score: upper.score, source: "upper-identity" };
  }

  const normalized = normalizedPatternSimilarity(a, b);
  const relaxedMatch =
    normalized.score >= 0.72 &&
    normalized.colorScore >= 0.87 &&
    normalized.shapeScore >= 0.52 &&
    normalized.containmentScore >= 0.72 &&
    (normalized.areaRatio ?? 0) >= 0.42;
  return {
    matched: relaxedMatch,
    score: Math.max(strict.score || 0, upper.score || 0, normalized.score || 0),
    source: relaxedMatch ? "relaxed-identity" : "",
  };
}

function sameVisualRepeatFeatureMatch(a, b) {
  const identity = sameVisualIdentityFeatureMatch(a, b);
  if (identity.matched) return identity;

  const upper = upperPatternSimilarity(a, b);
  const upperMatch =
    upper.score >= 0.66 &&
    upper.colorScore >= 0.84 &&
    upper.shapeScore >= 0.44 &&
    upper.containmentScore >= 0.66;
  if (upperMatch) {
    return { matched: true, score: upper.score, source: "upper-repeat" };
  }

  const normalized = normalizedPatternSimilarity(a, b);
  const relaxedMatch =
    normalized.score >= 0.66 &&
    normalized.colorScore >= 0.84 &&
    normalized.shapeScore >= 0.44 &&
    normalized.containmentScore >= 0.66;
  return {
    matched: relaxedMatch,
    score: Math.max(identity.score || 0, upper.score || 0, normalized.score || 0),
    source: relaxedMatch ? "relaxed-repeat" : "",
  };
}

function compareNormalizedPatternFeatures(a, b) {
  return normalizedPatternSimilarity(a, b).score;
}

function normalizedPatternSimilarity(a, b) {
  const normalizedA = normalizedPatternVector(a);
  const normalizedB = normalizedPatternVector(b);
  if (!normalizedA || !normalizedB) {
    return { score: 0, colorScore: 0, shapeScore: 0, containmentScore: 0 };
  }

  return bestShiftedNormalizedSimilarity(normalizedA, normalizedB);
}

function upperPatternSimilarity(a, b) {
  const normalizedA = upperPatternVector(a);
  const normalizedB = upperPatternVector(b);
  if (!normalizedA || !normalizedB) {
    return { score: 0, colorScore: 0, shapeScore: 0, containmentScore: 0 };
  }

  return bestShiftedNormalizedSimilarity(normalizedA, normalizedB);
}

function bestShiftedNormalizedSimilarity(normalizedA, normalizedB) {
  let best = null;
  for (let shiftY = -NORMALIZED_PATTERN_SHIFT_RADIUS; shiftY <= NORMALIZED_PATTERN_SHIFT_RADIUS; shiftY += 1) {
    for (let shiftX = -NORMALIZED_PATTERN_SHIFT_RADIUS; shiftX <= NORMALIZED_PATTERN_SHIFT_RADIUS; shiftX += 1) {
      const score = shiftedNormalizedPatternSimilarity(normalizedA, normalizedB, shiftX, shiftY);
      if (!best || score.score > best.score) best = score;
    }
  }

  return best || { score: 0, colorScore: 0, shapeScore: 0, containmentScore: 0 };
}

function shiftedNormalizedPatternSimilarity(normalizedA, normalizedB, shiftX, shiftY) {
  let overlap = 0;
  let union = 0;
  let diff = 0;
  let compared = 0;

  for (let y = 0; y < NORMALIZED_PATTERN_SIZE; y += 1) {
    for (let x = 0; x < NORMALIZED_PATTERN_SIZE; x += 1) {
      const indexA = y * NORMALIZED_PATTERN_SIZE + x;
      const xB = x + shiftX;
      const yB = y + shiftY;
      const indexB =
        xB >= 0 && xB < NORMALIZED_PATTERN_SIZE && yB >= 0 && yB < NORMALIZED_PATTERN_SIZE
          ? yB * NORMALIZED_PATTERN_SIZE + xB
          : -1;
      const inA = normalizedA.mask[indexA];
      const inB = indexB >= 0 ? normalizedB.mask[indexB] : 0;
      if (!inA && !inB) continue;
      union += 1;
      if (!inA || !inB) continue;

      const offsetA = indexA * 3;
      const offsetB = indexB * 3;
      overlap += 1;
      diff += Math.abs(normalizedA.rgb[offsetA] - normalizedB.rgb[offsetB]);
      diff += Math.abs(normalizedA.rgb[offsetA + 1] - normalizedB.rgb[offsetB + 1]);
      diff += Math.abs(normalizedA.rgb[offsetA + 2] - normalizedB.rgb[offsetB + 2]);
      compared += 3;
    }
  }

  if (!union || compared < 45) {
    return { score: 0, colorScore: 0, shapeScore: 0, containmentScore: 0, shiftX, shiftY };
  }

  const shapeScore = overlap / union;
  const colorScore = 1 - diff / (compared * 255);
  const containmentScore = overlap / Math.max(1, Math.min(normalizedA.maskArea, normalizedB.maskArea));
  const areaRatio = Math.min(normalizedA.area, normalizedB.area) / Math.max(normalizedA.area, normalizedB.area);
  const aspectRatio = normalizedA.aspect > 0 && normalizedB.aspect > 0
    ? Math.min(normalizedA.aspect, normalizedB.aspect) / Math.max(normalizedA.aspect, normalizedB.aspect)
    : 0;
  return {
    score: 0.5 * colorScore + 0.32 * shapeScore + 0.12 * areaRatio + 0.06 * aspectRatio,
    colorScore,
    shapeScore,
    containmentScore,
    areaRatio,
    aspectRatio,
    shiftX,
    shiftY,
  };
}

function normalizedPatternVector(features) {
  if (!features) return null;
  if (features._normalizedPatternVector !== undefined) return features._normalizedPatternVector;

  const patternMask = detachedPatternMask(features);
  if (!patternMask) {
    features._normalizedPatternVector = null;
    return null;
  }

  features._normalizedPatternVector = patternVectorFromMask(features, patternMask);
  return features._normalizedPatternVector;
}

function upperPatternVector(features) {
  if (!features) return null;
  if (features._upperPatternVector !== undefined) return features._upperPatternVector;

  const patternMask = detachedPatternMask(features, PATTERN_BOTTOM_TRIM + 5);
  if (!patternMask) {
    features._upperPatternVector = null;
    return null;
  }

  features._upperPatternVector = patternVectorFromMask(features, patternMask);
  return features._upperPatternVector;
}

function patternVectorFromMask(features, patternMask) {
  const bounds = maskBounds(patternMask);
  if (!bounds || bounds.area < 18) {
    return null;
  }

  const size = NORMALIZED_PATTERN_SIZE;
  const rgb = new Uint8Array(size * size * 3);
  const mask = new Uint8Array(size * size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = bounds.minX + Math.min(bounds.width - 1, Math.floor(((x + 0.5) * bounds.width) / size));
      const sy = bounds.minY + Math.min(bounds.height - 1, Math.floor(((y + 0.5) * bounds.height) / size));
      const sourceIndex = sy * VECTOR_SIZE + sx;
      const targetIndex = y * size + x;
      const sourceRgb = sourceIndex * 3;
      const targetRgb = targetIndex * 3;
      if (patternMask[sourceIndex]) mask[targetIndex] = 1;
      rgb[targetRgb] = features.rgb[sourceRgb];
      rgb[targetRgb + 1] = features.rgb[sourceRgb + 1];
      rgb[targetRgb + 2] = features.rgb[sourceRgb + 2];
    }
  }

  return {
    rgb,
    mask,
    area: bounds.area,
    maskArea: countMaskPixels(mask),
    aspect: bounds.width / Math.max(1, bounds.height),
  };
}

function detachedPatternMask(features, bottomTrim = PATTERN_BOTTOM_TRIM) {
  const initial = new Uint8Array(VECTOR_SIZE * VECTOR_SIZE);
  for (let i = 0, p = 0; i < features.mask.length; i += 1, p += 3) {
    if (!features.mask[i]) continue;
    const x = i % VECTOR_SIZE;
    const y = Math.floor(i / VECTOR_SIZE);
    if (isPatternPixelAt(features.rgb[p], features.rgb[p + 1], features.rgb[p + 2], x, y, bottomTrim)) {
      initial[i] = 1;
    }
  }

  const subject = subjectPatternMask(initial);
  if (countMaskPixels(subject) >= 18) return subject;

  const kept = removeEdgeConnectedComponents(initial);
  if (countMaskPixels(kept) >= 18) return kept;
  if (countMaskPixels(initial) >= 18) return initial;
  return null;
}

function innerPatternMask(features, bottomTrim = PATTERN_BOTTOM_TRIM) {
  const initial = new Uint8Array(VECTOR_SIZE * VECTOR_SIZE);
  for (let i = 0, p = 0; i < features.mask.length; i += 1, p += 3) {
    if (!features.mask[i]) continue;
    const x = i % VECTOR_SIZE;
    const y = Math.floor(i / VECTOR_SIZE);
    if (isPatternPixelAt(features.rgb[p], features.rgb[p + 1], features.rgb[p + 2], x, y, bottomTrim)) {
      initial[i] = 1;
    }
  }
  return removeEdgeConnectedComponents(initial);
}

function isPatternPixelAt(r, g, b, x, y, bottomTrim = PATTERN_BOTTOM_TRIM) {
  if (
    x < PATTERN_EDGE_TRIM ||
    y < PATTERN_EDGE_TRIM ||
    x >= VECTOR_SIZE - PATTERN_EDGE_TRIM ||
    y >= VECTOR_SIZE - bottomTrim
  ) {
    return false;
  }
  return isPatternPixel(r, g, b);
}

function subjectPatternMask(mask) {
  const kept = new Uint8Array(mask.length);
  const visited = new Uint8Array(mask.length);
  const queue = [];
  const component = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    queue.length = 0;
    component.length = 0;
    queue.push(start);
    visited[start] = 1;

    let minX = VECTOR_SIZE;
    let minY = VECTOR_SIZE;
    let maxX = -1;
    let maxY = -1;
    let centralPixels = 0;
    let touchesFrame = false;

    for (let head = 0; head < queue.length; head += 1) {
      const index = queue[head];
      component.push(index);
      const x = index % VECTOR_SIZE;
      const y = Math.floor(index / VECTOR_SIZE);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (x <= PATTERN_FRAME_MARGIN || y <= PATTERN_FRAME_MARGIN || x >= VECTOR_SIZE - 1 - PATTERN_FRAME_MARGIN || y >= VECTOR_SIZE - 1 - PATTERN_FRAME_MARGIN) {
        touchesFrame = true;
      }
      if (x >= 6 && x <= VECTOR_SIZE - 7 && y >= 6 && y <= VECTOR_SIZE - 7) centralPixels += 1;

      for (const next of neighborIndexes(x, y)) {
        if (!mask[next] || visited[next]) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (component.length < PATTERN_COMPONENT_MIN_AREA) continue;
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const isFrameStrip = (width >= 30 && height <= 7) || (height >= 30 && width <= 7);
    const centralShare = centralPixels / Math.max(1, component.length);
    if (isFrameStrip) continue;
    if (touchesFrame && centralShare < PATTERN_COMPONENT_CENTRAL_MIN_SHARE) continue;

    for (const index of component) kept[index] = 1;
  }

  return kept;
}

function isPatternPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = (max - min) / Math.max(max, 1);
  const brightness = max / 255;
  const nearWhite = r > 226 && g > 226 && b > 220;
  if (nearWhite) return false;
  if (brightness < 0.28) return saturation > 0.35;
  return saturation > 0.22;
}

function removeEdgeConnectedComponents(mask) {
  const kept = new Uint8Array(mask.length);
  const visited = new Uint8Array(mask.length);
  const queue = [];
  const component = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    queue.length = 0;
    component.length = 0;
    queue.push(start);
    visited[start] = 1;
    let touchesEdge = false;

    for (let head = 0; head < queue.length; head += 1) {
      const index = queue[head];
      component.push(index);
      const x = index % VECTOR_SIZE;
      const y = Math.floor(index / VECTOR_SIZE);
      if (x === 0 || y === 0 || x === VECTOR_SIZE - 1 || y === VECTOR_SIZE - 1) touchesEdge = true;

      for (const next of neighborIndexes(x, y)) {
        if (!mask[next] || visited[next]) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (!touchesEdge) {
      for (const index of component) kept[index] = 1;
    }
  }

  return kept;
}

function neighborIndexes(x, y) {
  const neighbors = [];
  if (x > 0) neighbors.push(y * VECTOR_SIZE + x - 1);
  if (x < VECTOR_SIZE - 1) neighbors.push(y * VECTOR_SIZE + x + 1);
  if (y > 0) neighbors.push((y - 1) * VECTOR_SIZE + x);
  if (y < VECTOR_SIZE - 1) neighbors.push((y + 1) * VECTOR_SIZE + x);
  return neighbors;
}

function countMaskPixels(mask) {
  let count = 0;
  for (const value of mask) {
    if (value) count += 1;
  }
  return count;
}

function maskBounds(mask) {
  let minX = VECTOR_SIZE;
  let minY = VECTOR_SIZE;
  let maxX = -1;
  let maxY = -1;
  let area = 0;

  for (let y = 0, index = 0; y < VECTOR_SIZE; y += 1) {
    for (let x = 0; x < VECTOR_SIZE; x += 1, index += 1) {
      if (!mask[index]) continue;
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!area) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    area,
  };
}

function vectorCanvasFromFeatures(features) {
  const canvas = document.createElement("canvas");
  canvas.width = VECTOR_SIZE;
  canvas.height = VECTOR_SIZE;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(VECTOR_SIZE, VECTOR_SIZE);
  for (let i = 0, p = 0; i < features.rgb.length; i += 3, p += 4) {
    imageData.data[p] = features.rgb[i];
    imageData.data[p + 1] = features.rgb[i + 1];
    imageData.data[p + 2] = features.rgb[i + 2];
    imageData.data[p + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function findTemplateById(id) {
  return (
    state.templates.find((item) => item.group === id || item.id === id) ||
    state.savedDictionary.find((item) => item.id === id) ||
    state.unknowns.find((item) => item.id === id)
  );
}

function templateGroups() {
  const groups = new Map();
  for (const template of state.templates) {
    const id = template.group || template.id;
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        label: "参考图案",
        thumb: template.thumb,
        builtin: true,
      });
    }
  }
  return [...groups.values()];
}

function ensureMetadata() {
  if (Number.isFinite(els.video.duration) && els.video.videoWidth) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("无法读取视频信息")), 8000);
    els.video.addEventListener(
      "loadedmetadata",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

function seekVideo(time) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`跳转到 ${formatDuration(time)} 失败`)), 9000);
    const done = async () => {
      clearTimeout(timeout);
      els.video.removeEventListener("seeked", done);
      await waitForDecodedFrame();
      resolve();
    };
    if (Math.abs(els.video.currentTime - time) < 0.01) {
      done();
      return;
    }
    els.video.addEventListener("seeked", done);
    els.video.currentTime = time;
  });
}

function waitForDecodedFrame() {
  if (typeof els.video.requestVideoFrameCallback === "function") {
    return new Promise((resolve) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve();
        }
      }, 160);
      els.video.requestVideoFrameCallback(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`模板加载失败：${src}`));
    image.src = src;
  });
}

function setProgress(value) {
  const percent = Math.round(clamp(value, 0, 1) * 100);
  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = `${percent}%`;
}

function idle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const total = Math.max(0, Math.round(seconds));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}
