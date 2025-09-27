import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login';
import VerifyPhone from './VerifyPhone';

import ElderlyDashboard from './ElderlyDashboard';
import HelperDashboard from './HelperDashboard';
import AdminDashboard from './AdminDashboard';
import CompleteProfile from './CompleteProfile';

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setReady(true);
      
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s ?? null);
        setReady(true);
      });
      unsub = sub.subscription.unsubscribe;
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!ready) return;
    
    const user = session?.user;
    const path = loc.pathname;
    
    if (!user) {
      if (path !== '/') nav('/', { replace: true });
      return;
    }

    // Check database for phone verification instead of just metadata
    const checkPhoneVerification = async () => {
      try {
        // First check if profile exists, only create if it doesn't
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, phone_verified, profile_completed, user_role')
          .eq('id', user.id)
          .single();

        // Only create profile if it doesn't exist, don't overwrite existing data
        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ 
              id: user.id,
              email: user.email || null,
              phone: user.user_metadata?.phone || null,
              user_role: user.user_metadata?.user_role || 'elderly',
              phone_verified: user.user_metadata?.phone_verified || false,
              profile_completed: false
            });

          if (insertError) {
            console.error('Profile insert error:', insertError);
            // Continue execution even if insert fails
          }
        }

        // Check phone verification, profile completion and role
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_verified, profile_completed, user_role')
          .eq('id', user.id)
          .single();

        const phoneVerified = profile?.phone_verified || user.user_metadata?.phone_verified || false;
        const profileCompleted = profile?.profile_completed || false;
        
        if (!phoneVerified && path !== '/verify-phone') {
          nav('/verify-phone', { replace: true });
        } else if (phoneVerified && !profileCompleted && path !== '/complete-profile') {
          nav('/complete-profile', { replace: true });
        } else if (phoneVerified && profileCompleted) {
          // Use profile role as source of truth, fallback to metadata only if profile role is null
          const userRole = profile?.user_role || user.user_metadata?.user_role || 'elderly';
          const currentPath = path === '/' ? null : path;
          const targetPath = `/${userRole}-dashboard`;
          
          // Allow nested routes by checking if the current path starts with the target path
          if (currentPath && !currentPath.startsWith(targetPath)) {
            nav(targetPath, { replace: true });
          }
        }
      } catch (error) {
        console.error('Error checking phone verification:', error);
        // Fallback to metadata check
        const needsPhone = !user.phone_confirmed_at && !user.user_metadata?.phone_verified;
        if (needsPhone && path !== '/verify-phone') {
          nav('/verify-phone', { replace: true });
        } else {
          // Get user role from profile first, then metadata, then default
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_role')
            .eq('id', user.id)
            .single();
          
          const userRole = profileData?.user_role || user.user_metadata?.user_role || 'elderly';
          const targetPath = `/${userRole}-dashboard`;
          // Allow nested routes by checking if the current path starts with the target path
          if (!path.startsWith(targetPath)) {
            nav(targetPath, { replace: true });
          }
        }
      }
    };

    checkPhoneVerification();
  }, [session, ready, loc.pathname, nav]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3"></div>
            <span className="text-white font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/verify-phone" element={<VerifyPhone />} />
      <Route path="/complete-profile" element={<CompleteProfile user={session?.user} />} />
      
      <Route path="/elderly-dashboard/*" element={<ElderlyDashboard user={session?.user} />} />
      <Route path="/helper-dashboard/*" element={<HelperDashboard user={session?.user} />} />
      <Route path="/admin-dashboard/*" element={<AdminDashboard user={session?.user} />} />
    </Routes>
  );
}
