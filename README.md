# Cities Chain Search

A geonames helper for [cities chain](https://github.com/GlutenFreeGrapes/cities-chain). Find valid cities from a geonames dump with an easy interface.

## Features

- Search one or more countries
- Filter by population and start/end names
- Sort by population, alphabetical order or used status
- Toggle options incl.
  - Convert accented characters (e.g. `ö` to `o`)
  - Search alternate names of cities
- Mark cities as `used` to keep track of which cities have already been guessed
  - Option to display only unused cities in the search results
- Local storage is used to save:
  - Filter settings (e.g., minimum population, selected countries, starts/ends with values)
  - City usage status (used/unused)
- Cities are loaded from the [official cities chain bot repo](https://github.com/GlutenFreeGrapes/cities-chain) to ensure up-to-date data

## Usage

Visit https://cities.trimpsuz.dev  
OR locally:

```bash
git clone https://github.com/Trimpsuz/cities-chain-search
cd cities-chain-search
bun install
bun run dev
```

## Contributing

- Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

## License

- The project is licensed under AGPL 3.0. See the [LICENSE](LICENSE) file for more details.
