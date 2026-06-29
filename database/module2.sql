-- ==========================================
-- MODULE 2 : Multi Stop Booking
-- ==========================================

-- Journey Segments
CREATE TABLE IF NOT EXISTS journeys (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    boarding_stop_id INTEGER NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    dropping_stop_id INTEGER NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    distance_km NUMERIC(8,2),
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fare Matrix
CREATE TABLE IF NOT EXISTS fares (
    id SERIAL PRIMARY KEY,
    journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seat Locks
CREATE TABLE IF NOT EXISTS seat_locks (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'locked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journey_route
ON journeys(route_id);

CREATE INDEX IF NOT EXISTS idx_fare_journey
ON fares(journey_id);

CREATE INDEX IF NOT EXISTS idx_lock_schedule
ON seat_locks(schedule_id);

CREATE INDEX IF NOT EXISTS idx_lock_seat
ON seat_locks(seat_number);
