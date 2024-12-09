import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseGeonames } from '../../utils/parseGeonames';
import anyAscii from 'any-ascii';
import { removeSpecial } from '../../utils/helpers';
import type { City } from '../../types';

let cities: City[] = [];

async function loadCities() {
  if (cities.length === 0) {
    try {
      const response = await axios.get('https://raw.githubusercontent.com/GlutenFreeGrapes/cities-chain/refs/heads/main/data/cities.txt');
      cities = parseGeonames(response.data).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to fetch city data: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    await loadCities();

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

    let filteredCities = cities;

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

    return NextResponse.json(filteredCities);
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error) ? error.message : error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
