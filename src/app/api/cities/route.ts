import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseCities, parseAdmin, parseCountries } from '../../utils/parseGeonames';
import anyAscii from 'any-ascii';
import { removeSpecial } from '../../utils/helpers';
import type { City } from '../../types';
import path from 'path';
import fs from 'fs';

interface Country {
  id: string;
  countryCode: string;
  iso3: string;
  name: string;
}

let cities: City[] = [];
let countries: Country[] = [];

const admin1 = new Map<string, string>();
const admin2 = new Map<string, string>();
const cityMap = new Map<string, City[]>();
const altNamesToPop = new Map<string, { id: string; name: string; population: number; countryCode: string; admin1: string; admin2?: string }>();

async function loadCities() {
  if (cities.length === 0) {
    try {
      const response = await axios.get('https://raw.githubusercontent.com/GlutenFreeGrapes/cities-chain/refs/heads/main/data/cities.txt');
      cities = parseCities(response.data).sort((a, b) => a.name.localeCompare(b.name));

      for (const c of cities) {
        if (!cityMap.has(c.name.toLowerCase())) cityMap.set(c.name.toLowerCase(), []);
        cityMap.get(c.name.toLowerCase())!.push(c);
        c.alternateNames.split(',').forEach((altName) => {
          if (altNamesToPop.has(altName) && altNamesToPop.get(altName)!.population > c.population) return;
          altNamesToPop.set(altName.toLowerCase(), { id: c.id, name: c.name, population: c.population, countryCode: c.countryCode, admin1: c.admin1, admin2: c.admin2 });
        });
      }
    } catch (error) {
      throw new Error(`Failed to fetch city data: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }
}

async function loadAdmin() {
  if (admin1.size === 0) {
    try {
      const response = await axios.get('https://raw.githubusercontent.com/GlutenFreeGrapes/cities-chain/refs/heads/main/data/admin1.txt');
      const parsed = parseAdmin(response.data).sort((a, b) => a.name.localeCompare(b.name));

      for (const a of parsed) {
        admin1.set(`${a.countryCode}-${a.admin1}`, a.name);
      }
    } catch (error) {
      throw new Error(`Failed to fetch admin1 data: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  if (admin2.size === 0) {
    try {
      const response = await axios.get('https://raw.githubusercontent.com/GlutenFreeGrapes/cities-chain/refs/heads/main/data/admin2.txt');
      const parsed = parseAdmin(response.data).sort((a, b) => a.name.localeCompare(b.name));

      for (const a of parsed) {
        admin2.set(`${a.countryCode}-${a.admin1}-${a.admin2}`, a.name);
      }
    } catch (error) {
      throw new Error(`Failed to fetch admin1 data: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }
}

async function loadCountries() {
  if (countries.length === 0) {
    countries = parseCountries(fs.readFileSync(path.join(process.cwd(), 'public', 'countries.txt'), 'utf-8'));
  }
}

export async function GET(req: NextRequest) {
  try {
    await loadCities();
    await loadAdmin();
    await loadCountries();

    const { searchParams } = new URL(req.url);
    const minPopulation = searchParams.get('minPopulation');
    const startsWith = searchParams.get('startsWith');
    const endsWith = searchParams.get('endsWith');
    const includes = searchParams.get('includes');
    let countries = searchParams.get('countries');
    const convertCharacters = searchParams.get('convertCharacters') === 'true';
    const searchAlternateNames = searchParams.get('searchAlternateNames') === 'true';

    if (!countries) return NextResponse.json([]);
    if (countries === 'all') countries = null;

    let filteredCities = cities.map((city) => Object.assign({}, city));

    if (countries) {
      const countryList = countries.split(',').map((code) => code.trim().toUpperCase());
      filteredCities = filteredCities.filter((city) => countryList.includes(city.countryCode.toUpperCase()));
    }

    if (minPopulation) {
      const minPop = parseInt(minPopulation, 10);
      filteredCities = filteredCities.filter((city) => city.population >= minPop);
    }

    if (startsWith || endsWith) {
      let startsWithNormalized = startsWith ? removeSpecial(startsWith.toLowerCase()) : '';
      let endsWithNormalized = endsWith ? removeSpecial(endsWith.toLowerCase()) : '';

      if (convertCharacters) {
        startsWithNormalized = anyAscii(startsWithNormalized);
        endsWithNormalized = anyAscii(endsWithNormalized);
      }

      filteredCities = filteredCities.filter((city) => {
        const checkCityName = (name: string) => {
          let normalized = removeSpecial(name.toLowerCase());

          if (convertCharacters) {
            normalized = anyAscii(normalized);
          }

          const startsWithCondition = startsWithNormalized ? normalized.startsWith(startsWithNormalized) : true;
          const endsWithCondition = endsWithNormalized ? normalized.endsWith(endsWithNormalized) : true;

          return startsWithCondition && endsWithCondition;
        };

        const cityNameMatches = checkCityName(city.name);
        const alternateNamesMatch = searchAlternateNames
          ? city.alternateNames
              .split(',')
              .map((name: string) => checkCityName(name))
              .some(Boolean)
          : false;

        return cityNameMatches || alternateNamesMatch;
      });
    }

    if (includes) {
      let parsedIncludes = includes
        .replace(/^[;]+|[;]+$/g, '')
        .split(';')
        .map((str) => str.toLowerCase());

      if (convertCharacters) {
        parsedIncludes = parsedIncludes.map((str) => anyAscii(str));
      }

      filteredCities = filteredCities.filter((city) => {
        const checkCityName = (name: string) => {
          let normalized = name.toLowerCase();

          if (convertCharacters) {
            normalized = anyAscii(normalized);
          }

          const includesCondition = parsedIncludes.length > 0 ? parsedIncludes.every((str) => normalized.includes(str)) : true;

          return includesCondition;
        };

        const cityNameMatches = checkCityName(city.name);
        const alternateNamesMatch = searchAlternateNames
          ? city.alternateNames
              .split(',')
              .map((name: string) => checkCityName(name))
              .some(Boolean)
          : false;

        return cityNameMatches || alternateNamesMatch;
      });
    }

    filteredCities = filteredCities.map((city) => ({
      ...city,
      countryRequired: false,
      admin1Required: false,
      admin2Required: false,
    }));

    for (const city of filteredCities) {
      let matches: City[] = [];
      if ((matches = cityMap.get(city.name.toLowerCase())?.filter((c) => c.id !== city.id && c.population > city.population) || []).length) {
        let countryRequired = false;
        let admin1Required = false;
        let admin2Required = false;

        for (const match of matches) {
          if (match.countryCode !== city.countryCode) {
            countryRequired = true;
          } else if (match.admin1 !== city.admin1) {
            admin1Required = true;
          } else if (match.admin2 !== city.admin2) {
            admin2Required = true;
          }
        }

        if (!countryRequired && !admin1Required && !admin2Required) continue;

        city.name +=
          ', ' +
          [admin1Required && admin1.get(`${city.countryCode}-${city.admin1}`), admin2Required && admin2.get(`${city.countryCode}-${city.admin1}-${city.admin2}`), countryRequired && city.countryCode]
            .filter(Boolean)
            .join(', ');

        city.countryRequired = countryRequired;
        city.admin1Required = admin1Required;
        city.admin2Required = admin2Required;
      }

      if (city.alternateNames === '') continue;

      matches = [];
      city.alternateNames = city.alternateNames.split(',').join(';');

      for (const name of city.alternateNames.split(';')) {
        if ((matches = cityMap.get(name.toLowerCase())?.filter((c) => c.id !== city.id) || []).length) {
          let countryRequired = false;
          let admin1Required = false;
          let admin2Required = false;

          for (const match of matches) {
            if (match.countryCode !== city.countryCode) {
              countryRequired = true;
            } else if (match.admin1 !== city.admin1) {
              admin1Required = true;
            } else if (match.admin2 !== city.admin2) {
              admin2Required = true;
            }
          }

          if (!countryRequired && !admin1Required && !admin2Required) continue;

          let alternateNames = city.alternateNames.split(';');

          alternateNames[alternateNames.indexOf(name)] =
            name +
            ', ' +
            [admin1Required && admin1.get(`${city.countryCode}-${city.admin1}`), admin2Required && admin2.get(`${city.countryCode}-${city.admin1}-${city.admin2}`), countryRequired && city.countryCode]
              .filter(Boolean)
              .join(', ');

          city.alternateNames = alternateNames.join(';');

          continue;
        }

        let match: { id: string; name: string; population: number; countryCode: string; admin1: string; admin2?: string } | undefined;

        if ((match = altNamesToPop.get(name.toLowerCase())) && match.population > city.population && match.id !== city.id) {
          let countryRequired = false;
          let admin1Required = false;
          let admin2Required = false;

          if (match.countryCode !== city.countryCode) {
            countryRequired = true;
          } else if (match.admin1 !== city.admin1) {
            admin1Required = true;
          } else if (match.admin2 !== city.admin2) {
            admin2Required = true;
          }

          if (!countryRequired && !admin1Required && !admin2Required) continue;

          let alternateNames = city.alternateNames.split(';');

          alternateNames[alternateNames.indexOf(name)] =
            name +
            ', ' +
            [admin1Required && admin1.get(`${city.countryCode}-${city.admin1}`), admin2Required && admin2.get(`${city.countryCode}-${city.admin1}-${city.admin2}`), countryRequired && city.countryCode]
              .filter(Boolean)
              .join(', ');

          city.alternateNames = alternateNames.join(';');
        }
      }
    }

    filteredCities = filteredCities.map((city) => ({
      ...city,
      ...(admin1.get(`${city.countryCode}-${city.admin1}`) != null && {
        admin1Name: admin1.get(`${city.countryCode}-${city.admin1}`),
      }),
    }));

    return NextResponse.json(filteredCities);
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error) ? error.message : error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
