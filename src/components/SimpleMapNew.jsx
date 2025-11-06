/**
 * SimpleMapNew - Hartă Highcharts România cu animație vizuală
 * FĂRĂ date reale - doar animație pe județe
 */

import { useState, useEffect, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMap from 'highcharts/modules/map';
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

function SimpleMapNew({ isPlaying = false }) {
  const [mapTopology, setMapTopology] = useState(null);
  const [activeCounty, setActiveCounty] = useState(null);

  // Load Romania map
  useEffect(() => {
    fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
      .then(res => res.json())
      .then(topology => setMapTopology(topology))
      .catch(err => console.error('Error loading map:', err));
  }, []);

  // Animație când isPlaying = true
  useEffect(() => {
    if (!isPlaying) {
      setActiveCounty(null);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      setActiveCounty(COUNTY_CODES[index]);
      index = (index + 1) % COUNTY_CODES.length;
    }, 1000); // 1 secundă per județ

    return () => {
      clearInterval(interval);
      setActiveCounty(null);
    };
  }, [isPlaying]);

  // Highcharts options
  const mapOptions = useMemo(() => {
    if (!mapTopology) return null;

    // Date simple pentru hartă - toate județele cu valoare 1
    const mapData = COUNTY_CODES.map(code => ({
      'hc-key': code,
      value: 1,
      color: code === activeCounty ? '#fbbf24' : '#e0f2fe', // Galben pentru activ, albastru deschis pentru restul
      borderColor: code === activeCounty ? '#ef4444' : '#64748b', // Roșu pentru activ, gri închis pentru restul
      borderWidth: code === activeCounty ? 5 : 2 // Border mai gros pentru vizibilitate
    }));

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
        max: 1,
        minColor: '#e0f2fe',
        maxColor: '#e0f2fe' // Toate județele aceeași culoare de bază
      },
      tooltip: {
        enabled: false
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
            borderColor: '#0ea5e9'
          }
        },
        dataLabels: {
          enabled: false
        }
      }]
    };
  }, [mapTopology, activeCounty]);

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
