-- Add heater_status to sensor_readings
ALTER TABLE sensor_readings
  ADD COLUMN IF NOT EXISTS heater_status BOOLEAN DEFAULT false;
