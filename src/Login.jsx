import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

const e164 = (v) => {
  const d = String(v || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91${d}` : '';
};

export default function Login() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();

  // Modal popup state
  const [showModal, setShowModal] = useState(
    loc.state && loc.state.emailVerifyInfo ? true : false
  );
  const verifiedEmail = loc.state?.email;

  // Switch to sign-in mode + clear fields if coming from sign-up
  useEffect(() => {
    if (loc.state?.emailVerifyInfo) {
      setMode('sign-in');
      setEmail('');
      setPwd('');
      setPhone('');
      setMsg('');
    }
  }, [loc.state]);

  // Clean up navigation state so modal doesn't show on further navigation
  useEffect(() => {
    if (loc.state?.emailVerifyInfo) {
      nav(loc.pathname, { replace: true, state: {} });
    }
  }, [loc, nav]);

  const up = mode === 'sign-up';

  const handleEmail = async () => {
    setMsg('');
    const p = up ? e164(phone) : '';
    if (!email || !pwd) return setMsg('Email & password required');
    if (up && !p) return setMsg('Enter 10-digit phone');
    setBusy(true);
    try {
      if (up) {
        const { error } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: { data: { phone: p } }
        });
        if (error) throw error;
        setMode('sign-in');
        setEmail('');
        setPwd('');
        setPhone('');
        setMsg('');
        nav('/', { replace: true, state: { emailVerifyInfo: true, email } });
        setShowModal(true);
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;

        // Get user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Redirect based on role
        if (profile.user_role === 'helper') {
          nav('/helper-dashboard', { replace: true });
        } else if (profile.user_role === 'elderly') {
          nav('/elderly-dashboard', { replace: true });
        } else if (profile.user_role === 'admin') {
          nav('/admin-dashboard', { replace: true });
        } else {
          throw new Error('Invalid user role');
        }
      }
    } catch (e) {
      console.error('Login error:', e);
      if (e.message.includes('column profiles.role does not exist')) {
        setMsg('System error. Please contact support.');
      } else if (e.message.includes('Invalid user role')) {
        setMsg('Account type not properly set up. Please contact support.');
      } else if (e.message.includes('Invalid login credentials')) {
        setMsg('Invalid email or password');
      } else if (e.message.includes('profiles')) {
        setMsg('Error fetching user profile. Please try again.');
      } else {
        setMsg('An error occurred during login. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/verify-phone` },
      });
      if (error) throw error;
    } catch (e) {
      setMsg(e.message);
    }
  };

  // THE GLASSY MODAL POPUP
  function Modal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]">
        <div className="glass p-8 rounded-2xl shadow-2xl animate-fadeInUp w-full max-w-sm text-center relative">
          <div className="mx-auto w-14 h-14 mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 12h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v2a4 4 0 11-8 0v-2" />
            </svg>
          </div>
          <div className="gradient-text text-2xl font-bold mb-3">Email Verification</div>
          <div className="text-slate-300 mb-5">
            {verifiedEmail ? (
              <>
                We've sent a verification link to <span className="text-blue-300 font-semibold">{verifiedEmail}</span>.<br />
                Please check your mailbox to verify your email.
              </>
            ) : (
              <>Check your mailbox to verify your email.</>
            )}
          </div>
          <button
            className="btn-primary rounded-xl py-2 px-6 text-white font-semibold text-lg w-full mt-2"
            onClick={() => setShowModal(false)}
            autoFocus
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="bg-animated">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
        <div className="blob b3"></div>
      </div>
      <div className="w-full max-w-md animate-fadeInUp">
        <div className="glass rounded-2xl p-8 card-hover">
          {/* POPUP MODAL */}
          {showModal && <Modal />}

          <div className="text-center mb-8 animate-slideInLeft delay-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              {up ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400">
              {up ? 'Join us today and get started' : 'Sign in to your account'}
            </p>
          </div>
          <div className="flex mb-6 p-1 glass-light rounded-xl animate-slideInRight delay-200">
            <button
              onClick={() => setMode('sign-in')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${!up ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              Sign In
            </button>
            <button
              onClick={() => setMode('sign-up')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                up ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              Sign Up
            </button>
          </div>
          <div className="space-y-4 animate-fadeInUp delay-300">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 input-enhanced rounded-xl text-white placeholder-slate-400"
                placeholder="your@email.com"
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full px-4 py-3 input-enhanced rounded-xl text-white placeholder-slate-400"
                placeholder="Enter your password"
                disabled={busy}
              />
            </div>
            {up && (
              <div className="animate-slideInLeft">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 input-enhanced rounded-xl text-white placeholder-slate-400"
                  placeholder="10-digit mobile number"
                  disabled={busy}
                />
              </div>
            )}
            {msg && (
              <div className={`p-4 rounded-xl text-sm animate-scaleIn ${
                msg.toLowerCase().includes('sent') || msg.toLowerCase().includes('success') 
                  ? 'message-success' 
                  : 'message-error'
              }`}>
                {msg}
              </div>
            )}
            <button
              onClick={handleEmail}
              disabled={busy}
              className={`w-full py-3 px-4 btn-primary rounded-xl text-white font-semibold transition-all ${
                busy ? 'opacity-50 shimmer' : 'hover:scale-105'
              }`}
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                up ? 'Create Account' : 'Sign In'
              )}
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800/80 text-slate-400">or continue with</span>
              </div>
            </div>
            <button
              onClick={handleGoogle}
              className="w-full py-3 px-4 btn-secondary rounded-xl text-white font-semibold flex items-center justify-center hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
