import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Target, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const LocationMarker = ({ onLocationSelect, selectedLocation }: LocationSelectorProps) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
  ) : null;
};

const LocationSelector = ({ onLocationSelect, selectedLocation }: LocationSelectorProps) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();
  const mapRef = useRef<L.Map>();

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCurrentLocation(location);
      onLocationSelect(location.lat, location.lng);
      
      toast({
        title: "Location found!",
        description: "Your current location has been set for the issue report.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Location access failed",
        description: error.message || "Unable to get your location. Please click on the map to select a location.",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      mapRef.current = map;
      if (selectedLocation) {
        map.setView([selectedLocation.lat, selectedLocation.lng], 16);
      } else if (currentLocation) {
        map.setView([currentLocation.lat, currentLocation.lng], 16);
      }
    }, [selectedLocation, currentLocation, map]);

    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4 text-primary" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="flex-1 h-9"
          >
            <Target className="w-4 h-4 mr-2" />
            {isLoadingLocation ? 'Getting Location...' : 'Use My Location'}
          </Button>
          <Button variant="outline" size="sm" className="h-9 w-9">
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="h-48 rounded-lg overflow-hidden border">
          <MapContainer
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [17.4065, 78.4772]} // Default to NYC
            zoom={selectedLocation ? 16 : 10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker 
              onLocationSelect={onLocationSelect} 
              selectedLocation={selectedLocation} 
            />
            <MapController />
          </MapContainer>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {selectedLocation 
            ? `Selected: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
            : 'Click on the map to select the issue location or use your current location.'
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationSelector;