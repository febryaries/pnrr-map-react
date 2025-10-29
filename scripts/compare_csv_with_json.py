#!/usr/bin/env python3
"""
Script pentru compararea CSV-ului de pe desktop cu JSON-ul actual
"""

import csv
import json
from collections import defaultdict

# Paths
csv_path = '/Users/teraki/Desktop/AlocariComponente.csv'
json_path = '/Users/teraki/Desktop/react-pnrr/src/data/alocariComponente.json'

def parse_number(value_str):
    """Convertește string în număr, gestionând formatele românești"""
    if not value_str or value_str.strip() == '' or value_str == 'Fără costuri asociate':
        return 0
    
    # Înlocuiește punctele (separatori de mii) și virgula (separator zecimal)
    value_str = value_str.replace('.', '').replace(',', '.')
    
    try:
        return float(value_str)
    except ValueError:
        return 0

def parse_percentage(value_str):
    """Convertește string procent în număr"""
    if not value_str or value_str.strip() == '':
        return 0
    
    # Elimină simbolul % și convertește
    value_str = value_str.replace('%', '').replace(',', '.')
    
    try:
        return float(value_str)
    except ValueError:
        return 0

# Citește CSV-ul
csv_data = {}
with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=';')
    
    for row in reader:
        componenta = row['Componenta'].strip()
        if not componenta:
            continue
            
        masura = row['Măsura'].strip()
        finantare = row['Finanțare'].strip().lower()
        
        key = f"{componenta}-{masura}-{finantare}"
        
        csv_data[key] = {
            'componenta': componenta,
            'masura': masura,
            'finantare': finantare,
            'titlul': row['Titlul măsurii'].strip(),
            'alocare': int(parse_number(row['Alocare Finaciară (euro Exclusiv Tva)'])),
            'executat': int(parse_number(row['Executat (euro)'])),
            'procent': round(parse_percentage(row['Executat (%)']), 2)
        }

# Citește JSON-ul
with open(json_path, 'r', encoding='utf-8') as jsonfile:
    json_obj = json.load(jsonfile)

json_data = {}
for component in json_obj['components']:
    for masura in component['masuri']:
        key = f"{component['componenta']}-{masura['masura']}-{masura['finantare']}"
        json_data[key] = {
            'componenta': component['componenta'],
            'masura': masura['masura'],
            'finantare': masura['finantare'],
            'titlul': masura['titlul_masurii'],
            'alocare': masura['alocare_financiara_euro'],
            'executat': masura['executat_euro'],
            'procent': masura['executat_procent']
        }

# Comparație
print("=" * 100)
print("📊 COMPARAȚIE CSV (Desktop) vs JSON (Actual)")
print("=" * 100)

# Statistici
print(f"\n📈 Statistici:")
print(f"   CSV măsuri: {len(csv_data)}")
print(f"   JSON măsuri: {len(json_data)}")

# Măsuri noi în CSV
new_in_csv = set(csv_data.keys()) - set(json_data.keys())
if new_in_csv:
    print(f"\n✨ Măsuri NOI în CSV ({len(new_in_csv)}):")
    for key in sorted(new_in_csv):
        data = csv_data[key]
        print(f"   • {key}: {data['titlul'][:60]}...")

# Măsuri lipsă din CSV
missing_in_csv = set(json_data.keys()) - set(csv_data.keys())
if missing_in_csv:
    print(f"\n⚠️  Măsuri LIPSĂ din CSV ({len(missing_in_csv)}):")
    for key in sorted(missing_in_csv):
        data = json_data[key]
        print(f"   • {key}: {data['titlul'][:60]}...")

# Diferențe în valori
differences = []
for key in set(csv_data.keys()) & set(json_data.keys()):
    csv_item = csv_data[key]
    json_item = json_data[key]
    
    diff = {}
    
    if csv_item['alocare'] != json_item['alocare']:
        diff['alocare'] = (json_item['alocare'], csv_item['alocare'])
    
    if csv_item['executat'] != json_item['executat']:
        diff['executat'] = (json_item['executat'], csv_item['executat'])
    
    if abs(csv_item['procent'] - json_item['procent']) > 0.01:
        diff['procent'] = (json_item['procent'], csv_item['procent'])
    
    if diff:
        differences.append((key, diff))

if differences:
    print(f"\n🔄 DIFERENȚE în valori ({len(differences)} măsuri):")
    print("=" * 100)
    
    major_diffs = []
    minor_diffs = []
    
    for key, diff in differences:
        csv_item = csv_data[key]
        
        # Calculează diferența în executat
        if 'executat' in diff:
            delta = diff['executat'][1] - diff['executat'][0]
            if abs(delta) > 1_000_000:  # > 1M EUR
                major_diffs.append((key, diff, delta))
            else:
                minor_diffs.append((key, diff, delta))
        else:
            minor_diffs.append((key, diff, 0))
    
    if major_diffs:
        print(f"\n🔴 DIFERENȚE MAJORE (>{1_000_000:,} EUR):")
        for key, diff, delta in sorted(major_diffs, key=lambda x: abs(x[2]), reverse=True):
            csv_item = csv_data[key]
            print(f"\n   {key}")
            print(f"   Titlu: {csv_item['titlul'][:70]}")
            if 'alocare' in diff:
                print(f"   Alocare:  {diff['alocare'][0]:>15,} → {diff['alocare'][1]:>15,} EUR")
            if 'executat' in diff:
                print(f"   Executat: {diff['executat'][0]:>15,} → {diff['executat'][1]:>15,} EUR (Δ {delta:+,} EUR)")
            if 'procent' in diff:
                print(f"   Procent:  {diff['procent'][0]:>15.2f} → {diff['procent'][1]:>15.2f}%")
    
    if minor_diffs:
        print(f"\n🟡 Diferențe minore (<{1_000_000:,} EUR): {len(minor_diffs)} măsuri")

else:
    print("\n✅ Nu există diferențe în valori!")

print("\n" + "=" * 100)
print("✅ Analiză completă!")
print("=" * 100)
