# 📊 Absorbție în Timp - Cum Trebuie să Funcționeze

## 🎯 Scop General

Pagina **Absorbție în Timp** vizualizează evoluția plăților PNRR pe județe de-a lungul timpului (Ianuarie 2022 - Noiembrie 2025), cu animații interactive și efecte vizuale pentru a evidenția județele cu plăți noi.

---

## 🗺️ Componente Vizibile

### 1. **Harta Interactivă**
- Hartă cu toate județele României
- Fiecare județ are o culoare unică și distinctă
- Județele cu plăți sunt colorate
- Județele fără plăți rămân gri deschis

### 2. **Controale Timeline**
- Butoane: Play/Pause/Stop pentru animație automată
- Slider temporal pentru navigare manuală
- Control viteză: 0.5x, 1x, 2x, 3x (default), 4x
- Butoane rapide pentru fiecare lună (click direct pe lună)

### 3. **Statistici Live**
- Valoare totală plăți (cu toggle RON/EUR)
- Număr total plăți
- Număr beneficiari unici
- Data curentă afișată

---

## 🎬 Reguli de Funcționare

### ✅ **IANUARIE - Animație Fade-In**

**Ce vede utilizatorul:**
- Harta pornește GOALĂ (toate județele gri)
- Județele cu plăți apar **unul câte unul**, în ordine ALEATORIE
- Fiecare județ apare la **300ms** după precedentul
- **NU există efect de pulse** în Ianuarie (niciodată!)

**Durată animație:**
- **Ianuarie 2022:** 4 județe → ~1.2 secunde
- **Ianuarie 2023:** 34 județe → ~10 secunde  
- **Ianuarie 2024:** ~35 județe → ~10.5 secunde

**Reguli:**
- Animația trebuie să se termine COMPLET înainte ca Februarie să înceapă
- Ordinea apariției județelor este diferită la fiecare rulare (random)
- Utilizatorul vede județele "crescând" pe hartă unul câte unul

---

### ✅ **FEBRUARIE - Așteaptă Ianuarie**

**Ce vede utilizatorul:**
- Când timeline-ul ajunge la Februarie, harta **NU se schimbă imediat**
- Februarie așteaptă ca animația fade-in din Ianuarie să se termine COMPLET
- După ce ultimul județ din Ianuarie apare pe hartă, Februarie se încarcă automat

**De ce este important:**
- Februarie trebuie să știe care județe erau deja colorate în Ianuarie
- Fără această așteptare, TOATE județele din Februarie ar pulsa (incorect)
- Utilizatorul vede o tranziție fluidă: Ianuarie se termină → Februarie începe

**Durată așteptare:**
- Depinde de câte județe sunt în Ianuarie
- Exemplu: 34 județe × 300ms = ~10 secunde așteptare

---

### ✅ **LUNI NORMALE (Martie - Decembrie) - Efect Pulse**

**Regula Pulse:**
Un județ **PULSEAZĂ** dacă:
- **ARE plăți în luna curentă** (indiferent dacă avea sau nu plăți în luna anterioară)

**Regula simplă:** Dacă județul are plăți în luna curentă → **PULSEAZĂ**

**Exemple concrete:**

#### Exemplu 1: Martie → Aprilie → Mai 2023
**Martie 2023:** Județul BV are plăți  
→ **BV este colorat și PULSEAZĂ**

**Aprilie 2023:** Județul BV are plăți  
→ **BV este colorat și PULSEAZĂ**

**Mai 2023:** Județul BV NU are plăți  
→ **BV se decolorează și NU pulsează**

#### Exemplu 2: Județ revine după pauză
**Mai 2023:** Județul BV NU are plăți  
→ **BV este gri (decolorat), NU pulsează**

**Iunie 2023:** Județul BV are plăți  
→ **BV este colorat și PULSEAZĂ**

**Iulie 2023:** Județul BV are plăți  
→ **BV este colorat și PULSEAZĂ**

#### Exemplu 3: Lună cu multe județe
**Februarie 2023:** 40 județe au plăți  
→ **TOATE cele 40 județe sunt colorate și PULSEAZĂ**

**Martie 2023:** 42 județe au plăți  
→ **TOATE cele 42 județe sunt colorate și PULSEAZĂ**

---

## 🎨 Efect Pulse - Cum Arată

**Ce vede utilizatorul:**
- **TOATE județele cu plăți** în luna curentă **pulsează** (schimbă opacitatea între 100% și 50%)
- Durata unui ciclu de pulsare: **2 secunde**
- Pulsarea este **continuă** (se repetă la infinit) până când utilizatorul avansează la luna următoare
- Efectul este **DOAR pe județ**, NU pe background sau restul hărții

**Reguli importante:**
- Județul rămâne în **culoarea sa unică** când pulsează (nu se schimbă culoarea)
- Județul **NU se mărește** când pulsează (rămâne în limitele sale geografice)
- Backgroundul hărții **NU pulsează** niciodată

---

## 🎮 Controale Timeline

### Butoane Principale
- **▶️ Pornește:** Pornește animația automată prin toate lunile
- **⏸️ Pauză:** Oprește temporar animația (rămâne pe luna curentă)
- **⏹️ Oprește:** Oprește animația și revine la Ianuarie 2022

### Control Viteză
- **0.5x:** 6 secunde per lună (foarte lent)
- **1x:** 3 secunde per lună (normal)
- **2x:** 1.5 secunde per lună (rapid)
- **3x:** 1 secundă per lună (foarte rapid) - **IMPLICIT**
- **4x:** 0.75 secunde per lună (ultra rapid)

### Navigare Manuală
- Click pe orice buton de lună → sare direct la acea lună
- Luna activă este evidențiată cu albastru
- Hover pe lună → previzualizare informații

---

## 🎨 Culori Județe

Județele sunt colorate cu **gradient de albastru** bazat pe valoarea plăților:
- **Albastru deschis** (#f0f9ff) - valori mici
- **Albastru mediu** (#38bdf8) - valori medii
- **Albastru închis** (#0284c7) - valori mari
- **Gri deschis** (#f1f5f9) - județe fără plăți
- Gradient dinamic calculat pentru fiecare lună în funcție de valorile plăților

---

## 📊 Date Afișate

### Sursa Datelor
- **Fișier:** `/public/timeline-plati-2025.json`
- **Perioada:** Ianuarie 2022 - Noiembrie 2025 (60 luni)
- **Actualizare:** Datele sunt statice, nu se actualizează automat

### Informații per Lună
- Valoare totală plăți (RON/EUR)
- Număr total plăți
- Număr beneficiari unici
- Lista județelor cu plăți

---

**Versiune:** 1.0  
**Ultima actualizare:** 8 Noiembrie 2025
