export interface City {
  id: string;
  name: string;
  alternateNames: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  population: number;
}

export interface Country {
  geonameid: string;
  country: string;
  iso3: string;
  name: string;
  default: string;
}
