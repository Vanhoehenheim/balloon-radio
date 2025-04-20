import { toast } from '@/components/ui/sonner';

// Based on https://de1.api.radio-browser.info/#Struct_Station
export interface RadioStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string; // DEPRECATED by API, but might still be present
  countrycode: string;
  state: string;
  language: string; // DEPRECATED by API
  languagecodes: string;
  votes: number;
  lastchangetime_iso8601: string;
  codec: string;
  bitrate: number;
  hls: number; // 0 or 1
  lastcheckok: number; // 0 or 1
  lastchecktime_iso8601: string;
  lastcheckoktime_iso8601: string;
  clicktimestamp_iso8601: string | null;
  clickcount: number;
  clicktrend: number;
  ssl_error: number; // 0 or 1
  geo_lat: number | null;
  geo_long: number | null;
  has_extended_info?: boolean;
}

// Define the list of specific API endpoints provided by the user
// Based on: https://api.radio-browser.info/
// And user-provided URLs (offsets/limits)
const RADIO_API_ENDPOINTS = [
    // Base URL                                       Path + Query Params (user specified offset/limit)
    "https://de1.api.radio-browser.info/json/stations/search?offset=500&limit=1000&hidebroken=true&has_geo_info=true&order=clickcount&reverse=true&fields=name,url_resolved,url,favicon,countrycode,state,stationuuid,geo_lat,geo_long,tags,clickcount",
    "https://fi1.api.radio-browser.info/json/stations/search?offset=1500&limit=1500&hidebroken=true&has_geo_info=true&order=clickcount&reverse=true&fields=name,url_resolved,url,favicon,countrycode,state,stationuuid,geo_lat,geo_long,tags,clickcount",
    "https://at1.api.radio-browser.info/json/stations/search?offset=3000&limit=2000&hidebroken=true&has_geo_info=true&order=clickcount&reverse=true&fields=name,url_resolved,url,favicon,countrycode,state,stationuuid,geo_lat,geo_long,tags,clickcount",
    "https://de1.api.radio-browser.info/json/stations/search?offset=5000&limit=2500&hidebroken=true&has_geo_info=true&order=clickcount&reverse=true&fields=name,url_resolved,url,favicon,countrycode,state,stationuuid,geo_lat,geo_long,tags,clickcount",
    "https://de2.api.radio-browser.info/json/stations/search?offset=7500&limit=3000&hidebroken=true&has_geo_info=true&order=clickcount&reverse=true&fields=name,url_resolved,url,favicon,countrycode,state,stationuuid,geo_lat,geo_long,tags,clickcount",
];

const USER_AGENT = 'RadioVista/0.1'; // Define User-Agent

/**
 * Fetches radio stations concurrently from a predefined list of API endpoints.
 * Deduplicates results and filters for valid geo-location.
 * @returns Promise<RadioStation[]>
 */
export const fetchStationsDistributed = async (): Promise<RadioStation[]> => {
  toast.info(`Fetching radio stations from multiple sources...`);

  const fetchPromises = RADIO_API_ENDPOINTS.map(url => 
    fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        return response.json();
      })
      .catch(error => {
          return null;
      })
  );

  const results = await Promise.all(fetchPromises);

  let allStations: RadioStation[] = [];
  let successfulFetches = 0;
  let failedFetches = 0;

  results.forEach((result, index) => {
    if (result && Array.isArray(result)) {
      allStations = allStations.concat(result);
      successfulFetches++;
    } else {
       if(result === null) {
           failedFetches++;
       }
    }
  });

  const stationMap = new Map<string, RadioStation>();
  allStations.forEach(station => {
    if (!stationMap.has(station.stationuuid)) {
      stationMap.set(station.stationuuid, station);
    }
  });
  const uniqueStations = Array.from(stationMap.values());

  const geoStations = uniqueStations.filter(s => s.geo_lat != null && s.geo_long != null);

  if (geoStations.length > 0) {
     toast.success(`Successfully loaded ${geoStations.length} unique radio stations.`);
  } else if (successfulFetches > 0) {
      toast.warning("Fetched station data, but none had valid location info.");
  } else {
      toast.error("Failed to fetch any radio station data.");
  }

  return geoStations;
}; 