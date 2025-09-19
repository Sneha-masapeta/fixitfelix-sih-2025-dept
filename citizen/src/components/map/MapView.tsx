import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@/lib/leaflet-fix';
import { supabase } from '@/integrations/supabase/client';
import { Issue } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ... (keep createCustomIcon as is)
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
  onViewDetails: (issue: Issue) => void; // Added prop
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

const MapView = ({ selectedIssue, onIssueSelect, onViewDetails, refreshTrigger }: MapViewProps) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select('*, users(name)')
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to load issues", description: error.message });
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshTrigger]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in-progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'destructive';
    }
  };

  // ... (remove formatDate if not used here anymore)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        {/* ... loading spinner ... */}
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <MapContainer
        center={[17.4065, 78.4772]}
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
            const coords = issue.location as { type: "Point"; coordinates: [number, number] } | null;
            if (!coords || coords.type !== "Point") return null;
            const [lng, lat] = coords.coordinates;

            return (
                <Marker
                  key={issue.id}
                  position={[lat, lng]}
                  icon={createCustomIcon(issue.category || "other", issue.priority || "medium")}
                  eventHandlers={{ click: () => onIssueSelect(issue) }}
                >
                  <Popup className="custom-popup" maxWidth={280}>
                    <Card className="border-0 shadow-none">
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm leading-tight flex-1">{issue.title}</h3>
                          <Badge variant={getStatusColor(issue.status) as any} className="text-xs shrink-0">
                            {issue.status || "open"}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Assigned to:</span> None
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7">
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7">
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <Button size="sm" className="h-8 text-xs" onClick={() => onViewDetails(issue)}>
                            View
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

      {/* ... (rest of the component) ... */}
    </div>
  );
};

export default MapView;