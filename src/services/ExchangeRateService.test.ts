/**
 * Test file for Exchange Rate Service
 * 
 * This file tests the accuracy and functionality of the exchange rate service
 * using the provided RON to EUR conversion table.
 */

import { 
  ExchangeRateService, 
  convertRONToEUR, 
  convertEURToRON,
  convertRONToEURWithClosestRate,
  convertEURToRONWithClosestRate
} from './ExchangeRateService';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    service = ExchangeRateService.getInstance();
  });

  describe('Basic Conversion Tests', () => {
    test('should convert RON to EUR using default rate', () => {
      const ronAmount = 100;
      const eurAmount = convertRONToEUR(ronAmount);
      expect(eurAmount).toBeCloseTo(20, 2); // 100 RON / 5.00 = 20 EUR
    });

    test('should convert EUR to RON using default rate', () => {
      const eurAmount = 20;
      const ronAmount = convertEURToRON(eurAmount);
      expect(ronAmount).toBeCloseTo(100, 2); // 20 EUR * 5.00 = 100 RON
    });

    test('should handle zero amounts', () => {
      expect(convertRONToEUR(0)).toBe(0);
      expect(convertEURToRON(0)).toBe(0);
      expect(convertRONToEUR(-10)).toBe(0);
      expect(convertEURToRON(-10)).toBe(0);
    });
  });

  describe('Exchange Rate Table Tests', () => {
    test('should return all available rates', () => {
      const rates = service.getAllRates();
      expect(rates).toHaveLength(7);
      expect(rates[0]).toEqual({ ronValue: 4.71, eurValue: 0.212314225053079 });
      expect(rates[3]).toEqual({ ronValue: 5.00, eurValue: 0.2 });
    });

    test('should find closest rate for given RON value', () => {
      // Test with exact match
      const exactMatch = service.findClosestRate(5.00);
      expect(exactMatch.ronValue).toBe(5.00);
      expect(exactMatch.eurValue).toBe(0.2);

      // Test with close value
      const closeMatch = service.findClosestRate(4.95);
      expect(closeMatch.ronValue).toBe(4.98); // Should find closest
    });

    test('should convert using closest rate from table', () => {
      const ronAmount = 100;
      const eurAmount = convertRONToEURWithClosestRate(ronAmount);
      
      // Should use the closest rate (5.00) which gives 20 EUR
      expect(eurAmount).toBeCloseTo(20, 2);
    });
  });

  describe('Rate Validation Tests', () => {
    test('should validate exchange rate table', () => {
      const validation = service.validateRates();
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should detect invalid rates', () => {
      // Add an invalid rate for testing
      service.addRate(0, 0.5); // Invalid: zero RON value
      
      const validation = service.validateRates();
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      
      // Clean up by removing the invalid rate
      service.removeRate(0);
    });
  });

  describe('Configuration Tests', () => {
    test('should add new exchange rate', () => {
      const initialCount = service.getAllRates().length;
      service.addRate(6.00, 0.1667);
      
      const rates = service.getAllRates();
      expect(rates).toHaveLength(initialCount + 1);
      
      // Clean up
      service.removeRate(6.00);
    });

    test('should remove exchange rate', () => {
      service.addRate(6.00, 0.1667);
      const addedCount = service.getAllRates().length;
      
      const removed = service.removeRate(6.00);
      expect(removed).toBe(true);
      expect(service.getAllRates()).toHaveLength(addedCount - 1);
    });

    test('should return false when removing non-existent rate', () => {
      const removed = service.removeRate(999.99);
      expect(removed).toBe(false);
    });
  });

  describe('Real-world Conversion Examples', () => {
    test('should convert common project amounts', () => {
      // Test with typical project amounts
      const testCases = [
        { ron: 1000, expectedEur: 200 }, // 1000 RON = 200 EUR (at 5.00 rate)
        { ron: 5000, expectedEur: 1000 }, // 5000 RON = 1000 EUR
        { ron: 25000, expectedEur: 5000 }, // 25000 RON = 5000 EUR
      ];

      testCases.forEach(({ ron, expectedEur }) => {
        const actualEur = convertRONToEUR(ron);
        expect(actualEur).toBeCloseTo(expectedEur, 2);
      });
    });

    test('should handle decimal amounts', () => {
      const ronAmount = 123.45;
      const eurAmount = convertRONToEUR(ronAmount);
      expect(eurAmount).toBeCloseTo(24.69, 2); // 123.45 / 5.00 = 24.69
    });

    test('should maintain precision for large amounts', () => {
      const ronAmount = 1000000; // 1 million RON
      const eurAmount = convertRONToEUR(ronAmount);
      expect(eurAmount).toBeCloseTo(200000, 2); // 1M RON = 200K EUR
    });
  });

  describe('Singleton Pattern Tests', () => {
    test('should return same instance', () => {
      const instance1 = ExchangeRateService.getInstance();
      const instance2 = ExchangeRateService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should maintain state across instances', () => {
      const instance1 = ExchangeRateService.getInstance();
      instance1.addRate(7.00, 0.1429);
      
      const instance2 = ExchangeRateService.getInstance();
      const rates = instance2.getAllRates();
      expect(rates.some(rate => rate.ronValue === 7.00)).toBe(true);
      
      // Clean up
      instance2.removeRate(7.00);
    });
  });
});

// Manual test function for console output
export const runManualTests = () => {
  console.log('🧪 Running Manual Exchange Rate Tests...\n');
  
  const service = ExchangeRateService.getInstance();
  
  // Test basic conversions
  console.log('📊 Basic Conversion Tests:');
  console.log(`100 RON = ${convertRONToEUR(100).toFixed(2)} EUR`);
  console.log(`20 EUR = ${convertEURToRON(20).toFixed(2)} RON`);
  console.log();
  
  // Test with closest rate
  console.log('🎯 Closest Rate Tests:');
  console.log(`100 RON (closest rate) = ${convertRONToEURWithClosestRate(100).toFixed(2)} EUR`);
  console.log(`20 EUR (closest rate) = ${convertEURToRONWithClosestRate(20).toFixed(2)} RON`);
  console.log();
  
  // Test validation
  console.log('✅ Validation Tests:');
  const validation = service.validateRates();
  console.log(`Exchange rate table is valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('Issues found:', validation.issues);
  }
  console.log();
  
  // Test all rates
  console.log('📋 All Available Rates:');
  const rates = service.getAllRates();
  rates.forEach((rate, index) => {
    console.log(`${index + 1}. ${rate.ronValue} RON = ${rate.eurValue.toFixed(6)} EUR`);
  });
  console.log();
  
  // Test real-world examples
  console.log('🏗️ Real-world Project Amount Examples:');
  const examples = [
    { ron: 1000, description: 'Small project' },
    { ron: 10000, description: 'Medium project' },
    { ron: 100000, description: 'Large project' },
    { ron: 1000000, description: 'Major infrastructure' }
  ];
  
  examples.forEach(({ ron, description }) => {
    const eur = convertRONToEUR(ron);
    console.log(`${description}: ${ron.toLocaleString()} RON = ${eur.toLocaleString()} EUR`);
  });
  
  console.log('\n✅ Manual tests completed!');
};
