
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UberWebhookEvent {
  event_id: string;
  event_type: string;
  event_time: string;
  resource_href: string;
  meta: {
    user_id: string;
    resource_id: string;
  };
}

interface DeliveryStatus {
  id: string;
  status: string;
  tracking_url: string;
  courier?: {
    name: string;
    phone_number: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  dropoff_eta?: string;
  proof_of_delivery?: {
    signature_image_url?: string;
    photo_url?: string;
    notes?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookEvent = await req.json() as UberWebhookEvent;
    console.log('Received Uber Direct webhook:', JSON.stringify(webhookEvent, null, 2));

    // Get Uber Direct API credentials
    const uberClientId = Deno.env.get('UBER_CLIENT_ID');
    const uberClientSecret = Deno.env.get('UBER_CLIENT_SECRET');
    const uberCustomerId = Deno.env.get('UBER_CUSTOMER_ID');

    if (!uberClientId || !uberClientSecret || !uberCustomerId) {
      throw new Error('Uber Direct API credentials not configured');
    }

    // Get OAuth token
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
      throw new Error('Failed to authenticate with Uber Direct');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch delivery details from Uber
    const deliveryId = webhookEvent.meta.resource_id;
    const deliveryResponse = await fetch(
      `https://api.uber.com/v1/customers/${uberCustomerId}/deliveries/${deliveryId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!deliveryResponse.ok) {
      throw new Error('Failed to fetch delivery details from Uber');
    }

    const deliveryData = await deliveryResponse.json() as DeliveryStatus;
    console.log('Delivery data from Uber:', JSON.stringify(deliveryData, null, 2));

    // Update order in database
    const updateData: any = {
      uber_delivery_status: deliveryData.status,
      uber_tracking_url: deliveryData.tracking_url,
      updated_at: new Date().toISOString(),
    };

    if (deliveryData.courier) {
      updateData.uber_courier_name = deliveryData.courier.name;
      updateData.uber_courier_phone = deliveryData.courier.phone_number;
      if (deliveryData.courier.location) {
        updateData.uber_courier_location = deliveryData.courier.location;
      }
    }

    if (deliveryData.dropoff_eta) {
      updateData.uber_delivery_eta = deliveryData.dropoff_eta;
    }

    if (deliveryData.proof_of_delivery) {
      updateData.uber_proof_of_delivery = deliveryData.proof_of_delivery;
    }

    // If delivery is completed, update order status
    if (deliveryData.status === 'delivered') {
      updateData.status = 'completed';
    }

    const { data: orderData, error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('uber_delivery_id', deliveryId)
      .select('id, user_id, order_number')
      .single();

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw updateError;
    }

    if (!orderData) {
      console.error('Order not found for delivery ID:', deliveryId);
      throw new Error('Order not found');
    }

    // Create notification for user based on delivery status
    let notificationTitle = '';
    let notificationMessage = '';

    switch (deliveryData.status) {
      case 'en_route_to_pickup':
        notificationTitle = `Order #${orderData.order_number} - Driver En Route`;
        notificationMessage = 'Your driver is on the way to pick up your order!';
        break;
      case 'at_pickup':
        notificationTitle = `Order #${orderData.order_number} - Driver Arrived`;
        notificationMessage = 'Your driver has arrived at the restaurant to pick up your order.';
        break;
      case 'en_route_to_dropoff':
        notificationTitle = `Order #${orderData.order_number} - On the Way`;
        notificationMessage = `Your order is on the way! ${deliveryData.courier?.name || 'Your driver'} will arrive soon.`;
        break;
      case 'delivered':
        notificationTitle = `Order #${orderData.order_number} - Delivered`;
        notificationMessage = 'Your order has been delivered! Enjoy your meal!';
        break;
      case 'canceled':
        notificationTitle = `Order #${orderData.order_number} - Delivery Canceled`;
        notificationMessage = 'The delivery has been canceled. Please contact support for assistance.';
        break;
      default:
        notificationTitle = `Order #${orderData.order_number} - Status Update`;
        notificationMessage = `Delivery status: ${deliveryData.status}`;
    }

    if (notificationTitle) {
      await supabaseClient.from('notifications').insert({
        user_id: orderData.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'order',
        action_url: '/order-history',
      });
    }

    return new Response(
      JSON.stringify({ success: true, orderId: orderData.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing Uber Direct webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
