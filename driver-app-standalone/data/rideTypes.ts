/**
 * Ride Types Data
 * Static data for different ride types
 */

export interface RideType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerKm: number;
  basePrice: number;
  icon: string;
}

export const rideTypes: RideType[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Affordable rides for everyday travel',
    capacity: 4,
    pricePerKm: 0.5,
    basePrice: 2.0,
    icon: '🚗',
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'More space and comfort for your journey',
    capacity: 4,
    pricePerKm: 0.75,
    basePrice: 3.0,
    icon: '🚙',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Luxury vehicles for special occasions',
    capacity: 4,
    pricePerKm: 1.5,
    basePrice: 5.0,
    icon: '🚘',
  },
  {
    id: 'xl',
    name: 'XL',
    description: 'Larger vehicles for groups',
    capacity: 6,
    pricePerKm: 1.0,
    basePrice: 4.0,
    icon: '🚐',
  },
];

export const getRideTypeById = (id: string): RideType | undefined => {
  return rideTypes.find((type) => type.id === id);
};

