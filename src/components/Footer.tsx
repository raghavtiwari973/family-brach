import { Link } from 'react-router-dom';
import { Trees, Mail } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-stone-200 bg-stone-100">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Trees className="h-4 w-4 text-amber-700" />
          <span>{t('appName')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-4 w-4" />
          <span>{t('tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
