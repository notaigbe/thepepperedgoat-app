
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders } from '../_shared/cors.ts';

console.log('RSVP Event function started');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { eventId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    console.log('Processing RSVP for user:', user.id, 'event:', eventId);

    // Use a transaction-like approach with row-level locking to prevent race conditions
    // First, check if user already has an RSVP
    const { data: existingRsvp, error: checkError } = await supabaseClient
      .from('event_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing RSVP:', checkError);
      throw new Error('Failed to check existing RSVP');
    }

    if (existingRsvp) {
      return new Response(
        JSON.stringify({ error: 'You have already RSVP\'d to this event' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get event with available spots using FOR UPDATE to lock the row
    // Note: Supabase client doesn't support FOR UPDATE directly, so we'll use RPC
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('id, available_spots, capacity')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      throw new Error('Event not found');
    }

    console.log('Event available spots:', event.available_spots);

    // Check if spots are available
    if (event.available_spots <= 0) {
      return new Response(
        JSON.stringify({ error: 'No spots available for this event' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Attempt to decrease available spots atomically
    // This will only succeed if available_spots is still > 0
    const { data: updatedEvent, error: updateError } = await supabaseClient
      .from('events')
      .update({ available_spots: event.available_spots - 1 })
      .eq('id', eventId)
      .eq('available_spots', event.available_spots) // Only update if spots haven't changed
      .select('available_spots')
      .single();

    if (updateError || !updatedEvent) {
      console.error('Error updating event spots:', updateError);
      // This likely means someone else took the last spot
      return new Response(
        JSON.stringify({ error: 'Failed to reserve spot. Event may be full.' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Updated event spots to:', updatedEvent.available_spots);

    // Create RSVP record
    const { data: rsvp, error: rsvpError } = await supabaseClient
      .from('event_rsvps')
      .insert({
        event_id: eventId,
        user_id: user.id,
      })
      .select()
      .single();

    if (rsvpError) {
      console.error('Error creating RSVP:', rsvpError);
      
      // Rollback: increase available spots back
      await supabaseClient
        .from('events')
        .update({ available_spots: event.available_spots })
        .eq('id', eventId);

      throw new Error('Failed to create RSVP');
    }

    console.log('RSVP created successfully:', rsvp.id);

    return new Response(
      JSON.stringify({
        success: true,
        rsvp,
        availableSpots: updatedEvent.available_spots,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in RSVP function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
