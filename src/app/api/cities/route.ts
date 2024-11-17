import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseGeonames } from '../../utils/parseGeonames';
import removeAccents from 'remove-accents';

export async function GET(req: NextRequest) {
  const filePath = path.join(process.cwd(), 'public', 'GeonamesDump.txt');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const cities = parseGeonames(fileContent)
    .filter((city) => city.featureClass === 'P')
    .sort((a, b) => a.name.localeCompare(b.name));

  const { searchParams } = new URL(req.url);
  const minPopulation = searchParams.get('minPopulation');
  const startsWith = searchParams.get('startsWith');
  const endsWith = searchParams.get('endsWith');
  const convertCharacters = searchParams.get('convertCharacters') === 'true';
  const searchAlternateNames = searchParams.get('searchAlternateNames') === 'true';

  let filteredCities = cities;

  // Apply filters
  if (minPopulation) {
    const minPop = parseInt(minPopulation, 10);
    filteredCities = filteredCities.filter((city) => city.population >= minPop);
  }

  if (startsWith) {
    if (convertCharacters) {
      if (searchAlternateNames) {
        filteredCities = filteredCities.filter(
          (city) =>
            removeAccents(city.name.toLowerCase()).startsWith(removeAccents(startsWith.toLowerCase())) ||
            city.alternateNames
              .split(',')
              .map((name) => removeAccents(name.toLowerCase()))
              .some((name) => name.startsWith(removeAccents(startsWith.toLowerCase())))
        );
      } else filteredCities = filteredCities.filter((city) => removeAccents(city.name.toLowerCase()).startsWith(removeAccents(startsWith.toLowerCase())));
    } else {
      if (searchAlternateNames) {
        filteredCities = filteredCities.filter(
          (city) =>
            city.name.toLowerCase().startsWith(startsWith.toLowerCase()) ||
            city.alternateNames
              .split(',')
              .map((name) => name.toLowerCase())
              .some((name) => name.startsWith(startsWith.toLowerCase()))
        );
      } else filteredCities = filteredCities.filter((city) => city.name.toLowerCase().startsWith(startsWith.toLowerCase()));
    }
  }

  if (endsWith) {
    if (convertCharacters) {
      if (searchAlternateNames) {
        filteredCities = filteredCities.filter(
          (city) =>
            removeAccents(city.name.toLowerCase()).endsWith(removeAccents(endsWith.toLowerCase())) ||
            city.alternateNames
              .split(',')
              .map((name) => removeAccents(name.toLowerCase()))
              .some((name) => name.endsWith(removeAccents(endsWith.toLowerCase())))
        );
      } else filteredCities = filteredCities.filter((city) => removeAccents(city.name.toLowerCase()).endsWith(removeAccents(endsWith.toLowerCase())));
    } else {
      if (searchAlternateNames) {
        filteredCities = filteredCities.filter(
          (city) =>
            city.name.toLowerCase().endsWith(endsWith.toLowerCase()) ||
            city.alternateNames
              .split(',')
              .map((name) => name.toLowerCase())
              .some((name) => name.endsWith(endsWith.toLowerCase()))
        );
      } else filteredCities = filteredCities.filter((city) => city.name.toLowerCase().endsWith(endsWith.toLowerCase()));
    }
  }

  return NextResponse.json(filteredCities);
}
