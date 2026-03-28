/* ============================================================
   charts.js — Kentucky Transportation Dashboard
   All 39+ chart builders. Each function receives the data
   it needs and a Chart.js canvas ID.
   Filterable charts accept the already-filtered rows.
   State-level charts ignore the filter.
   ============================================================ */

window.KY = window.KY || {};

KY.Charts = (function () {

  const _instances = {};   // id → Chart instance

  /* ── utils ──────────────────────────────────────────────── */
  const C  = () => KY.CONFIG.COLORS;
  const G  = () => KY.CONFIG.GRID;
  const TIP = () => KY.CONFIG.TIP;

  function fmt(n) {
    if (n == null || isNaN(n)) return '—';
    n = +n;
    if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(1)  + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(0)  + 'K';
    return n.toLocaleString();
  }

  function num(v) { return parseFloat((v+'').replace(/,/g,'')) || 0; }

  function make(id, type, data, options) {
    if (_instances[id]) { _instances[id].destroy(); }
    const el = document.getElementById(id);
    if (!el) return;
    _instances[id] = new Chart(el, { type, data, options });
  }

  const BASE = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: null }
  };

  function tip(extra) {
    return { ...TIP(), ...(extra || {}) };
  }

  function axXY(yCb) {
    return {
      x: { grid: { color: G() } },
      y: { grid: { color: G() }, ticks: { callback: yCb || fmt } }
    };
  }

  /* ── GROUP helpers ───────────────────────────────────────── */
  function groupSum(rows, groupCol, valueCol, top) {
    const m = {};
    rows.forEach(r => {
      const k = (r[groupCol] || '').trim();
      if (!k) return;
      m[k] = (m[k] || 0) + num(r[valueCol]);
    });
    let entries = Object.entries(m).sort((a,b) => b[1] - a[1]);
    if (top) entries = entries.slice(0, top);
    return { labels: entries.map(e=>e[0]), data: entries.map(e=>e[1]) };
  }

  function groupCount(rows, groupCol, top) {
    const m = {};
    rows.forEach(r => {
      const k = (r[groupCol] || '').trim();
      if (!k) return;
      m[k] = (m[k] || 0) + 1;
    });
    let entries = Object.entries(m).sort((a,b) => b[1] - a[1]);
    if (top) entries = entries.slice(0, top);
    return { labels: entries.map(e=>e[0]), data: entries.map(e=>e[1]) };
  }

  function extractSeries(rows, measureCol, yearCol, measureVal) {
    const filtered = rows.filter(r => (r[measureCol]||'').trim() === measureVal);
    const sorted   = filtered.sort((a,b) => (+a[yearCol]) - (+b[yearCol]));
    return {
      labels: sorted.map(r => r[yearCol]+''),
      data:   sorted.map(r => num(r[measureCol === 'Measures' ? 'Values' : 'Measure Values']))
    };
  }

  function extractKY(rows, measureCol, yearCol, measureName, valueCol) {
    const r = rows.filter(r => (r[measureCol]||'').trim() === measureName)
                  .sort((a,b) => (+a[yearCol]) - (+b[yearCol]));
    return { labels: r.map(x=>x[yearCol]+''), data: r.map(x=>num(x[valueCol||'Values'])) };
  }

  /* ══════════════════════════════════════════════════════════
     OVERVIEW CHARTS
  ══════════════════════════════════════════════════════════ */

  function buildOvVMT(vmtRows) {
    const d = extractKY(vmtRows,'Measures','Year of Year','Highway vehicle-miles traveled (millions)','Values');
    make('ov_vmt','line',{
      labels: d.labels,
      datasets:[{ data:d.data, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.1)', fill:true, tension:.4, pointRadius:3 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip()}, scales: axXY() });
  }

  function buildOvFreight(ffRows) {
    const g = ffRows.filter(r=>(r['Measure Names']||'').trim()==='Current Value (millions of dollars)');
    const m={};
    g.forEach(r=>{ const k=(r['Commodity']||'').trim(); m[k]=(m[k]||0)+num(r['Measure Values']); });
    const top7 = Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,7);
    make('ov_freight','bar',{
      labels: top7.map(e=>e[0]),
      datasets:[{ data:top7.map(e=>e[1]), backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` $${fmt(c.raw)}M`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>'$'+fmt(v)}}, y:{grid:{display:false},ticks:{font:{size:9}}} } });
  }

  function buildOvRail(railRows) {
    const g = groupSum(railRows,'RR_Management_Company','Mileage',8);
    make('ov_rail','bar',{
      labels: g.labels,
      datasets:[{ data:g.data, backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip()},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>v+'mi'}}, y:{grid:{display:false}} } });
  }

  function buildOvAirports(enpRows) {
    const paxRows = enpRows.filter(r=>(r['Measure Names']||'').trim()==='Passengers');
    const yr = Math.max(...paxRows.map(r=>+r['Year']||0));
    const latest = paxRows.filter(r=>+r['Year']===yr);
    const m={};
    latest.forEach(r=>{ const k=(r['Airport']||'').trim(); m[k]=(m[k]||0)+num(r['Measure Values']); });
    const sorted=Object.entries(m).sort((a,b)=>b[1]-a[1]);
    const CODES={'Cincinnati/Northern Kentucky International':'CVG','Standiford Field':'SDF','Blue Grass':'LEX','Campbell AAF':'FTK','Bowling Green-Warren County Regional':'BWG','Barkley Regional':'PAH','Addington Field':'ADG'};
    make('ov_airports','bar',{
      labels: sorted.map(e=>CODES[e[0]]||e[0].slice(0,6)),
      datasets:[{ data:sorted.map(e=>e[1]), backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)} pax`}})},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });
  }

  /* ══════════════════════════════════════════════════════════
     MOBILITY CHARTS
  ══════════════════════════════════════════════════════════ */

  function buildMobility(mobRows) {
    // aggregate by month
    const byMonth = {};
    mobRows.forEach(r => {
      const m = (r['Month']||'').toString().trim();
      if (!m) return;
      if (!byMonth[m]) byMonth[m] = { tv:0, hm:0, tr:0, n:0 };
      byMonth[m].tv += num(r['Population Not Staying at Home']);
      byMonth[m].hm += num(r['Population Staying at Home']);
      byMonth[m].tr += num(r['Number of Trips']);
      byMonth[m].n  += 1;
    });
    const MN={1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    const months = Object.keys(byMonth).sort((a,b)=>+a-+b);
    const labs   = months.map(m => MN[+m]||m);
    const tv     = months.map(m => Math.round(byMonth[m].tv / byMonth[m].n));
    const hm     = months.map(m => Math.round(byMonth[m].hm / byMonth[m].n));
    const tr     = months.map(m => Math.round(byMonth[m].tr / byMonth[m].n));

    make('mob_hometravel','bar',{
      labels: labs,
      datasets:[
        { label:'Traveling', data:tv, backgroundColor:'#3b82f6', borderRadius:6 },
        { label:'At Home',   data:hm, backgroundColor:'#fbbf24', borderRadius:6 }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });

    make('mob_trips','line',{
      labels: labs,
      datasets:[{ data:tr, borderColor:'#22d3ee', backgroundColor:'rgba(34,211,238,.1)', fill:true, tension:.4, pointRadius:6, pointBackgroundColor:'#22d3ee' }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)} trips`}})},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},min:tr.length?Math.min(...tr)*0.97:0,ticks:{callback:fmt}} } });
  }

  function buildMobCounties(mobRows) {
    const m = {};
    mobRows.forEach(r => {
      const k = (r['County Name']||'').trim();
      if (!k) return;
      m[k] = (m[k]||0) + num(r['Number of Trips']);
    });
    const cnt = {};
    mobRows.forEach(r => { const k=(r['County Name']||'').trim(); if(k) cnt[k]=(cnt[k]||0)+1; });
    const avgd = Object.entries(m).map(([k,v])=>([k, cnt[k]?v/cnt[k]:v])).sort((a,b)=>b[1]-a[1]).slice(0,10);
    make('mob_counties','bar',{
      labels: avgd.map(e=>e[0]),
      datasets:[{ data:avgd.map(e=>Math.round(e[1])), backgroundColor:avgd.map((_,i)=>i===0?'#3b82f6':'rgba(59,130,246,.35)'), borderRadius:4 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip()},
        scales:{ x:{grid:{color:G()},ticks:{callback:fmt}}, y:{grid:{display:false}} } });
  }

  function buildMobDist(mobRows) {
    const TCOLS=['Number of Trips <1','Number of Trips 1-3','Number of Trips 3-5','Number of Trips 5-10','Number of Trips 10-25','Number of Trips 25-50','Number of Trips 50-100','Number of Trips 100-250','Number of Trips 250-500','Number of Trips >=500'];
    const LABS=['<1mi','1-3mi','3-5mi','5-10mi','10-25mi','25-50mi','50-100mi','100-250mi','250-500mi','≥500mi'];
    const tots = TCOLS.map(c => {
      const valid = mobRows.filter(r => num(r[c]) > 0);
      return valid.length ? valid.reduce((s,r)=>s+num(r[c]),0)/valid.length : 0;
    });
    make('mob_dist','bar',{
      labels: LABS,
      datasets:[{ data:tots.map(Math.round), backgroundColor:LABS.map((_,i)=>`hsl(${200+i*14},70%,58%)`), borderRadius:4 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip()},
        scales:{ x:{grid:{display:false},ticks:{font:{size:9}}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });
  }

  /* ══════════════════════════════════════════════════════════
     INFRASTRUCTURE CHARTS
  ══════════════════════════════════════════════════════════ */

  function buildInfRoads(railMiRows) {
    function ex(m) {
      return railMiRows.filter(r=>(r['Measure']||'').trim()===m).sort((a,b)=>+a['Year']-+b['Year']);
    }
    const roads   = ex('Miles of public road');
    const bridges = ex('Bridges');
    make('inf_roads','line',{
      labels: roads.map(r=>r['Year']+''),
      datasets:[
        { label:'Road Miles', data:roads.map(r=>num(r['Value'])),   borderColor:'#3b82f6', tension:.3, pointRadius:3, yAxisID:'y1' },
        { label:'Bridges',    data:bridges.map(r=>num(r['Value'])), borderColor:'#22c55e', borderDash:[5,3], tension:.3, pointRadius:3, yAxisID:'y2' }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{grid:{color:G()}}, y1:{grid:{color:G()},position:'left',ticks:{callback:v=>(v/1000).toFixed(0)+'K'}}, y2:{grid:{display:false},position:'right'} } });
  }

  function buildInfDrivers(vmtRows) {
    function exV(m) { return extractKY(vmtRows,'Measures','Year of Year',m,'Values'); }
    const vmt  = exV('Highway vehicle-miles traveled (millions)');
    const drv  = exV('Licensed drivers');
    const veh  = exV('Vehicles');
    make('inf_drivers','line',{
      labels: vmt.labels,
      datasets:[
        { label:'VMT (M mi)', data:vmt.data, borderColor:'#3b82f6', tension:.3, pointRadius:3, yAxisID:'y1' },
        { label:'Vehicles',   data:veh.data, borderColor:'#fbbf24', borderDash:[5,3], tension:.3, pointRadius:3, yAxisID:'y2' },
        { label:'Drivers',    data:drv.data, borderColor:'#22c55e', borderDash:[3,3], tension:.3, pointRadius:3, yAxisID:'y2' }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{grid:{color:G()}}, y1:{grid:{color:G()},position:'left',ticks:{callback:fmt}}, y2:{grid:{display:false},position:'right',ticks:{callback:fmt}} } });
  }

  function buildInfIRI(iriRows) {
    const kyRows = iriRows.filter(r=>(r['State']||'').trim()==='Kentucky');
    const SYS_MAP={'Interstate':'Interstate','Other freeways and expressways':'Fwy/Exp','Other principal arterials':'Prin.Art.','Minor arterials':'Min.Art.','Minor Arterial':'Min.Art.','Major and Minor Collector':'Collector','Major Collector':'Collector'};
    const iri_g={}, iri_f={}, iri_p={};
    Object.entries(SYS_MAP).forEach(([sys,lb])=>{
      const s=kyRows.filter(r=>(r['System']||'').trim()===sys);
      const g=s.filter(r=>['Urban (miles)','Rural (miles)'].includes((r['Class']||'').trim())&&(r['International Roughness Index']||'').trim()==='Less than 60').reduce((a,r)=>a+num(r['Value']),0);
      const p=s.filter(r=>['Urban (miles)','Rural (miles)'].includes((r['Class']||'').trim())&&['More than 220','195-220','171-194','171-220'].includes((r['International Roughness Index']||'').trim())).reduce((a,r)=>a+num(r['Value']),0);
      const t=s.filter(r=>(r['Class']||'').trim()==='Total (miles)').reduce((a,r)=>a+num(r['Value']),0);
      iri_g[lb]=(iri_g[lb]||0)+g; iri_p[lb]=(iri_p[lb]||0)+p; iri_f[lb]=(iri_f[lb]||0)+Math.max(0,t-g-p);
    });
    const labs=Object.keys(Object.fromEntries(Object.entries(SYS_MAP).map(([,lb])=>[lb,1])));
    make('inf_iri','bar',{
      labels:labs,
      datasets:[
        { label:'Good', data:labs.map(l=>iri_g[l]||0), backgroundColor:'#22c55e', borderRadius:4 },
        { label:'Fair', data:labs.map(l=>iri_f[l]||0), backgroundColor:'#fbbf24', borderRadius:4 },
        { label:'Poor', data:labs.map(l=>iri_p[l]||0), backgroundColor:'#f87171', borderRadius:4 }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,grid:{color:G()}} } });

    const kyOv=kyRows.filter(r=>(r['System']||'').trim()==='Overall');
    const pct=kyOv.find(r=>(r['Class']||'').trim()==='Percent Acceptable');
    const pctVal=pct?num(pct['Value']):90.9;
    const pctEl=document.getElementById('roadPctVal');
    if(pctEl) pctEl.textContent=pctVal.toFixed(1)+'%';
    make('inf_gauge','doughnut',{
      labels:['Acceptable','Unacceptable'],
      datasets:[{ data:[pctVal,100-pctVal], backgroundColor:['#22c55e','rgba(248,113,113,.4)'], borderWidth:0 }]
    },{ ...BASE, cutout:'70%', plugins:{...BASE.plugins,legend:{display:true,position:'bottom',labels:{boxWidth:8,padding:8,font:{size:10}}},tooltip:tip()} });
  }

  function buildInfFunding() {
    make('inf_funding','bar',{
      labels:['Federal(IIJA)','State Fund','Bridges','Hi-Growth','Transit','EV Charge'],
      datasets:[{ data:[6400,1400,1500,450,180,70], backgroundColor:['#3b82f6','#22c55e','#22d3ee','#fbbf24','#a78bfa','#fb923c'], borderRadius:5 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` $${(c.raw/1000).toFixed(1)}B`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>'$'+(v/1000).toFixed(1)+'B'}}, y:{grid:{display:false}} } });
  }

  /* ══════════════════════════════════════════════════════════
     FREIGHT CHARTS (filterable)
  ══════════════════════════════════════════════════════════ */

  function buildFreightFlows(ffRows) {
    const fv = ffRows.filter(r=>(r['Measure Names']||'').trim()==='Current Value (millions of dollars)');
    const ft = ffRows.filter(r=>(r['Measure Names']||'').trim()==='Tons (thousands)');
    function top(rows,n){ const m={}; rows.forEach(r=>{ const k=(r['Commodity']||'').trim(); m[k]=(m[k]||0)+num(r['Measure Values']); }); return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,n); }
    const topV=top(fv,10), topT=top(ft,10);
    make('fr_val','bar',{
      labels:topV.map(e=>e[0]), datasets:[{ data:topV.map(e=>e[1]), backgroundColor:C(), borderRadius:4 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` $${fmt(c.raw)}M`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>'$'+fmt(v)}}, y:{grid:{display:false},ticks:{font:{size:10}}} } });
    make('fr_tons','bar',{
      labels:topT.map(e=>e[0]), datasets:[{ data:topT.map(e=>e[1]), backgroundColor:C().map(c=>c+'bb'), borderRadius:4 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)}K tons`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>fmt(v)+'K'}}, y:{grid:{display:false},ticks:{font:{size:10}}} } });
  }

  function buildFreightDistrict(frtRows) {
    const g=groupCount(frtRows,'District Name');
    const t={};
    frtRows.forEach(r=>{ const k=(r['District Name']||'').trim(); if(k){ t[k]=(t[k]||{s:0,n:0}); t[k].s+=num(r['Average Trucks per Day']); t[k].n++; } });
    const avgT=g.labels.map(l=>t[l]?+(t[l].s/t[l].n).toFixed(1):0);
    make('fr_district','bar',{
      labels:g.labels,
      datasets:[
        { label:'Facilities', data:g.data, backgroundColor:'#3b82f6', borderRadius:4, yAxisID:'y1' },
        { label:'Avg Trucks/Day', data:avgT, backgroundColor:'#fb923c', borderRadius:4, yAxisID:'y2' }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{grid:{display:false},ticks:{font:{size:9}}}, y1:{grid:{color:G()},position:'left'}, y2:{grid:{display:false},position:'right'} } });
  }

  function buildFreightCountyTable(frtRows) {
    const fc=groupCount(frtRows,'County Name',8);
    const ft={};
    frtRows.forEach(r=>{ const k=(r['County Name']||'').trim(); if(k){ ft[k]=(ft[k]||{s:0,n:0}); ft[k].s+=num(r['Average Trucks per Day']); ft[k].n++; } });
    const maxF=Math.max(...fc.data,1);
    const tbl=document.getElementById('fr_tbl');
    if(!tbl) return;
    tbl.innerHTML='';
    fc.labels.forEach((c,i)=>{
      const pct=Math.round(fc.data[i]/maxF*100);
      const avg=ft[c]?+(ft[c].s/ft[c].n).toFixed(1):0;
      tbl.innerHTML+=`<tr><td class="rk">${i+1}</td><td class="n">${c}</td><td class="n">${fc.data[i]}</td>
        <td><div class="brow"><div class="bgbg"><div class="bgfill" style="width:${pct}%;background:${avg>50?'#fbbf24':'#3b82f6'}"></div></div><span style="font-size:10px;color:var(--t3)">${pct}%</span></div></td>
        <td class="n" style="color:${avg>50?'#fbbf24':'#f0f6ff'}">${avg}</td></tr>`;
    });
    if(!fc.labels.length) tbl.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:20px">No data for selected area</td></tr>';
  }

  function buildParking(pkRows) {
    const byDist={}; pkRows.forEach(r=>{ const k=(r['District Name']||'').trim(); if(k){ byDist[k]=(byDist[k]||0)+num(r['Total Parking Spaces']); } });
    const sorted=Object.entries(byDist).sort((a,b)=>b[1]-a[1]);
    make('fr_parking','bar',{
      labels:sorted.map(e=>e[0]), datasets:[{ data:sorted.map(e=>e[1]), backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip()},
        scales:{ x:{grid:{color:G()}}, y:{grid:{display:false},ticks:{font:{size:10}}} } });

    const byType={}; pkRows.forEach(r=>{ const k=(r['Location Type']||'').trim(); if(k) byType[k]=(byType[k]||0)+1; });
    const typeSorted=Object.entries(byType).sort((a,b)=>b[1]-a[1]);
    make('fr_parktype','doughnut',{
      labels:typeSorted.map(e=>e[0]),
      datasets:[{ data:typeSorted.map(e=>e[1]), backgroundColor:C(), borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'58%', plugins:{...BASE.plugins,legend:{display:true,position:'right',labels:{boxWidth:9,padding:8,font:{size:10}}},tooltip:tip()} });

    // update KPI counts
    const totSpaces=pkRows.reduce((s,r)=>s+num(r['Total Parking Spaces']),0);
    const el=document.getElementById('pk_total_val');
    if(el) el.textContent=totSpaces.toLocaleString();
    const el2=document.getElementById('pk_fac_val');
    if(el2) el2.textContent=pkRows.length;
  }

  /* ══════════════════════════════════════════════════════════
     RAIL CHARTS (filterable)
  ══════════════════════════════════════════════════════════ */

  function buildRail(railRows) {
    const ro=groupSum(railRows,'RR_Management_Company','Mileage',10);
    const rt=groupSum(railRows,'RR_Line_Type','Mileage',8);
    const rc={};
    railRows.forEach(r=>{ const k=r['RR_Class']; if([1,2,3].includes(+k)){ rc[+k]=(rc[+k]||0)+num(r['Mileage']); } });
    const rd=groupSum(railRows,'D_DISTRICT','Mileage');

    make('rl_ops','bar',{
      labels:ro.labels, datasets:[{ data:ro.data.map(v=>+v.toFixed(1)), backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${c.raw.toFixed(1)}mi`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>v+'mi'}}, y:{grid:{display:false}} } });

    const clData=[1,2,3].map(k=>+(rc[k]||0).toFixed(1));
    make('rl_class','doughnut',{
      labels:[`Class 1 (${clData[0]}mi)`,`Class 2 (${clData[1]}mi)`,`Class 3 (${clData[2]}mi)`],
      datasets:[{ data:clData, backgroundColor:['#3b82f6','#22d3ee','#22c55e'], borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'65%', plugins:{...BASE.plugins,legend:{display:true,position:'right',labels:{boxWidth:8,padding:8,font:{size:10}}},tooltip:tip()} });

    make('rl_type','bar',{
      labels:rt.labels, datasets:[{ data:rt.data.map(v=>+v.toFixed(1)), backgroundColor:C(), borderRadius:4 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${c.raw.toFixed(1)}mi`}})},
        scales:{ x:{grid:{display:false},ticks:{font:{size:9}}}, y:{grid:{color:G()}} } });

    make('rl_district','bar',{
      labels:rd.labels, datasets:[{ data:rd.data.map(v=>+v.toFixed(1)), backgroundColor:C(), borderRadius:4 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${c.raw.toFixed(1)}mi`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>v+'mi'}}, y:{grid:{display:false},ticks:{font:{size:9}}} } });

    // Update KPIs
    const totalMi=railRows.reduce((s,r)=>s+num(r['Mileage']),0);
    const el=document.getElementById('rail_total_val'); if(el) el.textContent=totalMi.toFixed(0)+' mi';
    const el2=document.getElementById('rail_segs_val'); if(el2) el2.textContent=railRows.length.toLocaleString();
  }

  /* ══════════════════════════════════════════════════════════
     AVIATION CHARTS (filterable by county)
  ══════════════════════════════════════════════════════════ */

  function buildAviation(aptRows, enpRows) {
    const tc=groupCount(aptRows,'Type');
    const oc=groupCount(aptRows,'Ownership');
    const OWN_MAP={'PR':'Private','PU':'Public Use','MR':'Military'};

    make('av_types','doughnut',{
      labels:tc.labels.map((l,i)=>`${l} (${tc.data[i]})`),
      datasets:[{ data:tc.data, backgroundColor:['#3b82f6','#a78bfa','#fbbf24'], borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'60%', plugins:{...BASE.plugins,legend:{display:true,position:'bottom',labels:{boxWidth:8,padding:8,font:{size:10}}},tooltip:tip()} });

    make('av_own','doughnut',{
      labels:oc.labels.map((l,i)=>(OWN_MAP[l]||l)+` (${oc.data[i]})`),
      datasets:[{ data:oc.data, backgroundColor:['#fb923c','#22c55e','#f87171'], borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'60%', plugins:{...BASE.plugins,legend:{display:true,position:'bottom',labels:{boxWidth:8,padding:8,font:{size:10}}},tooltip:tip()} });

    // Enplanements — state level, always shown
    const paxRows=enpRows.filter(r=>(r['Measure Names']||'').trim()==='Passengers');
    const yr=Math.max(...paxRows.map(r=>+r['Year']||0));
    const latest=paxRows.filter(r=>+r['Year']===yr);
    const m={}; latest.forEach(r=>{ const k=(r['Airport']||'').trim(); m[k]=(m[k]||0)+num(r['Measure Values']); });
    const sorted=Object.entries(m).sort((a,b)=>b[1]-a[1]);
    const CODES={'Cincinnati/Northern Kentucky International':'CVG','Standiford Field':'SDF','Blue Grass':'LEX','Campbell AAF':'FTK','Bowling Green-Warren County Regional':'BWG','Barkley Regional':'PAH','Addington Field':'ADG'};
    const total=sorted.reduce((s,e)=>s+e[1],0);

    make('av_share','doughnut',{
      labels:sorted.map(e=>`${CODES[e[0]]||e[0].slice(0,3)} ${total?(e[1]/total*100).toFixed(1):'0'}%`),
      datasets:[{ data:sorted.map(e=>e[1]), backgroundColor:C(), borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'60%', plugins:{...BASE.plugins,legend:{display:true,position:'bottom',labels:{boxWidth:8,padding:8,font:{size:10}}},tooltip:tip()} });

    make('av_bar',{type:'bar'},{
      labels:sorted.map(e=>CODES[e[0]]||e[0].slice(0,6)),
      datasets:[{ data:sorted.map(e=>e[1]), backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)} pax`}})},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });

    // Update airport count KPI
    const el=document.getElementById('apt_total_val'); if(el) el.textContent=aptRows.length.toLocaleString();
    const el2=document.getElementById('apt_county_val'); if(el2) el2.textContent=new Set(aptRows.map(r=>r['County']||'')).size;
  }

  /* ══════════════════════════════════════════════════════════
     WATERWAYS CHARTS (filterable)
  ══════════════════════════════════════════════════════════ */

  function buildWaterways(pubPorts, prvRows, ferryRows) {
    // Public ports table
    const tbl=document.getElementById('pub_ports_tbl');
    if(tbl){
      tbl.innerHTML='';
      pubPorts.forEach((p,i)=>{
        const st=(p['Operating Status']||'').trim();
        const ftz=(p['Foreign Trade Zone']||'').trim();
        const badge=st==='Active'?'<span class="tag" style="background:rgba(34,197,94,.15);color:#86efac">Active</span>':'<span class="tag" style="background:rgba(251,191,36,.15);color:#fde68a">Developing</span>';
        const ftzBadge=ftz==='Yes'?'✅':'❌';
        tbl.innerHTML+=`<tr><td class="rk">${i+1}</td><td class="n">${p['Facility Name']||p['Facility name']||''}</td><td>${p['City Name']||''}</td><td>${p['River Name']||''}</td><td>${badge}</td><td style="text-align:center">${ftzBadge}</td></tr>`;
      });
      if(!pubPorts.length) tbl.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:20px">No ports for selected area</td></tr>';
    }

    // Private ports by waterway
    const pw=groupCount(prvRows,'WaterwayName',8);
    make('wt_private','bar',{
      labels:pw.labels.map(l=>l.split(',')[0]),
      datasets:[{ data:pw.data, backgroundColor:C(), borderRadius:5 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip()},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()}} } });

    // Ferry routes list
    const fl=document.getElementById('ferry_list');
    if(fl){
      fl.innerHTML='';
      ferryRows.forEach(f=>{
        fl.innerHTML+=`<div class="fcard"><div>
          <div class="fc-river">${f['LOCATION']||''}</div>
          <div class="fc-route">${f['DESCRIPTION']||''}</div>
          <div class="fc-loc">📍 ${f['CNTY_NAME']||''} County</div>
        </div></div>`;
      });
      if(!ferryRows.length) fl.innerHTML='<p style="color:var(--t3);padding:12px">No ferry routes for selected area.</p>';
    }

    // Principal ports tonnage (state-level — use static best-known values)
    make('wt_ports','bar',{
      labels:['Cincinnati-N KY','Louisville-Jeff.','Paducah-McCracken','Owensboro','Henderson','Hickman-Fulton','Elvis Stahr'],
      datasets:[{ data:[34476340,8409060,7201132,2602530,2254401,1255276,1048522],
        backgroundColor:['#22d3ee','#3b82f6','#a78bfa','#fbbf24','#22c55e','#fb923c','#f472b6'], borderRadius:5 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)} tons`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:fmt}}, y:{grid:{display:false},ticks:{font:{size:10}}} } });

    // Update KPIs
    const el=document.getElementById('prv_total_val'); if(el) el.textContent=prvRows.length;
    const el2=document.getElementById('pub_total_val'); if(el2) el2.textContent=pubPorts.length;
    const el3=document.getElementById('ferry_total_val'); if(el3) el3.textContent=ferryRows.length;
  }

  /* ══════════════════════════════════════════════════════════
     TRANSIT CHARTS (state-level)
  ══════════════════════════════════════════════════════════ */

  function buildTransit(vmtRows) {
    function exV(m) { return extractKY(vmtRows,'Measures','Year of Year',m,'Values'); }
    const trn=exV('Transit Ridership');
    const drv=exV('Licensed drivers');
    const veh=exV('Vehicles');
    const gas=exV('Highway use of gasoline (thousand gallons)');
    const minTrn=trn.data.filter(Boolean);

    make('tr_ride','line',{
      labels:trn.labels, datasets:[{ label:'Transit Riders', data:trn.data, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.1)', fill:true, tension:.4, pointRadius:4,
        pointBackgroundColor:trn.data.map(v=>v===Math.min(...minTrn)?'#f87171':'#22c55e') }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)} riders`}})},
        scales:{ x:{grid:{color:G()}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });

    make('tr_dveh','line',{
      labels:drv.labels,
      datasets:[
        { label:'Drivers',  data:drv.data, borderColor:'#3b82f6', tension:.3, pointRadius:3 },
        { label:'Vehicles', data:veh.data, borderColor:'#fbbf24', borderDash:[5,3], tension:.3, pointRadius:3 }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{grid:{color:G()}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });

    make('tr_gas','bar',{
      labels:gas.labels,
      datasets:[{ data:gas.data, backgroundColor:gas.data.map(v=>v===Math.min(...gas.data.filter(Boolean))?'#f87171':'rgba(59,130,246,.6)'), borderRadius:4 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${fmt(c.raw)} K gal`}})},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });
  }

  /* ══════════════════════════════════════════════════════════
     ACTIVE / ALTERNATE CHARTS (filterable)
  ══════════════════════════════════════════════════════════ */

  function buildActive(bikeRows, wtRows) {
    const br=groupSum(bikeRows,'BI_RT_NAME','Shapelen');
    const brMiles={labels:br.labels, data:br.data.map(v=>+(v/1609.34).toFixed(1))};

    make('ac_bike','bar',{
      labels:brMiles.labels,
      datasets:[{ data:brMiles.data, backgroundColor:brMiles.labels.map((_,i)=>C()[i%C().length]), borderRadius:5 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${c.raw} mi`}})},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},ticks:{callback:v=>v+' mi'}} } });

    // Water trails — state level
    const wtSorted=[...wtRows].sort((a,b)=>num(b['Miles'])-num(a['Miles'])).slice(0,15);
    make('ac_water','bar',{
      labels:wtSorted.map(r=>r['Trail_Name']||''),
      datasets:[{ data:wtSorted.map(r=>num(r['Miles'])), backgroundColor:wtSorted.map((_,i)=>`hsl(${180+i*10},70%,55%)`), borderRadius:4 }]
    },{ ...BASE, indexAxis:'y', plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${c.raw} mi`}})},
        scales:{ x:{grid:{color:G()},ticks:{callback:v=>v+'mi'}}, y:{grid:{display:false},ticks:{font:{size:9}}} } });

    // KPIs
    const totMi=bikeRows.reduce((s,r)=>s+num(r['Shapelen']),0)/1609.34;
    const el=document.getElementById('bike_total_val'); if(el) el.textContent=totMi.toFixed(0)+' mi';
    const el2=document.getElementById('bike_segs_val'); if(el2) el2.textContent=bikeRows.length.toLocaleString();
    const el3=document.getElementById('wt_total_val'); if(el3) el3.textContent=wtRows.length;
    const el4=document.getElementById('wt_miles_val'); if(el4) el4.textContent=wtRows.reduce((s,r)=>s+num(r['Miles']),0).toFixed(0)+' mi';
  }

  /* ══════════════════════════════════════════════════════════
     COMMUTE CHARTS (state-level)
  ══════════════════════════════════════════════════════════ */

  function buildCommute(commRows) {
    const CY=['2018','2019','2020','2021','2022','2023','2024'];
    const CM_COLORS=['#3b82f6','#22c55e','#fbbf24','#fb923c','#a78bfa','#22d3ee','#f472b6'];
    const datasets=commRows.map((m,i)=>({
      label:m['mode'], data:m['vals'],
      borderColor:CM_COLORS[i%CM_COLORS.length],
      backgroundColor:'transparent', tension:.3, pointRadius:4, spanGaps:true
    }));
    make('cm_lines','line',{
      labels:CY, datasets
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:8,font:{size:10}}},tooltip:tip()},
        scales:{ x:{grid:{color:G()}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });

    make('cm_donut','doughnut',{
      labels:commRows.map(m=>m['mode']),
      datasets:[{ data:commRows.map(m=>m['vals'][6]), backgroundColor:CM_COLORS, borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'55%', plugins:{...BASE.plugins,legend:{display:true,position:'right',labels:{boxWidth:9,padding:7,font:{size:10}}},tooltip:tip()} });

    make('cm_bar','bar',{
      labels:CY,
      datasets:commRows.slice(0,5).map((m,i)=>({ label:m['mode'], data:m['vals'], backgroundColor:CM_COLORS[i], borderRadius:3 }))
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:9,font:{size:10}}},tooltip:tip()},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},ticks:{callback:fmt}} } });
  }

  /* ══════════════════════════════════════════════════════════
     SAFETY CHARTS (state-level)
  ══════════════════════════════════════════════════════════ */

  function buildSafety(vmtRows) {
    const ftl=extractKY(vmtRows,'Measures','Year of Year','Highway Fatalities','Values');
    const FRKY={KY:[null,1.46,null,1.41,1.41,1.41,1.62,1.88,1.60,1.58,null],US:[null,1.14,null,1.10,1.13,1.10,1.34,1.38,1.34,1.26,null]};
    const ftlMin=Math.min(...ftl.data.filter(Boolean));

    make('sf_trend','bar',{
      labels:ftl.labels,
      datasets:[{ data:ftl.data, backgroundColor:ftl.data.map(v=>v>=800?'#f87171':v>=760?'#fb923c':'rgba(248,113,113,.4)'), borderRadius:4 }]
    },{ ...BASE, plugins:{...BASE.plugins,tooltip:tip({callbacks:{label:c=>` ${c.raw} fatalities`}})},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:G()},min:ftlMin?ftlMin*0.9:0} } });

    make('sf_rate','line',{
      labels:ftl.labels,
      datasets:[
        { label:'KY Rate', data:FRKY.KY.filter(Boolean), borderColor:'#f87171', backgroundColor:'rgba(248,113,113,.1)', fill:true, tension:.3, pointRadius:4 },
        { label:'US Average', data:FRKY.US.filter(Boolean), borderColor:'#3b82f6', borderDash:[6,3], tension:.3, pointRadius:3 }
      ]
    },{ ...BASE, plugins:{...BASE.plugins,legend:{display:true,position:'top',labels:{boxWidth:8,padding:10}},tooltip:tip()},
        scales:{ x:{grid:{color:G()}}, y:{grid:{color:G()},min:.8,ticks:{callback:v=>v.toFixed(2)}} } });

    make('sf_cause','doughnut',{
      labels:['Speed','Alcohol','Run-Off-Road','Distracted','Other'],
      datasets:[{ data:[229,177,169,98,141], backgroundColor:['#f87171','#fb923c','#a78bfa','#fbbf24','#22d3ee'], borderWidth:2, borderColor:'#0d1e35' }]
    },{ ...BASE, cutout:'52%', plugins:{...BASE.plugins,legend:{display:true,position:'right',labels:{boxWidth:9,padding:8,font:{size:10}}},tooltip:tip()} });
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════ */
  return {
    // State-level (no filter)
    buildOvVMT, buildOvFreight, buildOvRail, buildOvAirports,
    buildInfRoads, buildInfDrivers, buildInfIRI, buildInfFunding,
    buildFreightFlows, buildTransit, buildCommute, buildSafety,

    // Filterable
    buildMobility, buildMobCounties, buildMobDist,
    buildFreightDistrict, buildFreightCountyTable, buildParking,
    buildRail, buildAviation, buildWaterways, buildActive,

    fmt
  };

})();
