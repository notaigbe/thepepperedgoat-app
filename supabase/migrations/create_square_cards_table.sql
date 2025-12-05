
-- Migration: Create square_cards table for storing tokenized card information
-- This table stores card metadata from Square for saved payment methods
-- Created: 2024

-- Create square_cards table to store tokenized card information from Square
CREATE TABLE IF NOT EXISTS square_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  square_customer_id text NOT NULL,
  square_card_id text NOT NULL,
  card_brand text NOT NULL,
  last_4 text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  cardholder_name text,
  billing_address jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE square_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cards"
  ON square_cards
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cards"
  ON square_cards
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cards"
  ON square_cards
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cards"
  ON square_cards
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_square_cards_user_id ON square_cards(user_id);
CREATE INDEX idx_square_cards_square_customer_id ON square_cards(square_customer_id);
CREATE INDEX idx_square_cards_is_default ON square_cards(user_id, is_default);

-- Create function to ensure only one default card per user
CREATE OR REPLACE FUNCTION ensure_single_default_card()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE square_cards
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default card
CREATE TRIGGER trigger_ensure_single_default_card
  BEFORE INSERT OR UPDATE ON square_cards
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_card();

-- Add comment to table
COMMENT ON TABLE square_cards IS 'Stores tokenized card information from Square for saved payment methods';
