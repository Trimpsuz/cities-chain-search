'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import anyAscii from 'any-ascii';
import Multiselect from 'multiselect-react-dropdown';
import { removeSpecial } from './utils/helpers';
import type { City } from './types';
import { Modal } from './components/Modal';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

interface Country {
  code: string;
  name: string;
}

const saveUsedCitiesToDatabase = async (userId: string, usedCities: Set<string>) => {
  const citiesArray = Array.from(usedCities);
  const { data, error } = await supabase.from('user_used_cities').select('*').eq('user_id', userId).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching used cities:', error.message);
    return;
  }

  if (data) {
    const { error: updateError } = await supabase.from('user_used_cities').update({ used_cities: citiesArray }).eq('user_id', userId);

    if (updateError) {
      console.error('Error updating used cities:', updateError.message);
    }
  } else {
    const { error: insertError } = await supabase.from('user_used_cities').insert([{ user_id: userId, used_cities: citiesArray }]);

    if (insertError) {
      console.error('Error inserting used cities:', insertError.message);
    }
  }
};

const fetchUsedCitiesFromDatabase = async (userId: string) => {
  const { data, error } = await supabase.from('user_used_cities').select('used_cities').eq('user_id', userId).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching used cities:', error.message);
    return [];
  }

  return data?.used_cities || [];
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);

      if (data?.user) {
        const citiesFromDb = await fetchUsedCitiesFromDatabase(data.user.id);
        if (citiesFromDb) setUsedCities(new Set(citiesFromDb));
        const savedUsedCities = localStorage.getItem('usedCities');
        if (citiesFromDb.length === 0 && savedUsedCities && JSON.parse(savedUsedCities).length !== 0) saveUsedCitiesToDatabase(data.user.id, new Set(JSON.parse(savedUsedCities)));
      }

      setLoading(false);
    })();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUsedCitiesFromDatabase(session.user.id).then((cities) => {
          if (cities) setUsedCities(new Set(cities));
        });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = supabase
      .channel('user_used_cities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_used_cities' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setUsedCities(new Set(payload.new.used_cities || []));
          if (payload.new.used_cities.length === 0) localStorage.setItem('usedCities', JSON.stringify([]));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
    });

    if (error) console.error('Error logging in with Discord:', error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
    else setUser(null);
  };

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
    const newUsedCities = new Set(usedCities);
    if (newUsedCities.has(cityId)) {
      newUsedCities.delete(cityId);
    } else {
      newUsedCities.add(cityId);
    }

    setUsedCities(newUsedCities);

    if (user) saveUsedCitiesToDatabase(user.id, newUsedCities);
  };

  const clearAllUsedCities = useCallback(() => {
    setUsedCities(new Set());
    localStorage.setItem('usedCities', JSON.stringify([]));
    if (user) saveUsedCitiesToDatabase(user.id, new Set());
    setClearModalOpen(false);
  }, [localStorage, user]);

  const selectAllCountries = useCallback(() => {
    setSelectedCountries(countries);
    setSelectAllModalOpen(false);
  }, [countries]);

  const handleCloseClearModal = useCallback(() => setClearModalOpen(false), []);
  const handleCloseSelectAllModal = useCallback(() => setSelectAllModalOpen(false), []);

  const clearModal = useMemo(
    () => (
      <Modal
        isOpen={isClearModalOpen}
        onClose={handleCloseClearModal}
        onConfirm={clearAllUsedCities}
        text="Are you sure you want to clear all used cities? If you are logged in this will clear the from all your devices."
      />
    ),
    [isClearModalOpen, clearAllUsedCities, handleCloseClearModal]
  );

  const selectAllModal = useMemo(
    () => (
      <Modal
        isOpen={isSelectAllModalOpen}
        onClose={handleCloseSelectAllModal}
        onConfirm={selectAllCountries}
        text="Are you sure you want to select all countries? Selecting all can make the site slow."
      />
    ),
    [isSelectAllModalOpen, selectAllCountries, handleCloseSelectAllModal]
  );

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
      } else if (sortOption === 'nameLength') {
        const aNames = searchAlternateNames ? [a.name, ...(a.alternateNames?.split(',').filter((name) => name.trim() !== '') || [])] : [a.name];
        const bNames = searchAlternateNames ? [b.name, ...(b.alternateNames?.split(',').filter((name) => name.trim() !== '') || [])] : [b.name];

        const aMinLength = Math.min(...aNames.map((name) => name.length));
        const bMinLength = Math.min(...bNames.map((name) => name.length));

        comparison = aMinLength - bMinLength;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sortedCities;
  };

  useEffect(() => {
    setCities(sortCities(cities));
  }, [sortOption, sortDirection, usedCities]);

  const filteredCities = showUnusedCitiesOnly ? cities.filter((city) => !usedCities.has(city.id)) : cities;

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ marginRight: '1rem' }}>Cities Chain Search</h1>
        <a href="https://github.com/trimpsuz/cities-chain-search" style={{ textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" fill="#ededed">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          {!user ? (
            <button
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: '#5865F2',
                color: '#ededed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                borderRadius: '4px',
              }}
              onClick={handleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="#ededed" width="20" height="20">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              Log in
            </button>
          ) : (
            <button
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: '#5865F2',
                color: '#ededed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                borderRadius: '4px',
              }}
              onClick={handleLogout}
            >
              {user?.user_metadata?.name.split('#')[0] || 'User'}, Log out
            </button>
          )}
        </div>
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
          <option value="nameLength">Length</option>
        </select>
        <button style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
          {sortDirection === 'asc' ? '⬆️ Ascending' : '⬇️ Descending'}
        </button>
      </div>
      <button style={{ marginBottom: '1rem', cursor: 'pointer' }} onClick={fetchCities}>
        Search
      </button>

      {clearModal}
      {selectAllModal}

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
