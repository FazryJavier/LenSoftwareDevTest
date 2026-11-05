-- A map viewport is a longitude/latitude rectangle, which is a geometry question. The
-- geography index compares 3D geocentric boxes, so it cannot serve that query correctly.

-- +goose Up
CREATE INDEX entities_location_geometry_gist_idx ON entities USING gist ((location::geometry));
DROP INDEX entities_location_gist_idx;

-- +goose Down
CREATE INDEX entities_location_gist_idx ON entities USING gist (location);
DROP INDEX entities_location_geometry_gist_idx;
