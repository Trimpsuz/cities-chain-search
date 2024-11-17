'use client';

import React, { useState, useEffect } from 'react';
import removeAccents from 'remove-accents';

interface City {
  id: string;
  name: string;
  population: number;
  alternateNames?: string;
}

export default function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [minPopulation, setMinPopulation] = useState('');
  const [startsWith, setStartsWith] = useState('');
  const [endsWith, setEndsWith] = useState('');
  const [convertCharacters, setConvertCharacters] = useState(false);
  const [searchAlternateNames, setSearchAlternateNames] = useState(false);
  const [filterAltnames, setFilterAltnames] = useState(false);

  const fetchCities = async () => {
    const params = new URLSearchParams();
    if (minPopulation) params.append('minPopulation', minPopulation);
    if (startsWith) params.append('startsWith', startsWith);
    if (endsWith) params.append('endsWith', endsWith);
    params.append('convertCharacters', String(convertCharacters));
    params.append('searchAlternateNames', String(searchAlternateNames));

    const response = await fetch(`/api/cities?${params.toString()}`);
    const data = await response.json();
    setCities(data);
  };

  useEffect(() => {
    fetchCities();
  }, [minPopulation, startsWith, endsWith, convertCharacters, searchAlternateNames]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ marginRight: '1rem' }}>Cities Chain Search</h1>
        <a href="https://github.com/trimpsuz/cities-chain-search" style={{ textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" fill="#ededed">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Min Population:
          <input type="number" value={minPopulation} onChange={(e) => setMinPopulation(e.target.value)} />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Starts With:
          <input type="text" value={startsWith} onChange={(e) => setStartsWith(e.target.value)} />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Ends With:
          <input type="text" value={endsWith} onChange={(e) => setEndsWith(e.target.value)} />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Convert Accent Characters: <input type="checkbox" checked={convertCharacters} onChange={(e) => setConvertCharacters(e.target.checked)} />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Search Alternate Names: <input type="checkbox" checked={searchAlternateNames} onChange={(e) => setSearchAlternateNames(e.target.checked)} />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Only Show Compatible Alternate Names: <input type="checkbox" checked={filterAltnames} onChange={(e) => setFilterAltnames(e.target.checked)} />
        </label>
      </div>
      <button style={{ marginBottom: '1rem' }} onClick={fetchCities}>
        Search
      </button>
      <ul>
        {cities.map((city) => (
          <li key={city.id}>
            {city.name} (Population: {city.population})
            {city.alternateNames?.length
              ? filterAltnames
                ? convertCharacters
                  ? ` [Alt Names: ${city.alternateNames
                      .split(',')
                      .filter((name) => removeAccents(name.toLowerCase()).startsWith(removeAccents(startsWith.toLowerCase())))
                      .join(', ')}]`
                  : ` [Alt Names: ${city.alternateNames
                      .split(',')
                      .filter((name) => name.toLowerCase().startsWith(startsWith.toLowerCase()))
                      .join(', ')}]`
                : ` [Alt Names: ${city.alternateNames.split(',').join(', ')}]`
              : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
