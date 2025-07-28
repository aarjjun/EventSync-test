
-- Add new columns to the events table for suggestion functionality
ALTER TABLE public.events 
ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN suggested_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN suggestion_reason TEXT;
