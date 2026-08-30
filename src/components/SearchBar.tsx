import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { searchPersons } from '@/services/family';
import { displayName, birthYear } from '@/utils/person';
import type { Person } from '@/types';

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchPersons(query, 10);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectPerson(p: Person) {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(`/tree?focus=${p.id}`);
  }

  return (
    <div className={`relative ${compact ? 'w-full' : 'w-full max-w-md'}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-full border border-stone-300 bg-white/90 pl-10 pr-9 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (results.length > 0 || (!loading && query.length > 0)) && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
          {loading && <div className="px-4 py-3 text-sm text-stone-500">{t('loading')}</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-stone-500">{t('noResults')}</div>
          )}
          {!loading &&
            results.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPerson(p)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 transition border-b border-stone-100 last:border-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                  {p.gender === 'female' ? '♀' : p.gender === 'male' ? '♂' : '○'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-stone-800">{displayName(p, lang)}</div>
                  {birthYear(p) && <div className="text-xs text-stone-500">b. {birthYear(p)}</div>}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
