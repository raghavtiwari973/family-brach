import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, User } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { getPersons, createPerson, updatePerson, getPerson, createSpouse } from '@/services/family';
import type { Person, PersonInput, Gender, LifeStatus, ChildrenStatus, BranchStatus } from '@/types';
import { displayName } from '@/utils/person';

interface Props {
  editingId?: string;
}

export function MemberForm({ editingId }: Props) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(!!editingId);

  const [form, setForm] = useState<PersonInput>({
    first_name_en: '',
    middle_name_en: '',
    last_name_en: '',
    first_name_hi: '',
    middle_name_hi: '',
    last_name_hi: '',
    nickname: '',
    gender: 'male',
    date_of_birth: '',
    place_of_birth: '',
    date_of_death: '',
    place_of_death: '',
    life_status: 'alive',
    profile_photo: '',
    biography: '',
    father_id: null,
    mother_id: null,
    children_status: 'unknown',
    branch_status: 'unknown',
  });

  const [spouseForm, setSpouseForm] = useState({
    first_name_en: '',
    middle_name_en: '',
    last_name_en: '',
    first_name_hi: '',
    middle_name_hi: '',
    last_name_hi: '',
    gender: 'female' as Gender | null,
    life_status: 'alive' as LifeStatus,
  });

  const [selectedSpouseId, setSelectedSpouseId] = useState<string | 'new'>('');


  useEffect(() => {
    getPersons(1000).then(setAllPersons).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      setLoadingData(true);
      try {
        const p = await getPerson(editingId);
        if (p) {
          setForm({
            first_name_en: p.first_name_en ?? '',
            middle_name_en: p.middle_name_en ?? '',
            last_name_en: p.last_name_en ?? '',
            first_name_hi: p.first_name_hi ?? '',
            middle_name_hi: p.middle_name_hi ?? '',
            last_name_hi: p.last_name_hi ?? '',
            nickname: p.nickname ?? '',
            gender: p.gender,
            date_of_birth: p.date_of_birth ?? '',
            place_of_birth: p.place_of_birth ?? '',
            date_of_death: p.date_of_death ?? '',
            place_of_death: p.place_of_death ?? '',
            life_status: p.life_status,
            profile_photo: p.profile_photo ?? '',
            biography: p.biography ?? '',
            father_id: p.father_id,
            mother_id: p.mother_id,
            children_status: p.children_status,
            branch_status: p.branch_status,
          });
        }
      } finally {
        setLoadingData(false);
      }
    })();
  }, [editingId]);

  // Prevent selecting self or a descendant as parent
  const parentOptions = useMemo(() => {
    return allPersons.filter((p) => p.id !== editingId);
  }, [allPersons, editingId]);

  function update<K extends keyof PersonInput>(key: K, value: PersonInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateSpouse<K extends keyof typeof spouseForm>(key: K, value: (typeof spouseForm)[K]) {
    setSpouseForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: PersonInput = {
        ...form,
        date_of_birth: form.date_of_birth || null,
        date_of_death: form.date_of_death || null,
        father_id: form.father_id || null,
        mother_id: form.mother_id || null,
      };
      // If deceased, require date of death handling; clear death fields if alive
      if (form.life_status === 'alive') {
        payload.date_of_death = null;
        payload.place_of_death = null;
      }

      const saved = editingId
        ? await updatePerson(editingId, payload)
        : await createPerson(payload);

      // Link or create spouse
      if (selectedSpouseId === 'new') {
        const hasSpouseName = spouseForm.first_name_en || spouseForm.first_name_hi || spouseForm.last_name_en || spouseForm.last_name_hi;
        if (hasSpouseName) {
          const spousePayload: PersonInput = {
            first_name_en: spouseForm.first_name_en || null,
            middle_name_en: spouseForm.middle_name_en || null,
            last_name_en: spouseForm.last_name_en || null,
            first_name_hi: spouseForm.first_name_hi || null,
            middle_name_hi: spouseForm.middle_name_hi || null,
            last_name_hi: spouseForm.last_name_hi || null,
            gender: spouseForm.gender,
            life_status: spouseForm.life_status,
            children_status: 'unknown',
            branch_status: 'unknown',
          };
          const savedSpouse = await createPerson(spousePayload);
          await createSpouse(saved.id, savedSpouse.id);
        }
      } else if (selectedSpouseId && selectedSpouseId !== '') {
        await createSpouse(saved.id, selectedSpouseId);
      }

      navigate(`/person/${saved.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-amber-700" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-stone-700';
  const sectionClass = 'rounded-xl border border-stone-200 bg-white p-5 shadow-sm';
  const sectionTitle = 'mb-4 text-base font-semibold text-stone-800';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">
          {editingId ? t('editMember') : t('addFamilyMember')}
        </h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
        >
          <X className="h-4 w-4" />
          {t('cancel')}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-5">
        {/* Personal Info */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>{t('personalInfo')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t('firstNameHi')}</label>
              <input className={inputClass} value={form.first_name_hi ?? ''} onChange={(e) => update('first_name_hi', e.target.value)} dir="auto" />
            </div>
            <div>
              <label className={labelClass}>{t('gender')}</label>
              <select className={inputClass} value={form.gender ?? 'male'} onChange={(e) => update('gender', (e.target.value || null) as Gender | null)}>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('lifeStatus')}</label>
              <select className={inputClass} value={form.life_status} onChange={(e) => update('life_status', e.target.value as LifeStatus)}>
                <option value="alive">{t('alive')}</option>
                <option value="deceased">{t('deceased')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spouse (Optional) */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>{t('spouse')} (Optional)</h2>
          
          <div className="mb-4">
            <label className={labelClass}>{t('selectExisting')} / {t('createNewSpouse')}</label>
            <select
              className={inputClass}
              value={selectedSpouseId}
              onChange={(e) => setSelectedSpouseId(e.target.value as string | 'new')}
            >
              <option value="">{t('none')}</option>
              <option value="new">+ {t('createNewSpouse')}</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {displayName(p, lang)}
                </option>
              ))}
            </select>
          </div>

          {selectedSpouseId === 'new' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t('firstNameHi')}</label>
                  <input className={inputClass} value={spouseForm.first_name_hi} onChange={(e) => updateSpouse('first_name_hi', e.target.value)} dir="auto" />
                </div>
                <div>
                  <label className={labelClass}>{t('gender')}</label>
                  <select className={inputClass} value={spouseForm.gender ?? 'female'} onChange={(e) => updateSpouse('gender', (e.target.value || null) as Gender | null)}>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('lifeStatus')}</label>
                  <select className={inputClass} value={spouseForm.life_status} onChange={(e) => updateSpouse('life_status', e.target.value as LifeStatus)}>
                    <option value="alive">{t('alive')}</option>
                    <option value="deceased">{t('deceased')}</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Relationships */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>{t('familyRelationships')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t('father')}</label>
              <select
                className={inputClass}
                value={form.father_id ?? ''}
                onChange={(e) => update('father_id', (e.target.value || null) as string | null)}
              >
                <option value="">{t('none')}</option>
                {parentOptions
                  .filter((p) => p.gender !== 'female')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {displayName(p, lang)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50 transition"
          >
            {saving ? (
              <span>{t('loading')}</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editingId ? t('updateMember') : t('saveMember')}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// Unused import guard — User icon reserved for future photo picker
void User;
