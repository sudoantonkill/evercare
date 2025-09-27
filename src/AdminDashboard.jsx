import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import CustomSidebar from './components/CustomSidebar';
import CreateJob from './pages/CreateJob';
import Contacts from './components/Contacts';
import SOS from './components/SOS';
import EditProfile from './components/EditProfile';

export default function AdminDashboard({ user }) {
  const nav = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      nav('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    nav('/', { replace: true });
    return null;
  }

  const menuItems = [
    {
      label: "Main Menu",
      path: "/admin-dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: "User Management",
      path: "/admin-dashboard/users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      label: "Analytics",
      path: "/admin-dashboard/analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: "SOS Alerts",
      path: "/admin-dashboard/sos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      label: "Settings",
      path: "/admin-dashboard/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen p-4 relative">
      <div className="bg-animated">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
        <div className="blob b3"></div>
      </div>

      <CustomSidebar menuItems={menuItems} onSignOut={handleSignOut} userRole="admin" />

      <div className="pl-72 max-w-7xl mx-auto animate-fadeInUp">
        <div className="mb-8 animate-slideInLeft delay-100">
          <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2">Platform Management</p>
        </div>

        <Routes>
          <Route index element={<MainMenu user={user} userRole="admin" />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="sos" element={<SOSAlerts />} />
          <Route path="settings" element={<Settings user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

function MainMenu() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="glass rounded-2xl p-6 card-hover animate-slideInLeft delay-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Total Users</h3>
          <div className="p-2 rounded-full bg-blue-500/20">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">1,234</div>
        <div className="flex items-center text-sm">
          <span className="text-emerald-400">↑ 12%</span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 card-hover animate-slideInLeft delay-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Active Helpers</h3>
          <div className="p-2 rounded-full bg-green-500/20">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">856</div>
        <div className="flex items-center text-sm">
          <span className="text-emerald-400">↑ 8%</span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 card-hover animate-slideInRight delay-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Completed Tasks</h3>
          <div className="p-2 rounded-full bg-purple-500/20">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">3,567</div>
        <div className="flex items-center text-sm">
          <span className="text-emerald-400">↑ 15%</span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 card-hover animate-slideInRight delay-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Success Rate</h3>
          <div className="p-2 rounded-full bg-yellow-500/20">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">98.5%</div>
        <div className="flex items-center text-sm">
          <span className="text-emerald-400">↑ 2%</span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.user_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'elderly': return 'text-blue-400 bg-blue-500/20';
      case 'helper': return 'text-green-400 bg-green-500/20';
      case 'admin': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="elderly">Elderly</option>
            <option value="helper">Helper</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No users found matching your criteria.</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 glass-light rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden">
                    {user.profile_photo ? (
                      <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{user.email}</h4>
                    <p className="text-slate-400 text-sm">
                      Phone: {user.phone || 'Not provided'} • 
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.user_role)}`}>
                        {user.user_role || 'No role'}
                      </span>
                      {user.phone_verified && (
                        <span className="px-2 py-1 rounded-full text-xs text-green-400 bg-green-500/20">
                          Verified
                        </span>
                      )}
                      {user.profile_completed && (
                        <span className="px-2 py-1 rounded-full text-xs text-blue-400 bg-blue-500/20">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 btn-secondary rounded-lg text-white text-sm hover:scale-105 transition-all">
                    View
                  </button>
                  <button className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all">
                    Suspend
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    completedJobs: 0,
    activeHelpers: 0,
    sosAlerts: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [usersRes, jobsRes, sosRes] = await Promise.all([
        supabase.from('profiles').select('id, user_role, created_at'),
        supabase.from('jobs').select('id, status, created_at'),
        supabase.from('sos_alerts').select('id, status, created_at')
      ]);

      const users = usersRes.data || [];
      const jobs = jobsRes.data || [];
      const sosAlerts = sosRes.data || [];

      setStats({
        totalUsers: users.length,
        totalJobs: jobs.length,
        completedJobs: jobs.filter(job => job.status === 'completed').length,
        activeHelpers: users.filter(user => user.user_role === 'helper').length,
        sosAlerts: sosAlerts.length
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalUsers}</div>
          <p className="text-slate-400 text-sm">Total registered users</p>
        </div>
        
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Job Statistics</h3>
          <div className="text-3xl font-bold text-green-400 mb-2">{stats.completedJobs}/{stats.totalJobs}</div>
          <p className="text-slate-400 text-sm">Completed jobs</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">SOS Alerts</h3>
          <div className="text-3xl font-bold text-red-400 mb-2">{stats.sosAlerts}</div>
          <p className="text-slate-400 text-sm">Total emergency alerts</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold gradient-text mb-6">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 glass-light rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white">Active Helpers</span>
                <span className="text-green-400">{stats.activeHelpers}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${Math.min((stats.activeHelpers / stats.totalUsers) * 100, 100)}%`}}></div>
              </div>
            </div>
            
            <div className="p-4 glass-light rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white">Job Completion Rate</span>
                <span className="text-blue-400">{stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0}%`}}></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 glass-light rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white">System Status</span>
                <span className="text-emerald-400">Operational</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{width: '98%'}}></div>
              </div>
            </div>
            
            <div className="p-4 glass-light rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white">Database Load</span>
                <span className="text-yellow-400">Normal</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{width: '65%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SOSAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSOSAlerts();
    
    const subscription = supabase
      .channel('sos_alerts_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sos_alerts'
      }, () => {
        fetchSOSAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSOSAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select(`
          *,
          profiles:user_id (email, phone, profile_photo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-400 bg-red-500/20';
      case 'resolved': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold gradient-text mb-6">SOS Emergency Alerts</h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No SOS alerts found.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-4 glass-light rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
                      {alert.profiles?.profile_photo ? (
                        <img src={alert.profiles.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{alert.profiles?.email || 'Unknown User'}</h4>
                      <p className="text-slate-400 text-sm">Phone: {alert.profiles?.phone || 'Not available'}</p>
                      <p className="text-white mt-2">{alert.message}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        📍 Location: {alert.location} • 
                        🕒 {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${alert.location}`, '_blank')}
                        className="px-3 py-1 btn-secondary rounded-lg text-white text-sm hover:scale-105 transition-all"
                      >
                        View Location
                      </button>
                      {alert.status === 'active' && (
                        <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all">
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Settings({ user }) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold gradient-text mb-6">Platform Settings</h2>
        
        <div className="space-y-6">
          <div className="p-4 glass-light rounded-xl">
            <h3 className="text-white font-medium mb-2">Email Notifications</h3>
            <p className="text-slate-400 text-sm mb-4">Configure system-wide email notification settings</p>
            <div className="flex items-center justify-between">
              <span className="text-white">SOS Alert Emails</span>
              <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
                Enabled
              </button>
            </div>
          </div>

          <div className="p-4 glass-light rounded-xl">
            <h3 className="text-white font-medium mb-2">System Maintenance</h3>
            <p className="text-slate-400 text-sm mb-4">Platform maintenance and backup settings</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">Auto Backup</span>
                <span className="text-green-400">Daily at 2:00 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Last Backup</span>
                <span className="text-slate-400">2 hours ago</span>
              </div>
            </div>
          </div>

          <div className="p-4 glass-light rounded-xl">
            <h3 className="text-white font-medium mb-2">Security Settings</h3>
            <p className="text-slate-400 text-sm mb-4">Platform security and access controls</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">Two-Factor Authentication</span>
                <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                  Configure
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Session Timeout</span>
                <span className="text-slate-400">24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}