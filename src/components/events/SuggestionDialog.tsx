
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Event {
  id: string;
  title: string;
  community: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  datetime: string;
  end_datetime?: string;
  end_date?: string;
  poster_url?: string;
  created_by: string;
  suggested_datetime?: string;
  suggested_end_datetime?: string;
  suggestion_reason?: string;
}

interface SuggestionDialogProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuggestionDialog = ({ event, onClose, onSuccess }: SuggestionDialogProps) => {
  const [formData, setFormData] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    startTime: '',
    startAmpm: 'AM',
    endTime: '',
    endAmpm: 'AM',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const parseTime = (timeString: string, ampm: string) => {
    if (!timeString) return null;
    
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return null;
    
    let hour24 = parseInt(hours);
    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (ampm === 'AM' && hour24 === 12) hour24 = 0;
    return { hour: hour24, minute: parseInt(minutes) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    // Validate required fields
    if (!formData.startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startTime) {
      toast({
        title: "Error",
        description: "Please select a start time",
        variant: "destructive",
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the suggestion",
        variant: "destructive",
      });
      return;
    }

    const startTime = parseTime(formData.startTime, formData.startAmpm);
    if (!startTime) {
      toast({
        title: "Error",
        description: "Invalid start time format",
        variant: "destructive",
      });
      return;
    }

    // Validate end date/time if provided
    if (formData.endDate && formData.endTime) {
      const endTime = parseTime(formData.endTime, formData.endAmpm);
      if (!endTime) {
        toast({
          title: "Error",
          description: "Invalid end time format",
          variant: "destructive",
        });
        return;
      }
      
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(startTime.hour, startTime.minute, 0, 0);
      
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(endTime.hour, endTime.minute, 0, 0);
      
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
      // Create suggested start datetime
      const suggestedStartDateTime = new Date(formData.startDate);
      suggestedStartDateTime.setHours(startTime.hour, startTime.minute, 0, 0);

      // Create suggested end datetime if provided
      let suggestedEndDateTime = null;
      if (formData.endDate && formData.endTime) {
        const endTime = parseTime(formData.endTime, formData.endAmpm);
        if (endTime) {
          suggestedEndDateTime = new Date(formData.endDate);
          suggestedEndDateTime.setHours(endTime.hour, endTime.minute, 0, 0);
        }
      }

      const updateData = {
        suggested_datetime: suggestedStartDateTime.toISOString(),
        suggestion_reason: formData.reason.trim(),
        ...(suggestedEndDateTime && { suggested_end_datetime: suggestedEndDateTime.toISOString() })
      };

      console.log('Updating event with data:', updateData);

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Suggestion sent to the event creator!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error sending suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to send suggestion. Please try again.",
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
          <DialogTitle>Suggest New Date/Time</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Suggested Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
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
              <Label>Suggested End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
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
              <Label>Suggested Start Time *</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="flex-1"
                  required
                />
                <Select
                  value={formData.startAmpm}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, startAmpm: value }))}
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
              <Label>Suggested End Time (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="flex-1"
                />
                <Select
                  value={formData.endAmpm}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, endAmpm: value }))}
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
            <Label htmlFor="reason">Reason for Suggestion *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please explain why you're suggesting these new dates/times..."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Suggestion'}
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
