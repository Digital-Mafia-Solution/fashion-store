-- SQL snippet: add weight (grams) and optional dimensions to products
-- Run in Supabase SQL editor or include in your migration pipeline

alter table products
add column if not exists weight_grams int default 0,
add column if not exists length_mm int null,
add column if not exists width_mm int null,
add column if not exists height_mm int null;

-- Optional: set NOT NULL and a sensible default after backfilling weights
-- alter table products alter column weight_grams set not null;

-- Helpful query to find products missing weight information
select id, name
from products
where
    coalesce(weight_grams, 0) <= 0
limit 100;