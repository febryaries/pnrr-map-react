# 📊 Analiză: Implementare "Absorbție în Timp" pentru PNRR Map

**Data analizei**: 6 noiembrie 2025  
**Autor**: Analiza MFE vs PNRR Map React

---

## 🎯 Obiectiv

Implementare pagină "Absorbție în timp" inspirată de https://mfe.gov.ro/map1/animated.php

---

## 📋 Ce face MFE Animated Map

### Features identificate:

1. **Timeline cu snapshots istorice**
   - Array JavaScript: `TIMELINE` cu fișiere JSON pentru fiecare dată
   - Format fișiere: `DDMMYYYY-funds-lite.json` și `DDMMYYYY-funds.json`
   - Exemple date: 06.09.2024, 30.11.2024, 08.01.2025, etc.

2. **Controale animație**
   - Buton **Play/Pause** (▶︎) cu ID `playBtn`
   - `setInterval` pentru animație automată
   - Trece prin timeline și actualizează harta la fiecare pas

3. **Slider temporal**
   - Range input pentru navigare manuală prin timeline
   - Sincronizat cu animația automată
   - Afișează data curentă selectată

4. **Toggle-uri**
   - **RON/EUR**: Switch între valute
   - **Valoare/Proiecte**: Tip de date afișate pe hartă

5. **Hartă interactivă**
   - **Highcharts Map** (nu Leaflet!)
   - Culori gradient bazate pe valori (P90 - percentila 90)
   - Tooltip cu detalii județ
   - Legendă cu scala culorilor

6. **Statistici live**
   - Valoare totală investiții (RON/EUR)
   - Număr total proiecte
   - Data curentă a snapshot-ului

---

## 💾 Ce date avem NOI disponibile

### Sursa: https://mfe.gov.ro/generator/data/contains.json

**Total fișiere**: 30 snapshots (6 date × 5 endpoints)

### Date disponibile (noiembrie 2025):
- ✅ **20251104** - 04.11.2025 (LATEST)
- ✅ **20251103** - 03.11.2025
- ✅ **20251101** - 01.11.2025
- ✅ **20251031** - 31.10.2025
- ✅ **20251030** - 30.10.2025
- ✅ **20251029** - 29.10.2025

### Endpoints disponibile pentru fiecare dată:
1. `plati_pnrr.json.gz` (~2 MB) - **Plăți PNRR**
2. `progres_tehnic_proiecte.json.gz` (~2.35 MB) - **Progres proiecte**
3. `indicatori_total.json.gz` (~346 B) - **Indicatori totali**
4. `top_beneficiari.json.gz` (~634 B) - **Top beneficiari**
5. `persons.json.gz` (~3.76 KB) - **Persoane**

### Structura URL:
```
https://mfe.gov.ro/generator/data/YYYYMMDD-{endpoint}.json.gz
```

**Exemplu**:
```
https://mfe.gov.ro/generator/data/20251104-plati_pnrr.json.gz
```

---

## 🏗️ Arhitectura noastră actuală

### Servicii existente:

1. **PNRRDataService.ts**
   - Gestionează încărcarea datelor
   - Cache pentru date
   - Suport pentru `DATA_ENDPOINTS.PAYMENTS` și `DATA_ENDPOINTS.PROJECTS`

2. **PaymentDataAggregation.ts**
   - Agregare date plăți pe județe
   - Calcule statistici

3. **ProjectDataAggregation.ts**
   - Agregare date proiecte pe județe
   - Calcule statistici

4. **PNRRConstants.ts**
   - `getAPIEndpoints(dataDate)` - generează URL-uri cu dată dinamică
   - `FALLBACK_DATA_DATE = '20251103'`

### Componente existente:

- **MapView.jsx** - Hartă Leaflet cu județe
- **App.css** - Stiluri globale
- **Filtre** - Componente, Localități, Județe

---

## 🎨 Propuneri de implementare

### **Opțiunea 1: Timeline Simplu (Quick Win)** ⚡
**Timp estimat**: 2-3 ore

**Features**:
- ✅ Slider temporal în header
- ✅ Selectare dată din dropdown
- ✅ Reîncărcare date la schimbare dată
- ✅ Folosește serviciile existente
- ❌ Fără animație automată

**Avantaje**:
- Rapid de implementat
- Folosește arhitectura existentă
- Risc minim

**Dezavantaje**:
- Nu e "wow factor"
- Fără animație Play

---

### **Opțiunea 2: Full Animated Map (Complex)** 🚀
**Timp estimat**: 1-2 zile

