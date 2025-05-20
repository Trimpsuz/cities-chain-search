import type { City, Admin } from '../types';

interface Country {
  id: string;
  countryCode: string;
  iso3: string;
  name: string;
}

export const parseCities = (data: string): City[] => {
  const lines = data.split('\n').filter((line) => line.trim() !== '');

  const cityMap: Record<string, City> = {};

  for (const line of lines) {
    const fields = line.split('\t');

    if (fields.length < 10) continue;

    const id = fields[0];
    const name = fields[1];
    const population = parseInt(fields[2]) || 0;
    const countryCode = fields[3];
    const admin1 = fields[4];
    const admin2 = fields[5];
    const latitude = parseFloat(fields[8]) || 0;
    const longitude = parseFloat(fields[9]) || 0;
    const isDefault = fields[7] === '1';
    const isDeleted = fields[15] === '1';

    if (isDeleted) continue;

    if (!cityMap[id]) {
      cityMap[id] = {
        id,
        name: isDefault ? name : '',
        alternateNames: isDefault ? '' : name,
        latitude,
        longitude,
        countryCode,
        admin1,
        admin2,
        population,
      };
    } else {
      const city = cityMap[id];
      if (isDefault && name !== city.name) {
        city.name = name;
      } else {
        city.alternateNames += city.alternateNames ? `,${name}` : name;
      }
    }
  }

  return Object.values(cityMap);
};

export const parseAdmin = (data: string): Admin[] => {
  const lines = data.split('\n').filter((line) => line.trim() !== '');

  const adminMap: Record<string, Admin> = {};

  for (const line of lines) {
    const fields = line.split('\t');

    if (fields.length < 5) continue;

    const id = fields[0];
    const countryCode = fields[1];
    const admin1 = fields[2];
    const admin2 = fields.length === 6 ? fields[3] : undefined;
    const name = fields[fields.length - 2];
    const isDefault = fields[fields.length - 1] === '1';

    if (!adminMap[id]) {
      adminMap[id] = {
        id,
        name: isDefault ? name : '',
        alternateNames: isDefault ? '' : name,
        countryCode,
        admin1,
        admin2,
      };
    } else {
      const admin = adminMap[id];
      if (isDefault && name !== admin.name) {
        admin.name = name;
      } else {
        admin.alternateNames += admin.alternateNames ? `,${name}` : name;
      }
    }
  }

  return Object.values(adminMap);
};

export const parseCountries = (data: string): Country[] => {
  const lines = data.split('\n').filter((line) => line.trim() !== '');

  const countryMap: Record<string, Country> = {};

  for (const line of lines) {
    const fields = line.split('\t');

    if (fields.length < 5) continue;

    const id = fields[16];
    const countryCode = fields[0];
    const iso3 = fields[1];
    const name = fields[4];

    if (!countryMap[id]) {
      countryMap[id] = {
        id,
        countryCode,
        iso3,
        name,
      };
    }
  }

  return Object.values(countryMap);
};
