import type { City } from '../types';

export const parseGeonames = (data: string): City[] => {
  const lines = data.split('\n').filter((line) => line.trim() !== '');

  const cityMap: Record<string, City> = {};

  for (const line of lines) {
    const fields = line.split('\t');

    if (fields.length < 10) continue;

    const id = fields[0];
    const name = fields[1];
    const population = parseInt(fields[2]) || 0;
    const countryCode = fields[3];
    const latitude = parseFloat(fields[8]) || 0;
    const longitude = parseFloat(fields[9]) || 0;
    const isDefault = fields[7] === '1';

    if (!cityMap[id]) {
      cityMap[id] = {
        id,
        name: isDefault ? name : '',
        alternateNames: isDefault ? '' : name,
        latitude,
        longitude,
        countryCode,
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
