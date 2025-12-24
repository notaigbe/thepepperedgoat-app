
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-doordash-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const webhookData = await req.json();
    console.log('DoorDash webhook received:', JSON.stringify(webhookData, null, 2));

    const {
      external_delivery_id,
      delivery_status,
      tracking_url,
      dasher_name,
      dasher_phone_number,
      dasher_location,
      estimated_pickup_time,
      estimated_dropoff_time,
      proof_of_delivery,
    } = webhookData;

    if (!external_delivery_id) {
      throw new Error('Missing external_delivery_id in webhook data');
    }

    // Update order with delivery information
    const updateData: any = {
      doordash_delivery_status: delivery_status,
      updated_at: new Date().toISOString(),
    };

    if (tracking_url) updateData.doordash_tracking_url = tracking_url;
    if (dasher_name) updateData.doordash_dasher_name = dasher_name;
    if (dasher_phone_number) updateData.doordash_dasher_phone = dasher_phone_number;
    if (dasher_location) updateData.doordash_dasher_location = dasher_location;
    if (estimated_dropoff_time) updateData.doordash_delivery_eta = estimated_dropoff_time;
    if (proof_of_delivery) updateData.doordash_proof_of_delivery = proof_of_delivery;

    // If delivery is completed, update order status
    if (delivery_status === 'delivered') {
      updateData.status = 'completed';
    }

    const { data: order, error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', external_delivery_id)
      .select('user_id, order_number')
      .single();

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw updateError;
    }

    console.log('Order updated successfully:', order);

    // Send notification to user based on status
    if (order) {
      let notificationTitle = '';
      let notificationMessage = '';

      switch (delivery_status) {
        case 'confirmed':
          notificationTitle = `Order #${order.order_number} - Dasher Assigned`;
          notificationMessage = 'A dasher has been assigned to your order and is on the way to pick it up!';
          break;
        case 'picked_up':
          notificationTitle = `Order #${order.order_number} - On the Way`;
          notificationMessage = 'Your order has been picked up and is on the way to you!';
          break;
        case 'delivered':
          notificationTitle = `Order #${order.order_number} - Delivered`;
          notificationMessage = 'Your order has been delivered. Enjoy your meal!';
          break;
        case 'cancelled':
          notificationTitle = `Order #${order.order_number} - Delivery Cancelled`;
          notificationMessage = 'Your delivery has been cancelled. Please contact support for assistance.';
          break;
        default:
          notificationTitle = `Order #${order.order_number} - Status Update`;
          notificationMessage = `Your delivery status has been updated to: ${delivery_status}`;
      }

      if (notificationTitle && notificationMessage) {
        await supabaseClient.from('notifications').insert({
          user_id: order.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'order',
          action_url: '/order-history',
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing DoorDash webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
