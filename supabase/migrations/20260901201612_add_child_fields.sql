-- Add child_type and children_count to persons table

ALTER TABLE public.persons
ADD COLUMN child_type text CHECK (child_type IN ('putr', 'putri')),
ADD COLUMN children_count integer DEFAULT 0;
