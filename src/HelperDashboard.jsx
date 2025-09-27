import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Routes, Route } from 'react-router-dom';
import CustomSidebar from './components/CustomSidebar';
import MainMenu from './pages/MainMenu';
import AcceptJobs from './components/AcceptJobs';
import JobHistoryPage from './pages/JobHistory';
import Contacts from './components/Contacts';
import SOS from './components/SOS';
import EditProfile from './components/EditProfile';
import Feedback from './components/Feedback';
import AbortedJobs from './components/AbortedJobs';

export default function HelperDashboard({ user }) {
  const nav = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'available'

  useEffect(() => {
    if (!user) {
      nav('/', { replace: true });
      return;
    }

    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('helper_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching jobs:', error);
      else setJobs(data || []);
    };

    fetchJobs();

    const jobsSubscription = supabase
      .channel('helper_jobs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `helper_id=eq.${user.id}`
      }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      jobsSubscription.unsubscribe();
    };
  }, [user, nav]);

  if (!user) return null;

  const menuItems = [
    {
      label: 'Main Menu',
      path: '/helper-dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Accept Jobs',
      path: '/helper-dashboard/accept-jobs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Contacts',
      path: '/helper-dashboard/contacts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      label: 'SOS',
      path: '/helper-dashboard/sos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      label: 'Job History',
      path: '/helper-dashboard/job-history',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Edit Profile',
      path: '/helper-dashboard/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav('/', { replace: true });
  };

  return (
    <div className="min-h-screen p-4 relative">
      <div className="bg-animated">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
        <div className="blob b3"></div>
      </div>

      <CustomSidebar menuItems={menuItems} onSignOut={handleSignOut} userRole="helper" />

      <div className="pl-72 max-w-7xl mx-auto animate-fadeInUp">
        <div className="mb-8 animate-slideInLeft delay-100">
          <h1 className="text-4xl font-bold gradient-text">Helper Dashboard</h1>
          <p className="text-slate-400 mt-2">Find and manage assistance jobs</p>
        </div>

        <Routes>
          <Route index element={<MainMenu user={user} userRole="helper" jobs={jobs} onNavigate={(page, jobId) => {
            if (page === 'feedback' && jobId) {
              nav(`/helper-dashboard/feedback/${jobId}`);
            } else {
              nav(`/helper-dashboard/${page}`);
            }
          }} />} />
          <Route path="accept-jobs" element={<AcceptJobs user={user} onNavigate={(page) => nav(`/helper-dashboard/${page}`)} />} />
          <Route path="job-history" element={<JobHistoryPage user={user} userRole="helper" />} />
          <Route path="contacts" element={<Contacts user={user} />} />
          <Route path="sos" element={<SOS user={user} />} />
          <Route path="profile" element={<EditProfile user={user} />} />
          <Route path="feedback" element={<Feedback user={user} userRole="helper" onNavigate={(page) => nav(`/helper-dashboard/${page}`)} />} />
          <Route path="feedback/:jobId" element={<Feedback user={user} userRole="helper" onNavigate={(page) => nav(`/helper-dashboard/${page}`)} />} />
          <Route path="aborted-jobs" element={<AbortedJobs user={user} userRole="helper" />} />
        </Routes>
      </div>
    </div>
  );
}