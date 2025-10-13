/**
 * Exchange Rate Service for RON to EUR Conversion
 * 
 * This service provides accurate currency conversion using the provided exchange rate table.
 * It supports both RON to EUR and EUR to RON conversions with proper rate lookup.
 */

export interface ExchangeRateEntry {
  ronValue: number;
  eurValue: number;
}

export interface ExchangeRateConfig {
  rates: ExchangeRateEntry[];
  defaultRate: number;
}

/**
 * Exchange Rate Service Class
 * 
 * Handles currency conversion between RON and EUR using the provided exchange rate table.
 * The table contains RON values and their corresponding EUR equivalents.
 */
export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private config: ExchangeRateConfig;

  private constructor() {
    // Initialize with the exchange rate table from the image
    this.config = {
      rates: [
        { ronValue: 4.71, eurValue: 0.212314225053079 },
        { ronValue: 4.89, eurValue: 0.204498977505112 },
        { ronValue: 4.98, eurValue: 0.20083212851406 },
        { ronValue: 5.00, eurValue: 0.2 },
        { ronValue: 5.00, eurValue: 0.2 }, // Note: duplicate 5.00 entry
        { ronValue: 5.01, eurValue: 0.199600798403194 },
        { ronValue: 5.12, eurValue: 0.1953125 }
      ],
      defaultRate: 5.00 // Default RON to EUR rate
    };
  }

  /**
   * Get singleton instance of the service
   */
  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Convert RON amount to EUR using the exchange rate table
   * 
   * @param ronAmount - Amount in RON
   * @param dateString - Optional date string for rate lookup (currently uses default rate)
   * @returns EUR amount
   */
  public convertRONToEUR(ronAmount: number, dateString?: string): number {
    if (!ronAmount || ronAmount <= 0) return 0;

    // For now, use the default rate (5.00 RON = 1 EUR)
    // In the future, this could be enhanced to use date-based rate lookup
    const rate = this.getExchangeRate(dateString);
    return ronAmount / rate;
  }

  /**
   * Convert EUR amount to RON using the exchange rate table
   * 
   * @param eurAmount - Amount in EUR
   * @param dateString - Optional date string for rate lookup (currently uses default rate)
   * @returns RON amount
   */
  public convertEURToRON(eurAmount: number, dateString?: string): number {
    if (!eurAmount || eurAmount <= 0) return 0;

    // For now, use the default rate (5.00 RON = 1 EUR)
    // In the future, this could be enhanced to use date-based rate lookup
    const rate = this.getExchangeRate(dateString);
    return eurAmount * rate;
  }

  /**
   * Get the exchange rate for a given date
   * Currently returns the default rate, but can be enhanced for date-based lookup
   * 
   * @param dateString - Optional date string
   * @returns Exchange rate (RON per EUR)
   */
  public getExchangeRate(dateString?: string): number {
    // For now, return the default rate
    // This can be enhanced to parse the date and return historical rates
    return this.config.defaultRate;
  }

  /**
   * Get all available exchange rates from the table
   * 
   * @returns Array of exchange rate entries
   */
  public getAllRates(): ExchangeRateEntry[] {
    return [...this.config.rates];
  }

  /**
   * Find the closest exchange rate entry for a given RON value
   * 
   * @param ronValue - RON value to find closest rate for
   * @returns Closest exchange rate entry
   */
  public findClosestRate(ronValue: number): ExchangeRateEntry {
    if (!this.config.rates.length) {
      return { ronValue: this.config.defaultRate, eurValue: 1 / this.config.defaultRate };
    }

    // Find the closest RON value in the table
    let closest = this.config.rates[0];
    let minDifference = Math.abs(ronValue - closest.ronValue);

    for (const rate of this.config.rates) {
      const difference = Math.abs(ronValue - rate.ronValue);
      if (difference < minDifference) {
        minDifference = difference;
        closest = rate;
      }
    }

    return closest;
  }

  /**
   * Convert RON to EUR using the closest rate from the table
   * 
   * @param ronAmount - Amount in RON
   * @returns EUR amount using closest table rate
   */
  public convertRONToEURWithClosestRate(ronAmount: number): number {
    if (!ronAmount || ronAmount <= 0) return 0;

    const closestRate = this.findClosestRate(ronAmount);
    return ronAmount / closestRate.ronValue;
  }

  /**
   * Convert EUR to RON using the closest rate from the table
   * 
   * @param eurAmount - Amount in EUR
   * @returns RON amount using closest table rate
   */
  public convertEURToRONWithClosestRate(eurAmount: number): number {
    if (!eurAmount || eurAmount <= 0) return 0;

    const closestRate = this.findClosestRate(eurAmount);
    return eurAmount * closestRate.ronValue;
  }

  /**
   * Validate the exchange rate table for consistency
   * 
   * @returns Validation result with any issues found
   */
  public validateRates(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (let i = 0; i < this.config.rates.length; i++) {
      const rate = this.config.rates[i];
      
      // Check for zero or negative values
      if (rate.ronValue <= 0) {
        issues.push(`Rate ${i}: Invalid RON value ${rate.ronValue}`);
      }
      if (rate.eurValue <= 0) {
        issues.push(`Rate ${i}: Invalid EUR value ${rate.eurValue}`);
      }

      // Check if the rate calculation is approximately correct
      const calculatedEUR = 1 / rate.ronValue;
      const difference = Math.abs(calculatedEUR - rate.eurValue);
      if (difference > 0.001) { // Allow small floating point differences
        issues.push(`Rate ${i}: EUR value ${rate.eurValue} doesn't match calculated ${calculatedEUR} (difference: ${difference})`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Update the exchange rate configuration
   * 
   * @param config - New exchange rate configuration
   */
  public updateConfig(config: Partial<ExchangeRateConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Add a new exchange rate entry
   * 
   * @param ronValue - RON value
   * @param eurValue - Corresponding EUR value
   */
  public addRate(ronValue: number, eurValue: number): void {
    this.config.rates.push({ ronValue, eurValue });
    // Sort by RON value for easier lookup
    this.config.rates.sort((a, b) => a.ronValue - b.ronValue);
  }

  /**
   * Remove an exchange rate entry
   * 
   * @param ronValue - RON value to remove
   */
  public removeRate(ronValue: number): boolean {
    const index = this.config.rates.findIndex(rate => rate.ronValue === ronValue);
    if (index !== -1) {
      this.config.rates.splice(index, 1);
      return true;
    }
    return false;
  }
}

/**
 * Convenience functions for easy access without instantiating the service
 */

/**
 * Convert RON to EUR using the exchange rate service
 */
export const convertRONToEUR = (ronAmount: number, dateString?: string): number => {
  return ExchangeRateService.getInstance().convertRONToEUR(ronAmount, dateString);
};

/**
 * Convert EUR to RON using the exchange rate service
 */
export const convertEURToRON = (eurAmount: number, dateString?: string): number => {
  return ExchangeRateService.getInstance().convertEURToRON(eurAmount, dateString);
};

/**
 * Get the current exchange rate
 */
export const getExchangeRate = (dateString?: string): number => {
  return ExchangeRateService.getInstance().getExchangeRate(dateString);
};

/**
 * Convert RON to EUR using the closest rate from the table
 */
export const convertRONToEURWithClosestRate = (ronAmount: number): number => {
  return ExchangeRateService.getInstance().convertRONToEURWithClosestRate(ronAmount);
};

/**
 * Convert EUR to RON using the closest rate from the table
 */
export const convertEURToRONWithClosestRate = (eurAmount: number): number => {
  return ExchangeRateService.getInstance().convertEURToRONWithClosestRate(eurAmount);
};
