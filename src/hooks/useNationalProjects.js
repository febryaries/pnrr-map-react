/**
 * Custom hook to fetch NAȚIONAL projects directly from API
 * This bypasses ProjectDataAggregation.ts to get only NAȚIONAL projects
 */

import { useState, useEffect } from 'react';

const API_URL = 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte';

export const useNationalProjects = () => {
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

        // Filter for NAȚIONAL projects ONLY
        const filtered = allProjects.filter(project => {
          const judet = (project.judet_implementare || '').toUpperCase().trim();
          const localitate = (project.localitate_implementare || '').toUpperCase().trim();
          
          // Include ONLY NAȚIONAL projects
          if (judet === 'NAȚIONAL' || localitate === 'NATIONAL') {
            return true;
          }
          
          return false;
        });

        console.log(`✅ Fetched ${allProjects.length} total projects from API`);
        console.log(`✅ Filtered ${filtered.length} projects for NAȚIONAL`);

        // Transform API data to match the expected structure
        const transformedProjects = filtered.map(project => {
          const localitate = (project.localitate_implementare || '').toUpperCase().trim();
          
          // For NAȚIONAL projects, keep locality as "NATIONAL"
          let displayLocality = project.localitate_implementare || 'NATIONAL';
          
          // Ensure NAȚIONAL projects show "NATIONAL" in locality
          if (localitate === 'NAȚIONAL' || localitate === 'NATIONAL' || !localitate) {
            displayLocality = 'NATIONAL';
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
