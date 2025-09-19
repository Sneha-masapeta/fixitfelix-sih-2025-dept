import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Issue } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, User, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom icons for different issue types
const createCustomIcon = (category: string, priority: string) => {
  const getColor = () => {
    if (priority === 'urgent') return '#dc2626';
    if (priority === 'high') return '#ea580c';
    if (priority === 'medium') return '#ca8a04';
    return '#16a34a';
  };

  const getEmoji = () => {
    const categoryMap: { [key: string]: string } = {
      'pothole': '🕳️',
      'streetlight': '💡',
      'traffic': '🚦',
      'sidewalk': '🚶',
      'graffiti': '🎨',
      'garbage': '🗑️',
      'water': '💧',
      'park': '🌳',
      'other': '📝'
    };
    return categoryMap[category] || '📝';
  };

  return L.divIcon({
    html: `
      <div style="
        background: ${getColor()};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${getEmoji()}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface MapViewProps {
  selectedIssue: Issue | null;
  onIssueSelect: (issue: Issue) => void;
  refreshTrigger: number;
}

const MapController = ({ selectedIssue }: { selectedIssue: Issue | null }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedIssue && selectedIssue.location) {
      const coords = selectedIssue.location as { type: "Point"; coordinates: [number, number] };
      if (coords.type === "Point") {
        const [lng, lat] = coords.coordinates;
        map.setView([lat, lng], 16);
      }
    }
  }, [selectedIssue, map]);

  return null;
};

const MapView = ({ selectedIssue, onIssueSelect, refreshTrigger }: MapViewProps) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select(
          `
          *,
          users (name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load issues",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshTrigger]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in-progress':
        return 'default';
      case 'resolved':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <MapContainer
        center={[17.4065, 78.4772]} // Default to Hyderabad
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {issues.map((issue) => {
            const coords = issue.location as
                | { type: "Point"; coordinates: [number, number] }
                | null;

            if (!coords || coords.type !== "Point") return null;

            const [lng, lat] = coords.coordinates;

            return (
                <Marker
                key={issue.id}
                position={[lat, lng]}
                icon={createCustomIcon(issue.category || "other", issue.priority || "medium")}
                eventHandlers={{
                    click: () => onIssueSelect(issue),
                }}
                >
                <Popup className="custom-popup" maxWidth={300}>
                    <Card className="border-0 shadow-none">
                    <CardContent className="p-3">
                        <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm leading-tight">{issue.title}</h3>
                            <Badge
                            variant={getStatusColor(issue.status) as any}
                            className="text-xs shrink-0"
                            >
                            {issue.status || "open"}
                            </Badge>
                        </div>

                        {issue.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                            {issue.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{issue.users?.name || "Anonymous"}</span>
                            </div>

                            <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(issue.created_at)}</span>
                            </div>

                            {issue.priority === "urgent" && (
                            <div className="flex items-center gap-1 text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="font-medium">Urgent</span>
                            </div>
                            )}
                        </div>

                        <Button
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => onIssueSelect(issue)}
                        >
                            View Details
                        </Button>
                        </div>
                    </CardContent>
                    </Card>
                </Popup>
                </Marker>
            );
            })}
                    
        <MapController selectedIssue={selectedIssue} />
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Issue Priority</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span>Urgent</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span>Low</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Counter */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapView;