import { useState } from 'react';
import { Lock, Mail, Loader2, MapPin } from 'lucide-react';
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
      {/* Gradiente de fundo sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-2 border-teal-500/30 rounded-2xl shadow-2xl p-8 ring-1 ring-teal-400/20">
        
        {/* Bloco de Identidade Visual Oficial (Espelhando a logo do sidebar) */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-full bg-gradient-to-b from-blue-700 to-blue-900 rounded-xl p-5 border border-teal-400/30 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-400/15 via-transparent to-transparent pointer-events-none" />
            
            {/* Ícone de Pin Estilizado */}
            <div className="relative size-14 bg-blue-950/80 rounded-full border border-teal-400/40 flex items-center justify-center shadow-inner mb-3">
              <MapPin className="size-7 text-teal-300 drop-shadow" />
            </div>

            <h1 className="text-white font-black tracking-wide text-lg">GeoParques SM</h1>
            <div className="w-full h-px bg-teal-500/30 my-2.5" />
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-widest">SISTEMA DE GESTÃO URBANA</span>
            <span className="text-[10px] text-slate-300 tracking-wider mt-0.5 font-medium">Santa Maria - DF</span>
          </div>
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

        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Acesso restrito a servidores e equipe técnica autorizada.
          </p>
        </div>
      </div>
    </div>
  );
}
