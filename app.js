(function () {
  "use strict";

  const DEFAULT_ASSIGNEES = [
    "田村",
    "船木",
    "伊藤",
    "野口",
    "三木",
    "伝福",
    "藤田",
    "佐孝",
    "黒畑",
    "安楽",
    "岡崎",
    "西村",
    "担当者未設定"
  ];

  const COLORS = {
    "田村": "#0f766e",
    "船木": "#2563eb",
    "伊藤": "#dc2626",
    "野口": "#ca8a04",
    "三木": "#7c3aed",
    "伝福": "#0891b2",
    "藤田": "#16a34a",
    "佐孝": "#ea580c",
    "黒畑": "#374151",
    "安楽": "#be185d",
    "岡崎": "#4f46e5",
    "西村": "#65a30d",
    "担当者未設定": "#8b949e"
  };

  const HEADER_ALIASES = {
    systemId: ["システムID", "システム ID", "システムＩＤ", "ANDPAD_ID", "ANDPAD ID", "案件ID", "案件 ID", "order_id", "system_id"],
    andpadId: ["ANDPAD_ID", "ANDPAD ID", "システムID", "システム ID", "システムＩＤ", "案件ID", "案件 ID", "order_id", "system_id"],
    projectId: ["案件管理ID", "案件管理 ID", "案件管理ＩＤ", "現場コード", "管理ID", "管理 ID", "現場番号", "工事番号", "コード", "sitecode", "code"],
    code: ["現場コード", "案件管理ID", "案件管理 ID", "案件管理ＩＤ", "管理ID", "管理 ID", "現場番号", "工事番号", "コード", "sitecode", "code"],
    name: ["案件名", "現場名", "施主名", "顧客名", "お客様名", "現場名称", "工事件名", "物件名", "名称", "sitename", "name"],
    addressPrefecture: ["物件都道府県", "物件 都道府県", "建設地 都道府県", "建設地都道府県", "都道府県", "建設地_都道府県", "prefecture"],
    address: ["物件住所", "物件 住所", "建設地 住所", "建設地住所", "住所", "所在地", "現場住所", "address"],
    assignee: ["役割:工事", "役割：工事", "役割 工事", "工事担当", "現場担当", "施工担当", "担当者", "担当", "責任者", "assignee", "person"],
    salesAssignee: ["役割:営業", "役割：営業", "役割 営業", "営業担当", "営業", "営業者", "sales_assignee", "salesperson", "sales"],
    designAssignee: ["役割:設計", "役割：設計", "役割 設計", "設計担当", "設計", "設計者", "design_assignee", "designer"],
    status: ["案件フロー", "ステータス", "状態", "進捗", "状況", "status", "flow"],
    note: ["備考", "メモ", "コメント", "note", "remarks"],
    lat: ["物件緯度", "物件 緯度", "緯度", "lat", "latitude"],
    lng: ["物件経度", "物件 経度", "経度", "lng", "lon", "longitude"]
  };

  const VERSION_LABEL = "Version 8.1";
  const STANDARD_DATA_URL = "./data/sites.csv";
  const HOKKAIDO_CENTER = [43.06417, 141.34694];
  const HOKKAIDO_ZOOM = 8;
  const UNSET_STATUS = "ステータス未設定";

  const elements = {
    csvInput: document.getElementById("csvInput"),
    searchInput: document.getElementById("searchInput"),
    assigneeFilters: document.getElementById("assigneeFilters"),
    statusFilters: document.getElementById("statusFilters"),
    siteList: document.getElementById("siteList"),
    statusText: document.getElementById("statusText"),
    visibleCount: document.getElementById("visibleCount"),
    totalCount: document.getElementById("totalCount"),
    mapVisibleCount: document.getElementById("mapVisibleCount"),
    geocodeFailCount: document.getElementById("geocodeFailCount"),
    pendingCount: document.getElementById("pendingCount"),
    debugLoadedCount: document.getElementById("debugLoadedCount"),
    debugGeocodeSuccessCount: document.getElementById("debugGeocodeSuccessCount"),
    debugGeocodeFailureCount: document.getElementById("debugGeocodeFailureCount"),
    debugCsvCoordinateCount: document.getElementById("debugCsvCoordinateCount"),
    debugMarkerCount: document.getElementById("debugMarkerCount"),
    apiNameText: document.getElementById("apiNameText"),
    leafletCssStatus: document.getElementById("leafletCssStatus"),
    siteDetailPanel: document.getElementById("siteDetailPanel"),
    closeDetailButton: document.getElementById("closeDetailButton"),
    detailStatus: document.getElementById("detailStatus"),
    detailClientName: document.getElementById("detailClientName"),
    detailCode: document.getElementById("detailCode"),
    detailCodeValue: document.getElementById("detailCodeValue"),
    detailOwnerValue: document.getElementById("detailOwnerValue"),
    detailFieldAssignee: document.getElementById("detailFieldAssignee"),
    detailSalesAssignee: document.getElementById("detailSalesAssignee"),
    detailStatusValue: document.getElementById("detailStatusValue"),
    detailAddress: document.getElementById("detailAddress"),
    detailAndpadButton: document.getElementById("detailAndpadButton"),
    detailScheduleButton: document.getElementById("detailScheduleButton"),
    detailMessage: document.getElementById("detailMessage"),
    toggleAllButton: document.getElementById("toggleAllButton"),
    toggleStatusButton: document.getElementById("toggleStatusButton"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    fitMapButton: document.getElementById("fitMapButton"),
    mapNotice: document.getElementById("mapNotice"),
    assigneeDetailTitle: document.getElementById("assigneeDetailTitle"),
    assigneeDetailList: document.getElementById("assigneeDetailList"),
    clearAssigneeDetailButton: document.getElementById("clearAssigneeDetailButton"),
    municipalityStats: document.getElementById("municipalityStats")
  };
  elements.updateTimestamp = document.getElementById("updateTimestamp");

  let sites = [];
  let activeAssignees = new Set(DEFAULT_ASSIGNEES);
  let activeStatuses = new Set();
  let selectedAssigneeDetail = "";
  let selectedSiteId = "";
  let query = "";
  let visibleSites = [];
  let lastUpdatedAt = "";
  let renderFrame = 0;
  let map;
  let markersLayer;
  let markerById = new Map();

  init();

  function init() {
    map = L.map("map", {
      zoomControl: true,
      preferCanvas: false
    }).setView(HOKKAIDO_CENTER, HOKKAIDO_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    map.whenReady(() => {
      logDebug("map.whenReady", {
        center: HOKKAIDO_CENTER,
        zoom: HOKKAIDO_ZOOM
      });
      refreshMapLayout(false, 0);
    });

    activeStatuses = new Set(getCurrentStatuses());
    renderAssigneeFilters(DEFAULT_ASSIGNEES);
    renderStatusFilters(getCurrentStatuses());
    bindEvents();

    updateTimestampDisplay();
    render();
    loadStandardData();
  }

  function bindEvents() {
    elements.csvInput.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        const rows = await readDataFile(file);
        lastUpdatedAt = new Date().toISOString();
        loadRows(rows, `${file.name} を一時データとして取り込みました`);
      } catch (error) {
        setStatus(error && error.message ? error.message : "ファイルを読み込めませんでした");
        logDebug("data file read error", { error: error && error.message ? error.message : String(error) });
      } finally {
        event.target.value = "";
      }
    });

    elements.searchInput.addEventListener("input", (event) => {
      query = normalizeText(event.target.value);
      scheduleRender();
    });

    elements.toggleAllButton.addEventListener("click", () => {
      const assignees = getCurrentAssignees();
      activeAssignees = activeAssignees.size === assignees.length ? new Set() : new Set(assignees);
      renderAssigneeFilters(assignees);
      render();
    });

    elements.toggleStatusButton.addEventListener("click", () => {
      const statuses = getCurrentStatuses();
      activeStatuses = activeStatuses.size === statuses.length ? new Set() : new Set(statuses);
      renderStatusFilters(statuses);
      render();
    });

    elements.clearAssigneeDetailButton.addEventListener("click", () => {
      selectedAssigneeDetail = "";
      renderAssigneeDetail();
    });

    elements.exportCsvButton.addEventListener("click", exportVisibleCsv);
    elements.fitMapButton.addEventListener("click", fitVisibleMarkers);
    elements.closeDetailButton.addEventListener("click", closeSiteDetail);
    elements.detailAndpadButton.addEventListener("click", () => {
      const site = getSelectedSite();
      if (site) openAndpad(site);
    });
    elements.detailScheduleButton.addEventListener("click", () => {
      const site = getSelectedSite();
      if (site) openSchedule(site);
    });
    window.addEventListener("resize", () => refreshMapLayout(false));
  }

  async function readCsvFile(file) {
    const buffer = await file.arrayBuffer();
    const decoders = [
      new TextDecoder("utf-8", { fatal: true }),
      new TextDecoder("shift_jis")
    ];

    for (const decoder of decoders) {
      try {
        return decoder.decode(buffer);
      } catch (error) {
        // Try the next common Japanese CSV encoding.
      }
    }

    return new TextDecoder("utf-8").decode(buffer);
  }

  async function loadStandardData() {
    setStatus("標準データ data/sites.csv を確認しています");

    try {
      const response = await fetch(`${STANDARD_DATA_URL}?updated=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        const message = response.status === 404
          ? "data/sites.csv が見つかりません。手動読込できます"
          : `data/sites.csv を読み込めませんでした（HTTP ${response.status}）`;
        setStatus(message);
        logDebug("standard data not loaded", { status: response.status, url: STANDARD_DATA_URL });
        return;
      }

      const text = await response.text();
      const lastModified = response.headers.get("last-modified");
      const modifiedDate = lastModified ? new Date(lastModified) : null;
      lastUpdatedAt = modifiedDate && !Number.isNaN(modifiedDate.getTime())
        ? modifiedDate.toISOString()
        : new Date().toISOString();
      loadRows(parseCsv(text), "data/sites.csv を自動読込しました");
    } catch (error) {
      setStatus("data/sites.csv を自動読込できませんでした。手動読込できます");
      logDebug("standard data read error", { error: error && error.message ? error.message : String(error) });
    }
  }

  async function readDataFile(file) {
    const name = String(file.name || "").toLowerCase();
    const type = String(file.type || "").toLowerCase();
    if (name.endsWith(".xlsx")) {
      return readXlsxFile(file);
    }
    if (name.endsWith(".csv") || type.includes("csv") || !name) {
      return parseCsv(await readCsvFile(file));
    }
    throw new Error("ANDPADデータはExcel（.xlsx）またはCSVで読み込んでください。");
  }

  function loadCsvText(text, message) {
    loadRows(parseCsv(text), message);
  }

  function loadRows(rows, message) {
    sites = mapRows(rows);
    logDebug("CSV loaded", {
      parsedRows: rows.length,
      sites: sites.length,
      csvCoordinates: getCsvCoordinateCount(),
      mapMissing: getMapMissingCount()
    });
    logDebug("CSV site details", sites.map((site) => ({
      code: site.code,
      name: site.name,
      address: site.address,
      lat: site.lat,
      lng: site.lng,
      coordinateSource: site.coordinateSource
    })));
    selectedAssigneeDetail = "";
    selectedSiteId = "";
    activeAssignees = new Set(getCurrentAssignees());
    activeStatuses = new Set(getCurrentStatuses());
    renderAssigneeFilters(getCurrentAssignees());
    renderStatusFilters(getCurrentStatuses());
    setStatus(message);
    updateTimestampDisplay();
    render();
    refreshMapAfterCsvLoad();
  }

  function parseCsv(text) {
    const cleanText = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i += 1) {
      const char = cleanText[i];
      const next = cleanText[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(field);
        if (row.some((value) => value.trim() !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    return rows;
  }

  async function readXlsxFile(file) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("このブラウザではExcel読込に対応していません。CSVで取り込んでください。");
    }

    const buffer = await file.arrayBuffer();
    const entries = readZipDirectory(buffer);
    const sheetName = Array.from(entries.keys())
      .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))[0];

    if (!sheetName) {
      throw new Error("Excel内にワークシートが見つかりません。");
    }

    const [sharedXml, sheetXml] = await Promise.all([
      entries.has("xl/sharedStrings.xml") ? inflateZipEntry(buffer, entries.get("xl/sharedStrings.xml")) : "",
      inflateZipEntry(buffer, entries.get(sheetName))
    ]);

    return parseXlsxSheet(sheetXml, parseSharedStrings(sharedXml));
  }

  function readZipDirectory(buffer) {
    const view = new DataView(buffer);
    let eocdOffset = -1;
    for (let index = view.byteLength - 22; index >= 0; index -= 1) {
      if (view.getUint32(index, true) === 0x06054b50) {
        eocdOffset = index;
        break;
      }
    }

    if (eocdOffset < 0) {
      throw new Error("Excelファイルを読み取れませんでした。");
    }

    const entryCount = view.getUint16(eocdOffset + 10, true);
    let offset = view.getUint32(eocdOffset + 16, true);
    const decoder = new TextDecoder("utf-8");
    const entries = new Map();

    for (let count = 0; count < entryCount; count += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const fileNameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localHeaderOffset = view.getUint32(offset + 42, true);
      const nameBytes = new Uint8Array(buffer, offset + 46, fileNameLength);
      const name = decoder.decode(nameBytes).replace(/\\/g, "/");
      entries.set(name, { method, compressedSize, localHeaderOffset });
      offset += 46 + fileNameLength + extraLength + commentLength;
    }

    return entries;
  }

  async function inflateZipEntry(buffer, entry) {
    const view = new DataView(buffer);
    const offset = entry.localHeaderOffset;
    if (view.getUint32(offset, true) !== 0x04034b50) {
      throw new Error("Excelファイル内のデータを読み取れませんでした。");
    }

    const fileNameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const compressed = new Uint8Array(buffer, dataStart, entry.compressedSize);

    if (entry.method === 0) {
      return new TextDecoder("utf-8").decode(compressed);
    }
    if (entry.method !== 8) {
      throw new Error("対応していないExcel圧縮形式です。CSVで取り込んでください。");
    }

    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).text();
  }

  function parseSharedStrings(xmlText) {
    if (!xmlText) return [];
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    return Array.from(xml.getElementsByTagName("si")).map((item) => {
      return Array.from(item.getElementsByTagName("t")).map((textNode) => textNode.textContent || "").join("");
    });
  }

  function parseXlsxSheet(xmlText, sharedStrings) {
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    if (xml.getElementsByTagName("parsererror").length) {
      throw new Error("Excelシートの解析に失敗しました。CSVで取り込んでください。");
    }

    return Array.from(xml.getElementsByTagName("row")).map((rowNode) => {
      const row = [];
      Array.from(rowNode.getElementsByTagName("c")).forEach((cellNode, orderIndex) => {
        const cellRef = cellNode.getAttribute("r") || "";
        const columnIndex = getExcelColumnIndex(cellRef) ?? orderIndex;
        const type = cellNode.getAttribute("t") || "";
        let value = "";

        if (type === "inlineStr") {
          value = Array.from(cellNode.getElementsByTagName("t")).map((textNode) => textNode.textContent || "").join("");
        } else {
          const valueNode = cellNode.getElementsByTagName("v")[0];
          value = valueNode ? valueNode.textContent || "" : "";
          if (type === "s") {
            value = sharedStrings[Number(value)] || "";
          }
        }

        row[columnIndex] = value;
      });
      return row.map((value) => value || "");
    }).filter((row) => row.some((value) => String(value || "").trim() !== ""));
  }

  function getExcelColumnIndex(cellRef) {
    const match = String(cellRef || "").match(/^([A-Z]+)/i);
    if (!match) return null;
    return Array.from(match[1].toUpperCase()).reduce((total, char) => {
      return total * 26 + char.charCodeAt(0) - 64;
    }, 0) - 1;
  }

  function mapRows(rows) {
    if (rows.length === 0) return [];

    const detection = detectColumns(rows);
    const dataRows = detection.hasHeader ? rows.slice(1) : rows;

    return dataRows
      .filter((row) => row.some((value) => String(value || "").trim() !== ""))
      .map((row, rowIndex) => {
        const addressPrefecture = getCell(row, detection.columns.addressPrefecture);
        const rawAddress = getCell(row, detection.columns.address);
        const address = buildAddress(addressPrefecture, rawAddress);
        const assignee = normalizePersonName(getCell(row, detection.columns.assignee));
        const salesAssignee = normalizePersonName(getCell(row, detection.columns.salesAssignee));
        const designAssignee = normalizePersonName(getCell(row, detection.columns.designAssignee));
        const status = getCell(row, detection.columns.status) || UNSET_STATUS;
        const rawLat = getCell(row, detection.columns.lat);
        const rawLng = getCell(row, detection.columns.lng);
        const hasCoordinateInput = Boolean(rawLat || rawLng);
        const lat = parseCoordinate(rawLat);
        const lng = parseCoordinate(rawLng);
        const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
        const systemId = getCell(row, firstValidIndex(detection.columns.systemId, detection.columns.andpadId));
        const projectId = getCell(row, firstValidIndex(detection.columns.projectId, detection.columns.code));
        const site = {
          id: `site-${Date.now()}-${rowIndex}-${Math.random().toString(16).slice(2)}`,
          systemId,
          projectId,
          andpadId: systemId,
          code: projectId,
          name: getCell(row, detection.columns.name) || "名称未設定",
          addressPrefecture,
          rawAddress,
          address,
          assignee,
          fieldAssignee: assignee,
          salesAssignee,
          designAssignee,
          status,
          note: getCell(row, detection.columns.note),
          municipality: extractMunicipality(address),
          lat: hasCoordinates ? lat : null,
          lng: hasCoordinates ? lng : null,
          geocodeStatus: hasCoordinates ? "done" : address ? "not-found" : "missing-address",
          coordinateSource: hasCoordinates ? "andpad" : hasCoordinateInput ? "andpad-invalid" : "none",
          geocodeFailureReason: hasCoordinates ? "" : address ? "緯度経度未設定" : "住所未設定",
          lastGeocodeUrl: ""
        };

        site.searchIndex = buildSearchIndex(site);
        return site;
      });
  }

  function detectColumns(rows) {
    const headerColumns = detectHeaderColumns(rows[0] || []);
    const hasHeader = Object.values(headerColumns).filter((value) => value >= 0).length >= 2;
    const sampleRows = hasHeader ? rows.slice(1) : rows;
    const inferred = inferColumns(sampleRows);
    const positionalFallback = {
      addressPrefecture: 0,
      address: 1,
      lat: 2,
      lng: 3,
      systemId: 4,
      andpadId: 4,
      projectId: 5,
      code: 5,
      name: 6,
      status: 7,
      salesAssignee: 8,
      assignee: 9,
      designAssignee: 10,
      note: -1
    };
    const fallback = hasHeader
      ? Object.fromEntries(Object.keys(positionalFallback).map((key) => [key, -1]))
      : positionalFallback;

    return {
      hasHeader,
      columns: Object.fromEntries(
        Object.keys(fallback).map((key) => [
          key,
          firstValidIndex(headerColumns[key], inferred[key], fallback[key])
        ])
      )
    };
  }

  function detectHeaderColumns(headerRow) {
    const normalizedAliases = Object.fromEntries(
      Object.entries(HEADER_ALIASES).map(([key, aliases]) => [
        key,
        aliases.map((alias) => normalizeHeader(alias))
      ])
    );
    const columns = Object.fromEntries(Object.keys(HEADER_ALIASES).map((key) => [key, -1]));

    headerRow.forEach((header, index) => {
      const normalized = normalizeHeader(header);
      Object.entries(normalizedAliases).forEach(([key, aliases]) => {
        if (columns[key] < 0 && aliases.includes(normalized)) {
          columns[key] = index;
        }
      });
    });

    return columns;
  }

  function inferColumns(rows) {
    const width = Math.max(0, ...rows.map((row) => row.length));
    const scores = {};
    Object.keys(HEADER_ALIASES).forEach((key) => {
      scores[key] = Array.from({ length: width }, () => 0);
    });

    rows.slice(0, 30).forEach((row) => {
      for (let index = 0; index < width; index += 1) {
        const value = getCell(row, index);
        if (!value) continue;
        const number = parseCoordinate(value);

        if (Number.isFinite(number) && number >= 41 && number <= 46) scores.lat[index] += 6;
        if (Number.isFinite(number) && number >= 139 && number <= 146) scores.lng[index] += 6;
        if (looksLikeAddress(value)) scores.address[index] += 5;
        if (DEFAULT_ASSIGNEES.includes(value)) {
          scores.assignee[index] += 6;
          scores.salesAssignee[index] += 2;
        }
        if (looksLikeStatus(value)) scores.status[index] += 4;
        if (looksLikeCode(value)) scores.code[index] += 2;
        if (looksLikeName(value)) scores.name[index] += 2;
      }
    });

    const columns = {};
    const used = new Set();
    ["lat", "lng", "address", "assignee", "salesAssignee", "status", "code", "name"].forEach((key) => {
      columns[key] = pickBestColumn(scores[key], used);
      if (columns[key] >= 0) used.add(columns[key]);
    });
    columns.note = pickFirstUnused(width, used);
    return columns;
  }

  function pickBestColumn(values, used) {
    let bestIndex = -1;
    let bestScore = 0;
    values.forEach((score, index) => {
      if (!used.has(index) && score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return bestScore > 0 ? bestIndex : -1;
  }

  function pickFirstUnused(width, used) {
    for (let index = 0; index < width; index += 1) {
      if (!used.has(index)) return index;
    }
    return -1;
  }

  function firstValidIndex() {
    for (const value of arguments) {
      if (Number.isInteger(value) && value >= 0) return value;
    }
    return -1;
  }

  function normalizeHeader(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[＿_\-\s　]/g, "");
  }

  function looksLikeAddress(value) {
    return /北海道|市|区|町|村|郡|条|丁目|番地|通/.test(value);
  }

  function looksLikeStatus(value) {
    return /着工|進行|施工|調整|確認|未定|完了|保留|中止|予定|済|前|中/.test(value);
  }

  function looksLikeCode(value) {
    return /^[a-zA-Z0-9_\-]{2,20}$/.test(value) && /\d/.test(value);
  }

  function looksLikeName(value) {
    return value.length >= 3 && !looksLikeAddress(value) && !looksLikeStatus(value);
  }

  function getCell(row, index) {
    if (index < 0 || index >= row.length) return "";
    return String(row[index] || "").trim();
  }

  function addHokkaido(address) {
    const trimmed = String(address || "").trim();
    if (!trimmed) return "";
    return trimmed.includes("北海道") ? trimmed : `北海道${trimmed}`;
  }

  function buildAddress(prefecture, address) {
    const pref = String(prefecture || "").trim();
    const body = String(address || "").trim();
    if (pref && body) {
      return body.includes(pref) ? body : `${pref}${body}`;
    }
    return addHokkaido(body || pref);
  }

  function parseCoordinate(value) {
    if (!value) return null;
    const normalized = String(value).trim().replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
    return Number(normalized);
  }

  function extractMunicipality(address) {
    const compact = String(address || "").replace(/^北海道/, "").trim();
    if (!compact) return "市町村未設定";

    const match = compact.match(/^(.+?郡.+?[町村])|^(.+?市)|^(.+?[町村])/);
    return (match && (match[1] || match[2] || match[3])) || "市町村未判定";
  }

  function refreshMapLayout(shouldFitBounds, delayMs = 0) {
    window.setTimeout(() => {
      if (!map) return;
      invalidateMapSize();
      if (shouldFitBounds) {
        fitVisibleMarkers();
      }
      logDebug("map layout refreshed", {
        delayMs,
        shouldFitBounds,
        markerCount: markerById.size
      });
    }, delayMs);
  }

  function refreshMapAfterCsvLoad() {
    invalidateMapSize();
    logDebug("CSV map refresh step 1", {
      markerCount: markerById.size
    });
    window.setTimeout(() => {
      invalidateMapSize();
      if (markerById.size >= 10) {
        fitVisibleMarkers();
      } else {
        showHokkaidoCenter("マーカー10件未満");
      }
      logDebug("CSV map refresh step 2", {
        markerCount: markerById.size,
        fitBounds: markerById.size >= 10
      });
    }, 500);
  }

  function invalidateMapSize() {
    if (map && typeof map.invalidateSize === "function") {
      map.invalidateSize();
    }
  }

  function renderAssigneeFilters(assignees) {
    const counts = countBy(sites, "assignee");
    elements.assigneeFilters.innerHTML = "";

    assignees.forEach((assignee) => {
      const countValue = counts.get(assignee) || 0;
      const item = document.createElement("div");
      item.className = "assignee-item";
      item.title = `${assignee}: ${countValue}件`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = activeAssignees.has(assignee);
      checkbox.setAttribute("aria-label", `${assignee}を表示`);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          activeAssignees.add(assignee);
        } else {
          activeAssignees.delete(assignee);
        }
        render();
      });

      const dot = document.createElement("span");
      dot.className = "color-dot";
      dot.style.backgroundColor = getColor(assignee);

      const button = document.createElement("button");
      button.className = "assignee-link";
      button.type = "button";
      button.textContent = `${assignee}（${countValue}）`;
      button.addEventListener("click", () => {
        selectedAssigneeDetail = assignee;
        renderAssigneeDetail();
      });

      item.append(checkbox, dot, button);
      elements.assigneeFilters.append(item);
    });

    elements.toggleAllButton.textContent =
      activeAssignees.size === assignees.length ? "すべて非表示" : "すべて表示";
  }

  function renderStatusFilters(statuses) {
    const counts = countBy(sites, "status");
    elements.statusFilters.innerHTML = "";

    statuses.forEach((status) => {
      const countValue = counts.get(status) || 0;
      const label = document.createElement("label");
      label.className = "filter-item";
      label.title = `${status}: ${countValue}件`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = activeStatuses.has(status);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          activeStatuses.add(status);
        } else {
          activeStatuses.delete(status);
        }
        render();
      });

      const name = document.createElement("span");
      name.className = "filter-name";
      name.textContent = `${status}（${countValue}）`;

      label.append(checkbox, name);
      elements.statusFilters.append(label);
    });

    elements.toggleStatusButton.textContent =
      activeStatuses.size === statuses.length ? "すべて非表示" : "すべて表示";
  }

  function scheduleRender() {
    if (renderFrame) {
      window.cancelAnimationFrame(renderFrame);
    }
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0;
      render();
    });
  }

  function render() {
    const filtered = getFilteredSites();
    visibleSites = filtered;
    const mapMissing = getMapMissingCount();

    renderMarkers(filtered);
    renderSiteList(filtered);
    renderAssigneeFilters(getCurrentAssignees());
    renderStatusFilters(getCurrentStatuses());
    renderAssigneeDetail();
    renderMunicipalityStats(filtered);
    renderSiteDetail();

    elements.visibleCount.textContent = String(filtered.length);
    elements.totalCount.textContent = String(sites.length);
    elements.mapVisibleCount.textContent = String(markerById.size);
    elements.geocodeFailCount.textContent = String(mapMissing);
    elements.pendingCount.textContent = String(getCsvCoordinateCount());
    elements.exportCsvButton.disabled = filtered.length === 0;
    renderDebugPanel();

    if (mapMissing > 0) {
      elements.mapNotice.hidden = false;
      elements.mapNotice.textContent = `${mapMissing}件は緯度経度がないため地図未表示です。`;
    } else {
      elements.mapNotice.hidden = true;
      elements.mapNotice.textContent = "";
    }

    refreshMapLayout(false);
  }

  function getFilteredSites() {
    return sites.filter((site) => {
      if (!activeAssignees.has(site.assignee)) return false;
      if (!activeStatuses.has(site.status)) return false;
      if (!query) return true;

      return site.searchIndex.includes(query);
    });
  }

  function renderMarkers(filtered) {
    markersLayer.clearLayers();
    markerById = new Map();

    filtered.forEach((site) => {
      if (!Number.isFinite(site.lat) || !Number.isFinite(site.lng)) return;

      const marker = L.marker([site.lat, site.lng], {
        icon: createIcon(getColor(site.assignee)),
        title: site.name
      }).bindPopup(createPopup(site));

      if (typeof marker.on === "function") {
        marker.on("click", () => openSiteDetail(site, { focusMap: false }));
      }

      marker.addTo(markersLayer);
      markerById.set(site.id, marker);
    });
    logDebug("markers rendered", {
      filteredCount: filtered.length,
      markerCount: markerById.size
    });
  }

  function createIcon(color) {
    return L.divIcon({
      className: "pin-wrap",
      html: `<span class="pin" style="background:${escapeAttribute(color)}"></span>`,
      iconSize: [28, 34],
      iconAnchor: [14, 28],
      popupAnchor: [0, -26]
    });
  }

  function createPopup(site) {
    const andpadUrl = getAndpadUrl(site);
    const scheduleUrl = getScheduleUrl(site);
    const linkButtons = andpadUrl
      ? `
        <div class="popup-actions">
          <a class="popup-map-link" href="${escapeAttribute(andpadUrl)}" target="_blank" rel="noopener">ANDPADを開く</a>
          <a class="popup-map-link nav-link" href="${escapeAttribute(scheduleUrl)}" target="_blank" rel="noopener">工程表を開く</a>
        </div>
      `
      : "";
    const rows = [
      ["案件番号", site.code],
      ["案件名", site.name],
      ["住所", site.address || "住所未設定"],
      ["工事担当", site.assignee],
      ["営業担当", site.salesAssignee],
      ["案件ステータス", site.status],
      ["備考", site.note],
      ["地図表示", getGeocodeLabel(site)]
    ].filter(([, value]) => value);

    return `
      <div class="popup-title">${escapeHtml(site.name)}</div>
      ${rows.map(([label, value]) => `<div class="popup-row"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`).join("")}
      ${linkButtons}
    `;
  }

  function renderSiteList(filtered) {
    elements.siteList.innerHTML = "";

    if (sites.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "ANDPADデータを取り込むと案件が表示されます";
      elements.siteList.append(empty);
      return;
    }

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "該当する案件がありません";
      elements.siteList.append(empty);
      return;
    }

    filtered.forEach((site) => {
      elements.siteList.append(createSiteCard(site, true));
    });
  }

  function createSiteCard(site, compact) {
    const card = document.createElement("article");
    card.className = compact ? "site-card" : "site-card mini-site-card";
    card.dataset.siteId = site.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${site.name}を選択`);
    if (site.id === selectedSiteId) {
      card.classList.add("is-selected");
    }
    if (!Number.isFinite(site.lat) || !Number.isFinite(site.lng)) {
      card.classList.add("is-missing");
    }
    card.style.borderLeftColor = getColor(site.assignee);
    card.addEventListener("click", () => openSiteDetail(site, { focusMap: true }));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSiteDetail(site, { focusMap: true });
      }
    });

    const titleRow = document.createElement("div");
    titleRow.className = "site-title-row";

    const title = document.createElement("div");
    title.className = "site-title";
    title.textContent = site.name;

    const status = document.createElement("span");
    status.className = "status-pill";
    status.textContent = site.status;

    titleRow.append(title, status);

    const meta = document.createElement("div");
    meta.className = "site-meta";
    meta.append(
      makeMetaLine(site.code ? `案件番号: ${site.code}` : "案件番号未設定"),
      makeMetaLine(`工事担当: ${site.assignee}`),
      makeMetaLine(`営業担当: ${site.salesAssignee || "担当者未設定"}`),
      makeMetaLine(site.address || "住所未設定"),
      makeMetaLine(getGeocodeLabel(site))
    );

    const actions = document.createElement("div");
    actions.className = "site-actions";

    const mapButton = createActionButton("地図で表示", () => focusSite(site));
    mapButton.disabled = !hasMapPoint(site);
    actions.append(mapButton);

    const andpadButton = createActionButton("ANDPADを開く", () => openAndpad(site), "primary-action");
    andpadButton.disabled = !site.systemId;
    const scheduleButton = createActionButton("工程表を開く", () => openSchedule(site));
    scheduleButton.disabled = !site.systemId;
    actions.append(andpadButton, scheduleButton);

    card.append(titleRow, meta, actions);
    return card;
  }

  function createActionButton(label, handler, extraClass) {
    const button = document.createElement("button");
    button.className = extraClass ? `action-button ${extraClass}` : "action-button";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handler();
    });
    return button;
  }

  function renderAssigneeDetail() {
    elements.assigneeDetailList.innerHTML = "";

    if (!selectedAssigneeDetail) {
      elements.assigneeDetailTitle.textContent = "工事担当別物件";
      elements.clearAssigneeDetailButton.disabled = true;
      const empty = document.createElement("div");
      empty.className = "mini-empty";
      empty.textContent = "工事担当名をクリックすると一覧を表示します";
      elements.assigneeDetailList.append(empty);
      return;
    }

    const assigned = sites.filter((site) => site.assignee === selectedAssigneeDetail);
    elements.assigneeDetailTitle.textContent = `${selectedAssigneeDetail}の工事担当物件 ${assigned.length}件`;
    elements.clearAssigneeDetailButton.disabled = false;

    if (assigned.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mini-empty";
      empty.textContent = "工事担当物件はありません";
      elements.assigneeDetailList.append(empty);
      return;
    }

    assigned.forEach((site) => {
      const button = document.createElement("button");
      button.className = "mini-row";
      button.type = "button";
      button.addEventListener("click", () => {
        openSiteDetail(site, { focusMap: true });
      });

      const name = document.createElement("span");
      name.textContent = site.name;

      const status = document.createElement("small");
      status.textContent = site.status;

      button.append(name, status);
      elements.assigneeDetailList.append(button);
    });
  }

  function renderMunicipalityStats(filtered) {
    elements.municipalityStats.innerHTML = "";

    if (sites.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mini-empty";
      empty.textContent = "CSV取り込み後に集計します";
      elements.municipalityStats.append(empty);
      return;
    }

    const stats = Array.from(countBy(filtered, "municipality").entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"));

    if (stats.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mini-empty";
      empty.textContent = "表示中の現場がありません";
      elements.municipalityStats.append(empty);
      return;
    }

    stats.slice(0, 12).forEach(([municipality, count]) => {
      const row = document.createElement("div");
      row.className = "stat-row";

      const name = document.createElement("span");
      name.textContent = municipality;

      const badge = document.createElement("span");
      badge.className = "count-badge";
      badge.textContent = String(count);

      row.append(name, badge);
      elements.municipalityStats.append(row);
    });
  }

  function makeMetaLine(text) {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  function getGeocodeLabel(site) {
    const sourceLabels = {
      andpad: "ANDPAD緯度経度で表示"
    };
    const failureText = site.geocodeFailureReason ? `地図未表示（${site.geocodeFailureReason}）` : "地図未表示";
    const labels = {
      done: sourceLabels[site.coordinateSource] || "地図表示中",
      "not-found": failureText,
      error: failureText,
      "missing-address": "住所未設定"
    };
    return labels[site.geocodeStatus] || "";
  }

  function openSiteDetail(site, options = {}) {
    selectedSiteId = site.id;
    renderSiteDetail();
    syncSelectedSiteCards();
    if (options.focusMap && hasMapPoint(site)) {
      focusSite(site);
    }
  }

  function closeSiteDetail() {
    selectedSiteId = "";
    renderSiteDetail();
    syncSelectedSiteCards();
  }

  function syncSelectedSiteCards() {
    elements.siteList.querySelectorAll(".site-card").forEach((card) => {
      const selected = card.dataset.siteId === selectedSiteId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function getSelectedSite() {
    return sites.find((site) => site.id === selectedSiteId) || null;
  }

  function renderSiteDetail() {
    const site = getSelectedSite();
    elements.siteDetailPanel.hidden = !site;
    if (!site) return;

    elements.detailMessage.textContent = "";
    elements.detailStatus.textContent = site.status || UNSET_STATUS;
    elements.detailClientName.textContent = site.name || "案件名未設定";
    elements.detailCode.textContent = site.code ? `案件番号: ${site.code}` : "案件番号未設定";
    elements.detailCodeValue.textContent = site.code || "未設定";
    elements.detailOwnerValue.textContent = site.name || "未設定";
    elements.detailFieldAssignee.textContent = site.assignee || "担当者未設定";
    elements.detailSalesAssignee.textContent = site.salesAssignee || "担当者未設定";
    elements.detailStatusValue.textContent = site.status || UNSET_STATUS;
    elements.detailAddress.textContent = site.address || "住所未設定";
    elements.detailAndpadButton.disabled = !site.systemId;
    elements.detailScheduleButton.disabled = !site.systemId;
    if (!site.systemId) {
      elements.detailMessage.textContent = "システムID未設定";
    }
  }

  function focusSite(site) {
    const marker = markerById.get(site.id);
    if (!marker) return;
    refreshMapLayout(false);
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
    marker.openPopup();
  }

  function fitVisibleMarkers() {
    const markers = Array.from(markerById.values());
    if (markers.length === 0) {
      showHokkaidoCenter("マーカー0件");
      return;
    }

    if (markers.length < 10) {
      showHokkaidoCenter("マーカー10件未満");
      return;
    }

    try {
      const bounds = L.latLngBounds(markers.map((marker) => marker.getLatLng()));
      map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14 });
      logDebug("fitBounds applied", {
        markerCount: markers.length
      });
    } catch (error) {
      showHokkaidoCenter("fitBoundsエラー");
      logDebug("fitBounds error", {
        error: error && error.message ? error.message : String(error),
        markerCount: markers.length
      });
    }
  }

  function showHokkaidoCenter(reason) {
    map.setView(HOKKAIDO_CENTER, HOKKAIDO_ZOOM);
    logDebug("show Hokkaido center", {
      reason,
      center: HOKKAIDO_CENTER,
      zoom: HOKKAIDO_ZOOM,
      markerCount: markerById.size
    });
  }

  function renderDebugPanel() {
    const stats = getDebugStats();
    elements.debugLoadedCount.textContent = String(stats.loadedCount);
    elements.debugGeocodeSuccessCount.textContent = String(stats.csvCoordinateCount);
    elements.debugGeocodeFailureCount.textContent = String(stats.mapMissingCount);
    elements.debugCsvCoordinateCount.textContent = String(stats.csvCoordinateCount);
    elements.debugMarkerCount.textContent = String(stats.markerCount);
    elements.apiNameText.textContent = "システムIDから自動生成";
    elements.leafletCssStatus.textContent = isLeafletCssLoaded() ? "読込済み" : "未読込";
  }

  function isLeafletCssLoaded() {
    const byHref = Array.from(document.styleSheets || []).some((sheet) => {
      return sheet.href && sheet.href.includes("leaflet.css");
    });
    const mapElement = document.getElementById("map");
    const hasLeafletClass = Boolean(
      mapElement &&
      mapElement.classList &&
      typeof mapElement.classList.contains === "function" &&
      mapElement.classList.contains("leaflet-container")
    );
    return byHref || hasLeafletClass;
  }

  function getDebugStats() {
    return {
      loadedCount: sites.length,
      mapMissingCount: getMapMissingCount(),
      csvCoordinateCount: getCsvCoordinateCount(),
      markerCount: markerById.size
    };
  }

  function getCsvCoordinateCount() {
    return sites.filter((site) => site.coordinateSource === "andpad").length;
  }

  function getMapMissingCount() {
    return sites.filter((site) => !hasMapPoint(site)).length;
  }

  function logDebug(label, details) {
    if (!window.console || typeof console.log !== "function") return;
    console.log(`[ecoa Portal ${VERSION_LABEL}] ${label}`, details || {});
  }

  function openAndpad(site) {
    const url = getAndpadUrl(site);
    if (!url) {
      elements.detailMessage.textContent = "システムID未設定";
      return;
    }

    window.open(url, "_blank", "noopener");
    elements.detailMessage.textContent = "ANDPAD現場を開きました";
  }

  function openSchedule(site) {
    const url = getScheduleUrl(site);
    if (!url) {
      elements.detailMessage.textContent = "システムID未設定";
      return;
    }

    const shouldOpen = window.confirm("工程表が未作成の案件はANDPADでエラー画面になる場合があります。工程表を開きますか？");
    if (!shouldOpen) {
      elements.detailMessage.textContent = "工程表を開かずに戻りました";
      return;
    }

    window.open(url, "_blank", "noopener");
    elements.detailMessage.textContent = "工程表を開きました";
  }

  function hasMapPoint(site) {
    return Number.isFinite(site.lat) && Number.isFinite(site.lng);
  }

  function getAndpadUrl(site) {
    const id = normalizeAndpadId(site.systemId);
    return id ? `https://andpad.jp/my/orders/${encodeURIComponent(id)}` : "";
  }

  function getScheduleUrl(site) {
    const id = normalizeAndpadId(site.systemId);
    return id ? `https://andpad.jp/my/orders/${encodeURIComponent(id)}/workload/chart` : "";
  }

  function exportVisibleCsv() {
    if (visibleSites.length === 0) return;
    const headers = ["物件都道府県", "物件住所", "物件緯度", "物件経度", "システムID", "案件管理ID", "案件名", "案件フロー", "役割:営業", "役割:工事", "役割:設計"];
    const rows = visibleSites.map((site) => [
      site.addressPrefecture,
      site.rawAddress || site.address,
      hasMapPoint(site) ? site.lat : "",
      hasMapPoint(site) ? site.lng : "",
      site.systemId,
      site.projectId,
      site.name,
      site.status,
      site.salesAssignee,
      site.assignee,
      site.designAssignee
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `現場マップ_絞り込み結果_${formatDate(new Date())}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeCsvCell(value) {
    const text = String(value ?? "");
    if (/[",\r\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}${month}${day}_${hour}${minute}`;
  }

  function getCurrentAssignees() {
    const imported = sites.map((site) => site.assignee).filter(Boolean);
    return Array.from(new Set([...DEFAULT_ASSIGNEES, ...imported]));
  }

  function getCurrentStatuses() {
    const imported = sites.map((site) => site.status || UNSET_STATUS).filter(Boolean);
    return Array.from(new Set(imported.length ? imported : [UNSET_STATUS]));
  }

  function countBy(items, key) {
    const counts = new Map();
    items.forEach((item) => {
      const value = item[key] || "";
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  }

  function getColor(assignee) {
    if (COLORS[assignee]) return COLORS[assignee];
    const palette = ["#0d9488", "#1d4ed8", "#b91c1c", "#a16207", "#6d28d9", "#047857"];
    let hash = 0;
    for (let i = 0; i < assignee.length; i += 1) {
      hash = (hash * 31 + assignee.charCodeAt(i)) % palette.length;
    }
    return palette[hash];
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeCode(value) {
    return String(value || "").trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    }).toLowerCase();
  }

  function normalizePersonName(value) {
    const cleaned = String(value || "")
      .trim()
      .replace(/[：]/g, ":")
      .replace(/^\s*\d+\s*:\s*/, "")
      .trim();

    if (!cleaned || /^未定$|^未設定$|^なし$|^-$/.test(cleaned)) {
      return "担当者未設定";
    }
    return cleaned;
  }

  function normalizeAddressKey(value) {
    return String(value || "")
      .trim()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
      .replace(/[〇零一二三四五六七八九十]+/g, (match) => String(kanjiNumberToInt(match)))
      .replace(/[－ー―‐‑–—]/g, "-")
      .replace(/[ヶケ]/g, "ケ")
      .replace(/\s|　/g, "")
      .replace(/^北海道/, "")
      .replace(/丁目|番地|番|号/g, "-")
      .replace(/-+/g, "-")
      .replace(/-$/g, "")
      .toLowerCase();
  }

  function kanjiNumberToInt(value) {
    const digits = {
      "〇": 0,
      "零": 0,
      "一": 1,
      "二": 2,
      "三": 3,
      "四": 4,
      "五": 5,
      "六": 6,
      "七": 7,
      "八": 8,
      "九": 9
    };
    const text = String(value || "");
    if (!text.includes("十")) {
      return Array.from(text).reduce((number, char) => number * 10 + (digits[char] ?? 0), 0);
    }
    const parts = text.split("十");
    const tens = parts[0] ? digits[parts[0]] || 1 : 1;
    const ones = parts[1] ? digits[parts[1]] || 0 : 0;
    return tens * 10 + ones;
  }

  function buildSearchIndex(site) {
    return normalizeText([
      site.code,
      site.projectId,
      site.name,
      site.address,
      site.assignee,
      site.salesAssignee,
      site.status
    ].join(" "));
  }

  function normalizeAndpadId(value) {
    return String(value || "").trim();
  }

  function setStatus(text) {
    elements.statusText.textContent = text;
  }

  function updateTimestampDisplay() {
    if (!elements.updateTimestamp) return;
    if (!lastUpdatedAt) {
      elements.updateTimestamp.textContent = "未更新";
      return;
    }
    elements.updateTimestamp.textContent = formatDisplayDate(new Date(lastUpdatedAt));
  }

  function formatDisplayDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "未更新";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hour}:${minute}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return String(value || "").replace(/[^#a-zA-Z0-9(),.%\s\-:/?=&]/g, "");
  }
})();
