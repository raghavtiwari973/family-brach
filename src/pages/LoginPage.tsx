import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, LogIn, ArrowLeft, Trees } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const loginIdentifier = email.trim();
    // If the user entered a name (no @ symbol), automatically append a dummy domain
    const formattedEmail = loginIdentifier.includes('@') 
      ? loginIdentifier 
      : `${loginIdentifier}@gmail.com`;

    const { error: signInError } = await signIn(formattedEmail, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
    } else {
      navigate('/admin');
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-gradient-to-b from-stone-100 to-amber-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-stone-600 hover:text-amber-700">
          <Trees className="h-5 w-5" />
          <span className="font-semibold">{t('appName')}</span>
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">{t('adminLogin')}</h1>
            <p className="mt-1 text-sm text-stone-500">{t('loginToEdit')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('emailOrName')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 pl-10 pr-3 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  placeholder="admin@family.com or Admin Name"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 pl-10 pr-3 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-800 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50 transition"
            >
              <LogIn className="h-4 w-4" />
              {loading ? t('loading') : t('signIn')}
            </button>
          </form>
        </div>

        <Link
          to="/tree"
          className="mt-4 flex items-center justify-center gap-1.5 text-sm text-stone-500 hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToTree')}
        </Link>
      </div>
    </div>
  );
}
