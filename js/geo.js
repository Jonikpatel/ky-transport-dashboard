/* ============================================================
   geo.js — Kentucky Transportation Dashboard
   Builds the Dim_Geography lookup table from the freight
   users file (most complete district + county mapping).
   Provides cascading filter helpers used by app.js.
   ============================================================ */

window.KY = window.KY || {};

KY.Geo = (function () {

  let _dimGeo = [];   // [{ district, county }] — deduplicated

  /* ── Build Dim_Geography from source file ────────────────── */
  function buildDimGeo(rows) {
    const DC = KY.CONFIG.GEO_DISTRICT_COL;
    const CC = KY.CONFIG.GEO_COUNTY_COL;
    const seen = new Set();
    _dimGeo = [];

    rows.forEach(r => {
      const dist  = (r[DC] || '').trim();
      const cnty  = (r[CC] || '').trim();
      if (!dist && !cnty) return;
      const key = `${dist}|||${cnty}`;
      if (!seen.has(key)) {
        seen.add(key);
        _dimGeo.push({ district: dist, county: cnty });
      }
    });

    // Sort
    _dimGeo.sort((a, b) =>
      a.district.localeCompare(b.district) || a.county.localeCompare(b.county)
    );

    return _dimGeo;
  }

  /* ── Get unique districts ────────────────────────────────── */
  function getDistricts() {
    const set = new Set(_dimGeo.map(r => r.district).filter(Boolean));
    return [...set].sort();
  }

  /* ── Get counties for a district (or all counties) ───────── */
  function getCounties(district) {
    const rows = district
      ? _dimGeo.filter(r => r.district === district)
      : _dimGeo;
    const set = new Set(rows.map(r => r.county).filter(Boolean));
    return [...set].sort();
  }

  /* ── Filter any dataset by district and/or county ───────── */
  function filterRows(rows, dataKey, district, county) {
    const cfg = KY.CONFIG.FILTERABLE[dataKey];
    if (!cfg) return rows;

    let out = rows;

    if (district && cfg.districtCol) {
      out = out.filter(r =>
        (r[cfg.districtCol] || '').toString().trim() === district
      );
    }

    if (county && cfg.countyCol) {
      out = out.filter(r =>
        (r[cfg.countyCol] || '').toString().trim() === county
      );
    }

    return out;
  }

  /* ── Apply current filter to all filterable datasets ────── */
  function applyFilter(DATA, state) {
    const { district, county } = state;
    const out = {};

    Object.keys(DATA.filterable).forEach(key => {
      out[key] = filterRows(DATA.filterable[key], key, district, county);
    });

    return out;     // same shape as DATA.filterable but filtered
  }

  /* ── Summarise filter for UI badge ──────────────────────── */
  function filterLabel(state) {
    if (!state.district && !state.county) return null;
    if (state.district && state.county)
      return `${state.district} District · ${state.county} County`;
    if (state.district) return `${state.district} District`;
    return `${state.county} County`;
  }

  return { buildDimGeo, getDistricts, getCounties, applyFilter, filterLabel };

})();
