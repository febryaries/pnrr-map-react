#!/usr/bin/env python3
"""
Script pentru compararea diferențelor între JSON vechi și nou
"""

import json
import csv

# Citește JSON-ul actualizat
with open('/Users/teraki/Desktop/react-pnrr/src/data/alocariComponente.json', 'r', encoding='utf-8') as f:
    new_data = json.load(f)

# Citește CSV-ul original pentru comparație
old_csv_path = '/Users/teraki/Desktop/AlocariComponente.csv'
new_csv_path = '/Users/teraki/Desktop/AlocariComponenteNOU.csv'

def read_csv_to_dict(csv_path):
    """Citește CSV și returnează dict cu cheia (componenta, masura)"""
    data = {}
    try:
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                key = (row['Componenta'].strip(), row['Măsura'].strip())
                data[key] = row
    except FileNotFoundError:
        print(f"⚠️  Fișierul {csv_path} nu a fost găsit")
    return data

old_data = read_csv_to_dict(old_csv_path)
new_data_csv = read_csv_to_dict(new_csv_path)

print("=" * 80)
print("📊 ANALIZA DIFERENȚELOR - AlocariComponente.json")
print("=" * 80)

# Comparație
differences = []
new_measures = []
missing_measures = []

for key in new_data_csv:
    if key not in old_data:
        new_measures.append(key)
    else:
        old_row = old_data[key]
        new_row = new_data_csv[key]
        
        changes = []
        
        # Verifică finanțare
        if old_row['Finanțare'].strip().lower() != new_row['Finanțare'].strip().lower():
            changes.append({
                'field': 'Finanțare',
                'old': old_row['Finanțare'].strip(),
                'new': new_row['Finanțare'].strip()
            })
        
        # Verifică alocare
        old_alocare = old_row['Alocare Finaciară (euro Exclusiv Tva)'].strip()
        new_alocare = new_row['Alocare Finaciară (euro Exclusiv Tva)'].strip()
        if old_alocare != new_alocare and old_alocare != 'Fără costuri asociate' and new_alocare != 'Fără costuri asociate':
            changes.append({
                'field': 'Alocare',
                'old': old_alocare,
                'new': new_alocare
            })
        
        # Verifică executat
        old_exec = old_row['Executat (euro)'].strip()
        new_exec = new_row['Executat (euro)'].strip()
        if old_exec != new_exec:
            changes.append({
                'field': 'Executat',
                'old': old_exec,
                'new': new_exec
            })
        
        # Verifică procent
        old_proc = old_row['Executat (%)'].strip()
        new_proc = new_row['Executat (%)'].strip()
        if old_proc != new_proc:
            changes.append({
                'field': 'Procent',
                'old': old_proc,
                'new': new_proc
            })
        
        if changes:
            differences.append({
                'key': key,
                'title': new_row['Titlul măsurii'][:60] + '...',
                'changes': changes
            })

for key in old_data:
    if key not in new_data_csv:
        missing_measures.append(key)

# Afișează rezultatele
print(f"\n📈 STATISTICI:")
print(f"  - Măsuri în CSV vechi: {len(old_data)}")
print(f"  - Măsuri în CSV nou: {len(new_data_csv)}")
print(f"  - Măsuri noi adăugate: {len(new_measures)}")
print(f"  - Măsuri eliminate: {len(missing_measures)}")
print(f"  - Măsuri cu modificări: {len(differences)}")

if new_measures:
    print(f"\n✅ MĂSURI NOI ADĂUGATE ({len(new_measures)}):")
    for key in sorted(new_measures):
        row = new_data_csv[key]
        print(f"  - {key[0]}-{key[1]} ({row['Finanțare']}): {row['Titlul măsurii'][:60]}...")

if missing_measures:
    print(f"\n❌ MĂSURI ELIMINATE ({len(missing_measures)}):")
    for key in sorted(missing_measures):
        row = old_data[key]
        print(f"  - {key[0]}-{key[1]} ({row['Finanțare']}): {row['Titlul măsurii'][:60]}...")

if differences:
    print(f"\n🔄 MĂSURI MODIFICATE ({len(differences)}):")
    for diff in differences:
        key = diff['key']
        print(f"\n  📌 {key[0]}-{key[1]}: {diff['title']}")
        for change in diff['changes']:
            print(f"     • {change['field']}: {change['old']} → {change['new']}")

print("\n" + "=" * 80)
print("✅ Analiza completă!")
print("=" * 80)
