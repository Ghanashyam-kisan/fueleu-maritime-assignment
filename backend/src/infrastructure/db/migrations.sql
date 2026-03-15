-- FuelEU Maritime Compliance — Database Schema
-- Run with: psql $DATABASE_URL -f src/infrastructure/db/migrations.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Routes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id         VARCHAR(20)  NOT NULL UNIQUE,
  vessel_type      VARCHAR(50)  NOT NULL,
  fuel_type        VARCHAR(20)  NOT NULL,
  year             INTEGER      NOT NULL,
  ghg_intensity    NUMERIC(8,4) NOT NULL,   -- gCO2e/MJ
  fuel_consumption NUMERIC(10,2) NOT NULL,  -- tonnes
  distance         NUMERIC(10,2) NOT NULL,  -- km
  total_emissions  NUMERIC(10,2) NOT NULL,  -- tonnes
  is_baseline      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Only one baseline at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_single_baseline
  ON routes (is_baseline)
  WHERE is_baseline = TRUE;

-- ─── Ship Compliance ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ship_compliance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id     VARCHAR(20)  NOT NULL,
  year        INTEGER      NOT NULL,
  cb_gco2eq   NUMERIC(20,4) NOT NULL,  -- positive = surplus, negative = deficit
  computed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ship_id, year)
);

-- ─── Bank Entries ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id        VARCHAR(20)   NOT NULL,
  year           INTEGER       NOT NULL,
  amount_gco2eq  NUMERIC(20,4) NOT NULL CHECK (amount_gco2eq > 0),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_entries_ship_year
  ON bank_entries (ship_id, year);

-- ─── Pools ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pools (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year       INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Pool Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id   UUID          NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  ship_id   VARCHAR(20)   NOT NULL,
  cb_before NUMERIC(20,4) NOT NULL,
  cb_after  NUMERIC(20,4) NOT NULL,
  PRIMARY KEY (pool_id, ship_id)
);

-- ─── Seed Data ────────────────────────────────────────────────────────────────
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
VALUES
  ('R001', 'Container',   'HFO', 2024, 91.0, 5000, 12000, 4500, TRUE),
  ('R002', 'BulkCarrier', 'LNG', 2024, 88.0, 4800, 11500, 4200, FALSE),
  ('R003', 'Tanker',      'MGO', 2024, 93.5, 5100, 12500, 4700, FALSE),
  ('R004', 'RoRo',        'HFO', 2025, 89.2, 4900, 11800, 4300, FALSE),
  ('R005', 'Container',   'LNG', 2025, 90.5, 4950, 11900, 4400, FALSE)
ON CONFLICT (route_id) DO NOTHING;
