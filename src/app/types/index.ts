export interface City {
  id: string;
  name: string;
  alternateNames: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  admin1: string;
  admin2?: string;
  population: number;
  admin1Name?: string;
  countryRequired?: boolean;
  admin1Required?: boolean;
  admin2Required?: boolean;
}

export interface Country {
  geonameid: string;
  country: string;
  iso3: string;
  name: string;
  continent: string;
}

export interface Admin {
  id: string;
  countryCode: string;
  admin1: string;
  admin2?: string;
  name: string;
  alternateNames: string;
}
