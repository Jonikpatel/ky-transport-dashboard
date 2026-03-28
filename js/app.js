/* ============================================================
   app.js — Kentucky Transportation Dashboard
   Main controller: orchestrates data loading, filter UI,
   and chart rebuilding on filter changes.
   ============================================================ */

window.KY = window.KY || {};

KY.App = (function () {

  let _DATA         = null;   // full raw loaded data
  let _filterState  = { district: null, county: null };
  let _commData     = [];     // pre-parsed commute rows

  /* ── Chart.js global defaults ────────────────────────────── */
  function initChartDefaults() {
    Chart.defaults.color       = '#5c7fa8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size   = 11;
  }

  /* ── Populate filter dropdowns from Dim_Geography ────────── */
  function populateFilters() {
    const distSel  = document.getElementById('districtSel');
    const cntySel  = document.getElementById('countySel');
    const districts = KY.Geo.getDistricts();

    distSel.innerHTML = '<option value="">All Districts</option>';
    districts.forEach(d => {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      distSel.appendChild(o);
    });

    cntySel.innerHTML = '<option value="">All Counties</option>';
    KY.Geo.getCounties(null).forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      cntySel.appendChild(o);
    });
  }

  /* ── Cascade: when district changes, update county list ───── */
  function onDistrictChange() {
    const dist    = document.getElementById('districtSel').value;
    const cntySel = document.getElementById('countySel');
    const prev    = cntySel.value;

    cntySel.innerHTML = '<option value="">All Counties</option>';
    KY.Geo.getCounties(dist || null).forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      if (c === prev) o.selected = true;
      cntySel.appendChild(o);
    });

    _filterState.district = dist || null;
    _filterState.county   = null;
    applyAndRender();
  }

  function onCountyChange() {
    const cnty = document.getElementById('countySel').value;
    _filterState.county = cnty || null;
    applyAndRender();
  }

  function onClear() {
    _filterState = { district: null, county: null };
    document.getElementById('districtSel').value = '';
    document.getElementById('countySel').value   = '';
    populateFilters();
    applyAndRender();
  }

  /* ── Update filter status badge ───────────────────────────── */
  function updateFilterBadge() {
    const label   = KY.Geo.filterLabel(_filterState);
    const badge   = document.getElementById('filterBadge');
    const clearBtn = document.getElementById('clearBtn');
    const info    = document.getElementById('filterInfo');

    if (label) {
      badge.textContent   = `🗺️ ${label}`;
      badge.style.display = 'inline-flex';
      clearBtn.style.display = 'inline-flex';
      if (info) info.style.display = 'none';
    } else {
      badge.style.display   = 'none';
      clearBtn.style.display = 'none';
      if (info) info.style.display = 'flex';
    }
  }

  /* ── Apply filter and rebuild all affected charts ─────────── */
  function applyAndRender() {
    if (!_DATA) return;
    updateFilterBadge();

    const F = KY.Geo.applyFilter(_DATA, _filterState);
    const S = _DATA.stateLvl;

    const C = KY.Charts;

    // ── OVERVIEW (mix of filtered + state)
    C.buildOvVMT(S.vmtByState);
    C.buildOvFreight(S.freightFlows);
    C.buildOvRail(F.railActive);
    C.buildOvAirports(S.enplanements);

    // ── MOBILITY (county chart filterable)
    C.buildMobility(F.dailyMobility);
    C.buildMobCounties(F.dailyMobility);
    C.buildMobDist(F.dailyMobility);

    // ── INFRASTRUCTURE (all state-level)
    C.buildInfRoads(S.railroadMiles);
    C.buildInfDrivers(S.vmtByState);
    C.buildInfIRI(S.roadCondition);
    C.buildInfFunding();

    // ── FREIGHT (commodity = state, district/county = filtered)
    C.buildFreightFlows(S.freightFlows);
    C.buildFreightDistrict(F.freightUsers);
    C.buildFreightCountyTable(F.freightUsers);
    C.buildParking(F.truckParking);

    // ── RAIL (filterable)
    C.buildRail(F.railActive);

    // ── AVIATION (type/own = filterable by county; enplanements = state)
    C.buildAviation(F.faaAirports, S.enplanements);

    // ── WATERWAYS (filterable)
    C.buildWaterways(F.publicPorts, F.privatePorts, F.ferryBoats);

    // ── TRANSIT (state-level)
    C.buildTransit(S.vmtByState);

    // ── ACTIVE (bike = filterable; water trails = state)
    C.buildActive(F.bikeRoutes, S.waterTrails);

    // ── COMMUTE (state-level)
    C.buildCommute(_commData);

    // ── SAFETY (state-level)
    C.buildSafety(S.vmtByState);

    // ── Update overview KPIs
    updateOverviewKPIs(F, S);
  }

  /* ── Overview KPI tiles from live data ───────────────────── */
  function updateOverviewKPIs(F, S) {
    function set(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
    const fmt = KY.Charts.fmt;

    // Roads & bridges from railroadMiles state file
    const roadsLatest = S.railroadMiles
      .filter(r=>(r['Measure']||'').trim()==='Miles of public road')
      .sort((a,b)=>+b['Year']-+a['Year'])[0];
    const bridgesLatest = S.railroadMiles
      .filter(r=>(r['Measure']||'').trim()==='Bridges')
      .sort((a,b)=>+b['Year']-+a['Year'])[0];

    if(roadsLatest)  set('kpi_roads',   fmt(parseFloat((roadsLatest['Value']+'').replace(/,/g,''))));
    if(bridgesLatest)set('kpi_bridges', fmt(parseFloat((bridgesLatest['Value']+'').replace(/,/g,''))));

    // VMT
    const vmtLatest = S.vmtByState
      .filter(r=>(r['Measures']||'').trim()==='Highway vehicle-miles traveled (millions)')
      .sort((a,b)=>+b['Year of Year']-+a['Year of Year'])[0];
    if(vmtLatest) set('kpi_vmt', fmt(parseFloat((vmtLatest['Values']+'').replace(/,/g,'')))+' M mi');

    // Freight facilities (filtered)
    set('kpi_freight_fac', fmt(F.freightUsers.length)+' fac.');

    // Airports (filtered)
    set('kpi_airports', F.faaAirports.length+' facilities');

    // Rail total (filtered)
    const railMi = F.railActive.reduce((s,r)=>s+parseFloat(r['Mileage']||0),0);
    set('kpi_rail', fmt(railMi)+' mi');

    // Private ports (filtered)
    set('kpi_prv_ports', F.privatePorts.length+' docks');

    // Transit (state level — latest year)
    const trnLatest = S.vmtByState
      .filter(r=>(r['Measures']||'').trim()==='Transit Ridership')
      .sort((a,b)=>+b['Year of Year']-+a['Year of Year'])[0];
    if(trnLatest) set('kpi_transit', fmt(parseFloat((trnLatest['Values']+'').replace(/,/g,'')))+' riders');

    // Bike (filtered)
    const biMi = F.bikeRoutes.reduce((s,r)=>s+parseFloat(r['Shapelen']||0),0)/1609.34;
    set('kpi_bike', fmt(biMi)+' mi');

    // Fatalities (latest)
    const ftlLatest = S.vmtByState
      .filter(r=>(r['Measures']||'').trim()==='Highway Fatalities')
      .sort((a,b)=>+b['Year of Year']-+a['Year of Year'])[0];
    if(ftlLatest) set('kpi_fatalities', parseFloat((ftlLatest['Values']+'').replace(/,/g,'')));
  }

  /* ── Parse commute mode XLSX into [{mode, vals[]}] ────────── */
  function parseCommuteMode(rows) {
    const result = [];
    rows.forEach(r => {
      const mode = (r['Mode'] || r[Object.keys(r)[1]] || '').toString().trim();
      if (!mode || mode === 'Mode') return;
      const vals = ['2018','2019','2020','2021','2022','2023','2024'].map(y => {
        const v = r[y];
        return (v == null || v === '') ? null : parseFloat((v+'').replace(/,/g,'')) || null;
      });
      result.push({ mode, vals });
    });
    return result;
  }

  /* ── Tab navigation ──────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById('page-' + t.dataset.p).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /* ── Hide loader, show dashboard ─────────────────────────── */
  function showDashboard() {
    const loader = document.getElementById('loader');
    const dash   = document.getElementById('dashboard');
    if (loader) loader.style.display = 'none';
    if (dash)   dash.style.display   = 'block';
  }

  /* ── Main entry point ────────────────────────────────────── */
  async function init() {
    initChartDefaults();
    initTabs();

    // Wire up filter controls
    document.getElementById('districtSel').addEventListener('change', onDistrictChange);
    document.getElementById('countySel').addEventListener('change', onCountyChange);
    document.getElementById('clearBtn').addEventListener('click', onClear);

    // Load all files
    _DATA = await KY.Loader.loadAll();

    // Build Dim_Geography from freight users
    KY.Geo.buildDimGeo(_DATA.filterable.freightUsers);
    populateFilters();

    // Parse commute mode (state-level XLSX — special structure)
    _commData = parseCommuteMode(_DATA.stateLvl.commuteMode);

    // Initial render with no filter
    showDashboard();
    applyAndRender();
  }

  return { init };

})();

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', KY.App.init);
