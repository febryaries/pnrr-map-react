/**
 * Count NAȚIONAL projects directly from API
 */

import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchAllProjects() {
  const allProjects = [];
  let offset = 0;
  const limit = 5000;
  let hasMore = true;
  
  while (hasMore) {
    const url = `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte?offset=${offset}&limit=${limit}`;
    
    try {
      const response = await fetch(url, { agent });
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        allProjects.push(...data.items);
        hasMore = data.hasMore;
        offset += limit;
      } else {
        hasMore = false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      hasMore = false;
    }
  }
  
  return allProjects;
}

async function main() {
  console.log('🔍 Fetching all projects from API...\n');
  const projects = await fetchAllProjects();
  console.log(`✅ Total projects: ${projects.length}\n`);
  
  // Count NAȚIONAL by different criteria
  const nationalByJudet = projects.filter(p => {
    const judet = (p.judet_implementare || '').toUpperCase().trim();
    return judet === 'NAȚIONAL';
  });
  
  const nationalByLocality = projects.filter(p => {
    const locality = (p.localitate_implementare || '').toUpperCase().trim();
    return locality === 'NATIONAL';
  });
  
  const nationalByEither = projects.filter(p => {
    const judet = (p.judet_implementare || '').toUpperCase().trim();
    const locality = (p.localitate_implementare || '').toUpperCase().trim();
    return judet === 'NAȚIONAL' || locality === 'NATIONAL';
  });
  
  console.log('📊 NAȚIONAL Projects Count:\n');
  console.log(`   By judet_implementare = "NAȚIONAL": ${nationalByJudet.length}`);
  console.log(`   By localitate_implementare = "NATIONAL": ${nationalByLocality.length}`);
  console.log(`   By EITHER (judet OR locality): ${nationalByEither.length}\n`);
  
  // Check for overlap
  const overlap = projects.filter(p => {
    const judet = (p.judet_implementare || '').toUpperCase().trim();
    const locality = (p.localitate_implementare || '').toUpperCase().trim();
    return judet === 'NAȚIONAL' && locality === 'NATIONAL';
  });
  
  console.log(`🔄 Overlap (both judet AND locality): ${overlap.length}\n`);
  
  if (overlap.length > 0) {
    console.log('📋 Overlap projects:');
    overlap.forEach(p => {
      console.log(`   - ${p.nr_contract}: ${p.titlu_contract?.substring(0, 60)}`);
    });
  }
  
  // Expected: nationalByJudet + nationalByLocality - overlap = nationalByEither
  const expected = nationalByJudet.length + nationalByLocality.length - overlap.length;
  console.log(`\n✅ Verification: ${nationalByJudet.length} + ${nationalByLocality.length} - ${overlap.length} = ${expected}`);
  console.log(`   Actual (EITHER): ${nationalByEither.length}`);
  console.log(`   Match: ${expected === nationalByEither.length ? '✅ YES' : '❌ NO'}`);
}

main().catch(console.error);
