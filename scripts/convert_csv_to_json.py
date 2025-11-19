#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pentru conversia AlocariComponente_2025.csv în format JSON
compatibil cu alocariComponente.json
"""

import csv
import json
import re
from decimal import Decimal

def parse_euro_value(value_str):
    """
    Convertește valori în format românesc (ex: '244.838.539') în float
    """
    if not value_str or value_str.strip() == '' or value_str.strip() == '-':
        return 0
    
    # Elimină spații și caractere non-numerice (păstrează doar cifre, punct, virgulă, minus)
    cleaned = value_str.strip().replace(' ', '').replace('\xa0', '')
    
    # Elimină punctele care sunt separatori de mii
    cleaned = cleaned.replace('.', '')
    
    # Înlocuiește virgula cu punct pentru zecimale
    cleaned = cleaned.replace(',', '.')
    
    try:
        return float(cleaned)
    except ValueError:
        print(f"⚠️  Nu pot converti '{value_str}' în număr, returnez 0")
        return 0

def parse_percent(percent_str):
    """
    Convertește procent din format românesc (ex: '20,91%') în float
    """
    if not percent_str or percent_str.strip() == '' or percent_str.strip() == '-':
        return 0
    
    # Elimină '%' și spații
    cleaned = percent_str.strip().replace('%', '').replace(' ', '').replace('\xa0', '')
    
    # Înlocuiește virgula cu punct
    cleaned = cleaned.replace(',', '.')
    
    try:
        return float(cleaned)
    except ValueError:
        print(f"⚠️  Nu pot converti '{percent_str}' în procent, returnez 0")
        return 0

def clean_text(text):
    """
    Curăță textul de caractere speciale și spații multiple
    """
    if not text:
        return ""
    
    # Elimină spații multiple și newlines
    cleaned = re.sub(r'\s+', ' ', text.strip())
    
    # Elimină ghilimele duble de la început și sfârșit
    cleaned = cleaned.strip('"')
    
    return cleaned

def main():
    csv_path = '/Users/teraki/Desktop/AlocariComponente_2025.csv'
    json_output_path = '/Users/teraki/Desktop/react-pnrr/src/data/alocariComponente_2025.json'
    
    print("🔄 Citesc CSV-ul...")
    
    # Dicționar pentru a grupa măsurile pe componente
    components_dict = {}
    
    with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
        delimiter = ';'
        reader = csv.DictReader(csvfile, delimiter=delimiter)
        
        row_count = 0
        for row in reader:
            row_count += 1
            
            # Extrage datele din rând
            componenta = row.get('Componenta', '').strip()
            masura = row.get('Măsura', '').strip()
            finantare = row.get('Finanțare', '').strip().lower()
            titlu = clean_text(row.get('Titlul măsurii', ''))
            alocare_str = row.get('Alocare Finaciară (euro Exclusiv Tva)', '').strip()
            executat_str = row.get(' Executat (euro) ', '').strip()
            executat_procent_str = row.get('Executat (%)', '').strip()
            
            # Skip rânduri goale
            if not componenta or not masura:
                continue
            
            # Verifică dacă este "Fără costuri asociate"
            is_zero_cost = 'fără costuri' in alocare_str.lower() or 'fara costuri' in alocare_str.lower()
            
            # Parse valori
            alocare = 0 if is_zero_cost else parse_euro_value(alocare_str)
            executat = 0 if is_zero_cost else parse_euro_value(executat_str)
            executat_procent = parse_percent(executat_procent_str)
            
            # Creează obiectul măsură
            masura_obj = {
                "masura": masura,
                "finantare": finantare if finantare in ['loan', 'grant'] else 'grant',
                "titlul_masurii": titlu,
                "alocare_financiara_euro": int(alocare),
                "executat_euro": int(executat),
                "executat_procent": round(executat_procent, 2)
            }
            
            # Adaugă în dicționar
            if componenta not in components_dict:
                components_dict[componenta] = {
                    "componenta": componenta,
                    "masuri": []
                }
            
            components_dict[componenta]["masuri"].append(masura_obj)
            
            print(f"✅ {componenta} - {masura}: {alocare:,.0f} EUR")
    
    print(f"\n📊 Total rânduri procesate: {row_count}")
    print(f"📊 Total componente: {len(components_dict)}")
    
    # Sortează componentele (C1, C2, ..., C16)
    sorted_components = sorted(
        components_dict.values(),
        key=lambda x: int(x['componenta'].replace('C', ''))
    )
    
    # Sortează măsurile în fiecare componentă (I1, I2, R1, R2)
    for component in sorted_components:
        component['masuri'].sort(key=lambda m: (
            0 if m['masura'].startswith('I') else 1,  # Investiții înainte de reforme
            int(re.findall(r'\d+', m['masura'])[0]) if re.findall(r'\d+', m['masura']) else 999
        ))
    
    # Creează structura finală
    output_data = {
        "components": sorted_components
    }
    
    # Scrie JSON
    print(f"\n💾 Scriu JSON în {json_output_path}...")
    with open(json_output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(output_data, jsonfile, ensure_ascii=False, indent=2)
    
    print("✅ Conversie completă!")
    print(f"\n📁 Fișier generat: {json_output_path}")
    
    # Afișează statistici
    total_alocare = sum(
        sum(m['alocare_financiara_euro'] for m in c['masuri'])
        for c in sorted_components
    )
    total_executat = sum(
        sum(m['executat_euro'] for m in c['masuri'])
        for c in sorted_components
    )
    
    print(f"\n📈 Statistici:")
    print(f"   Total alocare: {total_alocare:,.0f} EUR")
    print(f"   Total executat: {total_executat:,.0f} EUR")
    if total_alocare > 0:
        print(f"   Procent executat: {(total_executat / total_alocare * 100):.2f}%")
    else:
        print(f"   Procent executat: 0%")

if __name__ == '__main__':
    main()
