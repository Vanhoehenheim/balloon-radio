import { getWindborneUrl } from "./corsProxy";
import { toast } from "@/components/ui/sonner";

export interface Balloon {
  id: string;
  lat: number;
  lng: number;
  alt?: number;
  time?: string;
  callsign?: string;
  frequency?: number;
  tags?: string[];
}

/**
 * Safely extracts and formats balloon data from the Windborne API response
 * Handles both object format and array of arrays format
 */
export const extractBalloonData = (data: any): Balloon[] => {
  if (!data) {
    return [];
  }

  try {
    const balloons: Balloon[] = [];
    
    // Check if data is an array (array of arrays format)
    if (Array.isArray(data)) {
      // Process data as array of arrays: [id, lat, lng, alt, ...]
      data.forEach((item, index) => {
        if (Array.isArray(item) && item.length >= 3) {
          const lat = Number(item[0]);
          const lng = Number(item[1]);
          const alt = item.length > 2 ? Number(item[2]) : undefined;
          
          // Use a more robust ID format with lat_lng instead of lat-lng
          const stableId = `balloon_${lat.toFixed(4)}_${lng.toFixed(4)}`;

          const balloon: Balloon = {
            id: stableId, // Use the generated stable ID
            lat: lat,
            lng: lng,
            alt: alt,
            callsign: `Balloon-${index}`, // Keep index-based callsign for display if needed
            // Generate a random frequency between 88.1 and 107.9 for the radio theme
            frequency: 88.1 + Math.random() * 19.8,
            // Randomly assign tags
            tags: generateRandomTags()
          };
          
          balloons.push(balloon);
        }
      });
    } 
    // Original object format handling
    else if (typeof data === "object") {
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (
          typeof value === "object" && 
          value !== null && 
          typeof value.lat === "number" && 
          typeof value.lng === "number"
        ) {
          // Valid balloon data with lat/lng - Use the object key as ID (assuming it's stable)
          const balloon: Balloon = {
            id: key,
            lat: value.lat,
            lng: value.lng,
            alt: typeof value.alt === "number" ? value.alt : undefined,
            time: typeof value.time === "string" ? value.time : undefined,
            callsign: typeof value.callsign === "string" ? value.callsign : `Balloon-${key}`,
            frequency: value.frequency || (88.1 + Math.random() * 19.8),
            tags: value.tags || generateRandomTags()
          };
          
          balloons.push(balloon);
        }
      });
    }

    return balloons;
  } catch (err) {
    return [];
  }
};

/**
 * Generates random radio station tags
 */
const generateRandomTags = (): string[] => {
  const allTags = ["Pop", "Rock", "Classical", "Jazz", "News", "Talk", "Electronic", "Country", "Hip-Hop", "R&B", "Soul", "Blues", "Reggae", "World"];
  const count = 1 + Math.floor(Math.random() * 3); // 1-3 tags
  const tags: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * allTags.length);
    const tag = allTags[randomIndex];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
};

/**
 * Fetches balloon data from the Windborne API
 */
export const fetchBalloonData = async (hour: number = 0): Promise<Balloon[]> => {
  try {
    const url = getWindborneUrl(hour);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return extractBalloonData(data);
  } catch (err) {
    toast.error("Failed to fetch balloon data. Using fallback data.");
    return getFallbackData();
  }
};

/**
 * Returns static fallback data if the API is down
 */
const getFallbackData = (): Balloon[] => {
  return [
    {
      id: "fallback-1",
      lat: 40.7128,
      lng: -74.006,
      alt: 9000,
      callsign: "NYC-Balloon",
      frequency: 91.3,
      tags: ["Jazz", "News"]
    },
    {
      id: "fallback-2",
      lat: 51.5074,
      lng: -0.1278,
      alt: 8500,
      callsign: "London-FM",
      frequency: 103.5,
      tags: ["Pop", "Talk"]
    },
    {
      id: "fallback-3",
      lat: 35.6762,
      lng: 139.6503,
      alt: 7800,
      callsign: "Tokyo-Radio",
      frequency: 98.7,
      tags: ["Electronic", "World"]
    },
    {
      id: "fallback-4",
      lat: -33.8688,
      lng: 151.2093,
      alt: 8200,
      callsign: "Sydney-Air",
      frequency: 88.9,
      tags: ["Rock", "Classical"]
    },
    {
      id: "fallback-5",
      lat: 37.7749,
      lng: -122.4194,
      alt: 9200,
      callsign: "SF-Waves",
      frequency: 105.7,
      tags: ["Hip-Hop", "Soul"]
    }
  ];
};
