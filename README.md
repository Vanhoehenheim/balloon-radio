# BalloonRadio

A web application that visualizes the approximate location of Windborne balloons and allows users to discover and play internet radio stations broadcasting near the selected balloon's location.

## Key Features

*   **Balloon Visualization:** Displays Windborne balloon locations on an interactive map (using Leaflet).
*   **Radio Station Discovery:** Fetches internet radio station data from the Radio Browser API.
*   **Nearby Stations:** Filters and displays radio stations within a defined radius of a selected balloon.
*   **Audio Playback:** Plays selected radio stations, supporting both standard streaming and HLS (HTTP Live Streaming) using HLS.js.
*   **Random Hop:** Allows users to jump to a random balloon on the map and automatically search for nearby stations.

## Technology Stack

*   **Frontend Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Mapping Library:** Leaflet & React-Leaflet
*   **UI Components:** shadcn/ui
*   **Styling:** Tailwind CSS
*   **Radio Data API:** [Radio Browser API](https://api.radio-browser.info/)
*   **HLS Playback:** HLS.js
*   **Icons:** Lucide React
*   **Animation:** Framer Motion

## Radio Feature Implementation Details

*   **Data Fetching:** On load, the application fetches station data concurrently from multiple distributed Radio Browser API server endpoints for robustness. It retrieves station details including geographical coordinates (`geo_lat`, `geo_long`) and HLS support (`hls`).
*   **Deduplication & Filtering:** The fetched results are combined, deduplicated based on `stationuuid`, and filtered to keep only stations with valid geographical coordinates.
*   **Local Proximity Filtering:** When a balloon is selected, the application calculates the distance to all locally stored stations and displays only those within a defined radius (e.g., 500km), sorted by popularity (`clickcount`).
*   **Playback:** The application uses a standard HTML `<audio>` element. For stations supporting HLS, it leverages the HLS.js library to handle the stream; otherwise, it uses direct audio source playback.

## How to Run Locally

**Prerequisites:**

*   Node.js & npm (or yarn/pnpm) installed - [Install Node.js (includes npm)](https://nodejs.org/)

**Steps:**

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    cd <REPOSITORY_DIRECTORY>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    # or yarn install / pnpm install
    ```

3.  **Start the development server:**
    ```sh
    npm run dev
    # or yarn dev / pnpm dev
    ```

    This will typically start the application on `http://localhost:5173` (or another port if 5173 is busy).

## Project Structure (Simplified)

*   `public/`: Static assets.
*   `src/`: Main application source code.
    *   `components/`: React components (Map, Markers, Station Card, UI elements).
    *   `utils/`: Utility functions (API fetching, calculations, etc.).
    *   `App.tsx`: Main application component.
    *   `main.tsx`: Application entry point.
*   `index.html`: Main HTML file.
*   `tailwind.config.js`: Tailwind CSS configuration.
*   `vite.config.ts`: Vite build configuration.
*   `tsconfig.json`: TypeScript configuration.
