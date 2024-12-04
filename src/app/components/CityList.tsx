import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { City } from '../types';
import anyAscii from 'any-ascii';
import { removeSpecial } from '../utils/helpers';

export const CityList = ({
  filteredCities,
  usedCities,
  toggleUsedCity,
  startsWith,
  endsWith,
  filterAltnames,
  convertCharacters,
}: {
  filteredCities: City[];
  usedCities: Set<string>;
  toggleUsedCity: (cityId: string) => void;
  startsWith: string;
  endsWith: string;
  filterAltnames: boolean;
  convertCharacters: boolean;
}) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: filteredCities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 21,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="List"
      style={{
        overflowY: 'auto',
        contain: 'strict',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: `${virtualizer.getTotalSize()}px`,
          margin: 0,
          padding: 0,
          width: '100%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualRow) => {
            const city = filteredCities[virtualRow.index];

            return (
              <div key={virtualRow.key} ref={virtualizer.measureElement} data-index={virtualRow.index}>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
