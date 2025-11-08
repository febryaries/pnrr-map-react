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
  'ARGEȘ': 'ro-ag'
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
  'ro-ag': 'AG'
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

function SimpleMapNew({ currentData = null, isPlaying = false, onCountyClick, onAnimationStateChange }) {
  const [mapTopology, setMapTopology] = useState(null);
  const [highlightedCounties, setHighlightedCounties] = useState(new Set());
  const [januaryAnimation, setJanuaryAnimation] = useState(false);
  const [newPaymentCounties, setNewPaymentCounties] = useState(new Set());
  const [februaryReady, setFebruaryReady] = useState(false);
  const animationInProgress = useRef(false);
  const lastProcessedDate = useRef(null);
  const previousHighlightedRef = useRef(new Set());
  const chartRef = useRef(null);
  const navigate = useNavigate();

  // Load Romania map
  useEffect(() => {
    fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
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
      setNewPaymentCounties(new Set());
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

    // Check if current month is Ianuarie (month 01)
    const currentMonth = currentData.date?.substring(5, 7); // Extract month from "2023-01"
    const isJanuary = currentMonth === '01';
    
    if (isJanuary) {
      // Skip if animation already in progress
      if (animationInProgress.current) {
        return;
      }
      
      // Ianuarie - animație fade-in random pentru județe
      const currentYear = currentData.date?.substring(0, 4);
      console.log(`🎊 Ianuarie ${currentYear} - Starting fade-in animation!`);
      animationInProgress.current = true;
      setJanuaryAnimation(true);
      setHighlightedCounties(new Set()); // Start with empty map
      previousHighlightedRef.current = new Set(); // Reset previous highlights for new year
      
      // Notify parent that animation started
      if (onAnimationStateChange) {
        onAnimationStateChange(true);
      }
      
      // Create shuffled array of counties
      const shuffled = [...currentData.counties].sort(() => Math.random() - 0.5);
      
      // Animate counties appearing one by one
      shuffled.forEach((county, index) => {
        setTimeout(() => {
          const normalizedName = normalizeDiacritics(county.name.toUpperCase());
          const hcKey = COUNTY_TO_HC_KEY[normalizedName];
          if (hcKey) {
            setHighlightedCounties(prev => new Set([...prev, hcKey]));
          }
        }, index * 300); // 300ms delay between each county
      });
      
      console.log(`✨ Animating ${shuffled.length} counties with fade-in effect`);
      
      // After animation completes, turn off animation mode and UPDATE previousHighlightedRef
      setTimeout(() => {
        setJanuaryAnimation(false);
        animationInProgress.current = false;
        
        // NOW update previousHighlightedRef with all counties that have payments
        const januaryHighlights = new Set();
        currentData.counties.forEach(county => {
          const normalizedName = normalizeDiacritics(county.name.toUpperCase());
          const hcKey = COUNTY_TO_HC_KEY[normalizedName];
          if (hcKey) {
            januaryHighlights.add(hcKey);
          }
        });
        previousHighlightedRef.current = januaryHighlights;
        console.log(`✅ Ianuarie finished! Updated previousHighlightedRef with ${januaryHighlights.size} counties`);
        
        setFebruaryReady(true); // Signal that February can now proceed
        
        // Notify parent that animation finished
        if (onAnimationStateChange) {
          onAnimationStateChange(false);
        }
      }, shuffled.length * 300);
      
      // IMPORTANT: NICIODATĂ pulse în Ianuarie
      setNewPaymentCounties(new Set());
      console.log(`📍 Ianuarie - no pulse effect for any counties`);
    } else {
      // Check if this is February after January (need to wait for January animation)
      const currentMonth = currentData.date?.substring(5, 7);
      const isFebruary = currentMonth === '02';
      
      // If February and previousHighlightedRef is empty (January hasn't finished), BLOCK processing
      if (isFebruary && previousHighlightedRef.current.size === 0) {
        console.log(`⏳ Februarie - BLOCKED! Waiting for Ianuarie to populate previousHighlightedRef...`);
        console.log(`   Current previousHighlightedRef size: ${previousHighlightedRef.current.size}`);
        // DO NOT process - wait for January to finish and update previousHighlightedRef
        return;
      }
      
      // Normal month - keep previous highlights and add new counties
      const previouslyHighlighted = previousHighlightedRef.current;
      const newHighlights = new Set();
      const countiesWithPulse = new Set();
      
      currentData.counties.forEach(county => {
        const normalizedName = normalizeDiacritics(county.name.toUpperCase());
        const hcKey = COUNTY_TO_HC_KEY[normalizedName];
        if (hcKey) {
          newHighlights.add(hcKey);
          
          // Pulse for ALL counties with payments in current month
          if (county.paymentsCount > 0) {
            countiesWithPulse.add(hcKey);
          }
        }
      });
      
      setHighlightedCounties(newHighlights);
      setNewPaymentCounties(countiesWithPulse);
      previousHighlightedRef.current = newHighlights; // Update ref for next iteration
      
      console.log(`✨ Highlighting ${newHighlights.size} counties with payments:`, Array.from(newHighlights));
      console.log(`💳 Counties with pulse effect (${countiesWithPulse.size}):`, Array.from(countiesWithPulse));
      console.log(`   - Previously highlighted: ${previouslyHighlighted.size}`);
    }
  }, [currentData, februaryReady]);

  // Apply pulse effect CSS class to counties with new payments
  useEffect(() => {
    if (!chartRef.current || !chartRef.current.chart) return;
    
    const chart = chartRef.current.chart;
    const series = chart.series[0];
    
    if (!series || !series.points) return;
    
    // Apply or remove pulse class based on newPaymentCounties
    series.points.forEach(point => {
      if (point.graphic && point.graphic.element) {
        const hcKey = point['hc-key'];
        if (newPaymentCounties.has(hcKey)) {
          point.graphic.element.classList.add('county-pulse-effect');
        } else {
          point.graphic.element.classList.remove('county-pulse-effect');
        }
      }
    });
  }, [newPaymentCounties, mapTopology, currentData]);

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
    if (!mapTopology) return null;

    // Build a map of county data by hc-key for quick lookup
    const countyDataMap = {};

    currentData.counties.forEach(county => {
      const normalizedName = normalizeDiacritics(county.name.toUpperCase());
      const hcKey = COUNTY_TO_HC_KEY[normalizedName];
      if (hcKey) {
        countyDataMap[hcKey] = {
          name: county.name,
          value: county.totalEUR || 0,
          totalEUR: county.totalEUR || 0,
          paymentsCount: county.paymentsCount || 0,
          beneficiariesCount: county.beneficiariesCount || 0
        };
      } else {
        console.warn('⚠️ No hc-key found for county:', county.name, 'normalized:', normalizedName);
      }
    });
    
    // Create map data for ALL counties (like MFE does)
    // Counties without payments get value: 0 (NOT null) so they appear light blue
    const mapData = Object.entries(HC_KEY_TO_CODE).map(([hcKey, code]) => {
      const data = countyDataMap[hcKey];
      const hasNewPayments = newPaymentCounties.has(hcKey);
      
      return {
        'hc-key': hcKey,
        code: code,
        name: data?.name || code,
        value: data?.value || 0, // 0 = light blue, NOT grey!
        totalEUR: data?.totalEUR || 0,
        paymentsCount: data?.paymentsCount || 0,
        beneficiariesCount: data?.beneficiariesCount || 0,
        hasNewPayments: hasNewPayments
      };
    });
    
    // Calculate P90 (percentila 90) for max value (like MFE does)
    // This makes the gradient more visible by capping at 90th percentile
    const values = mapData
      .filter(d => d.value > 0)
      .map(d => d.value)
      .sort((a, b) => a - b);
    const p90Index = Math.floor(values.length * 0.9);
    const p90Value = values.length > 0 ? (values[p90Index] || values[values.length - 1]) : 1;

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
        max: p90Value, // P90 (percentila 90) ca MFE
        stops: [
          [0, '#f0f9ff'],      // Very light blue
          [0.3, '#bae6fd'],    // Light blue
          [0.6, '#38bdf8'],    // Medium blue
          [1, '#0284c7']       // Dark blue
        ]
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
          const beneficiaries = point.beneficiariesCount || 0;
          
          // Format numbers with Romanian locale
          const fmtNum = (num) => num.toLocaleString('ro-RO');
          
          return `
            <strong>${point.name}</strong><br/>
            Valoare: <strong>${millions} mil EUR</strong><br/>
            Proiecte: ${fmtNum(payments)}<br/>
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
  }, [mapTopology, currentData, handleCountyClick]); // NU includem highlightedCounties sau newPaymentCounties pentru a evita re-render

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
