import { Issue } from "@/integrations/supabase/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ThumbsUp, ThumbsDown, Tag, AlertTriangle, Building } from "lucide-react";

interface IssueDetailsProps {
  issue: Issue | null;
  onOpenChange: (open: boolean) => void;
}

const ISSUE_CATEGORIES: { [key: string]: { label: string; icon: string } } = {
  pothole: { label: 'Pothole', icon: '🕳️' },
  streetlight: { label: 'Broken Streetlight', icon: '💡' },
  traffic: { label: 'Traffic Signal Issue', icon: '🚦' },
  sidewalk: { label: 'Sidewalk Problem', icon: '🚶' },
  graffiti: { label: 'Graffiti', icon: '🎨' },
  garbage: { label: 'Garbage/Litter', icon: '🗑️' },
  water: { label: 'Water/Drainage', icon: '💧' },
  park: { label: 'Park Maintenance', icon: '🌳' },
  other: { label: 'Other', icon: '📝' },
};

const IssueDetails = ({ issue, onOpenChange }: IssueDetailsProps) => {
  if (!issue) return null;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "open": return "destructive";
      case "in-progress": return "default";
      case "resolved": return "secondary";
      case "closed": return "outline";
      default: return "destructive";
    }
  };

  const getPriorityInfo = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return { label: 'Urgent', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'high': return { label: 'High', color: 'text-orange-500', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'medium': return { label: 'Medium', color: 'text-yellow-500', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'low': return { label: 'Low', color: 'text-green-500', icon: <AlertTriangle className="w-4 h-4" /> };
      default: return { label: 'Not set', color: 'text-muted-foreground', icon: <AlertTriangle className="w-4 h-4" /> };
    }
  };

  const categoryInfo = ISSUE_CATEGORIES[issue.category || 'other'] || ISSUE_CATEGORIES.other;
  const priorityInfo = getPriorityInfo(issue.priority);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Sheet open={!!issue} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 sm:p-6 border-b bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="text-3xl flex-shrink-0">{categoryInfo.icon}</div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl sm:text-2xl font-bold leading-tight truncate">{issue.title}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">{categoryInfo.label}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src="/placeholder.svg"
                alt="Issue placeholder"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Badge variant={getStatusColor(issue.status) as any} className="h-6 w-6 shrink-0 flex items-center justify-center" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize">{issue.status || "Open"}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 p-3 bg-muted/50 rounded-lg ${priorityInfo.color}`}>
                <div className="shrink-0">{priorityInfo.icon}</div>
                <div className="flex flex-col">
                  <span className="text-xs">Priority</span>
                  <span className="font-semibold">{priorityInfo.label}</span>
                </div>
              </div>
            </div>

            {issue.description && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{issue.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-base">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Reported by <span className="font-medium text-foreground">{issue.users?.name || "Anonymous"}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">on <span className="font-medium text-foreground">{formatDate(issue.created_at)}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Assigned to <span className="font-medium text-foreground">None</span></span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="p-4 sm:p-6 border-t bg-gradient-card-footer">
            <h3 className="font-semibold mb-3 text-base">Community Feedback</h3>
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-transparent hover:bg-green-100 border-green-300 text-green-600">
                  <ThumbsUp className="w-5 h-5" />
                </Button>
                <span className="font-bold text-xl text-green-600">{Math.floor(Math.random() * 100)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-transparent hover:bg-red-100 border-red-300 text-red-600">
                  <ThumbsDown className="w-5 h-5" />
                </Button>
                <span className="font-bold text-xl text-red-600">{Math.floor(Math.random() * 20)}</span>
              </div>
            </div>
          </div>
      </SheetContent>
    </Sheet>
  );
};

export default IssueDetails;
