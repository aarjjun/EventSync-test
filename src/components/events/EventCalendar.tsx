import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { EventModal } from './EventModal';
import { EventFilters } from './EventFilters';
import { ExportButtons } from './ExportButtons';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EventFormDialog } from './EventFormDialog';

interface Event {
  id: string;
  title: string;
  community: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  datetime: string;
  end_datetime?: string;
  poster_url?: string;
  created_by: string;
  suggested_datetime?: string;
  suggestion_reason?: string;
}

export const EventCalendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [filters, setFilters] = useState({
    community: 'all',
    status: 'all'
  });
  const { profile } = useAuth();

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' },
        () => fetchEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('datetime', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.community !== 'all') {
      filtered = filtered.filter(event => event.community === filters.community);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    setFilteredEvents(filtered);
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'pending': return '#eab308';
      default: return '#6b7280';
    }
  };

  const calendarEvents = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: event.datetime,
    end: event.end_datetime,
    backgroundColor: getEventColor(event.status),
    borderColor: getEventColor(event.status),
    extendedProps: event
  }));

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.extendedProps);
  };

  const communities = [...new Set(events.map(event => event.community))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Event Calendar</h1>
        <div className="flex flex-wrap gap-2">
          {profile?.role === 'rep' && (
            <Button onClick={() => setShowEventForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          )}
          {profile?.role === 'hod' && (
            <ExportButtons events={filteredEvents} />
          )}
        </div>
      </div>

      <EventFilters
        filters={filters}
        onFiltersChange={setFilters}
        communities={communities}
      />

      <div className="bg-card rounded-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
          }}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={fetchEvents}
        />
      )}

      {showEventForm && (
        <EventFormDialog
          onClose={() => setShowEventForm(false)}
          onSuccess={() => {
            setShowEventForm(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};
