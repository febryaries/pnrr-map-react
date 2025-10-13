/**
 * Custom hook to fetch București + NAȚIONAL projects directly from API
 * This bypasses ProjectDataAggregation.ts to ensure ALL 200 NATIONAL projects are included
 */

import { useState, useEffect } from 'react';

const API_URL = 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte';

export const useBucurestiNationalProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const allProjects = [];
        let offset = 0;
        const limit = 5000;
        let hasMore = true;

        // Fetch all data with pagination
        while (hasMore) {
          const url = `${API_URL}?offset=${offset}&limit=${limit}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            allProjects.push(...data.items);
            hasMore = data.hasMore;
            offset += limit;
          } else {
            hasMore = false;
          }
        }

        // Filter for București + NAȚIONAL projects
        const filtered = allProjects.filter(project => {
          const judet = (project.judet_implementare || '').toUpperCase().trim();
          const localitate = (project.localitate_implementare || '').toUpperCase().trim();
          
          // Include NAȚIONAL projects
          if (judet === 'NAȚIONAL' || localitate === 'NATIONAL') {
            return true;
          }
          
          // Include ALL București projects (based on judet_implementare ONLY)
          // Don't filter by localitate_implementare because projects can have
          // beneficiaries in other cities but still be implemented in București
          if (
            judet === 'MUNICIPIUL BUCUREȘTI' || 
            judet === 'BUCUREȘTI' ||
            judet === 'MUNICIPIUL BUCURESTI' ||
            judet === 'BUCURESTI'
          ) {
            return true;
          }
          
          // Also include projects from other judete that have București as locality
          // (e.g., ILFOV with BUCUREȘTI locality)
          if (!judet && (
            localitate === 'BUCUREȘTI' ||
            localitate === 'BUCURESTI' ||
            localitate === 'MUNICIPIUL BUCUREȘTI' ||
            localitate === 'MUNICIPIUL BUCURESTI' ||
            localitate.startsWith('SECTOR')
          )) {
            return true;
          }
          
          return false;
        });

        console.log(`✅ Fetched ${allProjects.length} total projects from API`);
        console.log(`✅ Filtered ${filtered.length} projects for București + NAȚIONAL`);
        
        // Count NAȚIONAL projects
        const nationalCount = filtered.filter(p => {
          const judet = (p.judet_implementare || '').toUpperCase();
          const localitate = (p.localitate_implementare || '').toUpperCase();
          return judet === 'NAȚIONAL' || localitate === 'NATIONAL';
        }).length;
        
        console.log(`✅ NAȚIONAL projects: ${nationalCount}`);

        // Transform API data to match the expected structure
        const transformedProjects = filtered.map(project => {
          const localitate = (project.localitate_implementare || '').toUpperCase().trim();
          
          // Clean up locality display: exclude "MUNICIPIUL X" from other cities
          // Keep only București-relevant localities
          let displayLocality = project.localitate_implementare || '';
          
          // If locality starts with "MUNICIPIUL" and is NOT București, replace with "București"
          if (localitate.startsWith('MUNICIPIUL') && 
              !localitate.includes('BUCUREȘTI') && 
              !localitate.includes('BUCURESTI')) {
            displayLocality = 'BUCUREȘTI'; // Show as București since judet is București
          }
          
          // Same for COMUNA, JUDETUL from other regions
          if ((localitate.startsWith('COMUNA') || localitate.startsWith('JUDETUL')) &&
              !localitate.includes('BUCUREȘTI') && 
              !localitate.includes('BUCURESTI')) {
            displayLocality = 'BUCUREȘTI';
          }
          
          return {
            // Original API fields (keep for compatibility)
            ...project,
            
            // Mapped fields for EnhancedTable
            DENUMIRE_BENEFICIAR: project.denumire_beneficiar || '',
            VALOARE_FE: parseFloat(project.valoare_fe) || 0,
            VALOARE_TOTAL: parseFloat(project.valoare_total) || 0,
            TITLU_CONTRACT: project.titlu_contract || '',
            NR_CONTRACT: project.nr_contract || '',
            SURSA_FINANTARE: project.sursa_finantare || '',
            COD_COMPONENTA: project.cod_componenta || '',
            COD_MASURA: project.cod_masura || '',
            LOCALITATE_IMPLEMENTARE: displayLocality,
            STADIU: project.stadiu || '',
            COMPONENTA_LABEL: project.cod_componenta || '',
            
            // Additional mapped fields for table display
            stage: project.stadiu || '', // For "Stadiu" column
            beneficiary: project.denumire_beneficiar || '',
            title: project.titlu_contract || '',
            contractNumber: project.nr_contract || '',
            fundingSource: project.sursa_finantare || '',
            value: parseFloat(project.valoare_fe) || 0,
            value_ron: parseFloat(project.valoare_total) || 0,
            componentCode: project.cod_componenta || '',
            measureCode: project.cod_masura || '',
            locality: displayLocality
          };
        });

        setProjects(transformedProjects);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
};
