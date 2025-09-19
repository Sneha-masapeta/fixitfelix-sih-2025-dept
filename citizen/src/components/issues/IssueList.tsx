import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, User, Search, Filter, Clock, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Issue } from '@/integrations/supabase/types';


interface IssueListProps {
  refreshTrigger: number;
  onIssueSelect?: (issue: Issue) => void;
}

const ISSUE_CATEGORIES = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'streetlight', label: 'Broken Streetlight', icon: '💡' },
  { value: 'traffic', label: 'Traffic Signal Issue', icon: '🚦' },
  { value: 'sidewalk', label: 'Sidewalk Problem', icon: '🚶' },
  { value: 'graffiti', label: 'Graffiti', icon: '🎨' },
  { value: 'garbage', label: 'Garbage/Litter', icon: '🗑️' },
  { value: 'water', label: 'Water/Drainage', icon: '💧' },
  { value: 'park', label: 'Park Maintenance', icon: '🌳' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const IssueList = ({ refreshTrigger, onIssueSelect }: IssueListProps) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { toast } = useToast();

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          users (name)
        `)
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    let filtered = issues;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, statusFilter, categoryFilter, priorityFilter]);

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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryInfo = (category: string | null) => {
    return ISSUE_CATEGORIES.find(cat => cat.value === category) || { icon: '📝', label: category || 'Other' };
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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Issues ({filteredIssues.length})
        </h2>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ISSUE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                }}
                className="h-9 px-3"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredIssues.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {issues.length === 0 ? 'No Issues Reported Yet' : 'No Issues Match Your Filters'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {issues.length === 0 
                ? 'Be the first to report an issue in your community!'
                : 'Try adjusting your search criteria or clearing the filters.'
              }
            </p>
            {issues.length > 0 && (
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const categoryInfo = getCategoryInfo(issue.category);
            return (
              <Card 
                key={issue.id} 
                className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary"
                onClick={() => onIssueSelect?.(issue)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="text-xl flex-shrink-0">{categoryInfo.icon}</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{issue.title}</h3>
                          <p className="text-xs text-muted-foreground">{categoryInfo.label}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant={getStatusColor(issue.status) as any} className="text-xs">
                          {issue.status || 'open'}
                        </Badge>
                        {issue.priority && (
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {issue.description && (
                      <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                        {issue.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-20">{issue.users?.name || 'Anonymous'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(issue.created_at)}</span>
                        </div>

                        {issue.priority === 'urgent' && (
                          <div>
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="font-medium text-xs">Urgent</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Eye className="w-3 h-3 mr-1" />
                        <span className="text-xs">View</span>
                      </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssueList;