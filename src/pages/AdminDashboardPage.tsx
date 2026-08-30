import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Trees, UserPlus, Pencil, Trash2, Search, LayoutDashboard } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { getStats, getRecentPersons, getPersons, deletePerson } from '@/services/family';
import { displayName, birthYear, calcAge } from '@/utils/person';
import type { Person } from '@/types';

export function AdminDashboardPage() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<{ total: number; alive: number; deceased: number } | null>(null);
  const [recent, setRecent] = useState<Person[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, all] = await Promise.all([getStats(), getRecentPersons(6), getPersons(1000)]);
        setStats(s);
        setRecent(r);
        setAllPersons(all);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id: string) {
    try {
      await deletePerson(id);
      setAllPersons((prev) => prev.filter((p) => p.id !== id));
      setRecent((prev) => prev.filter((p) => p.id !== id));
      setConfirmId(null);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const filtered = query.trim()
    ? allPersons.filter((p) =>
        displayName(p, lang).toLowerCase().includes(query.toLowerCase()),
      )
    : recent;

  const statCards = [
    { label: t('totalMembers'), value: stats?.total ?? 0, icon: Users, color: 'text-amber-700 bg-amber-50' },
    { label: t('aliveMembers'), value: stats?.alive ?? 0, icon: Heart, color: 'text-emerald-700 bg-emerald-50' },
    { label: t('deceasedMembers'), value: stats?.deceased ?? 0, icon: Trees, color: 'text-stone-600 bg-stone-100' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-amber-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-2">
        <LayoutDashboard className="h-6 w-6 text-amber-700" />
        <h1 className="text-2xl font-bold text-stone-800">{t('dashboard')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-bold text-stone-800">{card.value}</div>
            <div className="text-sm text-stone-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/admin/add"
          className="flex items-center gap-2 rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900 transition"
        >
          <UserPlus className="h-4 w-4" />
          {t('addMember')}
        </Link>
        <Link
          to="/tree"
          className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition"
        >
          <Trees className="h-4 w-4" />
          {t('familyTree')}
        </Link>
      </div>

      {/* Manage members */}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-800">
            {query ? `${t('manageMembers')} (${filtered.length})` : t('recentlyAdded')}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-64 rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-stone-500">
            {query ? t('noResults') : t('noPersonsYet')}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                  {p.gender === 'female' ? '♀' : p.gender === 'male' ? '♂' : '○'}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/person/${p.id}`} className="block truncate text-sm font-medium text-stone-800 hover:text-amber-700">
                    {displayName(p, lang)}
                  </Link>
                  <div className="text-xs text-stone-500">
                    {p.life_status === 'alive' && calcAge(p) != null
                      ? `${t('age')}: ${calcAge(p)} ${t('years')}`
                      : birthYear(p)
                        ? `${t('born')}: ${birthYear(p)}`
                        : t('unknown')}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Link
                    to={`/admin/edit/${p.id}`}
                    className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:border-amber-600 hover:text-amber-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setConfirmId(p.id)}
                    className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:border-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-stone-700">{t('deleteConfirm')}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
