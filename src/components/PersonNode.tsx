import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Heart } from 'lucide-react';
import type { Person } from '@/types';
import type { Lang } from '@/i18n/translations';
import { displayName, birthYear, deathYear, calcAge } from '@/utils/person';

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="4.5" r="2.5" />
    <path d="M9.5 9h5a1.5 1.5 0 0 1 1.5 1.5l2.5 7.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1l2.5-7.5A1.5 1.5 0 0 1 9.5 9Z" />
    <rect x="8.5" y="19" width="3" height="3" rx="1" />
    <rect x="12.5" y="19" width="3" height="3" rx="1" />
    <rect x="3" y="9.5" width="3" height="8" rx="1.5" transform="rotate(18.5 4.5 9.5)" />
    <rect x="18" y="9.5" width="3" height="8" rx="1.5" transform="rotate(-18.5 19.5 9.5)" />
  </svg>
);

const MaleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="4.5" r="2.5" />
    <path d="M8.5 22V15H8v-4.5A1.5 1.5 0 0 1 9.5 9h5A1.5 1.5 0 0 1 16 10.5V15h-.5v7h-3v-6h-1v6h-3Z" />
    <rect x="3" y="9.5" width="3" height="7.5" rx="1.5" />
    <rect x="18" y="9.5" width="3" height="7.5" rx="1.5" />
  </svg>
);

const getIconForGender = (gender: string, className: string) => {
  if (gender === 'female') return <FemaleIcon className={className} />;
  return <MaleIcon className={className} />;
};

export interface PersonNodeData extends Record<string, unknown> {
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
  spouses?: Person[];
  t: (key: any) => string;
}

const getAvatarStyle = (gender: string) => {
  if (gender === 'female') {
    return { ring: 'ring-pink-400', bg: 'bg-pink-50', icon: 'text-pink-600' };
  }
  return { ring: 'ring-blue-400', bg: 'bg-blue-50', icon: 'text-blue-600' };
};

function PersonNodeBase({ data }: { data: PersonNodeData }) {
  const { person, spouses, lang, isHighlighted, isSelected, childrenExpanded, hasChildren, childrenCount, loadingChildren, onToggleChildren, onSelect, t } = data;
  
  let g = person.gender;
  if (!g || g === 'other' || g === 'unknown' as string) {
    const n = (person.first_name_en || person.first_name_hi || '').toLowerCase();
    if (n.includes('reena') || n.includes('parvati') || n.includes('devi')) g = 'female';
    else g = 'male'; // Default to male if unknown
  }
  
  const style = getAvatarStyle(g);

  return (
    <div
      className={`relative rounded-full overflow-hidden border-2 bg-white shadow-md transition-all ${
        isSelected
          ? 'border-amber-600 ring-4 ring-amber-600/30 scale-105'
          : isHighlighted
            ? 'border-amber-500 ring-2 ring-amber-500/40'
            : 'border-stone-200 hover:border-stone-300'
      }`}
      style={{ width: 240 }}
    >
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />



      <button
        onClick={() => onSelect?.(person.id)}
        className="block w-full cursor-pointer text-left"
      >
        <div className="flex flex-col gap-2 py-3 pl-6 pr-6">
          {/* Main Person */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ${style.ring} ${style.bg}`}
            >
              {person.profile_photo ? (
                <img src={person.profile_photo} alt="" className="h-full w-full object-cover" />
              ) : (
                getIconForGender(g, `h-5 w-5 ${style.icon}`)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-stone-800" title={displayName(person, lang)}>
                {displayName(person, lang)}
                {person.life_status && person.life_status !== 'unknown' && (
                  <span className={`ml-1 text-[10px] font-normal ${person.life_status === 'deceased' ? 'text-stone-500' : 'text-emerald-600'}`}>
                    ({person.life_status === 'deceased' ? t('deceased') : t('alive')})
                  </span>
                )}
              </h3>
              {person.nickname && (
                <div className="truncate text-xs text-stone-500">"{person.nickname}"</div>
              )}
            </div>
          </div>

          {/* Spouses */}
          {spouses && spouses.length > 0 && spouses.map(spouse => {
            let sg = spouse.gender;
            if (!sg || sg === 'other' || sg === 'unknown' as string) {
              const sn = (spouse.first_name_en || spouse.first_name_hi || '').toLowerCase();
              if (sn.includes('reena') || sn.includes('parvati') || sn.includes('devi')) sg = 'female';
              else sg = 'male';
            }
            const sStyle = getAvatarStyle(sg);
            return (
              <div key={spouse.id} className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ${sStyle.ring} ${sStyle.bg}`}
                >
                  {spouse.profile_photo ? (
                    <img src={spouse.profile_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getIconForGender(sg, `h-5 w-5 ${sStyle.icon}`)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-stone-800" title={displayName(spouse, lang)}>
                    {displayName(spouse, lang)}
                    {spouse.life_status && spouse.life_status !== 'unknown' && (
                      <span className={`ml-1 text-[10px] font-normal ${spouse.life_status === 'deceased' ? 'text-stone-500' : 'text-emerald-600'}`}>
                        ({spouse.life_status === 'deceased' ? t('deceased') : t('alive')})
                      </span>
                    )}
                  </h3>
                  {spouse.nickname && (
                    <div className="truncate text-xs text-stone-500">"{spouse.nickname}"</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </button>

      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const PersonNode = memo(PersonNodeBase);
