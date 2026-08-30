/*
# Family Heritage Tree — schema (complete)

1. New Tables
- `persons` — every family member. Names stored in both English and Hindi.
  Parents tracked via `father_id` / `mother_id` self-references (children are
  discovered by querying these, so the tree is built dynamically and scales to
  thousands of members). Includes life status, dates, biography, photo, and
  branch/children status flags.
- `spouses` — marriage relationships between two persons. Supports multiple
  marriages and marriage status. Prevents self-relationship via CHECK.
2. Functions
- `get_descendants(start_id, max_depth)` — recursive CTE returning descendant
  ids with their generation depth (cycle-safe via path array, depth-capped).
- `get_ancestors(start_id, max_depth)` — recursive CTE returning ancestor ids
  with depth (follows both father and mother chains, cycle-safe).
3. Security
- RLS enabled on both tables.
- READ (SELECT) open to `anon, authenticated` — viewers (not signed in) can
  browse the family tree and profiles.
- WRITE (INSERT/UPDATE/DELETE) restricted to `authenticated` — signed-in users
  are family admins who can add/edit members. Anon users are read-only viewers.
4. Notes
- Children are NOT stored as an array on the parent; they are discovered via
  father_id/mother_id queries. This keeps relationships consistent.
- Foreign keys use ON DELETE SET NULL for parents and ON DELETE CASCADE for spouses.
- CTE names avoid Postgres reserved words (desc).
*/

CREATE TABLE IF NOT EXISTS persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name_en text,
  middle_name_en text,
  last_name_en text,
  first_name_hi text,
  middle_name_hi text,
  last_name_hi text,
  nickname text,
  gender text CHECK (gender IN ('male','female','other')),
  date_of_birth date,
  place_of_birth text,
  date_of_death date,
  place_of_death text,
  life_status text NOT NULL CHECK (life_status IN ('alive','deceased','unknown')) DEFAULT 'unknown',
  profile_photo text,
  biography text,
  father_id uuid REFERENCES persons(id) ON DELETE SET NULL,
  mother_id uuid REFERENCES persons(id) ON DELETE SET NULL,
  children_status text NOT NULL CHECK (children_status IN ('has_children','no_children','unknown')) DEFAULT 'unknown',
  branch_status text NOT NULL CHECK (branch_status IN ('continues','ends_here','unknown')) DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS persons_father_id_idx ON persons (father_id);
CREATE INDEX IF NOT EXISTS persons_mother_id_idx ON persons (mother_id);
CREATE INDEX IF NOT EXISTS persons_last_name_en_idx ON persons (last_name_en);

CREATE TABLE IF NOT EXISTS spouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_one uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  person_two uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  marriage_date date,
  marriage_location text,
  marriage_status text NOT NULL CHECK (marriage_status IN ('married','separated','divorced','widowed','unknown')) DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (person_one <> person_two)
);

CREATE INDEX IF NOT EXISTS spouses_person_one_idx ON spouses (person_one);
CREATE INDEX IF NOT EXISTS spouses_person_two_idx ON spouses (person_two);

ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE spouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "persons_select_all" ON persons;
CREATE POLICY "persons_select_all"
  ON persons FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "persons_insert_auth" ON persons;
CREATE POLICY "persons_insert_auth"
  ON persons FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "persons_update_auth" ON persons;
CREATE POLICY "persons_update_auth"
  ON persons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "persons_delete_auth" ON persons;
CREATE POLICY "persons_delete_auth"
  ON persons FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "spouses_select_all" ON spouses;
CREATE POLICY "spouses_select_all"
  ON spouses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "spouses_insert_auth" ON spouses;
CREATE POLICY "spouses_insert_auth"
  ON spouses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "spouses_update_auth" ON spouses;
CREATE POLICY "spouses_update_auth"
  ON spouses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "spouses_delete_auth" ON spouses;
CREATE POLICY "spouses_delete_auth"
  ON spouses FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS persons_touch_updated_at ON persons;
CREATE TRIGGER persons_touch_updated_at BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION get_descendants(start_id uuid, max_depth int DEFAULT 100)
RETURNS TABLE (id uuid, depth int) AS $$
WITH RECURSIVE desc_tree AS (
  SELECT c.id, 1 AS depth, ARRAY[start_id, c.id]::uuid[] AS path
  FROM persons c
  WHERE c.father_id = start_id OR c.mother_id = start_id
  UNION ALL
  SELECT c.id, d.depth + 1, d.path || c.id
  FROM persons c
  JOIN desc_tree d ON (c.father_id = d.id OR c.mother_id = d.id)
  WHERE d.depth < max_depth AND NOT (c.id = ANY(d.path))
)
SELECT id, depth FROM desc_tree;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_ancestors(start_id uuid, max_depth int DEFAULT 100)
RETURNS TABLE (id uuid, depth int) AS $$
WITH RECURSIVE parent_links AS (
  SELECT id, father_id AS parent_id FROM persons WHERE father_id IS NOT NULL
  UNION ALL
  SELECT id, mother_id AS parent_id FROM persons WHERE mother_id IS NOT NULL
),
anc_tree AS (
  SELECT pl.parent_id, 1 AS depth, ARRAY[start_id, pl.parent_id]::uuid[] AS path
  FROM parent_links pl
  WHERE pl.id = start_id
  UNION ALL
  SELECT pl.parent_id, a.depth + 1, a.path || pl.parent_id
  FROM parent_links pl
  JOIN anc_tree a ON pl.id = a.parent_id
  WHERE a.depth < max_depth AND NOT (pl.parent_id = ANY(a.path))
)
SELECT DISTINCT ON (parent_id) parent_id AS id, depth FROM anc_tree ORDER BY parent_id, depth;
$$ LANGUAGE sql STABLE;
