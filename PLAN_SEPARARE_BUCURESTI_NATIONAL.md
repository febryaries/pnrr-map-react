# 📋 PLAN: Separare București și Național

## 🎯 OBIECTIV
Separăm "București și proiecte naționale" în:
- **București** (RO-BI) - doar proiecte din București
- **National** - doar proiecte NAȚIONAL

---

## 📁 FIȘIERE NOI DE CREAT

### 1. `/src/hooks/useBucurestiProjects.js`
**Scop:** Hook pentru proiecte DOAR din București (fără NAȚIONAL)

**Funcționalitate:**
- Fetch API: `progres_tehnic_proiecte`
- Filtrare: `judet_implementare = "BUCUREȘTI"` (exclude "NAȚIONAL")
- Return: `{ projects, loading, error }`

**Filtre:**
```javascript
// Include DOAR București
if (judet === 'BUCUREȘTI' || judet === 'MUNICIPIUL BUCUREȘTI') return true;
if (localitate === 'BUCUREȘTI' || localitate.startsWith('SECTOR')) return true;

// EXCLUDE NAȚIONAL
if (judet === 'NAȚIONAL' || localitate === 'NATIONAL') return false;
```

---

### 2. `/src/hooks/useNationalProjects.js`
**Scop:** Hook pentru proiecte DOAR NAȚIONAL

**Funcționalitate:**
- Fetch API: `progres_tehnic_proiecte`
- Filtrare: `judet_implementare = "NAȚIONAL"` SAU `localitate_implementare = "NATIONAL"`
- Return: `{ projects, loading, error }`

**Filtre:**
```javascript
// Include DOAR NAȚIONAL
if (judet === 'NAȚIONAL' || localitate === 'NATIONAL') return true;

// EXCLUDE tot restul
return false;
```

---

## 🔧 FIȘIERE DE MODIFICAT

### 3. `/src/components/CountyDetails.jsx`

**Modificări:**

#### A. Detectare județ (linia ~589)
```javascript
const isBucuresti = county.county.code === 'RO-BI';
const isNational = county.county.code === 'NATIONAL';
```

#### B. Utilizare hook-uri (linia ~590-592)
```javascript
// Pentru București - DOAR proiecte București
const { projects: bucurestiProjects, loading: bucLoading, error: bucError } = 
  isBucuresti && endpoint === 'projects' 
    ? useBucurestiProjects() 
    : { projects: [], loading: false, error: null };

// Pentru National - DOAR proiecte NAȚIONAL
const { projects: nationalProjects, loading: natLoading, error: natError } = 
  isNational && endpoint === 'projects' 
    ? useNationalProjects() 
    : { projects: [], loading: false, error: null };
```

#### C. Selectare date (linia ~904-906)
```javascript
const allProjectsData = 
  (isBucuresti && endpoint === 'projects' && bucurestiProjects.length > 0) 
    ? bucurestiProjects 
  : (isNational && endpoint === 'projects' && nationalProjects.length > 0)
    ? nationalProjects
  : (countyData.extras?.rows || []);
```

#### D. Titlu pagină (linia ~1311)
```javascript
<h1>
  {isNational ? 'Proiecte Naționale' : `${county.county.name} (${countyCode})`}
</h1>
```

#### E. Hartă județ (linia ~1422-1445)
```javascript
// Pentru National, NU afișăm hartă județ (nu are geometrie)
{!isNational && countyMapData && countyMapOptions ? (
  <HighchartsReact ... />
) : isNational ? (
  <div>Proiectele naționale nu au o locație geografică specifică</div>
) : null}
```

---

### 4. `/src/components/MapView.jsx`

**Modificări:**

#### A. Adăugare hartă mică "National" (după linia ~1774)

**Poziție:** Stânga jos, lângă harta mare

**Structura:**
```jsx
{/* Mini Map for National Projects */}
<section className="national-mini-map">
  <div className="national-map-card">
    <h3>Proiecte Naționale</h3>
    <div className="national-map-stats">
      <div className="stat-value">{formatMoney(nationalValue)}</div>
      <div className="stat-label">{nationalProjects} proiecte</div>
    </div>
    <div className="national-map-chart">
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'mapChart'}
        options={nationalMapOptions}
      />
    </div>
  </div>
</section>
```

