export interface City {
  id: string;
  name: string;
  alternateNames: string;
  latitude: number;
  longitude: number;
  featureClass: string;
  featureCode: string;
  countryCode: string;
  population: number;
  timezone: string;
  modificationDate: string;
}

export const parseGeonames = (data: string): City[] => {
  return data
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const fields = line.split('\t');
      return {
        id: fields[0],
        name: fields[1],
        alternateNames: fields[3],
        latitude: parseFloat(fields[4]),
        longitude: parseFloat(fields[5]),
        featureClass: fields[6],
        featureCode: fields[7],
        countryCode: fields[8],
        population: parseInt(fields[14]) || 0,
        timezone: fields[17],
        modificationDate: fields[18],
      };
    });
};
