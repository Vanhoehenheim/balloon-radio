
/**
 * Base URL for the Windborne Systems API through Vite proxy
 */
export const WINDBORNE_BASE_URL = "/api/windborne";

/**
 * Gets the URL for the given hour (0-23)
 */
export const getWindborneUrl = (hour: number = 0): string => {
  const formattedHour = hour.toString().padStart(2, "0");
  return `${WINDBORNE_BASE_URL}/${formattedHour}.json`;
};
