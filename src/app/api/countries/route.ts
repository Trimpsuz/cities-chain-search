import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import type { Country } from '../../types';

export async function GET(req: NextRequest) {
  const data = fs.readFileSync(path.join(process.cwd(), 'public', 'countries.txt'), 'utf-8');

  const lines = data.split('\n').filter((line) => line.trim() !== '' && !line.startsWith('#'));

  const countries: Country[] = lines.map((line) => {
    const fields = line.split('\t');
    return {
      geonameid: fields[16],
      country: fields[0],
      iso3: fields[1],
      name: fields[4],
      continent: fields[8],
    };
  });

  return NextResponse.json(countries);
}
