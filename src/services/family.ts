import { supabase } from '@/lib/supabase';
import type { Person, PersonInput, Spouse } from '@/types';

function orTextSearch(query: string) {
  const q = query.trim();
  if (!q) return '';
  const escaped = q.replace(/,/g, '\\,');
  return `first_name_en.ilike.%${escaped}%,middle_name_en.ilike.%${escaped}%,last_name_en.ilike.%${escaped}%,first_name_hi.ilike.%${escaped}%,middle_name_hi.ilike.%${escaped}%,last_name_hi.ilike.%${escaped}%,nickname.ilike.%${escaped}%`;
}

export async function searchPersons(query: string, limit = 20): Promise<Person[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .or(orTextSearch(q))
    .limit(limit);
  if (error) throw error;
  return data as Person[];
}

export async function getPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase.from('persons').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Person | null;
}

export async function getPersons(limit = 500): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Person[];
}

export async function getRecentPersons(limit = 6): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Person[];
}

export async function getChildren(personId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .or(`father_id.eq.${personId},mother_id.eq.${personId}`)
    .order('date_of_birth', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as Person[];
}

export async function getRootAncestor(): Promise<Person | null> {
  // Oldest known ancestor: a person who is nobody's child (no parent ids set),
  // sorted by birth date ascending. Falls back to oldest created if no DOB.
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .is('father_id', null)
    .is('mother_id', null)
    .order('date_of_birth', { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Person | null;
}

export async function getSpouses(personId: string): Promise<{ spouse: Person; marriage: Spouse }[]> {
  const { data: rels, error } = await supabase
    .from('spouses')
    .select('*')
    .or(`person_one.eq.${personId},person_two.eq.${personId}`);
  if (error) throw error;
  if (!rels || rels.length === 0) return [];

  const results: { spouse: Person; marriage: Spouse }[] = [];
  const seenSpouses = new Set<string>();
  for (const rel of rels as Spouse[]) {
    const spouseId = rel.person_one === personId ? rel.person_two : rel.person_one;
    if (seenSpouses.has(spouseId)) continue;
    seenSpouses.add(spouseId);
    
    const { data: sp, error: spErr } = await supabase
      .from('persons')
      .select('*')
      .eq('id', spouseId)
      .maybeSingle();
    if (spErr) throw spErr;
    if (sp) results.push({ spouse: sp as Person, marriage: rel });
  }
  return results;
}

export async function getDescendants(personId: string, maxDepth = 100): Promise<{ person: Person; depth: number }[]> {
  const { data: ids, error } = await supabase.rpc('get_descendants', {
    start_id: personId,
    max_depth: maxDepth,
  });
  if (error) throw error;
  if (!ids || ids.length === 0) return [];

  const personIds = ids.map((r: { id: string; depth: number }) => r.id);
  const { data: persons, error: pErr } = await supabase
    .from('persons')
    .select('*')
    .in('id', personIds);
  if (pErr) throw pErr;

  const byId = new Map((persons as Person[]).map((p) => [p.id, p]));
  return ids.map((r: { id: string; depth: number }) => ({
    person: byId.get(r.id),
    depth: r.depth,
  })).filter((r: any) => r.person) as { person: Person; depth: number }[];
}

export async function getAncestors(personId: string, maxDepth = 100): Promise<{ person: Person; depth: number }[]> {
  const { data: ids, error } = await supabase.rpc('get_ancestors', {
    start_id: personId,
    max_depth: maxDepth,
  });
  if (error) throw error;
  if (!ids || ids.length === 0) return [];

  const personIds = ids.map((r: { id: string; depth: number }) => r.id);
  const { data: persons, error: pErr } = await supabase
    .from('persons')
    .select('*')
    .in('id', personIds);
  if (pErr) throw pErr;

  const byId = new Map((persons as Person[]).map((p) => [p.id, p]));
  return ids.map((r: { id: string; depth: number }) => ({
    person: byId.get(r.id),
    depth: r.depth,
  })).filter((r: any) => r.person) as { person: Person; depth: number }[];
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const { data, error } = await supabase.from('persons').insert(input).select('*').single();
  if (error) throw error;
  return data as Person;
}

export async function updatePerson(id: string, input: PersonInput): Promise<Person> {
  const { data, error } = await supabase.from('persons').update(input).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Person;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('persons').delete().eq('id', id);
  if (error) throw error;
}

export async function createSpouse(
  personOne: string,
  personTwo: string,
  extra?: { marriage_date?: string | null; marriage_location?: string | null; marriage_status?: string },
): Promise<Spouse> {
  const payload = {
    person_one: personOne,
    person_two: personTwo,
    marriage_date: extra?.marriage_date ?? null,
    marriage_location: extra?.marriage_location ?? null,
    marriage_status: extra?.marriage_status ?? 'unknown',
  };
  const { data, error } = await supabase.from('spouses').insert(payload).select('*').single();
  if (error) throw error;
  return data as Spouse;
}

export async function deleteSpouse(id: string): Promise<void> {
  const { error } = await supabase.from('spouses').delete().eq('id', id);
  if (error) throw error;
}

export async function getStats(): Promise<{
  total: number;
  alive: number;
  deceased: number;
}> {
  const { count: total, error: e1 } = await supabase.from('persons').select('*', { count: 'exact', head: true });
  if (e1) throw e1;
  const { count: alive, error: e2 } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true })
    .eq('life_status', 'alive');
  if (e2) throw e2;
  const { count: deceased, error: e3 } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true })
    .eq('life_status', 'deceased');
  if (e3) throw e3;
  return { total: total ?? 0, alive: alive ?? 0, deceased: deceased ?? 0 };
}
