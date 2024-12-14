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
  includes,
  filterAltnames,
  convertCharacters,
}: {
  filteredCities: City[];
  usedCities: Set<string>;
  toggleUsedCity: (cityId: string) => void;
  startsWith: string;
  endsWith: string;
  includes: string;
  filterAltnames: boolean;
  convertCharacters: boolean;
}) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: filteredCities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 21,
    paddingEnd: 32,
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
            const altNames = city.alternateNames
              .split(';')
              .map((str) => str.split(',')[0])
              .filter((name) => {
                const processedName = convertCharacters ? anyAscii(removeSpecial(name.toLowerCase())) : removeSpecial(name.toLowerCase());
                let parsedIncludes = includes
                  .replace(/^[;]+|[;]+$/g, '')
                  .split(';')
                  .map((str) => str.toLowerCase());
                if (convertCharacters) {
                  parsedIncludes = parsedIncludes.map((str) => anyAscii(str));
                }

                return (
                  processedName.startsWith(convertCharacters ? anyAscii(removeSpecial(startsWith.toLowerCase())) : removeSpecial(startsWith.toLowerCase())) &&
                  processedName.endsWith(convertCharacters ? anyAscii(removeSpecial(endsWith.toLowerCase())) : removeSpecial(endsWith.toLowerCase())) &&
                  parsedIncludes.every((str) => processedName.includes(str))
                );
              })
              .join('; ');

            return (
              <div key={virtualRow.key} ref={virtualizer.measureElement} data-index={virtualRow.index}>
                <button style={{ cursor: 'pointer' }} onClick={() => toggleUsedCity(city.id)}>
                  {usedCities.has(city.id) ? '✅' : '❌'}
                </button>{' '}
                {city.name} (Population: {city.population})
                {city.alternateNames?.length ? (filterAltnames ? (altNames ? ` [Alt Names: ${altNames}]` : '') : ` [Alt Names: ${city.alternateNames.split(';').join('; ')}]`) : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
