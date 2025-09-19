import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Camera, FileText, MapPin, AlertTriangle } from 'lucide-react';
import LocationSelector from '../map/LocationSelector';

interface IssueFormProps {
  onSuccess: () => void;
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

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'high', label: 'High Priority', color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50' },
];

const IssueForm = ({ onSuccess }: IssueFormProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: "You can upload a maximum of 5 images per issue.",
      });
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Generate previews
    const newPreviews = [...imagePreview];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setImagePreview([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast({
        variant: "destructive",
        title: "Location required",
        description: "Please select a location for the issue.",
      });
      return;
    }

    if (!category) {
      toast({
        variant: "destructive",
        title: "Category required",
        description: "Please select a category for the issue.",
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create issue
      const issueId = crypto.randomUUID();
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          id: issueId,
          title,
          description,
          category,
          priority,
          user_id: user.id,
          location: {
            type: "Point",
            coordinates: [location.lng, location.lat], // GeoJSON expects [lng, lat]
          },
        })
        .select()
        .single();

      if (issueError) throw issueError;

      // Upload images if any
      if (images.length > 0 && issue) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${issue.id}/${Date.now()}-${i}.${fileExt}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('issue-images')
            .upload(fileName, file);

          if (uploadError) {
            console.warn('Image upload failed:', uploadError);
            continue; // Continue with other images
          }

          // Get public URL
          const { data } = supabase.storage
            .from('issue-images')
            .getPublicUrl(fileName);

          // Save image record
          const { error: imageError } = await supabase
            .from('images')
            .insert({
              id: crypto.randomUUID(),
              issue_id: issue.id,
              url: data.publicUrl,
            });

          if (imageError) {
            console.warn('Image record creation failed:', imageError);
          }
        }
      }

      toast({
        title: "Issue reported successfully!",
        description: "Thank you for helping improve your community.",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setLocation(null);
      setImages([]);
      setImagePreview([]);
      
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to report issue",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = ISSUE_CATEGORIES.find(cat => cat.value === category);
  const selectedPriority = PRIORITY_LEVELS.find(p => p.value === priority);

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Report an Issue</h2>
              <p className="text-sm text-muted-foreground font-normal">Help improve your community</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Issue Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select category">
                      {selectedCategory && (
                        <div className="flex items-center gap-2">
                          <span>{selectedCategory.icon}</span>
                          <span>{selectedCategory.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-12">
                    <SelectValue>
                      {selectedPriority && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedPriority.bg} border-2 border-current ${selectedPriority.color}`}></div>
                          <span>{selectedPriority.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${level.bg} border-2 border-current ${level.color}`}></div>
                          <span>{level.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about the issue, when you noticed it, and any other relevant information..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Upload photos</p>
                    <p className="text-sm text-muted-foreground">
                      Click to add up to 5 images (JPG, PNG)
                    </p>
                  </div>
                </label>
              </div>

              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-4 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <p className="text-sm text-warning-foreground">
                Please ensure your location is accurate below. This helps local authorities respond effectively.
              </p>
            </div>

            <LocationSelector
              onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
              selectedLocation={location}
            />

            <Button
              type="submit"
              className="w-full h-12 shadow-civic text-base font-medium"
              disabled={loading || !location || !category}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Reporting Issue...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Report Issue
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueForm;