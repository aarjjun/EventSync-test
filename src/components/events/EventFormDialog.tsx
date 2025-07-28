
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface EventFormDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const EventFormDialog = ({ onClose, onSuccess }: EventFormDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    community: '',
    customCommunity: '',
    type: '',
    customType: '',
    description: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    startTime: '',
    startAmpm: 'AM',
    endTime: '',
    endAmpm: 'AM',
    poster: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const communities = ['IEEE', 'TinkerHub', 'CoreAI', 'GDSC', 'NSS', 'Other'];
  const eventTypes = ['Workshop', 'Seminar', 'Conference', 'Competition', 'Cultural', 'Technical', 'Other'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, poster: e.target.files![0] }));
    }
  };

  const uploadPoster = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('event-posters')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading poster:', error);
      return null;
    }
  };

  const parseTime = (timeString: string, ampm: string) => {
    const [hours, minutes] = timeString.split(':');
    let hour24 = parseInt(hours);
    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (ampm === 'AM' && hour24 === 12) hour24 = 0;
    return { hour: hour24, minute: parseInt(minutes) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.startDate || !formData.startTime) return;

    // Validate end date/time if provided
    if (formData.endDate && formData.endTime) {
      const startTime = parseTime(formData.startTime, formData.startAmpm);
      const endTime = parseTime(formData.endTime, formData.endAmpm);
      
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(startTime.hour, startTime.minute);
      
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(endTime.hour, endTime.minute);
      
      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End date/time must be after start date/time",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      let posterUrl = null;
      
      if (formData.poster) {
        posterUrl = await uploadPoster(formData.poster);
      }

      // Create start datetime
      const startTime = parseTime(formData.startTime, formData.startAmpm);
      const eventDateTime = new Date(formData.startDate);
      eventDateTime.setHours(startTime.hour, startTime.minute);

      // Create end datetime if provided
      let endDateTime = null;
      if (formData.endDate && formData.endTime) {
        const endTime = parseTime(formData.endTime, formData.endAmpm);
        endDateTime = new Date(formData.endDate);
        endDateTime.setHours(endTime.hour, endTime.minute);
      }

      // Determine final community and type values
      const finalCommunity = formData.community === 'Other' ? formData.customCommunity : formData.community;
      const finalType = formData.type === 'Other' ? formData.customType : formData.type;

      const eventData = {
        title: formData.title,
        community: finalCommunity,
        type: finalType,
        description: formData.description,
        datetime: eventDateTime.toISOString(),
        poster_url: posterUrl,
        created_by: user.id,
        ...(endDateTime && { end_datetime: endDateTime.toISOString() })
      };

      const { error } = await supabase
        .from('events')
        .insert(eventData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event submitted successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="community">Community</Label>
              <Select
                value={formData.community}
                onValueChange={(value) => handleInputChange('community', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map(community => (
                    <SelectItem key={community} value={community}>
                      {community}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.community === 'Other' && (
                <Input
                  placeholder="Specify community name"
                  value={formData.customCommunity}
                  onChange={(e) => handleInputChange('customCommunity', e.target.value)}
                  className="mt-2"
                  required
                />
              )}
            </div>

            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.type === 'Other' && (
                <Input
                  placeholder="Specify event type"
                  value={formData.customType}
                  onChange={(e) => handleInputChange('customType', e.target.value)}
                  className="mt-2"
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="flex-1"
                  required
                />
                <Select
                  value={formData.startAmpm}
                  onValueChange={(value) => handleInputChange('startAmpm', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>End Time (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={formData.endAmpm}
                  onValueChange={(value) => handleInputChange('endAmpm', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="poster">Event Poster (Optional)</Label>
            <Input
              id="poster"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Event'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
