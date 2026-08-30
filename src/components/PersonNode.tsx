import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Heart } from 'lucide-react';
import type { Person } from '@/types';
import type { Lang } from '@/i18n/translations';
import { displayName, birthYear, deathYear, calcAge } from '@/utils/person';

export interface PersonNodeData {
  person: Person;
  lang: Lang;
  isHighlighted?: boolean;
  isSelected?: boolean;
  childrenExpanded?: boolean;
  hasChildren?: boolean;
  childrenCount?: number;
  loadingChildren?: boolean;
  onToggleChildren?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSpouse?: boolean;
  t: (key: any) => string;
}

const genderStyles: Record<string, { ring: string; bg: string; icon: string }> = {
  male: { ring: 'ring-sky-300', bg: 'bg-sky-50', icon: 'text-sky-600' },
  female: { ring: 'ring-rose-300', bg: 'bg-rose-50', icon: 'text-rose-600' },
  other: { ring: 'ring-amber-300', bg: 'bg-amber-50', icon: 'text-amber-600' },
};

function PersonNodeBase({ data }: { data: PersonNodeData }) {
  const { person, lang, isHighlighted, isSelected, childrenExpanded, hasChildren, childrenCount, loadingChildren, onToggleChildren, onSelect, isSpouse, t } = data;
  const g = person.gender ?? 'other';
  const style = genderStyles[g] ?? genderStyles.other;

  return (
    <div
      className={`relative rounded-xl border-2 bg-white shadow-md transition-all ${
        isSelected
          ? 'border-amber-600 ring-4 ring-amber-600/30 scale-105'
          : isHighlighted
            ? 'border-amber-500 ring-2 ring-amber-500/40'
            : 'border-stone-200 hover:border-stone-300'
      } ${isSpouse ? 'opacity-90' : ''}`}
      style={{ width: 200 }}
    >
      {!isSpouse && <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />}

      <button
        onClick={() => onSelect?.(person.id)}
        className="block w-full cursor-pointer text-left"
      >
        <div className="flex items-start gap-3 p-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ${style.ring} ${style.bg}`}
          >
            {person.profile_photo ? (
              <img src={person.profile_photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className={`h-6 w-6 ${style.icon}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-stone-800">
              {displayName(person, lang)}
            </div>
            {person.nickname && (
              <div className="truncate text-xs text-stone-500">"{person.nickname}"</div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {person.life_status === 'alive' && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('alive')}
                  {calcAge(person) != null && <span className="text-stone-400">· {calcAge(person)}{t('years')}</span>}
                </span>
              )}
              {person.life_status === 'deceased' && (
                <span className="flex items-center gap-1 text-stone-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                  {t('deceased')}
                  {birthYear(person) && deathYear(person) && (
                    <span className="text-stone-400">· {birthYear(person)}–{deathYear(person)}</span>
                  )}
                </span>
              )}
              {person.life_status === 'unknown' && (
                <span className="text-stone-400">{t('unknown')}</span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Children toggle */}
      {!isSpouse && hasChildren && (
        <button
          onClick={() => onToggleChildren?.(person.id)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-stone-100 bg-stone-50/50 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition"
        >
          {loadingChildren ? (
            <span>{t('loading')}</span>
          ) : childrenExpanded ? (
            <>
              <span className="text-stone-400">{childrenCount ?? ''}</span>
              {t('hideChildren')}
            </>
          ) : (
            <>
              {t('showChildren')}
              {childrenCount ? ` (${childrenCount})` : ''}
            </>
          )}
        </button>
      )}

      {/* Branch ends indicator */}
      {!isSpouse && !hasChildren && person.children_status === 'no_children' && (
        <div className="border-t border-stone-100 py-1.5 text-center text-xs text-stone-400">
          {t('branchEnds')}
        </div>
      )}

      {!isSpouse && <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />}
    </div>
  );
}

export const PersonNode = memo(PersonNodeBase);
