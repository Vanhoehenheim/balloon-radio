# Radio Station Feature Implementation

## Objective

Integrate functionality to find and play internet radio stations located near a selected Windborne balloon's current latitude and longitude.

## API Used

*   **Radio Browser API:** A community-driven, open-source database of internet radio stations.
    *   Documentation: [https://api.radio-browser.info/](https://api.radio-browser.info/)
    *   Server Discovery: Implemented fetching from multiple distributed API endpoints (derived from DNS or predefined list) for robustness.
    *   Endpoints Used:
        *   `/json/stations/search`: To fetch batches of stations with specific fields (including `geo_lat`, `geo_long`, `hls`, `clickcount`).
        *   `/json/url/{stationuuid}`: To increment station click count on playback attempt (fire-and-forget).

## Current Approach (Fetch All, Filter Locally)

1.  **Distributed Station Fetch (✅ Completed):**
    *   On application load, fetch large batches of station data concurrently from a predefined list of Radio Browser API server endpoints (`src/utils/fetchRadioStations.ts::fetchStationsDistributed`).
    *   Endpoints specify offsets, limits, and required fields (`geo_lat`, `geo_long`, `hls`, etc.) for efficiency.
    *   Combine results from all successful fetches.
    *   Deduplicate the combined list based on `stationuuid`.
    *   Filter the list to include only stations with valid `geo_lat` and `geo_long`.
    *   Store this final list of unique, geo-located stations in `FullMap.tsx` state (`allRadioStations`).
    *   Handle potential fetch errors gracefully and provide user feedback via toasts.
2.  **Local Filtering (✅ Completed):**
    *   Add a distance calculation utility (`src/utils/geoUtils.ts::getDistanceFromLatLonInKm`).
    *   In `FullMap.tsx`, add a `useEffect` hook that triggers when `selectedBalloon` or `allRadioStations` changes.
    *   If a balloon is selected and stations are loaded, filter the `allRadioStations` list:
        *   Calculate the distance from the selected balloon to each station.
        *   Keep only stations within a defined radius (`searchRadiusKm`).
        *   Sort the nearby stations by `clickcount` (descending).
        *   Limit the number of results (`maxFilteredResults`).
    *   Store the filtered list in `FullMap.tsx` state (`filteredStations`).
    *   Pass the `filteredStations` array to the `StationCard` component.
3.  **Station Card Update & HLS Playback (✅ Completed):**
    *   Update `StationCard.tsx` props to only receive `stations` (the filtered list).
    *   Add state for playback (`playingUrl`, `isPlaying`).
    *   Include a hidden HTML `<audio>` element (`audioRef`).
    *   **HLS Integration:**
        *   Install `hls.js` library.
        *   Add a ref (`hlsRef`) to manage the Hls instance.
        *   In the playback `useEffect`, check if the station is HLS (`station.hls === 1`) and if the browser supports HLS (`Hls.isSupported()`).
        *   If HLS: Instantiate `hls.js`, attach it to the `<audio>` element, load the source, and handle HLS-specific errors.
        *   If not HLS (or HLS not supported): Use standard `<audio.src>` playback.
        *   Ensure proper cleanup (destroying Hls instance, pausing audio) when playback stops, card hides, or component unmounts.
    *   Implement `handlePlayPause` to update playback state (`playingUrl`, `isPlaying`) and trigger the fire-and-forget click count API call.
    *   Modify UI: Use `ScrollArea`, display station info (favicon, name, country), and show the Play/Pause button (no longer disabled specifically for HLS).

## Implementation Details

*(Note: Code snippets below may be slightly outdated compared to the latest implementation described above. Refer to the actual code files for the most current version.)*

### `src/utils/fetchRadioStations.ts` (Conceptual)

```typescript
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

// Predefined list of API endpoints with specific parameters
const RADIO_API_ENDPOINTS = [ /* ... URLs ... */ ];
const USER_AGENT = 'RadioVista/0.1';

export const fetchStationsDistributed = async (): Promise<RadioStation[]> => {
  // 1. Fetch concurrently from RADIO_API_ENDPOINTS using Promise.all
  //    - Handle individual errors, return null on failure
  // 2. Combine results from successful fetches
  // 3. Deduplicate using stationuuid and a Map
  // 4. Filter for valid geo_lat and geo_long
  // 5. Log progress and results, show toasts
  // 6. Return final array
};
```

### `src/utils/geoUtils.ts` (✅ Completed)

```typescript
export function getDistanceFromLatLonInKm(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  // ... Haversine formula implementation ...
}

function deg2rad(deg: number): number { /* ... */ }
```

### `src/components/FullMap.tsx` (Conceptual Changes)

```typescript
import { RadioStation, fetchStationsDistributed } from '@/utils/fetchRadioStations';
import { getDistanceFromLatLonInKm } from '@/utils/geoUtils';
// ... other imports

const FullMap: React.FC<FullMapProps> = () => {
  // State for balloons
  const [selectedBalloon, setSelectedBalloon] = useState<Balloon | null>(null);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [isLoadingBalloons, setIsLoadingBalloons] = useState<boolean>(false);
  // State for ALL stations
  const [allRadioStations, setAllRadioStations] = useState<RadioStation[]>([]);
  const [isLoadingAllStations, setIsLoadingAllStations] = useState<boolean>(true);
  // State for FILTERED stations
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>([]);
  // ... other state (map, mapRef, selectedHour)

  const searchRadiusKm = 500; // Example value
  const maxFilteredResults = 10;

  // Function to load ALL stations on mount
  const loadAllRadioStations = async () => {
    setIsLoadingAllStations(true);
    const stations = await fetchStationsDistributed();
    setAllRadioStations(stations);
    setIsLoadingAllStations(false);
  };

  // useEffect to load initial balloons AND all stations
  useEffect(() => {
    loadBalloonData(0);
    loadAllRadioStations();
  }, []);

  // useEffect to FILTER stations when selection or data changes
  useEffect(() => {
    if (selectedBalloon && allRadioStations.length > 0) {
      // 1. Map stations to include distance
      // 2. Filter by searchRadiusKm
      // 3. Sort by clickcount
      // 4. Slice by maxFilteredResults
      const nearby = /* ... filtering logic ... */ ;
      setFilteredStations(nearby);
    } else {
      setFilteredStations([]);
    }
  }, [selectedBalloon, allRadioStations]);

  return (
    // ... JSX ...
      {/* Attribution showing loaded station count */}
      <div className="absolute bottom-4 left-4 ...">
        {isLoadingAllStations ? "Loading..." : `${allRadioStations.length} stations loaded.`}
      </div>
      {/* Station card - PASS FILTERED STATIONS */}
      <div className="absolute bottom-6 ...">
        <StationCard
          balloon={selectedBalloon}
          stations={filteredStations} // Pass filtered list
          onClose={() => setSelectedBalloon(null)}
        />
      </div>
    // ... JSX ...
  );
};
```

### `src/components/StationCard.tsx` (Conceptual Changes)

```typescript
import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js'; // Import HLS
// ... other imports

interface StationCardProps {
  balloon: Balloon | null;
  stations: RadioStation[]; // Filtered list passed in
  onClose: () => void;
}

const StationCard: React.FC<StationCardProps> = ({ /* ...props */ }) => {
  // ... state (isVisible, playingUrl, isPlaying)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null); // Ref for HLS instance

  // Playback useEffect - Handles both HLS and standard streams
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playingUrl || !isPlaying) {
        // Stop playback logic (pause audio, destroy HLS)
        return; // Or handle stop logic
    }

    const currentStation = stations.find(s => (s.url_resolved || s.url) === playingUrl);
    const isHls = currentStation?.hls === 1;

    if (isHls && Hls.isSupported()) {
        // Setup HLS: new Hls(), attachMedia, loadSource, add error listeners
        hlsRef.current = new Hls(/* config */);
        // ... attach, load ...
    } else if (isHls && !Hls.isSupported()) {
        // Show HLS not supported error
        toast.error("HLS not supported");
    } else {
        // Setup standard playback: audio.src = playingUrl;
    }

    audio.play().catch(e => { /* handle error */ });

    // Cleanup function: destroy HLS instance, pause audio
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      audio?.pause();
    };
  }, [playingUrl, isPlaying, stations]);

  const handlePlayPause = (station: RadioStation) => {
    // Logic to set playingUrl and isPlaying state
    // Increment click count API call
    // NO HLS check needed here anymore
  };

  return (
    // ... JSX ...
        {/* Play/Pause Button - Enabled for HLS now */}
        <Button
          // ... props ...
          disabled={!station.url_resolved && !station.url}
        >
          {/* Icon logic */}
        </Button>
    // ... JSX ...
  );
};