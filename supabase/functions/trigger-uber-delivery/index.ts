
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryRequest {
  orderId: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dropoffAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  pickupPhoneNumber: string;
  dropoffPhoneNumber: string;
  pickupName: string;
  dropoffName: string;
  pickupNotes?: string;
  dropoffNotes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { orderId, pickupAddress, dropoffAddress, pickupPhoneNumber, dropoffPhoneNumber, pickupName, dropoffName, pickupNotes, dropoffNotes } = await req.json() as DeliveryRequest;

    console.log('Triggering Uber Direct delivery for order:', orderId);

    // Get Uber Direct API credentials from environment
    const uberClientId = Deno.env.get('UBER_CLIENT_ID');
    const uberClientSecret = Deno.env.get('UBER_CLIENT_SECRET');
    const uberCustomerId = Deno.env.get('UBER_CUSTOMER_ID');

    if (!uberClientId || !uberClientSecret || !uberCustomerId) {
      throw new Error('Uber Direct API credentials not configured');
    }

    // Get OAuth token from Uber
    const tokenResponse = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: uberClientId,
        client_secret: uberClientSecret,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Uber OAuth error:', errorText);
      throw new Error('Failed to authenticate with Uber Direct');
    }

    const { access_token } = await tokenResponse.json();

    // Create delivery request
    const deliveryPayload = {
      external_id: orderId,
      pickup: {
        name: pickupName,
        phone_number: pickupPhoneNumber,
        address: `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}`,
        detailed_address: {
          street_address: [pickupAddress.street],
          city: pickupAddress.city,
          state: pickupAddress.state,
          zip_code: pickupAddress.zipCode,
          country: pickupAddress.country,
        },
        notes: pickupNotes || '',
      },
      dropoff: {
        name: dropoffName,
        phone_number: dropoffPhoneNumber,
        address: `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.state} ${dropoffAddress.zipCode}`,
        detailed_address: {
          street_address: [dropoffAddress.street],
          city: dropoffAddress.city,
          state: dropoffAddress.state,
          zip_code: dropoffAddress.zipCode,
          country: dropoffAddress.country,
        },
        notes: dropoffNotes || '',
      },
      manifest: {
        description: `Order #${orderId}`,
      },
      pickup_ready_dt: new Date().toISOString(),
      dropoff_ready_dt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    };

    console.log('Creating Uber Direct delivery:', JSON.stringify(deliveryPayload, null, 2));

    const deliveryResponse = await fetch(`https://api.uber.com/v1/customers/${uberCustomerId}/deliveries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryPayload),
    });

    if (!deliveryResponse.ok) {
      const errorText = await deliveryResponse.text();
      console.error('Uber Direct API error:', errorText);
      throw new Error(`Failed to create Uber Direct delivery: ${errorText}`);
    }

    const deliveryData = await deliveryResponse.json();
    console.log('Uber Direct delivery created:', deliveryData);

    // Update order with delivery information
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        uber_delivery_id: deliveryData.id,
        uber_delivery_status: deliveryData.status,
        uber_tracking_url: deliveryData.tracking_url,
        delivery_triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order with delivery info:', updateError);
      throw updateError;
    }

    // Create notification for user
    const { data: orderData } = await supabaseClient
      .from('orders')
      .select('user_id, order_number')
      .eq('id', orderId)
      .single();

    if (orderData) {
      await supabaseClient.from('notifications').insert({
        user_id: orderData.user_id,
        title: `Order #${orderData.order_number} - Delivery Started`,
        message: 'Your order is being delivered via Uber Direct. Track your delivery in real-time!',
        type: 'order',
        action_url: '/order-history',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deliveryId: deliveryData.id,
        trackingUrl: deliveryData.tracking_url,
        status: deliveryData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error triggering Uber Direct delivery:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
