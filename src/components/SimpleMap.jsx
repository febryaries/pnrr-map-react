/**
 * SimpleMap Component
 * 
 * Simplified map component for timeline view - just the Highcharts map without header/filters
 */

import { useMemo, useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMap from 'highcharts/modules/map';

// Initialize Highcharts Map module
HighchartsMap(Highcharts);

function SimpleMap({ data = [], isLoading = false, isPlaying = false }) {
  const [mapTopology, setMapTopology] = useState(null);
  const [highlightedCounties, setHighlightedCounties] = useState([]);
  const [currentZoomCounty, setCurrentZoomCounty] = useState(null);

  // Load Romania map topology
  useEffect(() => {
    const loadMapData = async () => {
      try {
        const response = await fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json');
        if (!response.ok) {
          console.warn('Could not load Romania map data:', response.statusText);
          return;
        }
        const topology = await response.json();
        setMapTopology(topology);
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    loadMapData();
  }, []);

  // Evidențiere simplă - doar județul cu valoarea maximă
  useEffect(() => {
    if (!data || data.length === 0) {
      setHighlightedCounties([]);
      setCurrentZoomCounty(null);
      return;
    }

    // Găsește județul cu cea mai mare valoare
    const topCounty = [...data]
      .filter(c => c.total?.value > 0)
      .sort((a, b) => (b.total?.value || 0) - (a.total?.value || 0))[0];

    if (topCounty) {
      setHighlightedCounties([{
        code: topCounty.county?.code,
        name: topCounty.county?.name,
        change: topCounty.total?.value || 0
      }]);
      setCurrentZoomCounty(topCounty.county?.code);
    }
  }, [data]);
  // Prepare map data
  const mapData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(county => {
      const countyCode = county.county?.code;
      const value = county.total?.value || 0;
      const highlightInfo = highlightedCounties.find(h => h.code === countyCode);
      const isHighlighted = !!highlightInfo;
      
      // Convert county code to Highcharts format (ro-XX)
      const hcKey = `ro-${countyCode?.toLowerCase()}`;
      
      // Gradient culori bazat pe mărimea schimbării
      let highlightColor = undefined;
      let borderColor = '#94a3b8';
      let borderWidth = 1;
      
      if (isHighlighted && highlightInfo) {
        // ZOOM EFFECT: Culoare intensă și border foarte gros pentru efect "spargere" județ
        const isCurrentZoom = countyCode === currentZoomCounty;
        
        if (isCurrentZoom) {
          // Județul curent în zoom - EFECT MAXIM "SPARGE" JUDEȚUL!
          highlightColor = '#fbbf24'; // Galben auriu intens
          borderColor = '#ef4444';    // Roșu aprins
          borderWidth = 12;           // Border FOARTE gros pentru efect dramatic
        } else {
          // Alte județe - normale
          highlightColor = undefined;
          borderColor = '#94a3b8';
          borderWidth = 1;
        }
      }
      
      return {
        'hc-key': hcKey,
        value: value,
        name: county.county?.name || countyCode,
        code: countyCode,
        // Special styling for highlighted counties
        color: highlightColor,
        borderColor: borderColor,
        borderWidth: borderWidth
      };
    });
  }, [data, highlightedCounties]);

  // Highcharts map options
  const mapOptions = useMemo(() => {
    if (!mapTopology) return null;

    return {
      chart: {
        map: mapTopology,
        height: 600,
        backgroundColor: 'transparent'
      },
    title: {
      text: null
    },
    credits: {
      enabled: false
    },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'bottom'
      }
    },
    colorAxis: {
      min: 0,
      minColor: '#e0f2fe',
      maxColor: '#0ea5e9',
      labels: {
        format: '{value:.0f}'
      }
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      title: {
        text: 'Valoare (EUR)',
        style: {
          fontSize: '12px',
          fontWeight: '600'
        }
      }
    },
    tooltip: {
      useHTML: true,
      headerFormat: '',
      formatter: function() {
        const highlightInfo = highlightedCounties.find(h => h.code === this.point.code);
        const changeMil = highlightInfo ? (highlightInfo.change / 1000000).toFixed(2) : null;
        
        let tooltip = `<b>${this.point.name}</b><br/>`;
        tooltip += `Valoare: ${(this.point.value / 1000000).toFixed(2)} mil EUR`;
        
        if (changeMil && parseFloat(changeMil) > 0) {
          tooltip += `<br/><span style="color: #10b981; font-weight: bold;">↑ +${changeMil} mil EUR</span>`;
        }
        
        return tooltip;
      },
      style: {
        fontSize: '13px'
      }
    },
    series: [{
      data: mapData,
      name: 'Valoare',
      animation: {
        duration: 1000,
        easing: 'easeOutBounce'
      },
      states: {
        hover: {
          color: '#0284c7',
          borderColor: '#0ea5e9',
          borderWidth: 2
        }
      },
      dataLabels: {
        enabled: false
      },
      borderColor: '#94a3b8',
      borderWidth: 1,
      nullColor: '#e2e8f0',
      point: {
        events: {
          // Add pulse animation for highlighted counties
          mouseOver: function() {
            if (highlightedCounties.includes(this.code)) {
              this.graphic.animate({
                scaleX: 1.1,
                scaleY: 1.1
              }, {
                duration: 300
              });
            }
          },
          mouseOut: function() {
            if (this.graphic) {
              this.graphic.animate({
                scaleX: 1,
                scaleY: 1
              }, {
                duration: 300
              });
            }
          }
        }
      }
    }]
    };
  }, [mapData, mapTopology, highlightedCounties]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading || !mapOptions ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '600px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #ecf0f1',
            borderTopColor: '#0ea5e9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'mapChart'}
          options={mapOptions}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes countyPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        /* Highcharts map - smooth transitions */
        .highcharts-map-series .highcharts-point {
          transition: all 0.3s ease;
        }
        
        /* Animație simplă pentru județ curent - doar pulsare culoare */
        .highcharts-point[fill="#fbbf24"] {
          animation: countyPulse 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default SimpleMap;
