import { useState } from 'react';
import { Lock, Mail, Loader2, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import logoGeoParques from '../../imports/ChatGPT_Image_15_de_mai._de_2026__15_52_11.png';

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
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4 relative overflow-hidden">
      {/* Efeito de luz decorativo de fundo idêntico ao sidebar */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-950/90 backdrop-blur-2xl border border-teal-500/30 rounded-3xl shadow-2xl p-8 ring-1 ring-teal-400/20">
        
        {/* Bloco da Logo idêntico ao componente DashboardSidebar */}
        <div className="flex justify-center mb-6">
          <div className="relative group w-full max-w-[180px]">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-purple-500/20 blur-2xl rounded-3xl scale-110" />
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-teal-400/30 border border-white/10 flex items-center justify-center">
              <img src={logoGeoParques} alt="GeoParques SM" className="w-full h-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-1 mb-6">
          <p className="text-xs text-slate-300 font-bold tracking-wide uppercase">Sistema de Gestão Urbana</p>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
            <p className="text-xs text-teal-400 font-semibold">Santa Maria-DF</p>
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold">E-mail Institucional</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <Mail className="size-4" />
              </span>
              <Input
                type="email"
                placeholder="seu.email@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950/80 border-slate-700/80 pl-10 text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:ring-teal-500/20 h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold">Senha</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <Lock className="size-4" />
              </span>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950/80 border-slate-700/80 pl-10 text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:ring-teal-500/20 h-11 rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3 shadow-lg shadow-teal-900/50 transition-all mt-3 h-11 rounded-xl"
          >
            {isLoading ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Autenticando...</>
            ) : (
              'Acessar Sistema'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-white/10 pt-4">
          <p className="text-[11px] text-slate-400 font-medium">
            Acesso restrito a servidores e equipe técnica autorizada.
          </p>
        </div>
      </div>
    </div>
  );
}
