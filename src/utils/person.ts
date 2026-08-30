import type { Person, Lang } from '@/types';

export function fullNameEn(p: Pick<Person, 'first_name_en' | 'middle_name_en' | 'last_name_en'>): string {
  return [p.first_name_en, p.middle_name_en, p.last_name_en].filter(Boolean).join(' ').trim() || '—';
}

export function fullNameHi(p: Pick<Person, 'first_name_hi' | 'middle_name_hi' | 'last_name_hi'>): string {
  return [p.first_name_hi, p.middle_name_hi, p.last_name_hi].filter(Boolean).join(' ').trim() || '—';
}

export function displayName(p: Person, lang: Lang): string {
  const en = fullNameEn(p);
  const hi = fullNameHi(p);
  if (lang === 'hi' && hi !== '—') return hi;
  if (lang === 'en' && en !== '—') return en;
  return en !== '—' ? en : hi !== '—' ? hi : '—';
}

export function birthYear(p: Person): string | null {
  if (!p.date_of_birth) return null;
  const d = new Date(p.date_of_birth);
  if (isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

export function deathYear(p: Person): string | null {
  if (!p.date_of_death) return null;
  const d = new Date(p.date_of_death);
  if (isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

export function calcAge(p: Person): number | null {
  if (!p.date_of_birth) return null;
  const birth = new Date(p.date_of_birth);
  if (isNaN(birth.getTime())) return null;

  const end = p.date_of_death ? new Date(p.date_of_death) : new Date();
  if (isNaN(end.getTime())) return null;

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
