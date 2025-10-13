# 📚 Documentație Completă - PNRR Map React

## 📋 Cuprins

1. [Prezentare Generală](#prezentare-generală)
2. [Arhitectură](#arhitectură)
3. [API-uri și Surse de Date](#api-uri-și-surse-de-date)
4. [Structura Datelor](#structura-datelor)
5. [Componente Principale](#componente-principale)
6. [Flux de Date](#flux-de-date)
7. [Procesare și Agregare](#procesare-și-agregare)

---

## 🎯 Prezentare Generală

**PNRR Map React** este o aplicație web interactivă pentru vizualizarea și analiza fondurilor PNRR pe județele României.

### Funcționalități

- Hartă interactivă România cu date pe județe
- Tabele detaliate cu proiecte și plăți
- Filtrare pe componente și programe PNRR
- Căutare în proiecte și beneficiari
- Export Excel
- Vizualizări cu grafice Highcharts
- Date în timp real de pe API-ul oficial PNRR

### Tehnologii

- React 18 + Vite
- TypeScript
- Highcharts
- Node-fetch
- XLSX

---

## 🏗️ Arhitectură

### Structura Proiectului

```
src/
├── components/          # Componente React
│   ├── MapView.jsx      # Harta națională
│   ├── CountyDetails.jsx # Detalii județ
│   └── ComponentsOverview.jsx
├── services/            # Servicii pentru date
│   ├── PNRRDataService.ts
│   └── ExchangeRateService.ts
├── types/               # Clase de agregare date
│   ├── BaseDataAggregation.ts
│   ├── PaymentDataAggregation.ts
│   └── ProjectDataAggregation.ts
├── hooks/               # React hooks
│   └── useDataEndpoint.ts
├── constants/           # Constante și mapping-uri
│   └── PNRRConstants.ts
└── App.jsx              # Componenta principală
```

---

## 🌐 API-uri și Surse de Date

### API Oficial PNRR

**Base URL:** `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/`

### Endpoint 1: Plăți PNRR

```
GET /plati_pnrr?limit=5000&offset=0
```

**Câmpuri importante:**
- `cod_componenta` - Cod componentă (C1-C16)
- `nume_beneficiar` - Nume beneficiar
- `cui` - CUI beneficiar
- `judet_beneficiar` - Județ
- `valoare_plata_fe_euro` - Valoare EUR
- `data_plata` - Data plății

### Endpoint 2: Progres Tehnic Proiecte

```
GET /progres_tehnic_proiecte?limit=5000&offset=0
```

**Câmpuri importante:**
- `nr_contract` - Număr contract
- `titlu_contract` - Titlu proiect
- `denumire_beneficiar` - Beneficiar
- `judet_implementare` - Județ ("NAȚIONAL" pentru proiecte naționale)
- `localitate_implementare` - Localitate ("NATIONAL" pentru proiecte naționale)
- `valoare_fe` - Valoare fonduri europene (RON)
- `stadiu` - Stadiu proiect

### Proiecte NAȚIONALE

Proiectele cu impact național:
```json
{
  "judet_implementare": "NAȚIONAL",
  "localitate_implementare": "NATIONAL",
  "impact": "NATIONAL"
}
```

**Important:** Sunt atribuite la București în aplicație.

---

## 📊 Structura Datelor

### CountyAggregation

```typescript
interface CountyAggregation {
  county: {
    code: string;        // "RO-AB"
    name: string;        // "Alba"
  };
  total: {
    value: number;       // Valoare totală EUR
    projects: number;    // Număr proiecte
  };
  programs: {
    [key: string]: {
      value: number;
      projects: number;
    }
  };
  components: {
    [code: string]: {
      value: number;
      projects: number;
    }
  };
  extras: {
    rows: ProjectRecord[];
  };
}
```

### Mapping Componente

```javascript
{
  'C1': { label: 'Managementul apei', program: 'Tranziția verde' },
  'C2': { label: 'Managementul deșeurilor', program: 'Tranziția verde' },
  'C4': { label: 'Mobilitate durabilă', program: 'Tranziția verde' },
  'C8': { label: 'Conectivitate', program: 'Digitalizare' },
  'C13': { label: 'Sănătate', program: 'Coeziune socială' },
  // ... C1-C16
}
```

---

## 🧩 Componente Principale

### App.jsx

Componenta root - gestionează starea globală.

**State:**
- `currentView` - 'map' sau 'county'
- `selectedCounty` - Județul selectat
- `data` - Date PNRR
- `currency` - 'EUR' sau 'RON'

### MapView.jsx

Harta națională interactivă.

**Funcționalități:**
- Hartă interactivă (Highcharts Maps)
- Clasament județe (top 10)
- Filtrare pe programe
- Statistici generale

### CountyDetails.jsx

Detalii pentru un județ.

**Tabele:**

#### Tabel Proiecte

**Coloane:**
1. Titlu Proiect
2. Nume Beneficiar
3. Sursă Finanțare
4. Valoare Plată (EUR)
5. Progres Fizic (%)
6. Cod Componentă
7. Cod Măsură
8. **Localitate** (afișează "NATIONAL" pentru proiecte naționale)

**Funcționalități:**
- Sortare pe orice coloană
- Căutare full-text
- Filtrare pe componentă
- Paginare (20/pagină)
- Export Excel

#### Tabel Localități

**Coloane:**
1. Localitate
2. Număr proiecte
3. Valoare estimată (EUR)

---

## 🔄 Flux de Date

### 1. Inițializare

```
App.jsx
  └─> useDataEndpoint()
        └─> PNRRDataService.loadAllData()
              ├─> clearCache() // Șterge cache
              ├─> PaymentDataAggregation.loadData()
              │     └─> API: plati_pnrr
              └─> ProjectDataAggregation.loadData()
                    └─> API: progres_tehnic_proiecte
```

### 2. Procesare Proiecte

```
ProjectDataAggregation.processData()
  └─> Pentru fiecare proiect:
        ├─> normalizeCountyName(judet_implementare)
        │     ├─> "BUCUREȘTI" → 'BI'
        │     ├─> "NAȚIONAL" → 'BI' ✅
        │     └─> "ALBA" → 'AB'
        ├─> Convertește RON → EUR
        ├─> Agregare pe județ
        └─> Adaugă în county.extras.rows
```

### 3. Afișare în Tabel

```
CountyDetails.jsx
  └─> county.extras.rows
        └─> EnhancedTable
              └─> locality: project.LOCALITATE_IMPLEMENTARE
                    └─> "NATIONAL" ✅
```

---

## ⚙️ Procesare și Agregare

### BaseDataAggregation

Clasa de bază cu funcționalități comune.

**Metoda cheie:**

```typescript
protected normalizeCountyName(countyName: string): string | null {
  const normalized = countyName.toUpperCase().trim();
  
  // București
  if (normalized.includes('BUCUREȘTI')) return 'BI';
  
  // NAȚIONAL → București ✅
  if (normalized.includes('NAȚIONAL') || normalized.includes('NATIONAL')) {
    return 'BI';
  }
  
  // Alte județe
  for (const [code, name] of Object.entries(COUNTY_MAP)) {
    if (normalized.includes(name.toUpperCase())) return code;
  }
  
  return null;
}
```

### ProjectDataAggregation

Procesare date proiecte.

**Flux:**
1. Fetch cu paginare (5000/batch)
2. Normalizare județ
3. Conversie RON → EUR
4. Agregare pe județ
5. Salvare în county.extras.rows

### Cache și Performanță

```typescript
class PNRRDataService {
  private dataCache: Map<DataEndpointType, CountyAggregation[]>;
  
  async loadData(endpoint: DataEndpointType) {
    // Check cache
    const cached = this.dataCache.get(endpoint);
    if (cached) return cached;
    
    // Load fresh data
    const data = await aggregation.loadData();
    this.dataCache.set(endpoint, data);
    return data;
  }
  
  clearCache() {
    this.dataCache.clear();
  }
}
```

---

## 🚀 Deployment

### Local

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
```

### Vercel

- Push pe GitHub
- Vercel detectează automat
- Deploy automat la fiecare commit

**URL:** https://pnrr-map-react.vercel.app/

---

## 📝 Note Importante

### Proiecte NAȚIONALE

- Au `judet_implementare: "NAȚIONAL"`
- Sunt atribuite la București
- Apar cu "NATIONAL" în coloana Localitate
- Sunt ~41 proiecte în total

### Cache

- Cache în memorie (Map)
- Șters la fiecare pornire aplicație
- Permite performanță optimă

### Conversie Valutară

- RON → EUR folosind cursuri istorice
- Cursuri diferite pe ani (2021-2025)
- Conversie automată la procesare

---

## 🆕 Modificări Recente

### Octombrie 2025 - Integrare Date Componente din Excel

#### 1. **Sursă Date: comp.xlsx → JSON**

**Fișiere adăugate:**
- `src/data/comp.xlsx` - Fișier Excel sursă cu date componente PNRR
- `src/data/componentsData.json` - Date transformate în JSON
- `src/data/processComponentsData.js` - Procesare și transformare date

**Structura JSON:**
```json
{
  "id": 2,
  "componentCode": "C1",
  "measureCode": "I1",
  "title": "I1. Extinderea sistemelor de apă...",
  "allocatedValue": 244838539,
  "executedValue": 50017454,
  "executionPercent": "20,4 %"
}
```

**Transformare:**
```bash
# Excel → JSON
node -e "
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile('./src/data/comp.xlsx');
  const data = XLSX.utils.sheet_to_json(worksheet);
  // Clean and transform data
  fs.writeFileSync('componentsData.json', JSON.stringify(data));
"
```

#### 2. **ComponentsOverview.jsx - Afișare Date Dinamice**

**Modificări:**
- ❌ **Înainte:** Date hardcoded în componentă
- ✅ **Acum:** Date încărcate din `componentsData.json`

**Import:**
```javascript
import getProcessedComponentsData from '../data/processComponentsData'
```

**Utilizare:**
```javascript
const componentsData = getProcessedComponentsData()
```

**Afișare valori:**
```jsx
<div className="investment-value">
  <div className="value-main">{fmtMoney(investment.value)}</div>
  {investment.executedValue !== undefined && (
    <div className="value-executed">
      <span className="executed-label">Executat:</span> {fmtMoney(investment.executedValue)}
      {investment.executionPercent && (
        <span className="execution-percent"> • {investment.executionPercent}</span>
      )}
    </div>
  )}
</div>
```

#### 3. **Stilizare CSS - App.css**

**Stiluri adăugate:**
```css
/* Investment value styles */
.investment-value {
  text-align: right;
  min-width: 150px;
}

.value-main {
  font-weight: 600;
  color: #10b981;
  font-size: 14px;
}

.value-executed {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.4;
}

.executed-label {
  font-weight: 500;
  color: #475569;
}

.execution-percent {
  color: #3b82f6;
  font-weight: 600;
}
```

#### 4. **Rezultat Final**

Pentru fiecare investiție/reformă se afișează:

**Exemplu - C1 / I1:**
```
I1. Extinderea sistemelor de apă...        244,84 mil EUR
                                            Executat: 50,02 mil EUR • 20,4%
```

**Vizual:**
- **244,84 mil EUR** - Verde, bold (alocare)
- **Executat: 50,02 mil EUR** - Gri (suma executată)
- **20,4%** - Albastru, bold (procent execuție)

#### 5. **Avantaje**

✅ Date actualizabile - modifici `comp.xlsx` → regenerezi JSON  
✅ Performanță - JSON încărcat la build time  
✅ Mentenabilitate - date separate de cod  
✅ Vizibilitate - afișare clară alocare vs execuție  
✅ Transparență - procent execuție vizibil  

#### 6. **Actualizare Date**

Pentru a actualiza datele:

1. **Modifică** `comp.xlsx` pe Desktop
2. **Copiază** în proiect:
   ```bash
   cp ~/Desktop/comp.xlsx ./src/data/comp.xlsx
   ```
3. **Regenerează** JSON:
   ```bash
   node -e "
     const XLSX = require('xlsx');
     const workbook = XLSX.readFile('./src/data/comp.xlsx');
     const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
     const cleaned = data.map(row => ({
       id: row[' ID_FIN_BUGETE '],
       componentCode: row[' COMP ']?.trim(),
       measureCode: row[' MAS ']?.trim(),
       title: row['MASURA_TITLU']?.trim(),
       allocatedValue: row[' ALOCARE_FINANCIARA '],
       executedValue: row[' Executat_euro '],
       executionPercent: row[' Procent ']?.trim()
     }));
     require('fs').writeFileSync('./src/data/componentsData.json', JSON.stringify(cleaned, null, 2));
   "
   ```
4. **Commit & Push**:
   ```bash
   git add src/data/componentsData.json
   git commit -m "Update components data"
   git push
   ```

---

**Versiune:** 1.1  
**Data:** Octombrie 2025  
**Autor:** PNRR Map Team
