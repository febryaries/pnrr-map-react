# Scripts pentru PNRR Map React

## update_json_from_csv.py

Script Python pentru actualizarea fișierului `alocariComponente.json` cu date din CSV.

### Utilizare

```bash
python3 scripts/update_json_from_csv.py
```

### Ce face scriptul

1. **Citește CSV-ul** de la `/Users/teraki/Desktop/AlocariComponente.csv`
2. **Procesează datele**:
   - Convertește valorile financiare din format românesc (cu punct ca separator de mii și virgulă ca separator zecimal)
   - Convertește procentele în valori numerice
   - Gestionează cazurile speciale ("Fără costuri asociate")
3. **Generează JSON-ul** în formatul corect pentru aplicație
4. **Salvează** în `src/data/alocariComponente.json`

### Structura JSON generată

```json
{
  "components": [
    {
      "componenta": "C1",
      "numeComponenta": "Managementul apei",
      "masuri": [
        {
          "masura": "I1",
          "finantare": "loan",
          "titlul_masurii": "...",
          "alocare_financiara_euro": 244838539,
          "executat_euro": 51194398,
          "executat_procent": 20.91
        }
      ]
    }
  ]
}
```

### Cerințe

- Python 3.x
- Modulele standard: `csv`, `json`, `collections`

### Note

- CSV-ul trebuie să fie în format UTF-8 cu BOM
- Separatorul trebuie să fie `;` (punct și virgulă)
- Coloanele așteptate:
  - Componenta
  - Măsura
  - Finanțare
  - Titlul măsurii
  - Alocare Finaciară (euro Exclusiv Tva)
  - Executat (euro)
  - Executat (%)

### Rezultat

```
✅ JSON actualizat cu succes!
📊 Total componente: 16
📝 Total măsuri: 184
```
