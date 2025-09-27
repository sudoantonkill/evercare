import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function CustomSidebar({ menuItems, onSignOut, userRole = 'elderly' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_photo')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setUserProfile(data);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const isActive = (path) => {
    if (path === `/${userRole}-dashboard` && location.pathname === `/${userRole}-dashboard`) {
      return true;
    }
    return location.pathname === path;
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'elderly': return 'from-blue-500 to-purple-500';
      case 'helper': return 'from-green-500 to-teal-500';
      case 'admin': return 'from-purple-500 to-pink-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'elderly':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'helper':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'admin':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 z-40 ${
      isCollapsed ? 'w-20' : 'w-72'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getRoleColor()} flex items-center justify-center overflow-hidden`}>
                {userProfile?.profile_photo ? (
                  <img 
                    src={`${supabase.storage.from('profile-photos').getPublicUrl(userProfile.profile_photo).data.publicUrl}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getRoleIcon()
                )}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg capitalize">{userRole}</h2>
                <p className="text-gray-400 text-sm">Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.path)
                ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <div className={`flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
              {item.icon}
            </div>
            {!isCollapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </button>
        ))}
        
        {/* Feedback Option */}
        <button
          onClick={() => navigate(`/${userRole}-dashboard/feedback`)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            isActive(`/${userRole}-dashboard/feedback`)
              ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <div className={`flex-shrink-0 ${isActive(`/${userRole}-dashboard/feedback`) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="font-medium">Feedback</span>
          )}
        </button>

        {/* Aborted Jobs Option */}
        <button
          onClick={() => navigate(`/${userRole}-dashboard/aborted-jobs`)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            isActive(`/${userRole}-dashboard/aborted-jobs`)
              ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <div className={`flex-shrink-0 ${isActive(`/${userRole}-dashboard/aborted-jobs`) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="font-medium">Aborted Jobs</span>
          )}
        </button>
      </nav>

      {/* Sign Out Button */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && (
            <span className="font-medium">Sign Out</span>
          )}
        </button>
      </div>

      {/* Collapsed tooltip */}
      {isCollapsed && (
        <div className="absolute left-full top-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
          </div>
        </div>
      )}
    </div>
  );
}
