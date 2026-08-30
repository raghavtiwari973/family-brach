import { Link } from 'react-router-dom';
import { Trees, Search, Users, Heart, GitBranch, Sparkles } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export function HomePage() {
  const { t, lang } = useI18n();

  const features = [
    { icon: Trees, en: 'Interactive family tree', hi: 'इंटरैक्टिव परिवार वृक्ष' },
    { icon: Search, en: 'Powerful search', hi: 'शक्तिशाली खोज' },
    { icon: Users, en: 'Unlimited generations', hi: 'असीमित पीढ़ियाँ' },
    { icon: GitBranch, en: 'Branch exploration', hi: 'शाखा अन्वेषण' },
    { icon: Heart, en: 'Spouse relationships', hi: 'जीवनसाथी संबंध' },
    { icon: Sparkles, en: 'Bilingual (EN / हिंदी)', hi: 'द्विभाषी (EN / हिंदी)' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-900 via-amber-800 to-stone-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,220,150,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,200,100,0.3) 0%, transparent 40%)',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
            <Trees className="h-11 w-11 text-amber-200" />
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {lang === 'hi' ? t('tagline') : t('tagline')}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-amber-100/90 sm:text-xl">{t('subtagline')}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/tree"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 px-7 py-3.5 text-base font-semibold text-amber-900 shadow-lg transition hover:bg-white hover:shadow-xl"
            >
              <Trees className="h-5 w-5" />
              {t('exploreTree')}
            </Link>
            <Link
              to="/tree"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              <Search className="h-5 w-5" />
              {t('searchMember')}
            </Link>
          </div>
        </div>
        <svg
          className="relative block h-12 w-full text-stone-50"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,48 L1440,48 L1440,0 Q720,48 0,0 Z" />
        </svg>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-800 transition group-hover:bg-amber-100">
                <f.icon className="h-6 w-6" />
              </div>
              <p className="text-base font-medium text-stone-800">{lang === 'hi' ? f.hi : f.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-100">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold text-stone-800 sm:text-3xl">
            {lang === 'hi' ? 'अपनी विरासत को संजोएँ' : 'Preserve your heritage'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            {lang === 'hi'
              ? 'पीढ़ियों तक की कहानियों को एक जगह रखें। प्रत्येक सदस्य की प्रोफ़ाइल, संबंध और शाखा सुरक्षित रहती है।'
              : 'Keep the stories of generations in one place. Every member profile, relationship, and branch is preserved.'}
          </p>
          <Link
            to="/tree"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-800 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-amber-900"
          >
            <Trees className="h-5 w-5" />
            {t('exploreTree')}
          </Link>
        </div>
      </section>
    </div>
  );
}
