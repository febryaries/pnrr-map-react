/**
 * SimpleMapNew - Hartă Highcharts România pentru Timeline
 * Cu date reale, click handler și abrevieri județe
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMap from 'highcharts/modules/map';
// County name to hc-key mapping
const COUNTY_TO_HC_KEY = {
  'BUCUREȘTI': 'ro-bi',
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
  'BISTRIȚA-NĂSĂUD': 'ro-bn',
  'MUREȘ': 'ro-ms',
  'BOTOȘANI': 'ro-bt',
  'ARGEȘ': 'ro-ag',
  'TULCEA': 'ro-tl'
};

// hc-key to county code mapping
const HC_KEY_TO_CODE = {
  'ro-bi': 'B',
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
  'ro-bn': 'BN',
  'ro-ms': 'MS',
  'ro-bt': 'BT',
  'ro-ag': 'AG',
  'ro-tl': 'TL'
};
import './SimpleMapNew.css';

// Initialize Highcharts Map
HighchartsMap(Highcharts);

// Normalize diacritics: Ş→Ș, Ţ→Ț (cedilă → virgulă jos)
function normalizeDiacritics(str) {
  if (!str) return str;
  return str
    .replace(/Ş/g, 'Ș')
    .replace(/ş/g, 'ș')
    .replace(/Ţ/g, 'Ț')
    .replace(/ţ/g, 'ț');
}

function SimpleMapNew({ currentData = null, isPlaying = false, onCountyClick }) {
  const [mapTopology, setMapTopology] = useState(null);
  const [highlightedCounties, setHighlightedCounties] = useState(new Set());
  const lastProcessedDate = useRef(null);
  const previousHighlightedRef = useRef(new Set());
  const chartRef = useRef(null);
  const navigate = useNavigate();

  // Load Romania map
  useEffect(() => {
    fetch('/ro-all.topo.json')
      .then(res => res.json())
      .then(topology => setMapTopology(topology))
      .catch(err => console.error('Error loading map:', err));
  }, []);

  // Expose county click handler globally for tooltip button
  useEffect(() => {
    window.handleCountyClick = onCountyClick;
    return () => {
      delete window.handleCountyClick;
    };
  }, [onCountyClick]);

  // Highlight counties with payments and apply pulse to counties that were already highlighted
  useEffect(() => {
    console.log('🗺️ SimpleMapNew: currentData changed', {
      hasData: !!currentData,
      countiesCount: currentData?.counties?.length,
      label: currentData?.label,
      totalEUR: currentData?.totalEUR
    });
    
    if (!currentData?.counties) {
      console.log('⚠️ No counties data, clearing highlights');
      setHighlightedCounties(new Set());
      previousHighlightedRef.current = new Set();
      lastProcessedDate.current = null;
      return;
    }

    // Skip if we already processed this date
    if (lastProcessedDate.current === currentData.date) {
      console.log('⏭️ Skipping - already processed:', currentData.date);
      return;
    }
    
    // Mark this date as processed
    lastProcessedDate.current = currentData.date;

    // Normal month - keep previous highlights and add new counties
    const previouslyHighlighted = previousHighlightedRef.current;
    const newHighlights = new Set();
    
    currentData.counties.forEach(county => {
      const normalizedName = normalizeDiacritics(county.name.toUpperCase());
      const hcKey = COUNTY_TO_HC_KEY[normalizedName];
      if (hcKey) {
        newHighlights.add(hcKey);
      }
    });
    
    setHighlightedCounties(newHighlights);
    previousHighlightedRef.current = newHighlights; // Update ref for next iteration
    
    console.log(`✨ Highlighting ${newHighlights.size} counties with payments:`, Array.from(newHighlights));
    console.log(`   - Previously highlighted: ${previouslyHighlighted.size}`);
  }, [currentData]);

  // Handle county click - navigate to homepage with county selection
  const handleCountyClick = useCallback((countyCode) => {
    // Navigate to homepage with state to trigger county selection
    navigate('/', { 
      state: { 
        openCounty: countyCode,
        switchToPayments: true 
      } 
    });
  }, [navigate]);

  // Expose click handler globally for Highcharts (like MapView does)
  useEffect(() => {
    window.handleTimelineCountyClick = handleCountyClick;
    return () => {
      delete window.handleTimelineCountyClick;
    };
  }, [handleCountyClick]);

  // Highcharts options
  const mapOptions = useMemo(() => {
    if (!mapTopology || !currentData?.counties) return null;

    // Build a map of county data by hc-key for quick lookup
    const countyDataMap = {};

    currentData.counties.forEach(county => {
      const normalizedName = normalizeDiacritics(county.name.toUpperCase());
      const hcKey = COUNTY_TO_HC_KEY[normalizedName];
      if (hcKey) {
        countyDataMap[hcKey] = {
          name: county.name,
          value: county.value || 0,
          totalEUR: county.value || 0,
          paymentsCount: county.payments || 0
        };
      } else {
        console.warn('⚠️ No hc-key found for county:', county.name, 'normalized:', normalizedName);
      }
    });
    
    // Create map data for ALL counties (like MFE does)
    // Counties without payments get value: 0 (NOT null) so they appear light blue
    // In Ianuarie animation, only show values for counties that have appeared (in highlightedCounties)
    const mapData = Object.entries(HC_KEY_TO_CODE).map(([hcKey, code]) => {
      const data = countyDataMap[hcKey];
      const isHighlighted = highlightedCounties.has(hcKey);
      
      return {
        'hc-key': hcKey,
        code: code,
        name: data?.name || code,
        value: data?.value || 0,
        totalEUR: data?.totalEUR || 0,
        paymentsCount: data?.paymentsCount || 0
      };
    });
    
    // Calculate gradient max value
    // For few counties (< 10): use SECOND highest value to make smallest visible
    // For many counties (>= 10): use P90 (percentila 90)
    const values = mapData
      .filter(d => d.value > 0)
      .map(d => d.value)
      .sort((a, b) => a - b);
    
    let p90Value;
    if (values.length < 10 && values.length >= 2) {
      // Use second highest value to make smallest counties visible
      p90Value = values[values.length - 2];
    } else if (values.length >= 10) {
      // Use P90 for many counties
      const p90Index = Math.floor(values.length * 0.9);
      p90Value = values[p90Index] || values[values.length - 1];
    } else {
      // Fallback for 0 or 1 county
      p90Value = values.length > 0 ? values[values.length - 1] : 1;
    }

    console.log(`📊 Creating mapOptions for ${currentData?.label}:`, {
      totalCounties: mapData.length,
      countiesWithPayments: values.length,
      p90Value: p90Value.toFixed(2),
      maxValue: values.length > 0 ? values[values.length - 1].toFixed(2) : 0
    });

    const options = {
      chart: {
        map: mapTopology,
        height: 600,
        backgroundColor: '#ffffff', // Fundal alb pentru contrast
        animation: false // Dezactivăm animația Highcharts (fade-in din colț)
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      mapNavigation: {
        enabled: false
      },
      colorAxis: {
        min: 0,
        max: p90Value, // P90 (percentila 90) to make smaller values visible
        stops: [
          [0, '#e0f2fe'],      // Lightest blue for 0
          [0.5, '#4299e1'],    // Medium blue
          [1, '#0056b3']       // Darkest blue for max
        ],
        labels: {
          enabled: false
        }
      },
      tooltip: {
        useHTML: true,
        outside: true,
        followPointer: true,
        stickOnContact: true,
        hideDelay: 2000,
        formatter: function() {
          const point = this.point;
          const millions = (point.totalEUR / 1000000).toFixed(2);
          const payments = point.paymentsCount || 0;
          
          // Format numbers with Romanian locale
          const fmtNum = (num) => num.toLocaleString('ro-RO');
          
          return `
            <strong>${point.name}</strong><br/>
            Valoare: <strong>${millions} mil EUR</strong><br/>
            Plăți: ${fmtNum(payments)}<br/>
            <div style="margin-top: 8px;">
              <button onclick="window.handleCountyClick('${point.code}', '${point.name}')" 
                      style="padding: 6px 10px; background: #0ea5e9; color: #fff; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Click pe județ pentru detalii
              </button>
            </div>
          `;
        }
      },
      plotOptions: {
        map: {
          allAreas: true,
          borderColor: '#64748b',
          borderWidth: 2,
          nullColor: '#f1f5f9' // Culoare pentru județe fără date
        }
      },
      series: [{
        data: mapData, // TOATE județele (inclusiv cu value: 0)
        name: 'România',
        joinBy: ['hc-key', 'hc-key'],
        animation: false, // Dezactivăm animația și pentru series
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
              // Use global handler (like MapView does)
              if (window.handleTimelineCountyClick) {
                window.handleTimelineCountyClick(this.code);
              }
            }
          }
        },
        cursor: 'pointer'
      }]
    };
    
    console.log(`✅ Returning mapOptions with ${options.series[0].data.length} total counties`);
    return options;
  }, [mapTopology, currentData, handleCountyClick, highlightedCounties]);

  if (!mapOptions) {
    return (
      <div className="simple-map-container">
        <div className="map-loading">Se încarcă harta...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      {mapOptions && (
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'mapChart'}
          options={mapOptions}
          ref={chartRef}
          key={currentData?.date || 'map'} // Force re-create when date changes
        />
      )}
    </div>
  );
}

export default SimpleMapNew;
