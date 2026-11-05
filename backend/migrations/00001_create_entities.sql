-- +goose Up
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE entities (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
    type        text NOT NULL CHECK (type IN ('vehicle', 'iot_device', 'facility', 'other')),
    status      text NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
    description varchar(500),
    attributes  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(attributes) = 'object'),
    location    geography(Point, 4326) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX entities_location_gist_idx ON entities USING gist (location);
CREATE INDEX entities_type_status_idx ON entities (type, status);
CREATE INDEX entities_created_at_id_idx ON entities (created_at DESC, id DESC);

-- +goose Down
DROP TABLE entities;
