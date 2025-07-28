
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  eventId: string;
  action: 'approved' | 'rejected' | 'suggested';
  recipientEmail: string;
  eventTitle: string;
  hodMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { eventId, action, recipientEmail, eventTitle, hodMessage }: NotificationRequest = await req.json();

    // This is a placeholder for email sending logic
    // You would integrate with your email service here (like Resend)
    console.log(`Sending ${action} notification for event "${eventTitle}" to ${recipientEmail}`);
    
    if (hodMessage) {
      console.log(`HOD message: ${hodMessage}`);
    }

    // For now, we'll just log the notification
    // In a real implementation, you would send an actual email here
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `${action} notification sent successfully` 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-event-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