#### B. Configurare hartă mică (nou useMemo)
```javascript
const nationalMapOptions = useMemo(() => {
  if (!mapData) return null;
  
  return {
    chart: {
      map: mapData.topology,
      height: 250,  // Mai mică decât harta mare
    },
    title: { text: null },
    colorAxis: {
      min: 0,
      max: 1,
      stops: [[0, '#10b981'], [1, '#059669']]  // Verde pentru National
    },
    series: [{
      data: processedData.map(d => ({ ...d, value: 1 })),  // Toate județele aceeași culoare
      borderColor: '#ffffff',
      borderWidth: 0.5,
      enableMouseTracking: true,
      point: {
        events: {
          click: function() {
            // Click ORIUNDE → National
            onCountyClick('NATIONAL', 'Proiecte Naționale')
          }
        }
      }
    }],
    tooltip: {
      formatter: function() {
        return '<b>Click pentru Proiecte Naționale</b>'
      }
    }
  }
}, [mapData, nationalValue, nationalProjects])
```

#### C. Calcul valori National (nou useMemo)
```javascript
const nationalData = useMemo(() => {
  // Calculăm din data.find(d => d.code === 'NATIONAL')
  const nationalCounty = data.find(d => d.code === 'NATIONAL')
  
  return {
    value: nationalCounty?.total?.value || 0,
    projects: nationalCounty?.total?.projects || 0
  }
}, [data])
```

#### D. Modificare clasament (linia ~1858-1898)
```javascript
// Include și "National" în clasament
const rankingData = [
  ...processedData,  // Județe normale
  {
    code: 'NATIONAL',
    name: 'Proiecte Naționale',
    value: nationalData.value,
    money: nationalData.value,
    projects: nationalData.projects
  }
].sort((a, b) => b.value - a.value)
  .slice(0, showAllRanking ? undefined : 10)
```

#### E. Modificare display name (linia ~1868)
```javascript
const displayName = county.code === 'NATIONAL' 
  ? 'Proiecte Naționale' 
  : county.code === 'RO-BI' 
    ? 'București'  // NU mai include "și proiecte naționale"
    : county.name
```

---

### 5. `/src/App.css`

**Adăugare stiluri pentru hartă mică National:**

```css
/* National Mini Map */
.national-mini-map {
  position: absolute;
  left: 20px;
  bottom: 20px;
  z-index: 10;
}

.national-map-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 16px;
  width: 200px;
}

.national-map-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #059669;
  text-align: center;
}

.national-map-stats {
  margin-bottom: 12px;
  text-align: center;
}

.national-map-stats .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #059669;
  margin-bottom: 4px;
}

.national-map-stats .stat-label {
  font-size: 12px;
  color: #64748b;
}

.national-map-chart {
  cursor: pointer;
  transition: transform 0.2s;
}

.national-map-chart:hover {
  transform: scale(1.05);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .national-mini-map {
    position: static;
    margin: 20px 0;
  }
  
  .national-map-card {
    width: 100%;
  }
}
```

---

## 🗑️ FIȘIERE DE ȘTERS

### 6. `/src/hooks/useBucurestiNationalProjects.js`
**Motiv:** Înlocuit cu `useBucurestiProjects.js` și `useNationalProjects.js`

---

## 📊 MODIFICĂRI DATE

### 7. Agregare date pentru "National"

**Unde:** În serviciul de agregare date (probabil `ProjectDataAggregation.ts` sau similar)

**Modificare:**
- Creăm un "județ" virtual `code: 'NATIONAL'`
- Agregăm toate proiectele cu `judet_implementare = "NAȚIONAL"`
- Structură identică cu județele normale:

```javascript
{
  county: {
    code: 'NATIONAL',
    name: 'Proiecte Naționale'
  },
  total: {
    value: [suma proiecte NAȚIONAL],
    projects: [număr proiecte NAȚIONAL]
  },
  programs: { ... },
  components: { ... },
  extras: {
    rows: [toate proiectele NAȚIONAL]
  }
}
```

