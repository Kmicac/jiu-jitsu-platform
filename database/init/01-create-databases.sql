-- Create databases for each service
CREATE DATABASE auth_db;
CREATE DATABASE event_db;
CREATE DATABASE marketplace_db;
CREATE DATABASE payment_db;

-- Grant all privileges to postgres user (for development)
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE event_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE marketplace_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO postgres;
