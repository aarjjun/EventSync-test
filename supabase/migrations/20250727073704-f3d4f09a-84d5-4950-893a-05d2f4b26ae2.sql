
-- Add end_date column to events table if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Update the existing suggested_end_datetime column to be more clear
-- (This column already exists based on the schema, so we'll use it)

-- Add trigger to automatically set end_date when suggestion is accepted
CREATE OR REPLACE FUNCTION public.update_event_dates_on_suggestion_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    -- If suggested_datetime is being accepted (copied to datetime)
    IF NEW.datetime IS DISTINCT FROM OLD.datetime AND 
       NEW.suggested_datetime IS NOT NULL AND 
       NEW.datetime = NEW.suggested_datetime THEN
        -- Also update end_date if suggested_end_datetime exists
        IF NEW.suggested_end_datetime IS NOT NULL THEN
            NEW.end_date = NEW.suggested_end_datetime;
        END IF;
        
        -- Clear suggestion fields after acceptance
        NEW.suggested_datetime = NULL;
        NEW.suggested_end_datetime = NULL;
        NEW.suggestion_reason = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_event_dates_on_suggestion_acceptance ON public.events;
CREATE TRIGGER trigger_update_event_dates_on_suggestion_acceptance
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_event_dates_on_suggestion_acceptance();
