#!/usr/bin/env python3
"""
Script pentru actualizarea alocariComponente.json cu date din CSV
"""

import csv
import json
from collections import defaultdict

# Citește CSV-ul
csv_path = '/Users/teraki/Desktop/react-pnrr/src/data/AlocariComponente.csv'
json_output_path = '/Users/teraki/Desktop/react-pnrr/src/data/alocariComponente.json'

# Mapare nume componente
COMPONENT_NAMES = {
    'C1': 'Managementul apei',
    'C2': 'Protejarea pădurilor și a biodiversității',
    'C3': 'Managementul deșeurilor',
    'C4': 'Transport sustenabil',
    'C5': 'Valul Renovării',
    'C6': 'Energie',
    'C7': 'Transformare digitală',
    'C8': 'Reforme fiscale și pensiilor',
    'C9': 'Sprijin pentru mediul de afaceri și cercetare',
    'C10': 'Fondul local',
    'C11': 'Turism și cultura',
    'C12': 'Sănătate',
    'C13': 'Reforme sociale',
    'C14': 'Buna guvernanță',
    'C15': 'Educație',
    'C16': 'RePOWER EU'
}

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

# Citește CSV-ul și grupează pe componente
components_data = defaultdict(list)

with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=';')
    
    for row in reader:
        componenta = row['Componenta'].strip()
        if not componenta:  # Skip empty rows
            continue
            
        masura = row['Măsura'].strip()
        finantare = row['Finanțare'].strip().lower()
        titlul = row['Titlul măsurii'].strip()
        alocare = parse_number(row['Alocare Finaciară (euro Exclusiv Tva)'])
        executat = parse_number(row['Executat (euro)'])
        executat_procent = parse_percentage(row['Executat (%)'])
        
        masura_obj = {
            'masura': masura,
            'finantare': finantare,
            'titlul_masurii': titlul,
            'alocare_financiara_euro': int(alocare),
            'executat_euro': int(executat),
            'executat_procent': round(executat_procent, 2)
        }
        
        components_data[componenta].append(masura_obj)

# Construiește structura JSON finală
json_structure = {
    'components': []
}

# Sortează componentele (C1, C2, ..., C16)
sorted_components = sorted(components_data.keys(), key=lambda x: int(x[1:]))

for comp_code in sorted_components:
    component = {
        'componenta': comp_code,
        'numeComponenta': COMPONENT_NAMES.get(comp_code, f'Componenta {comp_code}'),
        'masuri': components_data[comp_code]
    }
    json_structure['components'].append(component)

# Scrie JSON-ul
with open(json_output_path, 'w', encoding='utf-8') as jsonfile:
    json.dump(json_structure, jsonfile, ensure_ascii=False, indent=2)

print(f'✅ JSON actualizat cu succes!')
print(f'📊 Total componente: {len(json_structure["components"])}')
print(f'📝 Total măsuri: {sum(len(c["masuri"]) for c in json_structure["components"])}')
