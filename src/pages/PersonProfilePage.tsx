import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trees, GitBranch, ChevronUp, ChevronDown, Heart, Users, Trash2, Edit2, User } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { PersonDetail, PersonCard } from '@/components/PersonCard';
import {
  getPerson,
  getChildren,
  getSpouses,
  getAncestors,
  getDescendants,
  deletePerson,
} from '@/services/family';
import type { Person } from '@/types';
import { displayName } from '@/utils/person';

export function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const navigate = useNavigate();

  async function handleDelete(personId: string, isMain: boolean) {
    if (!window.confirm(lang === 'hi' ? 'क्या आप वाकई इस व्यक्ति को हटाना चाहते हैं?' : 'Are you sure you want to delete this person? This action cannot be undone.')) return;
    try {
      await deletePerson(personId);
      if (isMain) {
        navigate('/tree');
      } else {
        setSpouses(spouses.filter(s => s.id !== personId));
      }
    } catch (e) {
      alert(lang === 'hi' ? 'हटाने में विफल। कृपया पुनः प्रयास करें।' : 'Failed to delete person. Please try again.');
    }
  }

  const [person, setPerson] = useState<Person | null>(null);
  const [father, setFather] = useState<Person | null>(null);
  const [mother, setMother] = useState<Person | null>(null);
  const [spouses, setSpouses] = useState<Person[]>([]);
  const [children, setChildren] = useState<Person[]>([]);
  const [ancestors, setAncestors] = useState<{ person: Person; depth: number }[]>([]);
  const [descendants, setDescendants] = useState<{ person: Person; depth: number }[]>([]);
  const [showAncestors, setShowAncestors] = useState(false);
  const [showDescendants, setShowDescendants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const p = await getPerson(id);
        if (cancelled || !p) {
          if (!cancelled) setError(true);
          setLoading(false);
          return;
        }
        setPerson(p);

        const [kids, sps] = await Promise.all([getChildren(id), getSpouses(id)]);
        if (cancelled) return;
        setChildren(kids);
        setSpouses(sps.map((s) => s.spouse));

        if (p.father_id) {
          const f = await getPerson(p.father_id);
          if (!cancelled) setFather(f);
        }
        if (p.mother_id) {
          const m = await getPerson(p.mother_id);
          if (!cancelled) setMother(m);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function loadAncestors() {
    if (!id) return;
    if (ancestors.length > 0) {
      setShowAncestors((v) => !v);
      return;
    }
    try {
      const a = await getAncestors(id);
      setAncestors(a);
      setShowAncestors(true);
    } catch {
      setAncestors([]);
    }
  }

  async function loadDescendants() {
    if (!id) return;
    if (descendants.length > 0) {
      setShowDescendants((v) => !v);
      return;
    }
    try {
      const d = await getDescendants(id);
      setDescendants(d);
      setShowDescendants(true);
    } catch {
      setDescendants([]);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-amber-700" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-800">{t('notFound')}</h1>
        <p className="mt-2 text-stone-500">{t('notFoundDesc')}</p>
        <Link
          to="/tree"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToTree')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/tree"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToTree')}
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/tree?focus=${person.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-amber-600 hover:text-amber-700 transition"
          >
            <Trees className="h-4 w-4" />
            {t('viewTreePosition')}
          </Link>
          <Link
            to={`/tree?focus=${person.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-amber-600 hover:text-amber-700 transition"
          >
            <GitBranch className="h-4 w-4" />
            {t('viewCompleteBranch')}
          </Link>
          {session && (
            <div className="flex items-center gap-2">
              <Link
                to={`/admin/edit/${person.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white hover:bg-stone-900 transition"
              >
                <Edit2 className="h-4 w-4" />
                {t('edit')}
              </Link>
              <button
                onClick={() => handleDelete(person.id, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <PersonDetail person={person} childrenCount={children.length} />

      {/* Parents */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {father && (
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{t('father')}</h3>
            <PersonCard person={father} />
          </div>
        )}
        {mother && (
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{t('mother')}</h3>
            <PersonCard person={mother} />
          </div>
        )}
      </div>

      {/* Spouse */}
      {spouses.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{t('spouse')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {spouses.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-pink-200 bg-pink-50 text-pink-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-800">{displayName(s, lang)}</h4>
                  </div>
                </div>
                {session && (
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/edit/${s.id}`} className="p-2 text-stone-400 hover:text-amber-700 transition" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(s.id, false)} className="p-2 text-stone-400 hover:text-red-600 transition" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Children */}
      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
          <Users className="h-4 w-4" />
          {t('children')} {children.length > 0 && `(${children.length})`}
        </h3>
        {children.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((c) => (
              <PersonCard key={c.id} person={c} />
            ))}
          </div>
        ) : person.children_status === 'no_children' ? (
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-stone-500">
            {t('branchEnds')}
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-stone-500">
            {t('branchIncomplete')}
          </div>
        )}
      </div>

      {/* Ancestors */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <button
          onClick={loadAncestors}
          className="flex w-full items-center justify-between text-sm font-semibold text-stone-700"
        >
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-amber-700" />
            {t('viewAncestors')}
          </span>
          {showAncestors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showAncestors && (
          <div className="mt-3">
            {ancestors.length > 0 ? (
              <div className="space-y-2">
                {ancestors.map((a) => (
                  <PersonCard
                    key={a.person.id}
                    person={a.person}
                    showRelationship={`${t('generation')} ${a.depth}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">{t('branchIncomplete')}</p>
            )}
          </div>
        )}
      </div>

      {/* Descendants */}
      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
        <button
          onClick={loadDescendants}
          className="flex w-full items-center justify-between text-sm font-semibold text-stone-700"
        >
          <span className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-amber-700" />
            {t('viewDescendants')}
          </span>
          {showDescendants ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showDescendants && (
          <div className="mt-3">
            {descendants.length > 0 ? (
              <div className="space-y-2">
                {descendants.map((d) => (
                  <PersonCard
                    key={d.person.id}
                    person={d.person}
                    showRelationship={`${t('generation')} ${d.depth}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">{t('noChildren')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
