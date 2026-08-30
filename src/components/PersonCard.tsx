import { Link } from 'react-router-dom';
import { User, Heart, GitBranch } from 'lucide-react';
import type { Person } from '@/types';
import type { Lang } from '@/i18n/translations';
import { useI18n } from '@/context/I18nContext';
import { displayName, fullNameHi, birthYear, deathYear, calcAge, formatDate } from '@/utils/person';

export function PersonCard({
  person,
  showRelationship,
}: {
  person: Person;
  showRelationship?: string;
}) {
  const { t, lang } = useI18n();

  return (
    <Link
      to={`/person/${person.id}`}
      className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition hover:border-amber-300 hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-2 ring-stone-200">
        {person.profile_photo ? (
          <img src={person.profile_photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-stone-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-stone-800 group-hover:text-amber-800">
          {displayName(person, lang)}
        </div>
        {showRelationship && (
          <div className="text-xs text-stone-500">{showRelationship}</div>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          {person.life_status === 'alive' && (
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('alive')}
              {calcAge(person) != null && <span className="text-stone-400">· {calcAge(person)} {t('years')}</span>}
            </span>
          )}
          {person.life_status === 'deceased' && (
            <span className="flex items-center gap-1 text-stone-500">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
              {t('deceased')}
            </span>
          )}
          {person.life_status === 'unknown' && <span className="text-stone-400">{t('unknown')}</span>}
        </div>
      </div>
    </Link>
  );
}

export function PersonDetail({ person }: { person: Person }) {
  const { t, lang } = useI18n();
  const age = calcAge(person);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-800 to-stone-800 p-6 text-white">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-4 ring-white/20">
            {person.profile_photo ? (
              <img src={person.profile_photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-white/70" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{displayName(person, lang)}</h1>
            <p className="mt-1 text-amber-200">{fullNameHi(person)}</p>
            {person.nickname && <p className="text-sm text-amber-100/80">"{person.nickname}"</p>}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
              {person.life_status === 'alive' && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {t('alive')}
                  {age != null && <span>· {age} {t('years')}</span>}
                </span>
              )}
              {person.life_status === 'deceased' && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-stone-300" />
                  {t('deceased')}
                  {birthYear(person) && deathYear(person) && <span>· {birthYear(person)}–{deathYear(person)}</span>}
                </span>
              )}
              {person.life_status === 'unknown' && (
                <span className="rounded-full bg-white/15 px-3 py-1">{t('unknown')}</span>
              )}
              {person.gender && (
                <span className="rounded-full bg-white/15 px-3 py-1 capitalize">
                  {t(person.gender as any)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            {t('personalInfo')}
          </h3>
          <dl className="space-y-2 text-sm">
            {person.date_of_birth && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">{t('dateOfBirth')}</dt>
                <dd className="text-right text-stone-800">{formatDate(person.date_of_birth)}</dd>
              </div>
            )}
            {person.place_of_birth && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">{t('placeOfBirth')}</dt>
                <dd className="text-right text-stone-800">{person.place_of_birth}</dd>
              </div>
            )}
            {person.date_of_death && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">{t('dateOfDeath')}</dt>
                <dd className="text-right text-stone-800">{formatDate(person.date_of_death)}</dd>
              </div>
            )}
            {person.place_of_death && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">{t('placeOfDeath')}</dt>
                <dd className="text-right text-stone-800">{person.place_of_death}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            {t('familyBranch')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-stone-400" />
              <span className="text-stone-500">{t('children')}:</span>
              <span className="text-stone-800">
                {person.children_status === 'has_children' ? t('hasChildren') : person.children_status === 'no_children' ? t('noChildren') : t('unknown')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-stone-400" />
              <span className="text-stone-500">{t('status')}:</span>
              <span className="text-stone-800">
                {person.branch_status === 'continues' ? t('branchContinues') : person.branch_status === 'ends_here' ? t('branchEndsHere') : t('unknown')}
              </span>
            </div>
          </div>
        </div>

        {person.biography && (
          <div className="md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {t('biography')}
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {person.biography}
            </p>
          </div>
        )}

        {person.children_status === 'no_children' && (
          <div className="md:col-span-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-stone-500">
            {t('branchEnds')}
          </div>
        )}
      </div>
    </div>
  );
}
