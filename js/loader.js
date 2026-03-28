/* ============================================================
   loader.js — Kentucky Transportation Dashboard
   Loads all CSV and XLSX files using PapaParse + SheetJS.
   Returns a promise that resolves to the full DATA object.
   ============================================================ */

window.KY = window.KY || {};

KY.Loader = (function () {

  /* ── helpers ─────────────────────────────────────────────── */
  function loadCSV(path) {
    return new Promise((resolve, reject) => {
      Papa.parse(path, {
        download: true,
        header:   true,
        skipEmptyLines: true,
        dynamicTyping: false,   // keep as strings, parse manually
        complete: r => resolve(r.data),
        error:    e => {
          console.warn(`CSV load failed: ${path}`, e);
          resolve([]);           // resolve empty so dashboard still works
        }
      });
    });
  }

  function loadXLSX(path) {
    return fetch(path)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(buf => {
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(ws, { defval: '' });
      })
      .catch(e => {
        console.warn(`XLSX load failed: ${path}`, e);
        return [];
      });
  }

  function loadFile(cfg) {
    return cfg.type === 'xlsx' ? loadXLSX(cfg.path) : loadCSV(cfg.path);
  }

  /* ── progress ────────────────────────────────────────────── */
  function setProgress(msg, pct) {
    const bar  = document.getElementById('loadProgress');
    const text = document.getElementById('loadText');
    if (bar)  bar.style.width  = pct + '%';
    if (text) text.textContent = msg;
  }

  /* ── main load ───────────────────────────────────────────── */
  async function loadAll() {
    const FCFG = KY.CONFIG.FILTERABLE;
    const SCFG = KY.CONFIG.STATE_LEVEL;
    const DATA = { filterable: {}, stateLvl: {} };

    const allEntries = [
      ...Object.entries(FCFG).map(([k, v]) => ({ key: k, cfg: v, bucket: 'filterable' })),
      ...Object.entries(SCFG).map(([k, v]) => ({ key: k, cfg: v, bucket: 'stateLvl'  }))
    ];

    const total = allEntries.length;

    for (let i = 0; i < allEntries.length; i++) {
      const { key, cfg, bucket } = allEntries[i];
      setProgress(`Loading: ${cfg.label || key}…`, Math.round((i / total) * 100));
      DATA[bucket][key] = await loadFile(cfg);
    }

    setProgress('Processing data…', 99);

    // Filter state-level tables to Kentucky rows
    Object.entries(SCFG).forEach(([key, cfg]) => {
      if (cfg.stateCol && cfg.stateVal) {
        DATA.stateLvl[key] = DATA.stateLvl[key].filter(
          r => (r[cfg.stateCol] || '').toString().trim() === cfg.stateVal
        );
      }
    });

    // Filter daily mobility to county-level (exclude state row)
    if (DATA.filterable.dailyMobility) {
      DATA.filterable.dailyMobility = DATA.filterable.dailyMobility.filter(
        r => (r['Geographic Level'] || '').trim() === 'County'
      );
    }

    setProgress('Ready!', 100);
    return DATA;
  }

  return { loadAll };

})();
