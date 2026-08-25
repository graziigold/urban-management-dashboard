import { useState } from 'react';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginProps {
  onLoginSuccess: (token: string, userEmail: string) => void;
}

const SUPABASE_PROJECT_ID = "kqrmsxhmbjzwjnxhfnap";
const ANON_KEY = "sb_publishable_DQm7g2O-m4BohGzHD3npfQ_NJd6SBxj";

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(
        `https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Falha na autenticação. Verifique suas credenciais.');
      }

      // Salva a sessão no navegador
      localStorage.setItem('geoparques_token', data.access_token);
      localStorage.setItem('geoparques_user', email);
      
      onLoginSuccess(data.access_token, email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-teal-500/30 rounded-2xl shadow-2xl p-8 ring-1 ring-teal-400/20">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-teal-500/15 rounded-2xl border border-teal-500/30 text-teal-400 mb-3 shadow-inner">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-xl font-black text-white tracking-wide">GeoParques SM</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Sistema Restrito de Gestão Urbana</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-300 font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs font-semibold">E-mail Institucional</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="size-4" />
              </span>
              <Input
                type="email"
                placeholder="seu.email@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950/60 border-slate-700/60 pl-10 text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-xs font-semibold">Senha</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="size-4" />
              </span>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950/60 border-slate-700/60 pl-10 text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-2.5 shadow-lg shadow-teal-900/40 transition-all mt-2"
          >
            {isLoading ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Autenticando...</>
            ) : (
              'Acessar Sistema'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500">
            Acesso restrito a servidores e equipe técnica autorizada.
          </p>
        </div>
      </div>
    </div>
  );
}
