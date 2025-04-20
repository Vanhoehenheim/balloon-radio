import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { LatLngExpression, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Balloon, fetchBalloonData } from '@/utils/fetchWindborne';
import BalloonMarker from './BalloonMarker';
import StationCard from './StationCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { RefreshCw, Radio, Shuffle } from 'lucide-react';
import { RadioStation, fetchStationsDistributed } from '@/utils/fetchRadioStations';
import { getDistanceFromLatLonInKm } from '@/utils/geoUtils';
import { shuffleArray } from '@/utils/arrayUtils';

interface FullMapProps {}

const FullMap: React.FC<FullMapProps> = () => {
  const [selectedBalloon, setSelectedBalloon] = useState<Balloon | null>(null);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [isLoadingBalloons, setIsLoadingBalloons] = useState<boolean>(false);
  
  const [allRadioStations, setAllRadioStations] = useState<RadioStation[]>([]);
  const [isLoadingAllStations, setIsLoadingAllStations] = useState<boolean>(true);
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>([]);
  
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isRandomHopActive, setIsRandomHopActive] = useState<boolean>(false);

  const [map, setMap] = useState<LeafletMap | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  
  const center: LatLngExpression = [20, 0];
  const searchRadiusKm = 500;
  const maxFilteredResults = 10;

  const loadBalloonData = async (hour: number) => {
    setIsLoadingBalloons(true);
    setSelectedBalloon(null);
    try {
      const data = await fetchBalloonData(hour);
      setBalloons(data);
      
      if (data.length === 0) {
        toast.warning("No balloon data available for this time");
      } else {
        toast.success(`Loaded ${data.length} balloons for ${hour.toString().padStart(2, '0')}:00`);
      }
    } catch (error) {
      
      toast.error("Failed to load balloon data");
    } finally {
      setIsLoadingBalloons(false);
    }
  };

  const loadAllRadioStations = async () => {
    setIsLoadingAllStations(true);
    
    try {
        const stations = await fetchStationsDistributed();
        setAllRadioStations(stations);
        
    } catch (error) {
        
        setAllRadioStations([]);
    } finally {
        setIsLoadingAllStations(false);
    }
  };

  const handleHourChange = (value: string) => {
    const hour = parseInt(value, 10);
    setSelectedHour(hour);
    loadBalloonData(hour);
  };

  const handleBalloonClick = (balloon: Balloon) => {
    setIsRandomHopActive(false);
    
    
    if (selectedBalloon?.id === balloon.id) {
      
      setSelectedBalloon(null);
    } else {
      
      setSelectedBalloon(balloon);
    }
  };

  const stopPlayback = useCallback(() => {
    
    setIsPlaying(false);
    setPlayingUrl(null);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    if (hlsRef.current) {
        
        hlsRef.current.destroy();
        hlsRef.current = null;
    }
  }, []);

  const handlePlayPause = useCallback((station: RadioStation) => {
    const urlToPlay = station.url_resolved || station.url;
    if (!urlToPlay) {
      toast.error("Station URL is missing.");
      return;
    }

    if (playingUrl === urlToPlay && isPlaying) {
      stopPlayback();
    } else {
      if (playingUrl && isPlaying) {
        stopPlayback();
      }
      setPlayingUrl(urlToPlay);
      setIsPlaying(true);
      
      fetch(`https://de1.api.radio-browser.info/json/url/${station.stationuuid}`, {
          method: 'POST', 
          headers: { 'User-Agent': 'RadioVista/0.1' }
      })
      .catch(err => console.warn("Failed to log station click for", station.stationuuid, err));
    }
  }, [isPlaying, playingUrl, stopPlayback]);

  const handleCloseCard = useCallback(() => {
      setSelectedBalloon(null);
      stopPlayback(); 
      setIsRandomHopActive(false); 
  }, [stopPlayback]);

  const handleRandomHop = () => {
    if (balloons.length === 0) {
      toast.info("No balloons loaded to hop to!");
      return;
    }
    stopPlayback();
    const randomIndex = Math.floor(Math.random() * balloons.length);
    const randomBalloon = balloons[randomIndex];
    setSelectedBalloon(randomBalloon);
    setIsRandomHopActive(true);
    toast.success(`Hopped to ${randomBalloon.callsign || randomBalloon.id}! Searching stations...`);
    if(map && randomBalloon) {
        map.flyTo([randomBalloon.lat, randomBalloon.lng], Math.max(map.getZoom() ?? 4, 6), { animate: true, duration: 1.5 });
    }
  };

  useEffect(() => {
    loadBalloonData(0);
    loadAllRadioStations();
  }, []);

  useEffect(() => {
    if (map) {
      map.setMinZoom(4);
      map.options.worldCopyJump = true;
      map.options.maxBoundsViscosity = 1.0;
    }
  }, [map]);
  
  useEffect(() => {
    if (mapRef.current) {
      setMap(mapRef.current);
    }
  }, []);
  
  useEffect(() => {
    if (selectedBalloon) {
      
    } else {
      
    }
  }, [selectedBalloon]);

  useEffect(() => {
    if (selectedBalloon && allRadioStations.length > 0) {
      
      
      const stationsWithDistance = allRadioStations
        .map(station => {
          if (station.geo_lat == null || station.geo_long == null) {
            return null;
          }
          const distance = getDistanceFromLatLonInKm(
            selectedBalloon.lat,
            selectedBalloon.lng,
            station.geo_lat,
            station.geo_long
          );
          return { ...station, distance };
        })
        .filter(station => station !== null) as (RadioStation & { distance: number })[];
      
      const debugRadius = searchRadiusKm * 2;
      const stationsInDebugRadius = stationsWithDistance
          .filter(station => station.distance <= debugRadius)
          .sort((a, b) => a.distance - b.distance);
          
      if (stationsInDebugRadius.length > 0) {
          
          stationsInDebugRadius.slice(0, 20).forEach(s => {
              
          });
      } else {
          
      }

      const nearby = stationsWithDistance
        .filter(station => station.distance <= searchRadiusKm)
        .sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
        .slice(0, maxFilteredResults);

      setFilteredStations(nearby);
      

    } else {
      setFilteredStations([]);
    }
  }, [selectedBalloon, allRadioStations]);

  useEffect(() => {
    if (isRandomHopActive && filteredStations.length > 0) {
       
       const firstPlayableStation = filteredStations.find(s => s.url_resolved || s.url);
       if (firstPlayableStation) {
         
         const timer = setTimeout(() => {
           handlePlayPause(firstPlayableStation);
         }, 100);
         setIsRandomHopActive(false);
         return () => clearTimeout(timer);
       } else {
         
         toast.info("No playable station found for this balloon.");
         setIsRandomHopActive(false);
       }
    }
  }, [isRandomHopActive, filteredStations, handlePlayPause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
        
        return;
    }

    const currentStation = allRadioStations.find(s => (s.url_resolved || s.url) === playingUrl); 
    const isHls = currentStation?.hls === 1 && Hls.isSupported();
    let hlsInstance = hlsRef.current;

    if (playingUrl && isPlaying) {
      
      
      if (hlsInstance && (!isHls || hlsInstance.url !== playingUrl)) {
          
          hlsInstance.destroy();
          hlsInstance = null; 
          hlsRef.current = null;
      }

      if (isHls) {
        
        if (!hlsInstance) {
          
          hlsInstance = new Hls();
          hlsRef.current = hlsInstance;
          
          hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            
            if (data.fatal) {
              toast.error(`HLS Playback Error: ${data.details || 'Fatal error'}`);
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  
                  hlsInstance?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  
                  hlsInstance?.recoverMediaError();
                  break;
                default:
                  
                  stopPlayback();
                  break;
              }
            }
          });
          
          
          hlsInstance.attachMedia(audio);
          hlsInstance.once(Hls.Events.MEDIA_ATTACHED, () => {
            
            hlsInstance?.loadSource(playingUrl);
          });
          hlsInstance.once(Hls.Events.MANIFEST_PARSED, () => {
              
              audio.play().catch(e => {
                  
                  toast.error(`Failed to play HLS station: ${e.message || 'Unknown error'}`);
                  stopPlayback();
              });
          });

        } else if (hlsInstance.url !== playingUrl) {
           
           hlsInstance.loadSource(playingUrl);
        } else {
          
           if (audio.paused) {
               audio.play().catch(e => {
                   
                   toast.error(`Failed to resume HLS station: ${e.message || 'Unknown error'}`);
                   stopPlayback();
               });
           }
        }

      } else if (currentStation?.hls === 1 && !Hls.isSupported()) {
        toast.error("HLS streaming is not supported in this browser.");
        
        stopPlayback();
      } else {
        
        
        if (audio.src !== playingUrl) {
            
            audio.src = playingUrl; 
            
            audio.load(); 
        }
        
        audio.play().catch(e => {
          
          
          toast.error(`Failed to play station: ${e.message || 'Unknown error'}`); 
          stopPlayback();
        });
      }
    } else {
      if (!isPlaying && audio && !audio.paused) {
        
        audio.pause();
      }
    }

    return () => {
      
    };
  }, [playingUrl, isPlaying, stopPlayback, allRadioStations]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <audio ref={audioRef} className="hidden" preload="none" />
      
      <MapContainer 
        className="h-full w-full"
        // @ts-ignore - Type definitions might be inaccurate for center prop
        center={center}
        zoom={3}
        minZoom={3}
        zoomControl={false}
        worldCopyJump={true}
        whenCreated={setMap}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          // @ts-ignore - Type definitions might be inaccurate for attribution prop
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />
        
        {balloons.map((balloon) => (
          <BalloonMarker
            key={`${balloon.id}-${selectedBalloon?.id === balloon.id ? 'selected' : 'unselected'}`}
            balloon={balloon}
            isSelected={selectedBalloon?.id === balloon.id}
            onClick={handleBalloonClick}
          />
        ))}
      </MapContainer>
      
      <div className="absolute top-0 left-0 right-0 z-[5000] pointer-events-none">
        <div className="container mx-auto p-4 flex justify-between items-start">
          <div className="pointer-events-auto">
            <div className="bg-card/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-mapaccent-blue/20">
              <h1 className="text-lg font-bold text-maptext flex items-center gap-2 mb-1">
                <Radio size={20} className="text-mapaccent-blue" />
                BalloonRadio
              </h1>
              <p className="text-xs text-maptext/70">
                {isLoadingBalloons ? 'Loading...' : `${balloons.length} balloons loaded`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 items-end pointer-events-auto">
            <div className="bg-card/80 backdrop-blur-sm p-2 rounded-md shadow-lg border border-mapaccent-blue/20 flex items-center gap-2">
              <button 
                className={`p-1.5 rounded-md bg-mapaccent-blue/20 text-mapaccent-blue hover:bg-mapaccent-blue/30 transition-colors ${isLoadingBalloons ? 'animate-spin' : ''}`}
                onClick={() => loadBalloonData(selectedHour)}
                disabled={isLoadingBalloons}
                title="Refresh Balloon Data"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <Button 
                variant="outline"
                className="bg-card/80 backdrop-blur-sm hover:bg-card/90 border-mapaccent-blue/20 hover:border-mapaccent-blue/30 text-maptext h-9 px-3 shadow-lg"
                onClick={handleRandomHop}
                disabled={isLoadingBalloons || balloons.length === 0}
            >
                <Shuffle size={16} className="mr-2 text-mapaccent-blue"/>
                Go to Random Station
            </Button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 z-[4000] text-xs text-maptext/60">
        <div className="bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-md">
          {isLoadingAllStations ? "Loading radio stations..." : `${allRadioStations.length} radio stations loaded.`}
        </div>
      </div>

      <AnimatePresence>
  {selectedBalloon && (
    <motion.div
      className="absolute bottom-4 left-0 right-0 mx-auto z-[9999]"
      style={{ maxWidth: "400px", width: "90%" }}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 150 }}
    >
      <StationCard
        balloon={selectedBalloon}
        stations={filteredStations}
        playingUrl={playingUrl}
        isPlaying={isPlaying}
        onClose={handleCloseCard}
        onPlayPause={handlePlayPause}
      />
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default FullMap;
