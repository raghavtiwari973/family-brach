-- Add x_pos and y_pos to persons table for saving chart node positions
ALTER TABLE public.persons
ADD COLUMN IF NOT EXISTS x_pos numeric,
ADD COLUMN IF NOT EXISTS y_pos numeric;
