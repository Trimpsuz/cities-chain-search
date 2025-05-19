import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json([
    {
      geonameid: '6255146',
      continent: 'AF',
      name: 'Africa',
    },
    {
      geonameid: '6255147',
      continent: 'AS',
      name: 'Asia',
    },
    {
      geonameid: '6255148',
      continent: 'EU',
      name: 'Europe',
    },
    {
      geonameid: '6255149',
      continent: 'NA',
      name: 'North America',
    },
    {
      geonameid: '6255151',
      continent: 'OC',
      name: 'Oceania',
    },
    {
      geonameid: '6255150',
      continent: 'SA',
      name: 'South America',
    },
    {
      geonameid: '6255152',
      continent: 'AN',
      name: 'Antarctica',
    },
  ]);
}