**Features**:
- ✅ Timeline cu toate datele disponibile
- ✅ Buton Play/Pause cu animație automată
- ✅ Slider sincronizat cu animația
- ✅ Toggle RON/EUR
- ✅ Statistici live (valoare totală, nr. proiecte)
- ✅ Pagină separată `/absorbtie-in-timp`
- ✅ Preload date pentru animație smooth

**Avantaje**:
- Experiență completă ca MFE
- "Wow factor" pentru utilizatori
- Valorifică datele istorice

**Dezavantaje**:
- Mai complex de implementat
- Necesită preload pentru performanță
- Risc mediu

---

### **Opțiunea 3: Hybrid (Recomandat)** 🎯
**Timp estimat**: 4-6 ore

**Features**:
- ✅ Timeline cu date majore (săptămânale/lunare)
- ✅ Play button pentru animație
- ✅ Slider manual
- ✅ Păstrează filtrele existente (componente, localități)
- ✅ Toggle RON/EUR
- ✅ Integrare în pagina principală (tab nou)

**Avantaje**:
- Balanță bună între complexitate și impact
- Reutilizează componente existente
- Animație + filtre = flexibilitate maximă

**Dezavantaje**:
- Mai puține date decât MFE (doar ultimele 6 zile)

---

## 📐 Plan de implementare (Opțiunea 3 - Hybrid)

### **Faza 1: Backend & Data Service** (1-2 ore)

1. **Creare `TimelineDataService.ts`**
   ```typescript
   class TimelineDataService {
     async getAvailableDates(): Promise<TimelineDate[]>
     async loadDataForDate(date: string): Promise<CountyAggregation[]>
     async preloadTimeline(dates: string[]): Promise<void>
   }
   ```

2. **Extindere `PNRRDataService.ts`**
   - Suport pentru încărcare multiplă de date
   - Cache per dată

3. **Hook nou: `useTimelineData`**
   ```typescript
   const { 
     availableDates, 
     currentDate, 
     setCurrentDate,
     isPlaying,
     play,
     pause,
     data 
   } = useTimelineData();
   ```

### **Faza 2: UI Components** (2-3 ore)

1. **`TimelineControls.jsx`**
   - Play/Pause button
   - Slider temporal
   - Date selector dropdown
   - Speed control (1x, 2x, 4x)

2. **`TimelineStats.jsx`**
   - Valoare totală (RON/EUR toggle)
   - Număr proiecte
   - Data curentă
   - Animație smooth la schimbare

3. **`TimelineMap.jsx`**
   - Wrapper peste `MapView` existent
   - Actualizare culori bazate pe timeline
   - Legendă dinamică

### **Faza 3: Integrare & Styling** (1 oră)

1. **Routing**
   - Rută nouă: `/absorbtie-in-timp`
   - Sau tab nou în pagina principală

2. **Styling**
   - Animații CSS pentru tranziții smooth
   - Responsive design
   - Dark mode support

3. **Performance**
   - Lazy loading pentru date
   - Debounce pentru slider
   - Web Workers pentru procesare date (opțional)

---

## 🎨 Mockup UI (Hybrid)

```
┌─────────────────────────────────────────────────────────────┐
│  PNRR Map - Absorbție în Timp                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📊 Statistici                                        │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Valoare totală: 159.622.621.634 RON  [RON|EUR]     │  │
│  │  Număr proiecte: 7.135                               │  │
│  │  Data: 05.11.2025                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⏯️  Timeline Controls                                │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  [▶️ Play]  [⏸️ Pause]  [⏮️ Reset]  Speed: [1x ▼]    │  │
│  │                                                       │  │
│  │  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○  │  │
│  │  29.10  30.10  31.10  01.11  03.11  04.11           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │              🗺️  HARTA ROMÂNIEI                       │  │
│  │                                                       │  │
│  │         [Județe colorate gradient albastru]          │  │
│  │                                                       │  │
│  │  Legendă: 0 ━━━━━━━━━━━━━━━━━━━━━━━━ 15 miliarde   │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Filtre: [Componente ▼] [Localități ▼] [Județe ▼]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Recomandare finală

**Opțiunea 3 - Hybrid** este cea mai bună alegere pentru că:

1. ✅ **Impact vizual mare** - animație + statistici live
2. ✅ **Timp rezonabil** - 4-6 ore implementare
3. ✅ **Reutilizează codul existent** - servicii, componente
4. ✅ **Flexibilitate** - păstrează filtrele existente
5. ✅ **Scalabil** - ușor de extins cu mai multe date

---

## 📝 Next Steps

1. **Confirmare abordare** - Hybrid, Quick sau Full?
2. **Prioritizare features** - Ce e must-have vs nice-to-have?
3. **Design review** - Mockup UI final
4. **Implementare** - Fază cu fază

---

**Gata de start?** 🚀
