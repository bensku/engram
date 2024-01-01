import { OptionType } from '../../chat/options';
import { registerTool } from '../core';
import { JSONSchemaType } from 'ajv';

const SCHEMA: JSONSchemaType<{ location: string }> = {
  type: 'object',
  properties: {
    location: {
      type: 'string',
      description:
        'Location, e.g. a city or municipality name. Expand shorthand names (e.g. airport identifiers) to full place names.',
    },
  },
  required: ['location'],
  additionalProperties: false,
};

registerTool({
  enableOption: new OptionType(
    'toggle',
    'weather-forecast',
    'Weather Forecast',
  ),
  name: 'weather_forecast',
  purpose: 'Provide weather forecasts',
  description:
    'Retrieves the current weather and 5-day weather forecast for given location.',
  result: 'A weather forecast, including current weather.',
  guidance:
    'Use weather_forecast when asked about current or near-future weather',
  argsSchema: SCHEMA,
  preHandler: (args) => {
    return Promise.resolve({
      callTitle: `Getting weather at ${args.location}...`,
    });
  },
  handler: async (args) => {
    const reply = await callApi(args.location);
    return {
      message: reply,
    };
  },
});

const API_KEY = process.env.OPENWEATHERMAP_KEY ?? '';

async function callApi(location: string) {
  // FIXME find a better geocoding API, this one expects the location to be in City,Country format
  const coords = (await (
    await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`,
    )
  ).json()) as GeocodeResult;

  const forecast = (await (
    await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${coords[0].lat}&lon=${coords[0].lon}&appid=${API_KEY}&units=metric`,
    )
  ).json()) as WeatherForecast;

  const current = (await (
    await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords[0].lat}&lon=${coords[0].lon}&appid=${API_KEY}&units=metric`,
    )
  ).json()) as CurrentWeather;

  const resolvedLoc = `${coords[0].name}, ${coords[0].country}`;
  return `
Current Weather at ${resolvedLoc}:
Temperature: ${current.main.temp} °C (feels like ${current.main.feels_like} °C)
Weather: ${current.weather[0].description}
Wind speed: ${current.wind.speed} m/s  (gusts ${current.wind.gust} m/s)
Probability of precipitation: ${current.pop * 100}%
Average visibility: ${current.visibility} m
Sunrise: ${new Date(current.sys.sunrise * 1000).toTimeString()}
Sunset: ${new Date(current.sys.sunset * 1000).toTimeString()}

5-day forecast, 3 hour accuracy:
${forecast.list.map(printEntry).join('\n\n')}
`;
}

function printEntry(entry: WeatherEntry) {
  return `${new Date(entry.dt * 1000).toDateString()}:
  Temperature: ${entry.main.temp} °C (feels like ${entry.main.feels_like} °C)
  Weather: ${entry.weather[0].description}
  Wind speed: ${entry.wind.speed} m/s  (gusts ${entry.wind.gust} m/s)
  Probability of precipitation: ${entry.pop * 100}%
  Average visibility: ${entry.visibility} m`;
}

type GeocodeResult = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state: string;
}[];

interface WeatherEntry {
  dt: number;
  main: { temp: number; feels_like: number };
  weather: { main: string; description: string }[];
  clouds: { all: number };
  wind: { speed: number; gust: number };
  visibility: number;
  pop: number;
  // Note that this is incomplete, omitting unused fields - see API docs for more
}

type CurrentWeather = WeatherEntry & {
  sys: {
    sunrise: number;
    sunset: number;
  };
};

interface WeatherForecast {
  list: WeatherEntry[];
}
