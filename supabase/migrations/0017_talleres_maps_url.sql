-- Migración 0017: Agregar campo opcional maps_url a la tabla talleres para soporte híbrido de Google Maps.
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS maps_url text;
