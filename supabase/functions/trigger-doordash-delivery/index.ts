
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

    console.log('Triggering DoorDash delivery for order:', orderId);

    // Get DoorDash API credentials from environment
    const doordashDeveloperId = Deno.env.get('DOORDASH_DEVELOPER_ID');
    const doordashKeyId = Deno.env.get('DOORDASH_KEY_ID');
    const doordashSigningSecret = Deno.env.get('DOORDASH_SIGNING_SECRET');

    if (!doordashDeveloperId || !doordashKeyId || !doordashSigningSecret) {
      throw new Error('DoorDash API credentials not configured');
    }

    // Generate JWT for DoorDash API authentication
    const header = {
      alg: 'HS256',
      typ: 'JWT',
      dd-ver: 'DD-JWT-V1'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'doordash',
      iss: doordashDeveloperId,
      kid: doordashKeyId,
      exp: now + 300, // 5 minutes
      iat: now,
    };

    // Simple JWT encoding (for production, use a proper JWT library)
    const base64UrlEncode = (str: string) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    // Create HMAC signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(doordashSigningSecret);
    const messageData = encoder.encode(signatureInput);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${headerEncoded}.${payloadEncoded}.${signatureBase64}`;

    // Create delivery request
    const deliveryPayload = {
      external_delivery_id: orderId,
      pickup_address: `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}`,
      pickup_business_name: pickupName,
      pickup_phone_number: pickupPhoneNumber,
      pickup_instructions: pickupNotes || '',
      dropoff_address: `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.state} ${dropoffAddress.zipCode}`,
      dropoff_business_name: dropoffName,
      dropoff_phone_number: dropoffPhoneNumber,
      dropoff_instructions: dropoffNotes || '',
      order_value: 0, // Will be updated with actual order value
      tip: 0,
      pickup_time: new Date().toISOString(),
      dropoff_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    };

    console.log('Creating DoorDash delivery:', JSON.stringify(deliveryPayload, null, 2));

    const deliveryResponse = await fetch('https://openapi.doordash.com/drive/v2/deliveries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryPayload),
    });

    if (!deliveryResponse.ok) {
      const errorText = await deliveryResponse.text();
      console.error('DoorDash API error:', errorText);
      throw new Error(`Failed to create DoorDash delivery: ${errorText}`);
    }

    const deliveryData = await deliveryResponse.json();
    console.log('DoorDash delivery created:', deliveryData);

    // Update order with delivery information
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        doordash_delivery_id: deliveryData.external_delivery_id,
        doordash_delivery_status: deliveryData.delivery_status,
        doordash_tracking_url: deliveryData.tracking_url,
        delivery_provider: 'doordash',
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
        message: 'Your order is being delivered via DoorDash. Track your delivery in real-time!',
        type: 'order',
        action_url: '/order-history',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deliveryId: deliveryData.external_delivery_id,
        trackingUrl: deliveryData.tracking_url,
        status: deliveryData.delivery_status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error triggering DoorDash delivery:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
