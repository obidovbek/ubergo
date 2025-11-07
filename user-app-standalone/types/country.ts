export type CountryPattern = 'uz' | 'ru' | 'generic';

export interface CountryOption {
  id?: string;
  name: string;
  code: string;
  flag?: string | null;
  localLength: number;
  pattern: CountryPattern;
  sortOrder?: number;
  isActive?: boolean;
}


