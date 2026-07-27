BEGIN;

CREATE TABLE IF NOT EXISTS homepage_route_shortcuts (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL
    REFERENCES routes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  display_label VARCHAR(160),
  note VARCHAR(200),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT homepage_route_shortcuts_route_unique UNIQUE (route_id),
  CONSTRAINT homepage_route_shortcuts_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS homepage_route_shortcuts_active_sort_idx
ON homepage_route_shortcuts (is_active, sort_order, id);

COMMIT;