---

## ✅ CHECKLIST IMPLEMENTARE

### Fază 1: Hook-uri
- [ ] Creează `useBucurestiProjects.js`
- [ ] Creează `useNationalProjects.js`
- [ ] Testează ambele hook-uri (console.log)

### Fază 2: CountyDetails
- [ ] Modifică detectare județ (isBucuresti, isNational)
- [ ] Modifică utilizare hook-uri
- [ ] Modifică selectare date (allProjectsData)
- [ ] Modifică titlu pagină
- [ ] Ascunde hartă pentru National
- [ ] Testează pagina București (fără NAȚIONAL)
- [ ] Testează pagina National (doar NAȚIONAL)

### Fază 3: MapView
- [ ] Adaugă hartă mică National (HTML/JSX)
- [ ] Configurează hartă mică (nationalMapOptions)
- [ ] Calculează valori National (nationalData)
- [ ] Modifică clasament (include National)
- [ ] Modifică display name (București fără "și proiecte naționale")
- [ ] Testează click pe hartă mică → National
- [ ] Testează click pe București → București (fără NAȚIONAL)

### Fază 4: Stiluri
- [ ] Adaugă CSS pentru hartă mică National
- [ ] Testează responsive (mobile)

### Fază 5: Date
- [ ] Modifică agregare date (adaugă "județ" NATIONAL)
- [ ] Verifică că București NU include NAȚIONAL
- [ ] Verifică că National include DOAR NAȚIONAL

### Fază 6: Cleanup
- [ ] Șterge `useBucurestiNationalProjects.js`
- [ ] Verifică că nu mai există referințe la hook-ul vechi
- [ ] Testează întreaga aplicație

---

## 🧪 TESTE FINALE

### Test 1: Harta mare
- [ ] Click pe București → pagină București (fără NAȚIONAL)
- [ ] Click pe alt județ → pagină județ normal

### Test 2: Harta mică National
- [ ] Click oriunde pe hartă mică → pagină National (doar NAȚIONAL)
- [ ] Afișează valoare corectă
- [ ] Afișează număr proiecte corect

### Test 3: Clasament
- [ ] București apare fără "și proiecte naționale"
- [ ] "Proiecte Naționale" apare separat
- [ ] Sortare corectă după valoare

### Test 4: Pagini detalii
- [ ] București: tabel cu proiecte București (fără NAȚIONAL)
- [ ] București: subtitle arată 0 proiecte naționale
- [ ] National: tabel cu proiecte NAȚIONAL (fără București)
- [ ] National: NU afișează hartă județ
- [ ] National: afișează mesaj "Proiectele naționale nu au o locație geografică specifică"

### Test 5: Filtre
- [ ] Filtrare pe componente funcționează pe București
- [ ] Filtrare pe componente funcționează pe National
- [ ] Export Excel funcționează pe București
- [ ] Export Excel funcționează pe National

---

## 📝 NOTE IMPORTANTE

1. **NU inventăm coduri** - folosim `'NATIONAL'` simplu, fără `RO-`
2. **NU stricăm funcționalități** - toate județele normale rămân neschimbate
3. **Verificăm BINE** - testăm fiecare modificare înainte să mergem mai departe
4. **Zero erori** - implementăm corect din prima

---

## 🎯 REZULTAT FINAL

### Harta mare (dreapta):
- 41 județe normale
- București (RO-BI) - doar proiecte București
- Click pe județ → detalii județ

### Harta mică (stânga):
- România în miniatură (verde)
- Click oriunde → pagina "Proiecte Naționale"
- Afișează valoare + număr proiecte NAȚIONAL

### Clasament:
- București (separat, fără NAȚIONAL)
- Proiecte Naționale (separat)
- Toate județele sortate după valoare

### Pagini detalii:
- București: doar proiecte București
- National: doar proiecte NAȚIONAL, fără hartă județ

---

**STATUS:** ✅ Plan complet - Gata de implementare!
