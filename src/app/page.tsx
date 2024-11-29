'use client';

import React, { useState, useEffect, useRef } from 'react';
import anyAscii from 'any-ascii';
import Multiselect from 'multiselect-react-dropdown';
import { removeSpecial } from './utils/helpers';
import type { City } from './types';
import { Modal } from './components/Modal';
import axios from 'axios';

interface Country {
  code: string;
  name: string;
}

export default function Home() {
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const citiesRef = useRef<City[]>(cities);
  const [minPopulation, setMinPopulation] = useState('1000');
  const [startsWith, setStartsWith] = useState('');
  const [endsWith, setEndsWith] = useState('');
  const [convertCharacters, setConvertCharacters] = useState(false);
  const [searchAlternateNames, setSearchAlternateNames] = useState(false);
  const [filterAltnames, setFilterAltnames] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  const [usedCities, setUsedCities] = useState<Set<string>>(new Set());
  const [showUnusedCitiesOnly, setShowUnusedCitiesOnly] = useState(false);
  const [isClearModalOpen, setClearModalOpen] = useState(false);
  const [isSelectAllModalOpen, setSelectAllModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState('alphabetical');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    citiesRef.current = cities;
  }, [cities]);

  useEffect(() => {
    const savedMinPopulation = localStorage.getItem('minPopulation');
    const savedSelectedCountries = localStorage.getItem('selectedCountries');
    const savedStartsWith = localStorage.getItem('startsWith');
    const savedEndsWith = localStorage.getItem('endsWith');
    const savedConvertCharacters = localStorage.getItem('convertCharacters');
    const savedSearchAlternateNames = localStorage.getItem('searchAlternateNames');
    const savedFilterAltnames = localStorage.getItem('filterAltnames');
    const savedUsedCities = localStorage.getItem('usedCities');
    const savedShowUnusedCitiesOnly = localStorage.getItem('showUnusedCitiesOnly');
    const savedSortOption = localStorage.getItem('sortOption');
    const savedSortDirection = localStorage.getItem('sortDirection');

    if (savedMinPopulation) setMinPopulation(savedMinPopulation);
    if (savedSelectedCountries) setSelectedCountries(JSON.parse(savedSelectedCountries));
    if (savedStartsWith) setStartsWith(savedStartsWith);
    if (savedEndsWith) setEndsWith(savedEndsWith);
    if (savedConvertCharacters) setConvertCharacters(JSON.parse(savedConvertCharacters));
    if (savedSearchAlternateNames) setSearchAlternateNames(JSON.parse(savedSearchAlternateNames));
    if (savedFilterAltnames) setFilterAltnames(JSON.parse(savedFilterAltnames));
    if (savedUsedCities) setUsedCities(new Set(JSON.parse(savedUsedCities)));
    if (savedShowUnusedCitiesOnly) setShowUnusedCitiesOnly(JSON.parse(savedShowUnusedCitiesOnly));
    if (savedSortOption) setSortOption(savedSortOption);
    if (savedSortDirection) setSortDirection(savedSortDirection);
  }, []);

  useEffect(() => {
    localStorage.setItem('minPopulation', minPopulation);
    localStorage.setItem('selectedCountries', JSON.stringify(selectedCountries));
    localStorage.setItem('startsWith', startsWith);
    localStorage.setItem('endsWith', endsWith);
    localStorage.setItem('convertCharacters', JSON.stringify(convertCharacters));
    localStorage.setItem('searchAlternateNames', JSON.stringify(searchAlternateNames));
    localStorage.setItem('filterAltnames', JSON.stringify(filterAltnames));
    if (usedCities.size !== 0) localStorage.setItem('usedCities', JSON.stringify(Array.from(usedCities)));
    localStorage.setItem('showUnusedCitiesOnly', JSON.stringify(showUnusedCitiesOnly));
    localStorage.setItem('sortOption', sortOption);
    localStorage.setItem('sortDirection', sortDirection);
  }, [minPopulation, selectedCountries, startsWith, endsWith, convertCharacters, searchAlternateNames, filterAltnames, usedCities, showUnusedCitiesOnly, sortOption, sortDirection]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'usedCities' && event.newValue !== null && event.newValue !== event.oldValue) {
        setUsedCities(new Set(JSON.parse(event.newValue)));
        setCities(sortCities(citiesRef.current));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchCities = async () => {
    if (countries.length === 0) return;

    const params = new URLSearchParams();
    if (minPopulation) params.append('minPopulation', minPopulation);
    if (startsWith) params.append('startsWith', startsWith);
    if (endsWith) params.append('endsWith', endsWith);
    params.append('convertCharacters', String(convertCharacters));
    params.append('searchAlternateNames', String(searchAlternateNames));

    if (selectedCountries.length > 0) {
      if (selectedCountries.length === countries.length) {
        if (!startsWith && !endsWith) return setCities([]);
        params.append('countries', 'all');
      } else {
        params.append('countries', selectedCountries.map((country) => country.code).join(','));
      }

      const data = (await axios.get(`/api/cities?${params.toString()}`)).data;
      setCities(sortCities(data));
    } else {
      setCities([]);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [minPopulation, startsWith, endsWith, convertCharacters, searchAlternateNames, selectedCountries, countries]);

  useEffect(() => {
    const fetchCountries = async () => {
      const data = (await axios.get('/api/countries')).data;
      setCountries(data);
    };
    fetchCountries();
  }, []);

  const toggleUsedCity = (cityId: string) => {
    setUsedCities((prev) => {
      const newUsedCities = new Set(prev);
      if (newUsedCities.has(cityId)) {
        newUsedCities.delete(cityId);
      } else {
        newUsedCities.add(cityId);
      }
      return newUsedCities;
    });
  };

  const clearAllUsedCities = () => {
    setUsedCities(new Set());
    setClearModalOpen(false);
  };

  const selectAllCountries = () => {
    setSelectedCountries(countries);
    setSelectAllModalOpen(false);
  };

  const sortCities = (citiesToSort: City[]) => {
    const sortedCities = [...citiesToSort];
    sortedCities.sort((a, b) => {
      let comparison = 0;

      if (sortOption === 'alphabetical') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortOption === 'population') {
        comparison = a.population - b.population;
      } else if (sortOption === 'usedStatus') {
        const aUsed = usedCities.has(a.id);
        const bUsed = usedCities.has(b.id);
        comparison = aUsed === bUsed ? 0 : aUsed ? 1 : -1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sortedCities;
  };

  useEffect(() => {
    setCities(sortCities(cities));
  }, [sortOption, sortDirection, usedCities]);

  const filteredCities = showUnusedCitiesOnly ? cities.filter((city) => !usedCities.has(city.id)) : cities;

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
        <Multiselect
          options={countries}
          selectedValues={selectedCountries}
          displayValue="name"
          onSelect={(selectedList: Country[]) => setSelectedCountries(selectedList)}
          onRemove={(selectedList: Country[]) => setSelectedCountries(selectedList)}
          closeIcon="cancel"
          showCheckbox={true}
          avoidHighlightFirstOption={true}
          placeholder="Select Countries"
          isObject={true}
          style={{
            optionContainer: {
              backgroundColor: '#0a0a0a',
            },
            option: {
              color: '#ededed',
            },
          }}
        />
        <div style={{ marginTop: '1rem' }}>
          <button
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => setSelectAllModalOpen(true)}
          >
            Select All
          </button>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4d4d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedCountries([])}
          >
            Deselect All
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>Min Population: </label>
        <input type="number" value={minPopulation} onChange={(e) => setMinPopulation(e.target.value)} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Starts With: </label>
        <input type="text" value={startsWith} onChange={(e) => setStartsWith(e.target.value)} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Ends With: </label>
        <input type="text" value={endsWith} onChange={(e) => setEndsWith(e.target.value)} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Romanize Characters: </label>
        <input type="checkbox" style={{ cursor: 'pointer' }} checked={convertCharacters} onChange={(e) => setConvertCharacters(e.target.checked)} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Search Alternate Names: </label>
        <input type="checkbox" style={{ cursor: 'pointer' }} checked={searchAlternateNames} onChange={(e) => setSearchAlternateNames(e.target.checked)} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Only Show Compatible Alternate Names: </label>
        <input type="checkbox" style={{ cursor: 'pointer' }} checked={filterAltnames} onChange={(e) => setFilterAltnames(e.target.checked)} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Only Show Unused Cities: </label>
        <input type="checkbox" style={{ cursor: 'pointer' }} checked={showUnusedCitiesOnly} onChange={() => setShowUnusedCitiesOnly(!showUnusedCitiesOnly)} />
        <br />
        <button
          style={{
            padding: '2px 8px',
            backgroundColor: '#ff4d4d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={() => setClearModalOpen(true)}
        >
          Clear All Used Cities
        </button>
      </div>
      <div style={{ marginBottom: '0.5rem', flexDirection: 'column' }}>
        <label>Sort: </label>
        <select style={{ cursor: 'pointer' }} value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="alphabetical">Alphabetical</option>
          <option value="population">Population</option>
          <option value="usedStatus">Used/Unused</option>
        </select>
        <button style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
          {sortDirection === 'asc' ? '⬆️ Ascending' : '⬇️ Descending'}
        </button>
      </div>
      <button style={{ marginBottom: '1rem', cursor: 'pointer' }} onClick={fetchCities}>
        Search
      </button>

      <Modal isOpen={isClearModalOpen} onClose={() => setClearModalOpen(false)} onConfirm={clearAllUsedCities} text="Are you sure you want to clear all used cities?" />
      <Modal
        isOpen={isSelectAllModalOpen}
        onClose={() => setSelectAllModalOpen(false)}
        onConfirm={selectAllCountries}
        text="Are you sure you want to select all countries? Selecting all can make the site slow."
      />

      <ul>
        {filteredCities.map((city) => (
          <li key={city.id}>
            <button style={{ cursor: 'pointer' }} onClick={() => toggleUsedCity(city.id)}>
              {usedCities.has(city.id) ? '✅' : '❌'}
            </button>{' '}
            {city.name} (Population: {city.population})
            {city.alternateNames?.length
              ? filterAltnames
                ? convertCharacters
                  ? ` [Alt Names: ${city.alternateNames
                      .split(',')
                      .filter(
                        (name) =>
                          anyAscii(removeSpecial(name.toLowerCase())).startsWith(anyAscii(removeSpecial(startsWith.toLowerCase()))) &&
                          anyAscii(removeSpecial(name.toLowerCase())).endsWith(anyAscii(removeSpecial(endsWith.toLowerCase())))
                      )
                      .join(', ')}]`
                  : ` [Alt Names: ${city.alternateNames
                      .split(',')
                      .filter(
                        (name) =>
                          removeSpecial(name.toLowerCase()).startsWith(removeSpecial(startsWith.toLowerCase())) && removeSpecial(name.toLowerCase()).endsWith(removeSpecial(endsWith.toLowerCase()))
                      )
                      .join(', ')}]`
                : ` [Alt Names: ${city.alternateNames.split(',').join(', ')}]`
              : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
