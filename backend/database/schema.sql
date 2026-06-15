
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS geofences (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,

    coordinates JSONB NOT NULL,

    category TEXT NOT NULL CHECK (
        category IN ('delivery_zone', 'restricted_zone', 'toll_zone', 'customer_area')
    ),
    
    status TEXT DEFAULT 'active',
  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    vehicle_number TEXT NOT NULL UNIQUE,
    driver_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_locations (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_configs (
    id TEXT PRIMARY KEY,
    geofence_id TEXT NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN ('entry', 'exit', 'both')
    ),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violations (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    geofence_id TEXT NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL CHECK (
        event_type IN ('entry', 'exit')
    ),
    
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
 
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_geofence_state (
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    geofence_id TEXT NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    is_inside BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (vehicle_id, geofence_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id 
    ON vehicle_locations(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_timestamp 
    ON vehicle_locations(timestamp);

CREATE INDEX IF NOT EXISTS idx_violations_vehicle_id 
    ON violations(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_violations_geofence_id 
    ON violations(geofence_id);

CREATE INDEX IF NOT EXISTS idx_violations_timestamp 
    ON violations(timestamp);

CREATE INDEX IF NOT EXISTS idx_alert_configs_geofence_id 
    ON alert_configs(geofence_id);

CREATE INDEX IF NOT EXISTS idx_alert_configs_vehicle_id 
    ON alert_configs(vehicle_id);

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;