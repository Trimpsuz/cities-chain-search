import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import type { Country } from '../../types';

export async function GET(req: NextRequest) {
  const data = fs.readFileSync(path.join(process.cwd(), 'public', 'countries.txt'), 'utf-8');

  const lines = data.split('\n').filter((line) => line.trim() !== '');

  const countries: Country[] = lines.map((line) => {
    const fields = line.split('\t');
    return {
      geonameid: fields[0],
      country: fields[1],
      iso3: fields[2],
      name: fields[3],
      default: fields[4],
    };
  });

  const primaryCountries = countries
    .filter((country) => country.default === '1')
    .map((country) => ({
      code: country.country,
      name: country.name,
    }));

  return NextResponse.json(primaryCountries);
}
