import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Popup from './Popup';

export default function AcceptJobs({ user, onNavigate }) {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'distance', 'urgency'

  useEffect(() => {
    fetchAvailableJobs();
    getCurrentLocation();
    
    // Real-time subscription for new jobs
    const jobsSubscription = supabase
      .channel('available_jobs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'jobs',
        filter: 'status=eq.pending'
      }, () => {
        fetchAvailableJobs();
      })
      .subscribe();

    return () => {
      jobsSubscription.unsubscribe();
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          elderly:elderly_id(email, phone, location, full_name, age, average_rating, total_ratings)
        `)
        .eq('status', 'pending')
        .is('helper_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load available jobs');
    }
  };

  const openLocationInMaps = (job) => {
    if (job.location) {
      // Check if location is coordinates (lat,lng format)
      const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
      let mapsUrl;
      
      if (coordPattern.test(job.location)) {
        // It's coordinates
        mapsUrl = `https://www.google.com/maps?q=${job.location}`;
      } else {
        // It's an address
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`;
      }
      
      window.open(mapsUrl, '_blank');
    }
  };

  const acceptJob = async (jobId) => {
    setLoading(true);
    setError('');

    try {
      console.log('Attempting to accept job:', jobId, 'for user:', user.id);
      
      // Get current location
      const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            resolve('Location not available');
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve(`${position.coords.latitude},${position.coords.longitude}`);
            },
            (error) => {
              console.warn('Geolocation error:', error);
              resolve('Location not available');
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      };

      const helperLocation = await getCurrentLocation();
      console.log('Helper location:', helperLocation);

      // First check if job still exists and is available
      const { data: jobCheck, error: checkError } = await supabase
        .from('jobs')
        .select('id, status, helper_id')
        .eq('id', jobId)
        .single();

      if (checkError) {
        console.error('Error checking job:', checkError);
        throw new Error('Job not found or access denied');
      }

      if (jobCheck.status !== 'pending' || jobCheck.helper_id !== null) {
        throw new Error('Job is no longer available');
      }

      // Update job with helper info
      const { data: updateData, error: jobError } = await supabase
        .from('jobs')
        .update({
          helper_id: user.id,
          helper_location: helperLocation,
          helper_current_location: helperLocation,
          status: 'accepted'
        })
        .eq('id', jobId)
        .eq('status', 'pending')
        .is('helper_id', null)
        .select();

      if (jobError) {
        console.error('Job update error:', jobError);
        throw jobError;
      }

      if (!updateData || updateData.length === 0) {
        throw new Error('Job was already taken by another helper');
      }

      console.log('Job updated successfully:', updateData);

      // Update helper's current location in profile (optional, don't fail if it errors)
      try {
        await supabase
          .from('profiles')
          .update({ current_location: helperLocation })
          .eq('id', user.id);
      } catch (profileError) {
        console.warn('Could not update profile location:', profileError);
      }

      fetchAvailableJobs();
      
      // Show success popup
      setPopupConfig({
        title: 'Job Accepted Successfully!',
        message: 'The elderly person has been notified. Redirecting to home page...',
        type: 'success',
        redirectTo: 'home'
      });
      setShowPopup(true);
    } catch (err) {
      console.error('Error accepting job:', err);
      setError(err.message || 'Failed to accept job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (job) => {
    if (!userLocation || !job.elderly?.location?.latitude || !job.elderly?.location?.longitude) {
      return { text: 'Location unavailable', value: Infinity };
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = (job.elderly.location.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (job.elderly.location.longitude - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(job.elderly.location.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return { text: `${Math.round(distance * 1000)}m away`, value: distance };
    } else {
      return { text: `${distance.toFixed(1)}km away`, value: distance };
    }
  };

  // Sort jobs based on selected criteria
  const getSortedJobs = () => {
    const jobsWithDistance = availableJobs.map(job => ({
      ...job,
      distanceInfo: calculateDistance(job)
    }));

    return jobsWithDistance.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distanceInfo.value - b.distanceInfo.value;
        case 'urgency':
          const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Available Jobs</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800/50 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="created_at">Latest First</option>
              <option value="distance">Distance</option>
              <option value="urgency">Urgency</option>
            </select>
          </div>
          <button
            onClick={fetchAvailableJobs}
            className="btn-secondary rounded-xl px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-error rounded-xl p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {availableJobs.length === 0 ? (
          <div className="glass-light rounded-xl p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 6V9a2 2 0 00-2-2H10a2 2 0 00-2 2v3.1M15 13l-3-3-3 3" />
            </svg>
            <h3 className="text-white font-medium mb-2">No Jobs Available</h3>
            <p className="text-slate-400 text-sm">Check back later for new assistance requests</p>
          </div>
        ) : (
          getSortedJobs().map((job) => (
            <div key={job.id} className="glass-light rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg flex items-center gap-2">
                    {job.title}
                    {job.is_emergency && (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 animate-pulse">
                        🚨 EMERGENCY
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-400 mt-2">{job.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">💰 Payment:</span>
                    <span className="text-green-400 font-medium">${job.payment_amount || job.money_offered || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">⏰ Duration:</span>
                    <span className="text-white">{job.estimated_duration || job.duration || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">🏷️ Category:</span>
                    <span className="text-white">{job.category || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">🚨 Priority:</span>
                    <span className={`font-medium ${
                      job.urgency === 'urgent' ? 'text-red-400' :
                      job.urgency === 'high' ? 'text-orange-400' :
                      job.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {job.urgency === 'urgent' ? 'Urgent - within 1 hour' :
                       job.urgency === 'high' ? 'High - in 1-2 hours' :
                       job.urgency === 'medium' ? 'Medium - in 2-3 hours' : 'Low - in 4-5 hours'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">👤 Name:</span>
                    <span className="text-white">{job.elderly?.full_name || 'Contact via app'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">🎂 Age:</span>
                    <span className="text-white">{job.elderly?.age ? `${job.elderly.age} years` : 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📞 Phone:</span>
                    <span className="text-white">{job.elderly?.phone || 'Available after acceptance'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📍 Location:</span>
                    <span className="text-white text-xs">{job.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📏 Distance:</span>
                    <span className={`font-medium ${
                      job.distanceInfo.value === Infinity ? 'text-slate-400' :
                      job.distanceInfo.value < 1 ? 'text-green-400' :
                      job.distanceInfo.value < 5 ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {job.distanceInfo.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">⭐ Rating:</span>
                    <span className="text-white font-medium">
                      {job.elderly?.total_ratings > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span>{job.elderly.average_rating.toFixed(1)}</span>
                          <span className="text-slate-400 text-xs">({job.elderly.total_ratings})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">No ratings yet</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                <span className="text-slate-400 text-sm">
                  Posted {new Date(job.created_at).toLocaleDateString()} at {new Date(job.created_at).toLocaleTimeString()}
                </span>
                <div className="flex gap-2">
                  {job.location && (
                    <button
                      onClick={() => openLocationInMaps(job)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      🗺️ Show in Maps
                    </button>
                  )}
                  <button
                    onClick={() => acceptJob(job.id)}
                    disabled={loading}
                    className={`px-6 py-2 rounded-xl font-medium transition-all transform hover:scale-105 ${
                      job.is_emergency 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'btn-primary'
                    }`}
                  >
                    {loading ? 'Accepting...' : job.is_emergency ? '🚨 Accept Emergency' : 'Accept Job'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Popup Component */}
      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        redirectTo={popupConfig.redirectTo}
        onRedirect={(page) => {
          if (onNavigate) {
            onNavigate(page);
          }
        }}
      />
    </div>
  );
}
