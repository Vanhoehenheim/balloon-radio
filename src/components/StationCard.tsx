import React, { useState, useEffect } from 'react';
import { Play, Pause, Radio, X, WifiOff, MapPin, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Balloon } from '@/utils/fetchWindborne';
import { RadioStation } from '@/utils/fetchRadioStations';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StationCardProps {
  balloon: Balloon | null;
  stations: RadioStation[];
  playingUrl: string | null;
  isPlaying: boolean;
  onClose: () => void;
  onPlayPause: (station: RadioStation) => void;
}

const StationCard: React.FC<StationCardProps> = ({
  balloon,
  stations,
  playingUrl,
  isPlaying,
  onClose,
  onPlayPause
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (balloon) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [balloon]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!balloon) {
    return null;
  }

  return (
    <div className={`max-w-sm ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full`}>
      <Card className="bg-black/90 backdrop-blur-md border border-blue-500/20 shadow-lg shadow-black/30 rounded-lg overflow-hidden">
        
        <div className="px-3 pt-3 pb-2 flex justify-between items-start">
          <div className="flex-grow min-w-0 pr-2">
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-1.5 rounded-md mr-2">
                <Radio className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white truncate" title={balloon.callsign || "Balloon FM"}>
                  {balloon.callsign || "Balloon FM"}
                </h3>
                <p className="text-sm text-gray-400">
                  {balloon.frequency ? `${balloon.frequency.toFixed(1)} MHz` : 'Frequency N/A'}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/10 text-gray-400 hover:text-white flex-shrink-0"
            onClick={handleClose}
            aria-label="Close card"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        
        <div className="px-3 pb-2">
          <div className="flex items-center text-xs text-gray-400 mb-1">
            <MapPin className="h-3 w-3 mr-1 text-blue-400" />
            <span>
              {balloon.lat.toFixed(3)}°, {balloon.lng.toFixed(3)}°
              {balloon.alt ? ` · ${balloon.alt.toFixed(0)}m` : ''}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {balloon.tags?.map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        
        <CardContent className="p-0">
          <div className="bg-gray-900/50 px-3 py-1.5 border-t border-b border-blue-500/10">
            <h4 className="text-xs font-medium text-gray-300 flex items-center">
              <Compass size={12} className="mr-1.5 text-blue-400" />
              NEARBY STATIONS ({stations.length > 0 ? stations.length : 0})
            </h4>
          </div>
          
          <ScrollArea className="max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500">
            {stations.length > 0 ? (
              <ul className="py-1">
                {stations.map((station) => {
                  const stationUrl = station.url_resolved || station.url;
                  const isCurrentlyPlaying = playingUrl === stationUrl && isPlaying;
                  return (
                    <li 
                      key={station.stationuuid} 
                      className={`flex items-center justify-between gap-2 py-1 px-3 hover:bg-blue-500/5 transition-colors ${isCurrentlyPlaying ? 'bg-blue-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        {station.favicon ? (
                          <img
                            src={station.favicon}
                            alt=""
                            className="h-5 w-5 rounded-sm object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display='none'; 
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-sm bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Radio className="h-2.5 w-2.5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-white truncate font-medium" title={station.name}>
                            {station.name || 'Unknown Station'}
                          </span>
                          <span className="text-[10px] text-gray-400">{station.countrycode || 'N/A'}</span>
                        </div>
                      </div>
                      <Button
                        size="icon" 
                        variant="ghost"
                        className={`h-7 w-7 rounded-full flex-shrink-0 ${isCurrentlyPlaying ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-blue-400 hover:bg-blue-500/10'} ${!stationUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => onPlayPause(station)}
                        disabled={!stationUrl}
                        title={isCurrentlyPlaying ? 'Pause Station' : 'Play Station'}
                        aria-label={isCurrentlyPlaying ? 'Pause Station' : 'Play Station'}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                <WifiOff size={20} className="mb-2 opacity-50"/>
                <p className="text-xs">No stations available in this area</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default StationCard;