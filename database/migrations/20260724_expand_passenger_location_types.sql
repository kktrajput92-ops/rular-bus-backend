BEGIN;

ALTER TABLE passenger_locations
DROP CONSTRAINT IF EXISTS passenger_locations_type_check;

ALTER TABLE passenger_locations
ADD CONSTRAINT passenger_locations_type_check
CHECK (
  location_type IN (
    'CITY',
    'TOWN',
    'VILLAGE',
    'AREA',
    'STOP',
    'BUS_STAND',
    'BYPASS',
    'PICKUP_POINT',
    'DROP_POINT',
    'LANDMARK',
    'TOLL_PLAZA',
    'DHABA',
    'OTHER'
  )
);

COMMIT;
