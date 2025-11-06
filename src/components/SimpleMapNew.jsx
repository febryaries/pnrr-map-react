/**
 * SimpleMapNew - Hartă Highcharts România pentru Timeline
 * Cu date reale, click handler și abrevieri județe
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMap from 'highcharts/modules/map';
// County name to hc-key mapping
const COUNTY_TO_HC_KEY = {
  'BUCUREȘTI': 'ro-b',
  'CLUJ': 'ro-cj',
  'TIMIȘ': 'ro-tm',
  'CONSTANȚA': 'ro-ct',
  'IAȘI': 'ro-is',
  'BRAȘOV': 'ro-bv',
  'SIBIU': 'ro-sb',
  'GORJ': 'ro-gj',
  'DOLJ': 'ro-dj',
  'PRAHOVA': 'ro-ph',
  'BACĂU': 'ro-bc',
  'GALAȚI': 'ro-gl',
  'VASLUI': 'ro-vs',
  'BOTOȘANI': 'ro-bt',
  'SUCEAVA': 'ro-sv',
  'ALBA': 'ro-ab',
  'ARAD': 'ro-ar',
  'ARGEȘ': 'ro-ag',
  'BRĂILA': 'ro-br',
  'BUZĂU': 'ro-bz',
  'CARAȘ-SEVERIN': 'ro-cs',
  'CĂLĂRAȘI': 'ro-cl',
  'COVASNA': 'ro-cv',
  'DÂMBOVIȚA': 'ro-db',
  'GIURGIU': 'ro-gr',
  'HUNEDOARA': 'ro-hd',
  'HARGHITA': 'ro-hr',
  'IALOMIȚA': 'ro-il',
  'MEHEDINȚI': 'ro-mh',
  'MUREȘ': 'ro-ms',
  'NEAMȚ': 'ro-nt',
  'OLT': 'ro-ot',
  'SĂLAJ': 'ro-sj',
  'SATU MARE': 'ro-sm',
  'TELEORMAN': 'ro-tr',
  'VÂLCEA': 'ro-vl',
  'VRANCEA': 'ro-vn',
  'ILFOV': 'ro-if',
  'MARAMUREȘ': 'ro-mm',
  'BIHOR': 'ro-bh',
  'BISTRIȚA-NĂSĂUD': 'ro-bn'
};

// hc-key to county code mapping
const HC_KEY_TO_CODE = {
  'ro-b': 'B',
  'ro-cj': 'CJ',
  'ro-tm': 'TM',
  'ro-ct': 'CT',
  'ro-is': 'IS',
  'ro-bv': 'BV',
  'ro-sb': 'SB',
  'ro-gj': 'GJ',
  'ro-dj': 'DJ',
  'ro-ph': 'PH',
  'ro-bc': 'BC',
  'ro-gl': 'GL',
  'ro-vs': 'VS',
  'ro-bt': 'BT',
  'ro-sv': 'SV',
  'ro-ab': 'AB',
  'ro-ar': 'AR',
  'ro-ag': 'AG',
  'ro-br': 'BR',
  'ro-bz': 'BZ',
  'ro-cs': 'CS',
  'ro-cl': 'CL',
  'ro-cv': 'CV',
  'ro-db': 'DB',
  'ro-gr': 'GR',
  'ro-hd': 'HD',
  'ro-hr': 'HR',
  'ro-il': 'IL',
  'ro-mh': 'MH',
  'ro-ms': 'MS',
  'ro-nt': 'NT',
  'ro-ot': 'OT',
  'ro-sj': 'SJ',
  'ro-sm': 'SM',
  'ro-tr': 'TR',
  'ro-vl': 'VL',
  'ro-vn': 'VN',
  'ro-if': 'IF',
  'ro-mm': 'MM',
  'ro-bh': 'BH',
  'ro-bn': 'BN'
};
import './SimpleMapNew.css';

// Initialize Highcharts Map
HighchartsMap(Highcharts);

// Coduri județe România pentru animație
const COUNTY_CODES = [
  'ro-b', 'ro-cj', 'ro-tm', 'ro-ct', 'ro-is', 'ro-bv', 
  'ro-sb', 'ro-gj', 'ro-dj', 'ro-ph', 'ro-bc', 'ro-gl',
  'ro-vs', 'ro-bt', 'ro-sv', 'ro-ab', 'ro-ar', 'ro-ag',
  'ro-br', 'ro-bz', 'ro-cs', 'ro-cl', 'ro-cv', 'ro-db',
  'ro-gr', 'ro-hd', 'ro-hr', 'ro-il', 'ro-mh', 'ro-ms',
  'ro-nt', 'ro-ot', 'ro-sj', 'ro-sm', 'ro-tr', 'ro-vl',
  'ro-vn', 'ro-if', 'ro-mm', 'ro-bh', 'ro-mh', 'ro-cj'
];

function SimpleMapNew({ currentData = null, isPlaying = false }) {
  const [mapTopology, setMapTopology] = useState(null);
  const [highlightedCounties, setHighlightedCounties] = useState(new Set());
  const navigate = useNavigate();

  // Load Romania map
  useEffect(() => {
    fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
      .then(res => res.json())
      .then(topology => setMapTopology(topology))
      .catch(err => console.error('Error loading map:', err));
  }, []);

  // Random county highlight animation when playing
  useEffect(() => {
    if (!isPlaying) {
      setHighlightedCounties(new Set());
      return;
    }

    const allHcKeys = Object.keys(HC_KEY_TO_CODE);
    
    const interval = setInterval(() => {
      // Randomly select 2-3 counties to highlight
      const numToHighlight = Math.floor(Math.random() * 2) + 2;
      const highlighted = new Set();
      
      for (let i = 0; i < numToHighlight; i++) {
        const randomKey = allHcKeys[Math.floor(Math.random() * allHcKeys.length)];
        highlighted.add(randomKey);
      }
      
      setHighlightedCounties(highlighted);
    }, 1200); // Change every 1.2 seconds for slower, more visible effect

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle county click
  const handleCountyClick = useCallback((countyCode) => {
    console.log('County clicked:', countyCode);
    // Navigate to homepage with county selected
    navigate(`/?county=${countyCode}`);
  }, [navigate]);

  // Highcharts options
  const mapOptions = useMemo(() => {
    if (!mapTopology) return null;

    // Process real data from Timeline
    const counties = currentData?.counties || [];
    const maxValue = Math.max(...counties.map(c => c.totalEUR), 1);
    
    // Map county data to hc-keys
    const countyDataMap = {};
    counties.forEach(county => {
      if (!county || !county.name) return;
      
      const hcKey = COUNTY_TO_HC_KEY[county.name.toUpperCase()];
      if (hcKey) {
        countyDataMap[hcKey] = {
          value: county.totalEUR || 0,
          name: county.name,
          code: HC_KEY_TO_CODE[hcKey],
          totalEUR: county.totalEUR || 0,
          paymentsCount: county.paymentsCount || 0,
          beneficiariesCount: county.beneficiariesCount || 0
        };
      }
    });

    // Create map data for all counties
    const mapData = Object.entries(HC_KEY_TO_CODE).map(([hcKey, code]) => {
      const data = countyDataMap[hcKey] || {};
      const isHighlighted = highlightedCounties.has(hcKey);
      
      return {
        'hc-key': hcKey,
        code: code,
        name: data.name || code,
        value: data.value || 0,
        totalEUR: data.totalEUR || 0,
        paymentsCount: data.paymentsCount || 0,
        beneficiariesCount: data.beneficiariesCount || 0,
        // Override color for highlighted counties
        color: isHighlighted ? '#3b82f6' : undefined,
        borderColor: isHighlighted ? '#1d4ed8' : undefined,
        borderWidth: isHighlighted ? 3 : undefined
      };
    });

    return {
      chart: {
        map: mapTopology,
        height: 600,
        backgroundColor: '#ffffff' // Fundal alb pentru contrast
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      mapNavigation: {
        enabled: false
      },
      colorAxis: {
        min: 0,
        max: maxValue,
        minColor: '#e0f2fe',
        maxColor: '#0ea5e9',
        stops: [
          [0, '#f0f9ff'],
          [0.3, '#bae6fd'],
          [0.6, '#38bdf8'],
          [1, '#0284c7']
        ]
      },
      tooltip: {
        enabled: true,
        useHTML: true,
        formatter: function() {
          const millions = (this.point.totalEUR / 1000000).toFixed(2);
          const payments = this.point.paymentsCount || 0;
          const beneficiaries = this.point.beneficiariesCount || 0;
          
          console.log('Tooltip data:', {
            name: this.point.name,
            totalEUR: this.point.totalEUR,
            paymentsCount: payments,
            beneficiariesCount: beneficiaries
          });
          
          return `
            <div style="padding: 8px; min-width: 200px;">
              <strong style="font-size: 14px;">${this.point.name}</strong><br/>
              <span style="color: #0ea5e9;">💰 ${millions} mil EUR</span><br/>
              <span style="color: #64748b;">💳 ${payments.toLocaleString('ro-RO')} plăți</span><br/>
              <span style="color: #64748b;">👥 ${beneficiaries.toLocaleString('ro-RO')} beneficiari</span><br/>
              <em style="font-size: 11px; color: #94a3b8;">Click pentru detalii</em>
            </div>
          `;
        }
      },
      plotOptions: {
        map: {
          allAreas: true,
          joinBy: ['hc-key'],
          borderColor: '#64748b',
          borderWidth: 2,
          nullColor: '#f1f5f9' // Culoare pentru județe fără date
        }
      },
      series: [{
        data: mapData,
        name: 'România',
        states: {
          hover: {
            color: '#38bdf8',
            borderColor: '#0ea5e9',
            borderWidth: 3
          }
        },
        dataLabels: {
          enabled: true,
          format: '{point.code}',
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#1e293b',
            textOutline: '2px white'
          }
        },
        point: {
          events: {
            click: function() {
              handleCountyClick(this.code);
            }
          }
        },
        cursor: 'pointer'
      }]
    };
  }, [mapTopology, currentData, handleCountyClick, highlightedCounties]);

  if (!mapOptions) {
    return (
      <div className="simple-map-container">
        <div className="map-loading">Se încarcă harta...</div>
      </div>
    );
  }

  return (
    <div className="simple-map-container">
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'mapChart'}
        options={mapOptions}
      />
    </div>
  );
}

export default SimpleMapNew;
