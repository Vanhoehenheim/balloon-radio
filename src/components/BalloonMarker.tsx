import React, { useMemo, useEffect, useRef } from 'react';
import { LatLngExpression, divIcon, Marker as LeafletMarker } from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import { Balloon } from '@/utils/fetchWindborne';

interface BalloonMarkerProps {
  balloon: Balloon;
  isSelected: boolean;
  onClick: (balloon: Balloon) => void;
}

const BalloonMarker: React.FC<BalloonMarkerProps> = ({ 
  balloon, 
  isSelected,
  onClick 
}) => {
  const map = useMap();
  const markerRef = useRef<LeafletMarker>(null);
  
  const markerClassName = useMemo(() => {
    return isSelected 
      ? 'balloon-marker balloon-marker-selected'
      : 'balloon-marker';
  }, [isSelected]);
  
  const markerIcon = useMemo(() => {
    return divIcon({
      className: markerClassName,
      iconSize: isSelected ? [8, 8] : [4, 4], 
      iconAnchor: isSelected ? [4, 4] : [2, 2],
      html: ''
    });
  }, [isSelected, markerClassName, balloon.id]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(markerIcon);
      markerRef.current.setZIndexOffset(isSelected ? 1000 : 0);
    }
  }, [isSelected, markerIcon, balloon.id]);
  
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(markerIcon);
      markerRef.current.setZIndexOffset(isSelected ? 1000 : 0);
    }
  }, []);
  
  return (
    <Marker 
      ref={markerRef}
      position={[balloon.lat, balloon.lng] as LatLngExpression}
      eventHandlers={{
        click: () => onClick(balloon)
      }}
      key={`${balloon.id}-${isSelected ? 'selected' : 'unselected'}`} 
    />
  );
};

export default BalloonMarker;
