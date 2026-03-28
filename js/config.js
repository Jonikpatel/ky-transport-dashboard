/* ============================================================
   config.js — Kentucky Transportation Dashboard
   Defines every data source, its geography columns,
   and whether it responds to the District/County filter.
   ============================================================ */

window.KY = window.KY || {};

KY.CONFIG = {

  /* ── FILTERABLE FILES ──────────────────────────────────────
     These have district and/or county columns.
     Charts built from these data sets will re-render when
     the user selects a district or county in the filter bar.
  ─────────────────────────────────────────────────────────── */
  FILTERABLE: {
    freightUsers: {
      path: 'data/Ky_KYTC_Major_Freight_Users_WM_2158843578129676376.csv',
      type: 'csv',
      districtCol: 'District Name',
      countyCol:   'County Name',
      label:       'Major Freight Users'
    },
    railActive: {
      path: 'data/Ky_KYTC_Rail_Active_WM_-5673233921812200276.xlsx',
      type: 'xlsx',
      districtCol: 'D_DISTRICT',
      countyCol:   'CNTY_NAME',
      label:       'Active Rail Segments'
    },
    truckParking: {
      path: 'data/Ky_KYTC_Trucking_Parking_Facilities_WM_-1628202214245374222.xlsx',
      type: 'xlsx',
      districtCol: 'District Name',
      countyCol:   'County Name',
      label:       'Trucking Parking Facilities'
    },
    faaAirports: {
      path: 'data/Ky_KYTC_FAA_Airports_WM_gdb_-8831601967108505846 (1).xlsx',
      type: 'xlsx',
      districtCol: null,          // no district column — county only
      countyCol:   'County',
      label:       'FAA Airports & Heliports'
    },
    kyAirportDetail: {
      path: 'data/KY airport(Sheet1).csv',
      type: 'csv',
      districtCol: null,
      countyCol:   'COUNTY_NAME',
      label:       'KY Airport Detail'
    },
    privatePorts: {
      path: 'data/Private_Port_Facilities_in_Kentucky.csv',
      type: 'csv',
      districtCol: 'D_District',
      countyCol:   'CNTY_NAME',
      label:       'Private Port Facilities'
    },
    publicPorts: {
      path: 'data/Public_river_Port_Facilities_in_Kentucky_-2363957597937601664(Public_river_Port_Facilities_in).csv',
      type: 'csv',
      districtCol: 'KYTC District Name',
      countyCol:   'County Name',
      label:       'Public River Port Authorities'
    },
    ferryBoats: {
      path: 'data/Ferry_Boats_in_Kentucky(Ferry_Boats_in_Kentucky).csv',
      type: 'csv',
      districtCol: 'D_DISTRICT',
      countyCol:   'CNTY_NAME',
      label:       'Ferry Boat Routes'
    },
    bikeRoutes: {
      path: 'data/Ky_Bicycle_Routes.xlsx',
      type: 'xlsx',
      districtCol: 'DISTRICT',
      countyCol:   'COUNTY_NAM',
      label:       'Bicycle Routes'
    },
    railMaint: {
      path: 'data/Ky_KYTC_Rail_Maintenance_Facilities_WM_-1714507099644838183.csv',
      type: 'csv',
      districtCol: 'D_DISTRICT',
      countyCol:   'CNTY_NAME',
      label:       'Rail Maintenance Facilities'
    },
    dailyMobility: {
      path: 'data/Daily_Mobility_Statistics_20260319.csv',
      type: 'csv',
      districtCol: null,          // county-level only
      countyCol:   'County Name',
      label:       'Daily Mobility Statistics'
    }
  },

  /* ── STATE-LEVEL FILES ─────────────────────────────────────
     No district or county columns.
     Charts from these data sets display statewide context
     and are NOT affected by the district/county filter.
     A "🌐 Statewide" badge will mark those visuals.
  ─────────────────────────────────────────────────────────── */
  STATE_LEVEL: {
    vmtByState: {
      path:  'data/Highway Vehicle Miles Traveled by State.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'Highway VMT / Drivers / Vehicles / Fatalities / Transit'
    },
    freightFlows: {
      path:  'data/Freight Flows.csv',
      type:  'csv',
      stateCol:  'Origin State',
      stateVal:  'Kentucky',
      label: 'Freight Flows (FAF)'
    },
    roadCondition: {
      path:  'data/Condition of Miles of Public Road by International Roughness Index by Functional System.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'Road Condition (IRI/HPMS)'
    },
    railroadMiles: {
      path:  'data/Miles of Freight Railroad by State.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'Railroad Miles / Bridges / Roads / Waterways'
    },
    enplanements: {
      path:  'data/Enplanements by Airport.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'Airport Enplanements'
    },
    principalPorts: {
      path:  'data/Principal Water Ports.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'Principal Water Ports (Tonnage)'
    },
    personalTravel: {
      path:  'data/PersonalTravel.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'Personal Travel (NHTS)'
    },
    mpoCount: {
      path:  'data/Number of Metropolitan Planning Organizations by State.csv',
      type:  'csv',
      stateCol:  'State',
      stateVal:  'Kentucky',
      label: 'MPO Count'
    },
    energyConsumption: {
      path:  'data/Energy Consumption by State.csv',
      type:  'csv',
      label: 'Energy Consumption (National)'
    },
    landBorderPorts: {
      path:  'data/Land Border Ports of Entry.csv',
      type:  'csv',
      label: 'Land Border Ports'
    },
    waterTrails: {
      path:  'data/Ky_KDFWR_BlueWaterTrails_WM_gdb_-1253325987605433237.xlsx',
      type:  'xlsx',
      label: 'Blue Water Trails (KDFWR)'
    },
    commuteMode: {
      path:  'data/Commute Mode.xlsx',
      type:  'xlsx',
      label: 'Commute Mode (ACS)'
    }
  },

  /* ── DIM_GEOGRAPHY SOURCE ──────────────────────────────────
     Built automatically from freightUsers which has the
     most complete District + County mapping in one file.
  ─────────────────────────────────────────────────────────── */
  GEO_SOURCE: 'freightUsers',
  GEO_DISTRICT_COL: 'District Name',
  GEO_COUNTY_COL:   'County Name',

  /* ── CHART COLORS ─────────────────────────────────────────  */
  COLORS: ['#3b82f6','#22c55e','#fbbf24','#fb923c','#a78bfa',
           '#22d3ee','#f472b6','#f87171','#a3e635','#818cf8'],
  GRID:   'rgba(26,51,87,.5)',
  TIP: {
    backgroundColor: '#0a1628', borderColor: '#1a3357', borderWidth: 1,
    padding: 10, titleColor: '#f0f6ff', bodyColor: '#5c7fa8',
    titleFont: { family:"'Syne',sans-serif", size: 12, weight:'700' }
  }
};
