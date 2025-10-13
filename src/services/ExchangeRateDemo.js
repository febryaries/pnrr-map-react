/**
 * Exchange Rate Service Demonstration
 * 
 * This script demonstrates the usage of the new exchange rate service
 * with the provided RON to EUR conversion table.
 */

import { 
  ExchangeRateService, 
  convertRONToEUR, 
  convertEURToRON,
  convertRONToEURWithClosestRate,
  convertEURToRONWithClosestRate
} from './ExchangeRateService.js';

// Run the demonstration
function runDemo() {
  console.log('🔄 Exchange Rate Service Demonstration');
  console.log('=====================================\n');
  
  const service = ExchangeRateService.getInstance();
  
  // Display the exchange rate table
  console.log('📊 Exchange Rate Table from Image:');
  console.log('RON Value | EUR Value');
  console.log('----------|----------');
  const rates = service.getAllRates();
  rates.forEach(rate => {
    console.log(`${rate.ronValue.toFixed(2).padStart(8)} | ${rate.eurValue.toFixed(6)}`);
  });
  console.log();
  
  // Test basic conversions
  console.log('💰 Basic Conversion Examples:');
  const testAmounts = [100, 500, 1000, 5000, 10000];
  
  testAmounts.forEach(ronAmount => {
    const eurAmount = convertRONToEUR(ronAmount);
    console.log(`${ronAmount.toLocaleString().padStart(6)} RON = ${eurAmount.toLocaleString().padStart(8)} EUR`);
  });
  console.log();
  
  // Test reverse conversions
  console.log('🔄 Reverse Conversion Examples:');
  const eurAmounts = [20, 100, 200, 1000, 2000];
  
  eurAmounts.forEach(eurAmount => {
    const ronAmount = convertEURToRON(eurAmount);
    console.log(`${eurAmount.toLocaleString().padStart(6)} EUR = ${ronAmount.toLocaleString().padStart(8)} RON`);
  });
  console.log();
  
  // Test closest rate conversion
  console.log('🎯 Closest Rate Conversion Examples:');
  const testRates = [4.71, 4.89, 4.98, 5.00, 5.01, 5.12];
  
  testRates.forEach(rate => {
    const closest = service.findClosestRate(rate);
    const converted = convertRONToEURWithClosestRate(100);
    console.log(`Closest to ${rate} RON: ${closest.ronValue} RON = ${converted.toFixed(2)} EUR`);
  });
  console.log();
  
  // Validate the exchange rate table
  console.log('✅ Exchange Rate Table Validation:');
  const validation = service.validateRates();
  if (validation.isValid) {
    console.log('✅ All exchange rates are valid!');
  } else {
    console.log('❌ Issues found:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  console.log();
  
  // Demonstrate real project amounts
  console.log('🏗️ Real Project Amount Examples:');
  const projectExamples = [
    { amount: 50000, description: 'Small municipal project' },
    { amount: 250000, description: 'Medium infrastructure project' },
    { amount: 1000000, description: 'Large development project' },
    { amount: 5000000, description: 'Major infrastructure investment' }
  ];
  
  projectExamples.forEach(({ amount, description }) => {
    const eurAmount = convertRONToEUR(amount);
    console.log(`${description}:`);
    console.log(`  ${amount.toLocaleString()} RON = ${eurAmount.toLocaleString()} EUR`);
    console.log();
  });
  
  // Show accuracy comparison
  console.log('📈 Accuracy Comparison (Table vs Default Rate):');
  console.log('RON Amount | Table Method | Default Method | Difference');
  console.log('-----------|--------------|----------------|-----------');
  
  const testValues = [100, 500, 1000, 2500, 5000];
  testValues.forEach(ronAmount => {
    const tableResult = convertRONToEURWithClosestRate(ronAmount);
    const defaultResult = convertRONToEUR(ronAmount);
    const difference = Math.abs(tableResult - defaultResult);
    
    console.log(
      `${ronAmount.toString().padStart(10)} | ${tableResult.toFixed(2).padStart(12)} | ${defaultResult.toFixed(2).padStart(14)} | ${difference.toFixed(2)}`
    );
  });
  
  console.log('\n✅ Demonstration completed!');
  console.log('\nThe exchange rate service is now integrated into the project data sources.');
  console.log('All RON to EUR conversions will use the accurate rates from your table.');
}

// Export for use in other modules
export { runDemo };

// Run the demo if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runDemo();
}
