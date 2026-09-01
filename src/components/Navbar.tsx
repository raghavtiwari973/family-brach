import { Link, useNavigate } from 'react-router-dom';
import { Trees, Globe, LogOut, LayoutDashboard, LogIn, Menu, X, Download } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { SearchBar } from '@/components/SearchBar';

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/95 backdrop-blur supports-[backdrop-filter]:bg-stone-50/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" className="h-12 w-auto object-contain" alt="Logo" />
          <span className="hidden text-lg font-semibold text-stone-800 sm:block">{t('appName')}</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/tree"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 transition sm:block"
          >
            {t('familyTree')}
          </Link>

          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-amber-600 hover:text-amber-700 transition"
            title={t('selectLanguage')}
          >
            <Globe className="h-4 w-4" />
            {lang === 'en' ? 'हिंदी' : 'English'}
          </button>

          <a
            href="/app-debug.apk"
            download="FamilyHeritageTree.apk"
            className="hidden items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition sm:flex"
            title={t('downloadApp')}
          >
            <Download className="h-4 w-4" />
            {t('downloadApp')}
          </a>

          {session ? (
            <>
              <Link
                to="/admin"
                className="hidden items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white hover:bg-stone-900 transition sm:flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('dashboard')}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-stone-300 bg-white p-2 text-stone-600 hover:border-red-400 hover:text-red-600 transition"
                title={t('logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white hover:bg-amber-900 transition sm:flex"
            >
              <LogIn className="h-4 w-4" />
              {t('adminLogin')}
            </Link>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-stone-300 bg-white p-2 text-stone-600 md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-200 bg-stone-50 px-4 py-3 md:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          <div className="flex flex-col gap-1">
            <Link
              to="/tree"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200/60"
            >
              {t('familyTree')}
            </Link>
            {session ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200/60"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-amber-800 hover:bg-amber-50"
              >
                {t('adminLogin')}
              </button>
            )}
            
            <a
              href="/app-debug.apk"
              download="FamilyHeritageTree.apk"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 mt-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              {t('downloadApp')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
