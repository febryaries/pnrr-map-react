# 📊 DETALII COMPONENTE PNRR

## 📋 Cuprins

1. [Prezentare Generală](#prezentare-generală)
2. [Sursa Datelor](#sursa-datelor)
3. [Structura Datelor](#structura-datelor)
4. [Stiluri CSS](#stiluri-css)
5. [Link-uri PNRR](#link-uri-pnrr)
6. [Exemplu Complet](#exemplu-complet)

---

## 🎯 Prezentare Generală

Componenta **ComponentsOverview.jsx** afișează toate cele **16 componente PNRR** (C1-C16) într-un format acordeon expandabil, cu detalii despre investiții și reforme.

### Caracteristici

- ✅ **16 componente PNRR** cu acordeon expandabil
- ✅ **Valori alocate și executate** pentru fiecare măsură
- ✅ **Procente de execuție** calculate automat
- ✅ **Link-uri către dashboard oficial** PNRR pentru fiecare măsură
- ✅ **Responsive design** cu media queries

---

## 📁 Sursa Datelor

### 1. Fișier Excel Sursă

**Locație:** `src/data/comp.xlsx`

**Structura Excel:**
```
| ID_FIN_BUGETE | COMP | MAS | MASURA_TITLU              | ALOCARE_FINANCIARA | Executat_euro | Procent |
|---------------|------|-----|---------------------------|-------------------|---------------|---------|
| 2             | C1   | I1  | I1. Extinderea sistem...  | 244838539         | 50017454      | 20,4 %  |
| 3             | C1   | I2  | I2. Colectarea apelor...  | 57974587          | 25049710      | 43,2 %  |
| 5             | C1   | I4  | I4. Adaptarea la schim... | 33003856          | 1185419       | 3,6 %   |
```

### 2. Transformare Excel → JSON

**Script:** `parse-components-better.js`

**Output:** `src/data/componentsData.json`

```json
[
  {
    "id": 2,
    "componentCode": "C1",
    "measureCode": "I1",
    "title": "I1. Extinderea sistemelor de apă și canalizare în aglomerări mai mari de 2000 de locuitori echivalenți",
    "allocatedValue": 244838539,
    "executedValue": 50017454,
    "executionPercent": "20,4 %"
  },
  {
    "id": 3,
    "componentCode": "C1",
    "measureCode": "I2",
    "title": "I2. Colectarea apelor uzate...",
    "allocatedValue": 57974587,
    "executedValue": 25049710,
    "executionPercent": "43,2 %"
  }
]
```

### 3. Procesare Date

**Script:** `src/data/processComponentsData.js`

**Funcție:** `getProcessedComponentsData()`

```javascript
// Agregare pe componente
componentsRawData.forEach(item => {
  const code = item.componentCode  // "C1"
  
  // Agregare totale
  componentsData[code].totalValue += item.allocatedValue
  componentsData[code].totalExecutedValue += item.executedValue
  
  // Adăugare măsură
  const measureItem = {
    description: item.title,
    value: item.allocatedValue,
    executedValue: item.executedValue,
    executionPercent: item.executionPercent
  }
  
  if (isInvestment) {
    componentsData[code].investments.push(measureItem)
  } else if (isReform) {
    componentsData[code].reforms.push(measureItem)
  }
})
```

---

## 📊 Structura Datelor

### Structura Componentă

```javascript
{
  code: "C1",
  name: "Managementul apei",
  totalValue: 463543982,           // Sumă toate măsurile
  totalExecutedValue: 89235916,    // Sumă toate executate
  investments: [
    {
      description: "I1. Extinderea sistemelor...",
      value: 244838539,
      executedValue: 50017454,
      executionPercent: "20,4 %"
    },
    // ... alte investiții
  ],
  reforms: [
    {
      description: "R2. Reconfigurarea...",
      value: 62727000,
      executedValue: 0,
      executionPercent: "0,0 %"
    }
  ]
}
```

### Calcul Valori

#### La nivel de măsură (I1, I2, R2):
```javascript
executedValue: 50017454        // din JSON direct
executionPercent: "20,4 %"     // din JSON direct
```

#### La nivel de componentă (C1):
```javascript
// Sumă toate măsurile
totalExecutedValue = I1.executedValue + I2.executedValue + I4.executedValue + ...

// Exemplu C1:
totalExecutedValue = 50017454 + 25049710 + 1185419 + 12484331 + 499002
                   = 89235916 EUR (≈ 89,24 mil EUR)

// Procent componentă
executionPercent = (totalExecutedValue / totalValue) * 100
                 = (89235916 / 463543982) * 100
                 = 19.3%
```

---

## 🎨 Stiluri CSS

### 1. Header Componentă (C1, C2, etc.)

```css
/* Valoarea totală alocată - VERDE MARE */
.component-value {
  margin-bottom: -4px;
  font-size: 16px;  /* pe desktop */
}

/* Valoarea executată - VERDE MIC sub total */
.component-executed {
  font-size: 13px;
  color: #059669;      /* Verde închis */
  font-weight: 500;
  margin-top: 0px;     /* Lipită de valoarea totală */
  margin-bottom: 3px;  /* Spațiu mic înainte de meta info */
}

/* Meta info (5 investiții • 1 reforme • 2.2% din total) */
.component-meta {
  font-size: 11px;
  color: #64748b;      /* Gri */
}
```

**Rezultat vizual:**
```
463,55 mil EUR
Executat: 89,24 mil EUR • 19.3%
5 investiții • 1 reforme • 2.2% din total
```

### 2. Fiecare Investiție/Reformă (I1, I2, etc.)

```css
/* Container pentru valoare */
.investment-value {
  text-align: right;
  min-width: 150px;
}

/* Valoarea alocată - VERDE MARE */
.value-main {
  font-weight: 600;
  color: #10b981;      /* Verde deschis */
  font-size: 14px;
}

/* Valoarea executată - GRI MIC sub alocare */
.value-executed {
  font-size: 12px;
  color: #64748b;      /* Gri */
  margin-top: 4px;
  line-height: 1.4;
}

/* Label "Executat:" */
.executed-label {
  font-weight: 500;
  color: #475569;      /* Gri mai închis */
}

/* Procentul de execuție - ALBASTRU */
.execution-percent {
  color: #3b82f6;      /* Albastru */
  font-weight: 600;
}
```

**Rezultat vizual:**
```
244,84 mil EUR
Executat: 50,02 mil EUR • 20,4 %
```

### 3. Responsive Design

```css
/* Tablet (max-width: 960px) */
@media (max-width: 960px) {
  .component-value {
    font-size: 16px;
  }
  
  .component-executed {
    font-size: 12px;
  }
  
  .component-meta {
    font-size: 11px;
  }
}

/* Mobile (max-width: 768px) */
@media (max-width: 768px) {
  .component-value {
    font-size: 18px;
  }
  
  .investment-value {
    width: 100%;
    text-align: left;
  }
  
  .value-main {
    font-size: 16px;
  }
  
  .value-executed {
    font-size: 11px;
  }
}

/* Small mobile (max-width: 480px) */
@media (max-width: 480px) {
  .component-value {
    font-size: 16px;
  }
  
  .component-executed {
    font-size: 11px;
  }
  
  .value-main {
    font-size: 14px;
  }
}
```

---

## 🔗 Link-uri PNRR

### Mapping ID-uri

**Locație:** `src/components/ComponentsOverview.jsx`

```javascript
const PNRR_IDS = {
  'C1': {
    'I1': 2,
    'I2': 3,
    'I4': 5,
    'I5': 7,
    'I6': 8,
    'R2': 1
  },
  'C2': {
    'I1': 11,
    'I2': 12,
    'I3': 13,
    'I4': 16,
    'I5': 20,
    'R1': 10
  },
  // ... C3-C16
}
```

### Generare Link

```javascript
const getPNRRLink = (componentCode, measureCode) => {
  const componentIds = PNRR_IDS[componentCode]
  if (!componentIds) return null
  
  const id = componentIds[measureCode]
  if (!id) return null
  
  return `https://pnrr.fonduri-ue.ro/ords/pnrr/r/dashboard-status-pnrr/detalii-masura?masura=${id}`
}

// Exemplu:
// getPNRRLink('C1', 'I1') 
// → "https://pnrr.fonduri-ue.ro/ords/pnrr/r/dashboard-status-pnrr/detalii-masura?masura=2"
```

### Extragere Cod Măsură

```javascript
const extractMeasureCode = (description) => {
  const match = description.match(/^(I\d+(?:\.\d+)?(?:[a-z])?|R\d+(?:\.\d+)?(?:[a-z])?)/)
  return match ? match[1] : null
}

// Exemplu:
// extractMeasureCode("I1. Extinderea sistemelor...") → "I1"
// extractMeasureCode("I1.2 Dezvoltarea...") → "I1.2"
// extractMeasureCode("R2. Reconfigurarea...") → "R2"
```

### Afișare în UI

```jsx
{pnrrLink && (
  <a 
    href={pnrrLink} 
    target="_blank" 
    rel="noopener noreferrer"
    className="pnrr-link"
    title="Vezi detalii în PNRR Dashboard"
  >
    🔗
  </a>
)}
```

**CSS pentru link:**
```css
.pnrr-link {
  margin-left: 8px;
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.pnrr-link:hover {
  opacity: 1;
  text-decoration: underline;
}
```

---

## 📝 Exemplu Complet

### C1 - Managementul apei

**Date din JSON:**

| Măsură | Alocat (EUR) | Executat (EUR) | Procent |
|--------|-------------|----------------|---------|
| **I1** | 244,838,539 | 50,017,454 | 20,4 % |
| **I2** | 57,974,587 | 25,049,710 | 43,2 % |
| **I4** | 33,003,856 | 1,185,419 | 3,6 % |
| **I5** | 35,000,000 | 12,484,331 | 35,7 % |
| **I6** | 30,000,000 | 499,002 | 1,7 % |
| **R2** | 62,727,000 | 0 | 0,0 % |
| **TOTAL** | **463,543,982** | **89,235,916** | **19,3%** |

### Afișare în UI

**Header C1:**
```
┌─────────────────────────────────────────────────────────────┐
│ C1  Managementul apei                    463,55 mil EUR  [+]│
│     Executat: 89,24 mil EUR • 19.3%                         │
│     5 investiții • 1 reforme • 2.2% din total               │
└─────────────────────────────────────────────────────────────┘
```

**Detalii expandate:**
```
Investiții & reforme detaliate          [5 investiții] [1 reforme]

INVESTIȚII

I1. Extinderea sistemelor de apă... 🔗           244,84 mil EUR
                                          Executat: 50,02 mil EUR • 20,4 %

I2. Colectarea apelor uzate... 🔗                 57,98 mil EUR
                                          Executat: 25,05 mil EUR • 43,2 %

I4. Adaptarea la schimbările climatice... 🔗      33,01 mil EUR
                                          Executat: 1,10 mil EUR • 3,6 %

I5. Dotarea adecvată... 🔗                        35,00 mil EUR
                                          Executat: 12,49 mil EUR • 35,7 %

I6. Realizarea cadastrului apelor 🔗              30,00 mil EUR
                                          Executat: 0,50 mil EUR • 1,7 %

REFORME

R2. Reconfigurarea actualului mecanism... 🔗      62,73 mil EUR
                                          Executat: 0,00 mil EUR • 0,0 %
```

### Cod JSX

```jsx
<div className="component-accordion-item">
  <div className="component-accordion-header">
    <div className="component-main-info">
      <div className="component-code">C1</div>
      <div className="component-name">Managementul apei</div>
    </div>
    <div className="component-summary">
      <div className="component-value">463,55 mil EUR</div>
      <div className="component-executed">
        Executat: 89,24 mil EUR • 19.3%
      </div>
      <div className="component-meta">
        5 investiții • 1 reforme • 2.2% din total
      </div>
    </div>
  </div>
  
  <div className="component-accordion-content">
    <div className="section">
      <h5 className="section-title">Investiții</h5>
      <div className="investments-list">
        <div className="investment-item">
          <div className="investment-description">
            I1. Extinderea sistemelor...
            <a href="https://pnrr.fonduri-ue.ro/ords/pnrr/r/dashboard-status-pnrr/detalii-masura?masura=2" 
               target="_blank" 
               className="pnrr-link">
              🔗
            </a>
          </div>
          <div className="investment-value">
            <div className="value-main">244,84 mil EUR</div>
            <div className="value-executed">
              <span className="executed-label">Executat:</span> 50,02 mil EUR
              <span className="execution-percent"> • 20,4 %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🔄 Flux de Date

```
📄 comp.xlsx (Excel manual)
    ↓
🔄 parse-components-better.js
    ↓
📋 componentsData.json
    ↓
⚙️ processComponentsData.js
    ↓
📊 ComponentsOverview.jsx
    ↓
🎨 App.css (stiluri)
    ↓
🖥️ UI (Browser)
```

---

## 🔧 Actualizare Date

Pentru a actualiza valorile executate:

1. **Modifică** `comp.xlsx` cu date noi
2. **Rulează** script de conversie:
   ```bash
   node parse-components-better.js
   ```
3. **Verifică** `componentsData.json`
4. **Refresh** aplicația

---

## 📌 Note Importante

### Culori Utilizate

| Element | Culoare | Hex | Utilizare |
|---------|---------|-----|-----------|
| **Verde deschis** | 🟢 | `#10b981` | Valori alocate (măsuri) |
| **Verde închis** | 🟢 | `#059669` | Valori executate (total componentă) |
| **Gri** | ⚫ | `#64748b` | Valori executate (măsuri) |
| **Gri închis** | ⚫ | `#475569` | Label "Executat:" |
| **Albastru** | 🔵 | `#3b82f6` | Procente execuție |

### Toate Componentele PNRR

1. **C1** - Managementul apei
2. **C2** - Protejarea pădurilor și a biodiversității
3. **C3** - Managementul deșeurilor
4. **C4** - Transport sustenabil
5. **C5** - Valul Renovării
6. **C6** - Energie
7. **C7** - Transformare digitală
8. **C8** - Reforme fiscale și Rpensiilor
9. **C9** - Sprijin pentru mediul de afaceri și cercetare
10. **C10** - Fondul local
11. **C11** - Turism și cultura
12. **C12** - Sănătate
13. **C13** - Reforme sociale
14. **C14** - Buna guvernanță
15. **C15** - Educație
16. **C16** - RePOWER EU

---

**Versiune:** 1.0  
**Data:** Octombrie 2025  
**Autor:** PNRR Map Team
