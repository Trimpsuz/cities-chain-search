import type { City } from '@/app/types';
import { parseCities } from '@/app/utils/parseGeonames';
import axios from 'axios';
import xxhash from 'xxhash-wasm';

class CitiesCache {
  private static instance: CitiesCache;
  private cities: City[] = [];
  private hash: string | null = null;

  private constructor() {}

  static getInstance(): CitiesCache {
    if (!CitiesCache.instance) {
      CitiesCache.instance = new CitiesCache();
    }
    return CitiesCache.instance;
  }

  async getCities(): Promise<City[]> {
    if (this.cities.length === 0) {
      try {
        const response = await axios.get('https://raw.githubusercontent.com/GlutenFreeGrapes/cities-chain/refs/heads/main/data/cities.txt');
        this.cities = parseCities(response.data).sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        throw new Error(`Failed to fetch city data: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
      }
    }

    return this.cities;
  }

  async getHash(): Promise<string> {
    if (!this.hash) {
      const data = await this.getCities();
      const { h64ToString } = await xxhash();
      this.hash = h64ToString(JSON.stringify(data));
    }

    return this.hash;
  }
}

export const citiesCache = CitiesCache.getInstance();
