import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCountries, type CountryResponse } from '../api/countries';
import type { CountryOption } from '../types/country';

const FALLBACK_COUNTRIES: CountryOption[] = [
  { code: '+998', flag: '🇺🇿', name: "O'zbekiston", localLength: 9, pattern: 'uz', sortOrder: 10 },
  { code: '+7', flag: '🇷🇺', name: 'Rossiya', localLength: 10, pattern: 'ru', sortOrder: 20 },
  { code: '+7', flag: '🇰🇿', name: 'Qozogiston', localLength: 10, pattern: 'ru', sortOrder: 30 },
  { code: '+996', flag: '🇰🇬', name: "Qirg'iziston", localLength: 9, pattern: 'generic', sortOrder: 40 },
  { code: '+992', flag: '🇹🇯', name: 'Tojikiston', localLength: 9, pattern: 'generic', sortOrder: 50 },
];

const mapApiCountryToOption = (country: CountryResponse): CountryOption => ({
  id: country.id,
  name: country.name,
  code: country.code,
  flag: country.flag,
  localLength: country.local_length,
  pattern: country.pattern,
  sortOrder: country.sort_order,
  isActive: country.is_active,
});

export const useCountries = () => {
  const [countries, setCountries] = useState<CountryOption[]>(FALLBACK_COUNTRIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRemoteData, setHasRemoteData] = useState<boolean>(false);

  const fetchCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiCountries = await getCountries();

      if (Array.isArray(apiCountries) && apiCountries.length > 0) {
        const mapped = apiCountries
          .filter((country) => country.is_active !== false)
          .map(mapApiCountryToOption)
          .sort((a, b) => {
            const orderA = a.sortOrder ?? 0;
            const orderB = b.sortOrder ?? 0;

            if (orderA !== orderB) {
              return orderA - orderB;
            }

            return a.name.localeCompare(b.name);
          });

        if (mapped.length > 0) {
          setCountries(mapped);
          setHasRemoteData(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch countries', err);
      const message = err instanceof Error ? err.message : 'Failed to load countries';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const metadata = useMemo(
    () => ({
      hasRemoteData,
      fallbackUsed: !hasRemoteData,
    }),
    [hasRemoteData]
  );

  return {
    countries,
    isLoading,
    error,
    refresh: fetchCountries,
    metadata,
  };
};


