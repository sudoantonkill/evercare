import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function VerifyPhone() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [cd, setCd] = useState(0);
  const sentRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) return nav('/', { replace: true });
      
      const p = state?.phone || user.user_metadata?.phone || '';
      setPhone(p);
    })();
  }, [state, nav]);

  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  const toE164 = (v) => {
    const d = v.replace(/\D/g, '').slice(-10);
    return d.length === 10 ? `+91${d}` : '';
  };

  const savePhone = async () => {
    const p = toE164(phone);
    if (!p) return setMsg('Enter a valid 10-digit mobile');
    
    setBusy(true);
    setMsg('');
    try {
      await supabase.auth.updateUser({ data: { phone: p } });
      const { data } = await supabase.auth.getUser();
      await supabase.from('profiles').update({ phone: p }).eq('id', data.user.id);
      setPhone(p);
      await sendOtp(p);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async (p) => {
    if (sentRef.current) return;
    setBusy(true);
    setMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ phone: p });
      if (error) throw error;
      sentRef.current = true;
      setMsg(`OTP sent to ${p}`);
      setCd(60);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) return setMsg('Enter 6-digit code');
    setBusy(true);
    setMsg('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'phone_change'
      });
      if (error) throw error;

      await supabase.auth.updateUser({ data: { phone_verified: true } });
      await supabase.from('profiles')
        .update({ 
          phone_verified: true, 
          phone_verified_at: new Date().toISOString() 
        })
        .eq('id', data.user.id);

      setMsg('Verified! Redirecting to profile setup...');
      setTimeout(() => nav('/complete-profile', { replace: true }), 800);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Animated background */}
      <div className="bg-animated">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
        <div className="blob b3"></div>
      </div>

      <div className="w-full max-w-md animate-fadeInUp">
        <div className="glass rounded-2xl p-8 card-hover">
          {/* Header */}
          <div className="text-center mb-8 animate-slideInLeft delay-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Verify Phone</h1>
            <p className="text-slate-400">Secure your account with phone verification</p>
          </div>

          <div className="space-y-6 animate-fadeInUp delay-200">
            {/* Phone input section */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-4 py-3 input-enhanced rounded-xl text-white placeholder-slate-400"
                  placeholder="10-digit mobile number"
                  disabled={busy || sentRef.current}
                />
                <button
                  onClick={savePhone}
                  disabled={busy || sentRef.current || !phone}
                  className={`px-6 py-3 btn-primary rounded-xl text-white font-semibold transition-all ${
                    busy || sentRef.current ? 'opacity-50' : 'hover:scale-105'
                  }`}
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    sentRef.current ? '✓' : 'Send'
                  )}
                </button>
              </div>
            </div>

            {/* OTP section */}
            {sentRef.current && (
              <div className="animate-slideInRight delay-300">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <p className="text-sm text-slate-400 mb-4">
                  Enter the 6-digit code sent to <span className="text-blue-400 font-medium">{phone}</span>
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full otp-input rounded-xl py-4"
                  placeholder="● ● ● ● ● ●"
                  inputMode="numeric"
                  disabled={busy}
                />
                
                {cd > 0 && (
                  <p className="text-sm text-slate-500 mt-2 text-center">
                    Resend code in {cd}s
                  </p>
                )}
              </div>
            )}

            {/* Message */}
            {msg && (
              <div className={`p-4 rounded-xl text-sm animate-scaleIn ${
                msg.includes('sent') || msg.includes('Verified') 
                  ? 'message-success' 
                  : 'message-error'
              }`}>
                <div className="flex items-center">
                  {msg.includes('Verified') && (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {msg}
                </div>
              </div>
            )}

            {/* Verify button */}
            {sentRef.current && (
              <button
                onClick={verifyOtp}
                disabled={busy || otp.length !== 6}
                className={`w-full py-3 px-4 btn-primary rounded-xl text-white font-semibold transition-all animate-slideInLeft delay-400 ${
                  busy || otp.length !== 6 ? 'opacity-50' : 'hover:scale-105 pulse-glow'
                }`}
              >
                {busy ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Phone Number'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
