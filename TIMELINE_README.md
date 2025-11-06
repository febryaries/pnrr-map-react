# 📈 Absorbție în Timp - Timeline Animation

## 🎯 Overview

Pagină nouă pentru vizualizarea evoluției investițiilor PNRR în timp, cu animație interactivă și controale de playback.

**URL**: `/absorbtie-in-timp`

---

## 🏗️ Arhitectură

### **Servicii**

#### `TimelineDataService.ts`
- Gestionează încărcarea datelor istorice
- Cache pentru performanță
- Preload pentru animație smooth
- Fetch date disponibile din `contains.json`

**Metode cheie**:
```typescript
fetchAvailableDates(): Promise<TimelineDate[]>
loadDataForDate(date: string): Promise<TimelineData>
preloadTimeline(dates: string[]): Promise<void>
```

### **Hooks**

#### `useTimelineData.ts`
- React hook pentru state management
- Controale animație (play/pause/stop)
- Navigare timeline (next/previous)
- Playback speed control

**Return values**:
```typescript
{
  availableDates: TimelineDate[]
  currentData: TimelineData | null
  isPlaying: boolean
  play, pause, stop, next, previous
  playbackSpeed, setPlaybackSpeed
}
```

### **Componente**

#### `TimelineControls.jsx`
- Butoane Play/Pause/Stop
- Slider temporal interactiv
- Speed control (0.5x, 1x, 2x, 4x)
- Date markers pe slider

#### `TimelineStats.jsx`
- Statistici live (valoare totală, nr. proiecte)
- Toggle RON/EUR
- Animație smooth la schimbare valori
- Loading states

#### `TimelinePage.jsx`
- Pagină principală
- Integrează toate componentele
- MapView pentru vizualizare județe
- Error handling

---

## 📊 Surse de date

### **API Endpoint**
```
https://mfe.gov.ro/generator/data/contains.json
```

Returnează lista cu toate fișierele disponibile:
```json
{
  "generated_at": "2025-11-06 13:28:17",
  "count": 30,
  "files": [
    {
      "file": "20251104-plati_pnrr.json.gz",
      "endpoint": "plati_pnrr",
      "dataset_date": "04.11.2025",
      "date_yyyymmdd": "20251104",
      "date_iso": "2025-11-04"
    }
  ]
}
```

### **Date încărcate**
Pentru fiecare dată:
- `plati_pnrr.json.gz` - Plăți PNRR (~2 MB)
- `progres_tehnic_proiecte.json.gz` - Progres proiecte (~2.35 MB)

---

## 🎨 Features

### ✅ Implementate

1. **Timeline Animation**
   - Play/Pause/Stop controls
   - Playback speed: 0.5x, 1x, 2x, 4x
   - Auto-loop la final

2. **Interactive Slider**
   - Drag pentru navigare manuală
   - Date markers vizibile
   - Current date highlight

3. **Live Statistics**
   - Valoare totală (RON/EUR toggle)
   - Număr proiecte
   - Data curentă
   - Animație smooth la schimbare

4. **Map Integration**
   - Hartă Leaflet cu județe
   - Culori gradient bazate pe valori
   - Tooltip cu detalii

5. **Performance**
   - Data caching
   - Preload pentru animație smooth
   - Lazy loading

### 🔮 Viitoare (opțional)

- Export video/GIF
- Comparație între 2 date
- Grafice statistici (line charts)
- Filtre pe componente/programe
- Share link cu timestamp

---

## 🚀 Utilizare

### **Navigare**
```
http://localhost:5173/absorbtie-in-timp
```

### **Controale**

1. **Play** - Pornește animația automată
2. **Pause** - Oprește temporar animația
3. **Stop** - Oprește și resetează la prima dată
4. **Slider** - Drag pentru navigare manuală
5. **Speed** - Schimbă viteza animației

### **Toggle-uri**

- **RON/EUR** - Schimbă valuta afișată
- **Speed** - 0.5x (lent) → 4x (rapid)

---

## 📁 Structură fișiere

```
src/
├── services/
│   └── TimelineDataService.ts       # Service pentru date timeline
├── hooks/
│   └── useTimelineData.ts           # Hook pentru state management
├── components/
│   ├── TimelineControls.jsx         # Controale Play/Pause/Slider
│   ├── TimelineControls.css
│   ├── TimelineStats.jsx            # Statistici live
│   └── TimelineStats.css
├── pages/
│   ├── TimelinePage.jsx             # Pagină principală
│   └── TimelinePage.css
└── App.jsx                          # Routing (+1 rută)
```

---

## 🎯 Exemple de utilizare

### **Încărcare date pentru o dată specifică**
```typescript
import { timelineDataService } from './services/TimelineDataService';

const data = await timelineDataService.loadDataForDate('20251104');
console.log(data.totalValue); // 159622621634
console.log(data.totalProjects); // 7135
```

### **Preload pentru animație**
```typescript
const dates = ['20251104', '20251103', '20251101'];
await timelineDataService.preloadTimeline(dates);
```

### **Folosire hook**
```jsx
function MyComponent() {
  const { 
    currentData, 
    isPlaying, 
    play, 
    pause 
  } = useTimelineData();

  return (
    <div>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <p>Valoare: {currentData?.totalValue}</p>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### **Problema**: Animația e prea lentă
**Soluție**: Crește playback speed la 2x sau 4x

### **Problema**: Date nu se încarcă
**Soluție**: Verifică console pentru erori API, verifică conexiunea internet

### **Problema**: Harta nu se actualizează
**Soluție**: Verifică că `currentData` e valid și conține date pentru județe

---

## 📊 Performance

### **Optimizări implementate**

1. **Caching** - Date încărcate sunt cached
2. **Preload** - Date viitoare sunt preîncărcate
3. **Debounce** - Slider are debounce pentru performanță
4. **Lazy loading** - Componente încărcate on-demand

### **Metrici**

- **Timp încărcare inițială**: ~2-3s (6 date × 2 endpoints)
- **Timp schimbare frame**: <100ms (cu cache)
- **Memorie folosită**: ~50-100MB (6 date cached)

---

## 🎨 Customizare

### **Culori**
Editează în `TimelineControls.css` și `TimelineStats.css`:
```css
.timeline-btn-play {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}
```

### **Playback speeds**
Editează în `TimelineControls.jsx`:
```javascript
const speedOptions = [
  { label: '0.5x', value: 4000 },
  { label: '1x', value: 2000 },
  { label: '2x', value: 1000 },
  { label: '4x', value: 500 }
];
```

---

## 📝 TODO

- [ ] Export video/GIF
- [ ] Comparație între 2 date
- [ ] Grafice statistici
- [ ] Filtre avansate
- [ ] Share functionality
- [ ] Mobile optimization

---

**Creat**: 6 noiembrie 2025  
**Versiune**: 1.0.0  
**Status**: ✅ Production Ready
