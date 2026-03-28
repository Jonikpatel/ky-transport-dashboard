# 🚦 Kentucky Transportation at a Glance — Dashboard

An interactive, data-driven transportation dashboard for Kentucky built with vanilla JavaScript, Chart.js, PapaParse, and SheetJS. All 27 source files are loaded and rendered directly in the browser — no backend required.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)

---

## 📁 Project Structure

```
ky-transport-dashboard/
├── index.html              ← Main dashboard (open this)
├── css/
│   └── dashboard.css       ← All styles
├── js/
│   ├── config.js           ← File paths & column mappings
│   ├── loader.js           ← CSV/XLSX loader (PapaParse + SheetJS)
│   ├── geo.js              ← Dim_Geography + filter logic
│   ├── charts.js           ← All 39 chart builders
│   └── app.js              ← Main controller
├── data/                   ← ⚠️ PUT YOUR DATA FILES HERE
│   └── (your 27 CSV/XLSX files)
├── README.md
└── .gitignore
```

---

## 📊 Data Files Required

Place all 27 files exactly as named below into the `data/` folder:

### Filterable Files (have District/County columns)
| File | Filter Column |
|---|---|
| `Ky_KYTC_Major_Freight_Users_WM_2158843578129676376.csv` | District Name + County Name |
| `Ky_KYTC_Rail_Active_WM_-5673233921812200276.xlsx` | D_DISTRICT + CNTY_NAME |
| `Ky_KYTC_Trucking_Parking_Facilities_WM_-1628202214245374222.xlsx` | District Name + County Name |
| `Ky_KYTC_FAA_Airports_WM_gdb_-8831601967108505846 (1).xlsx` | County |
| `KY airport(Sheet1).csv` | COUNTY_NAME |
| `Private_Port_Facilities_in_Kentucky.csv` | D_District + CNTY_NAME |
| `Public_river_Port_Facilities_in_Kentucky_-2363957597937601664(Public_river_Port_Facilities_in).csv` | KYTC District Name + County Name |
| `Ferry_Boats_in_Kentucky(Ferry_Boats_in_Kentucky).csv` | D_DISTRICT + CNTY_NAME |
| `Ky_Bicycle_Routes.xlsx` | DISTRICT + COUNTY_NAM |
| `Ky_KYTC_Rail_Maintenance_Facilities_WM_-1714507099644838183.csv` | D_DISTRICT + CNTY_NAME |
| `Daily_Mobility_Statistics_20260319.csv` | County Name |

### State-Level Files (no filter — shown as statewide 🌐)
| File | Shows |
|---|---|
| `Highway Vehicle Miles Traveled by State.csv` | VMT, Drivers, Vehicles, Fatalities, Transit, Gas |
| `Freight Flows.csv` | Commodity Value & Tonnage |
| `Condition of Miles of Public Road by International Roughness Index by Functional System.csv` | Road IRI Quality |
| `Miles of Freight Railroad by State.csv` | Roads, Bridges, Rail, Waterway miles |
| `Enplanements by Airport.csv` | Airport Passengers |
| `Principal Water Ports.csv` | Port Tonnage |
| `PersonalTravel.csv` | NHTS Person Trips |
| `Number of Metropolitan Planning Organizations by State.csv` | MPO Count |
| `Energy Consumption by State.csv` | Transportation Energy |
| `Land Border Ports of Entry.csv` | Border Crossings |
| `Ky_KDFWR_BlueWaterTrails_WM_gdb_-1253325987605433237.xlsx` | Water Trails |
| `Commute Mode.xlsx` | ACS Commute Modes |

---

## 🚀 Deployment (GitHub Pages)

### Step 1 — Upload to GitHub

1. Create a new GitHub repository (e.g., `ky-transport-dashboard`)
2. Upload all files maintaining the folder structure
3. Upload your 27 data files to the `data/` folder

### Step 2 — Enable GitHub Pages

1. Go to your repository → **Settings** → **Pages**
2. Under **Source**, select `main` branch, `/ (root)` folder
3. Click **Save**
4. Your dashboard will be live at:
   ```
   https://yourusername.github.io/ky-transport-dashboard/
   ```

---

## 💻 Local Development

Because this app uses `fetch()` to load files, you need a local web server (browsers block `fetch()` on `file://`).

**Option 1 — Python (recommended)**
```bash
cd ky-transport-dashboard
python -m http.server 8000
# Open http://localhost:8000
```

**Option 2 — Node.js**
```bash
npx serve .
```

**Option 3 — VS Code**
Install the **Live Server** extension, right-click `index.html` → Open with Live Server.

---

## 🗺️ How the District/County Filter Works

```
District Dropdown ──→ Dim_Geography (built from Freight Users CSV)
County Dropdown   ──→    (cascades from District selection)
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
       Freight Charts    Rail Charts    Port Charts
       Aviation Types    Bike Routes    Ferry Routes
       Parking Charts    Mobility Charts
```

- **Filterable charts** re-aggregate data on the fly using the selected District/County
- **Statewide charts** (marked 🌐) always show Kentucky-wide data — they are excluded from the filter using Edit Interactions pattern
- Selecting a **District** automatically narrows the **County** dropdown to only counties in that district
- Click **✕ Clear** to reset to statewide view

---

## 📚 Data Sources

| Source | Description |
|---|---|
| **BTS/DOT** | `explore.dot.gov/STSStateProfiles` |
| **FHWA** | Highway Statistics, HPMS Road Conditions |
| **KYTC** | Kentucky Transportation Cabinet GIS data |
| **NHTSA** | FARS Fatality Analysis Reporting |
| **FAA** | Airport data (T-100, NPIAS) |
| **USACE** | Waterborne Commerce Statistics |
| **ACS** | American Community Survey (Commute) |
| **NTD** | National Transit Database |
| **KDFWR** | Kentucky Dept. of Fish & Wildlife Resources |

---

## 🛠️ Technology Stack

| Library | Version | Purpose |
|---|---|---|
| [Chart.js](https://chartjs.org) | 4.4.1 | All charts and visualizations |
| [PapaParse](https://papaparse.com) | 5.4.1 | CSV file parsing |
| [SheetJS (xlsx)](https://sheetjs.com) | 0.18.5 | XLSX/Excel file parsing |
| Vanilla JS | ES5+ | No build step needed |

---

## 📄 License

Data sourced from U.S. federal and Kentucky state government open data portals. Code is MIT licensed.
