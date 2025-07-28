
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, FileText, Clock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { SuggestionDialog } from './SuggestionDialog';

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

interface EventModalProps {
  event: Event;
  onClose: () => void;
  onUpdate: () => void;
}

export const EventModal = ({ event, onClose, onUpdate }: EventModalProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);

  const updateEventStatus = async (newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${newStatus} successfully!`,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  const acceptSuggestion = async () => {
    try {
      const updateData = {
        datetime: event.suggested_datetime,
        status: 'pending' as const,
        suggested_datetime: null,
        suggested_end_datetime: null,
        suggestion_reason: null,
        ...(event.suggested_end_datetime && { end_datetime: event.suggested_end_datetime })
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event rescheduled and resubmitted for approval!",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to accept suggestion",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{event.title}</span>
            <Badge className={getStatusColor(event.status)}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {event.poster_url && (
            <div className="w-full flex justify-center">
              <div className="relative w-full max-w-2xl">
                <img
                  src={event.poster_url}
                  alt="Event Poster"
                  className="w-full h-auto object-contain rounded-lg shadow-lg max-h-96"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Start:</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(event.datetime).date} at {formatDateTime(event.datetime).time}
                </div>
              </div>
            </div>

            {(event.end_datetime || event.end_date) && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">End:</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(event.end_datetime || event.end_date!).date} at {formatDateTime(event.end_datetime || event.end_date!).time}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{event.community}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{event.type}</span>
            </div>
          </div>

          {event.suggested_datetime && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">HOD Suggestion</h4>
              <div className="space-y-2">
                <p className="text-blue-800">
                  <strong>Suggested start:</strong> {formatDateTime(event.suggested_datetime).date} at {formatDateTime(event.suggested_datetime).time}
                </p>
                {event.suggested_end_datetime && (
                  <p className="text-blue-800">
                    <strong>Suggested end:</strong> {formatDateTime(event.suggested_end_datetime).date} at {formatDateTime(event.suggested_end_datetime).time}
                  </p>
                )}
                {event.suggestion_reason && (
                  <p className="text-blue-700 text-sm">
                    <strong>Reason:</strong> {event.suggestion_reason}
                  </p>
                )}
              </div>
              {profile?.role === 'rep' && (
                <Button onClick={acceptSuggestion} size="sm" className="bg-blue-600 hover:bg-blue-700 mt-3">
                  Accept Suggestion
                </Button>
              )}
            </div>
          )}

          {event.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Description</span>
              </div>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          {profile?.role === 'hod' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => updateEventStatus('approved')}
                className="bg-green-600 hover:bg-green-700"
                disabled={event.status === 'approved'}
              >
                Approve
              </Button>
              <Button
                onClick={() => updateEventStatus('rejected')}
                variant="destructive"
                disabled={event.status === 'rejected'}
              >
                Reject
              </Button>
              <Button
                onClick={() => setShowSuggestionDialog(true)}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Suggest New Date/Time
              </Button>
              <Button
                onClick={() => updateEventStatus('pending')}
                variant="outline"
                disabled={event.status === 'pending'}
              >
                Mark Pending
              </Button>
            </div>
          )}
        </div>

        {showSuggestionDialog && (
          <SuggestionDialog
            event={event}
            onClose={() => setShowSuggestionDialog(false)}
            onSuccess={() => {
              setShowSuggestionDialog(false);
              onUpdate();
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
