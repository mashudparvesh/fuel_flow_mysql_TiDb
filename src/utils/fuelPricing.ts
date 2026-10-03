// Smart Historical Fuel Pricing & Fuel Type Suggestions Engine
import { FuelType } from '../types';

export interface StandardFuelSuggestion {
  name: string;
  nameBn: string;
  code: string;
  unit: string;
  defaultPrice: number;
  category: 'liquid' | 'gas' | 'alternative';
  description: string;
}

export const STANDARD_FUEL_SUGGESTIONS: StandardFuelSuggestion[] = [
  {
    name: 'Diesel',
    nameBn: 'ডিজেল',
    code: 'diesel',
    unit: 'Liter',
    defaultPrice: 105.00,
    category: 'liquid',
    description: 'Standard automotive & commercial truck diesel fuel'
  },
  {
    name: 'Octane',
    nameBn: 'অকটেন (৯২/৯৫)',
    code: 'octane',
    unit: 'Liter',
    defaultPrice: 125.00,
    category: 'liquid',
    description: 'High-octane premium motor gasoline for cars & SUVs'
  },
  {
    name: 'Petrol',
    nameBn: 'পেট্রোল',
    code: 'petrol',
    unit: 'Liter',
    defaultPrice: 121.00,
    category: 'liquid',
    description: 'Regular unleaded petrol for motorbikes and light vehicles'
  },
  {
    name: 'CNG',
    nameBn: 'সিএনজি (সংকুচিত প্রাকৃতিক গ্যাস)',
    code: 'cng',
    unit: 'Cubic Meter (m³)',
    defaultPrice: 43.00,
    category: 'gas',
    description: 'Compressed natural gas measured in cubic meters'
  },
  {
    name: 'LPG Autogas',
    nameBn: 'এলপিজি অটো গ্যাস',
    code: 'lpg',
    unit: 'Liter',
    defaultPrice: 55.50,
    category: 'gas',
    description: 'Liquefied Petroleum Gas for passenger vehicles and auto-rickshaws'
  },
  {
    name: 'Bio-Diesel',
    nameBn: 'বায়ো-ডিজেল',
    code: 'bio_diesel',
    unit: 'Liter',
    defaultPrice: 108.00,
    category: 'alternative',
    description: 'Renewable biodiesel blend for commercial fleets'
  },
  {
    name: 'Furnace Oil',
    nameBn: 'ফার্নেস অয়েল (এইচএফও)',
    code: 'furnace_oil',
    unit: 'Liter',
    defaultPrice: 92.00,
    category: 'liquid',
    description: 'Heavy fuel oil for industrial generators and power plants'
  },
  {
    name: 'Kerosene',
    nameBn: 'কেরোসিন',
    code: 'kerosene',
    unit: 'Liter',
    defaultPrice: 105.00,
    category: 'liquid',
    description: 'Standard burning kerosene for equipment heating/lighting'
  }
];

/**
 * Resolves the effective per-unit price of a fuel type on a given historical date.
 * If multiple price changes exist in price_history, finds the price record active on that date (latest record with date <= targetDate).
 * Ensures that price changes on future dates NEVER alter or recalculate past fuel records!
 * 
 * Example:
 * - 01.10.2026: 105 BDT
 * - 05.10.2026: 115 BDT
 * - 25.10.2026: 102 BDT
 * For entry on 03.10.2026 -> returns 105
 * For entry on 10.10.2026 -> returns 115
 * For entry on 26.10.2026 -> returns 102
 */
export function getEffectiveFuelPriceForDate(
  fuelType: { current_price: number; price_history?: Array<{ date: string; price: number; changed_by?: string }> } | undefined | null,
  targetDateStr?: string
): number {
  if (!fuelType) return 108.50;
  const history = fuelType.price_history || [];
  if (history.length === 0) {
    return Number(fuelType.current_price) || 108.50;
  }

  const cleanDate = (targetDateStr || new Date().toISOString().split('T')[0]).slice(0, 10);

  // Sort history ascending by date
  const sorted = [...history].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // If target date is before the earliest price record, return earliest recorded price
  if (cleanDate < sorted[0].date) {
    return Number(sorted[0].price) || Number(fuelType.current_price) || 108.50;
  }

  // Find the latest price record whose date is <= targetDate
  let effectivePrice = Number(sorted[0].price);
  for (const record of sorted) {
    if (record.date <= cleanDate) {
      effectivePrice = Number(record.price);
    } else {
      break;
    }
  }

  return effectivePrice || Number(fuelType.current_price) || 108.50;
}
