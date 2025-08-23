-- Create service_messages table for communication between admin and dealers
CREATE TABLE IF NOT EXISTS service_messages (
  id SERIAL PRIMARY KEY,
  service_request_id INTEGER NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('admin', 'dealer')),
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_messages_request_id ON service_messages(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_messages_created_at ON service_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_service_messages_sender_type ON service_messages(sender_type);

-- Add foreign key constraint if service_requests table exists
-- ALTER TABLE service_messages ADD CONSTRAINT fk_service_messages_service_request_id 
-- FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE;

-- Insert sample messages for testing
INSERT INTO service_messages (service_request_id, sender_type, sender_name, message) VALUES
(1, 'admin', 'Administrator', 'We have received your service request and are reviewing it.'),
(1, 'dealer', 'Dealer ABC', 'Thank you for the update. When can we expect a resolution?'),
(1, 'admin', 'Administrator', 'We will have a technician contact you within 24 hours.'),
(2, 'admin', 'Administrator', 'Your warranty claim has been approved. Parts will be shipped tomorrow.'),
(2, 'dealer', 'Dealer XYZ', 'Excellent! Please provide the tracking number when available.');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_messages_updated_at
  BEFORE UPDATE ON service_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_service_messages_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON service_messages TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE service_messages_id_seq TO authenticated;
