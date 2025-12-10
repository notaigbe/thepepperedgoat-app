
-- Add Uber Direct delivery tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_delivery_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_courier_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_courier_location JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_delivery_eta TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_proof_of_delivery JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_triggered_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_uber_delivery_id ON orders(uber_delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_uber_delivery_status ON orders(uber_delivery_status);

-- Add comment for documentation
COMMENT ON COLUMN orders.uber_delivery_id IS 'Uber Direct delivery ID';
COMMENT ON COLUMN orders.uber_delivery_status IS 'Current status of Uber Direct delivery (e.g., pending, en_route_to_pickup, at_pickup, en_route_to_dropoff, delivered, canceled)';
COMMENT ON COLUMN orders.uber_tracking_url IS 'URL for tracking the delivery';
COMMENT ON COLUMN orders.uber_courier_name IS 'Name of the courier';
COMMENT ON COLUMN orders.uber_courier_phone IS 'Phone number of the courier';
COMMENT ON COLUMN orders.uber_courier_location IS 'Current location of the courier (lat/lng)';
COMMENT ON COLUMN orders.uber_delivery_eta IS 'Estimated time of arrival';
COMMENT ON COLUMN orders.uber_proof_of_delivery IS 'Proof of delivery data (signature, photo, etc.)';
COMMENT ON COLUMN orders.delivery_triggered_at IS 'Timestamp when delivery was triggered';
