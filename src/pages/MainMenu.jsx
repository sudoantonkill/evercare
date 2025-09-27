import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import JobWorkflow from '../components/JobWorkflow';

// Contact Information Component that directly fetches from profiles table
const ContactInfo = ({ job, userRole }) => {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      if (!job.helper_id && !job.elderly_id) return;
      
      try {
        const targetUserId = userRole === 'elderly' ? job.helper_id : job.elderly_id;
        if (!targetUserId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, aadhaar_number, average_rating, total_ratings')
          .eq('id', targetUserId)
          .single();

        if (error) {
          console.error('Error fetching contact info:', error);
          return;
        }

        setContactData(data);
      } catch (err) {
        console.error('Contact fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, [job.helper_id, job.elderly_id, userRole]);

  if (loading) {
    return (
      <div className="glass-primary rounded-xl p-4 mb-4">
        <div className="text-white">Loading contact information...</div>
      </div>
    );
  }

  return (
    <div className="glass-primary rounded-xl p-4 mb-4">
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {userRole === 'elderly' ? 'Helper Contact Information' : 'Elderly Contact Information'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Full Name</div>
          <div className="text-white font-medium">
            {contactData?.full_name || 'Not available'}
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Phone Number</div>
          <div className="text-white font-medium">
            {contactData?.phone || 'Not available'}
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Aadhaar Number</div>
          <div className="text-white font-medium font-mono">
            {contactData?.aadhaar_number && contactData.aadhaar_number.length >= 4
              ? `****-****-${contactData.aadhaar_number.slice(-4)}`
              : 'Not available'
            }
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Rating</div>
          <div className="text-white font-medium flex items-center gap-1">
            {contactData?.total_ratings > 0 ? (
              <>
                <span className="text-yellow-400">⭐</span>
                <span>{contactData.average_rating.toFixed(1)}</span>
                <span className="text-slate-400 text-xs">({contactData.total_ratings})</span>
              </>
            ) : (
              <span className="text-slate-400">No ratings yet</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Contact information is shared only for accepted jobs for safety and verification purposes.
      </div>
    </div>
  );
};

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

export default function MainMenu({ user, userRole = 'elderly', jobs: propJobs, onNavigate }) {
  const [jobs, setJobs] = useState(propJobs || []);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [helperLocation, setHelperLocation] = useState(null);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
  const [refreshTimeout, setRefreshTimeout] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [abortedJobs, setAbortedJobs] = useState([]);

  useEffect(() => {
    if (propJobs) {
      setJobs(propJobs);
    } else if (user?.id) {
      fetchJobs(true); // Force refresh on initial load
    }
    getCurrentLocation();
    fetchUserProfile();
    fetchAbortedJobs();

    let jobsSubscription = null;
    
    if (user?.id && !propJobs) {
      jobsSubscription = supabase
        .channel('jobs_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'jobs'
        }, (payload) => {
          console.log('Job change detected:', payload);
          // Check if this change affects the current user
          const record = payload.new || payload.old;
          if (record && (record.elderly_id === user.id || record.helper_id === user.id)) {
            // Debounce the refresh to avoid rapid successive calls
            if (refreshTimeout) {
              clearTimeout(refreshTimeout);
            }
            const timeout = setTimeout(() => {
              fetchJobs(true); // Force refresh on meaningful changes
              fetchAbortedJobs(); // Also refresh aborted jobs
            }, 500); // Reduced timeout for faster response
            setRefreshTimeout(timeout);
          }
        })
        .subscribe();
    }

    // Handle visibility change - refresh data when user comes back to tab
    // TEMPORARILY DISABLED to test if this is causing the issue
    const handleVisibilityChange = () => {
      console.log('Visibility change detected, but handler is disabled for testing');
      // if (!document.hidden && user?.id && !propJobs) {
      //   // Only refresh if it's been more than 30 seconds since last fetch
      //   // This prevents unnecessary refreshes when quickly switching tabs
      //   const timeSinceLastFetch = Date.now() - lastFetchTime;
      //   if (timeSinceLastFetch > 30000) {
      //     console.log('Tab became visible, refreshing data after', timeSinceLastFetch, 'ms');
      //     fetchJobs(true); // Force refresh when tab becomes visible
      //   } else {
      //     console.log('Tab became visible but skipping refresh (too recent)');
      //   }
      // }
    };

    // document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (jobsSubscription) {
        jobsSubscription.unsubscribe();
      }
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, userRole, propJobs]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, average_rating, total_ratings')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchAbortedJobs = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('aborted_jobs')
        .select('*')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .order('aborted_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched aborted jobs:', data);
      setAbortedJobs(data || []);
    } catch (err) {
      console.error('Error fetching aborted jobs:', err);
    }
  };

  const fetchJobs = async (forceRefresh = false) => {
    if (!user?.id) return;
    
    // Prevent excessive API calls - only fetch if it's been more than 2 seconds since last fetch (reduced for better responsiveness)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 2000) {
      return;
    }
    
    try {
      // Get job data excluding aborted jobs (they're fetched separately)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .neq('status', 'aborted')
        .order('created_at', { ascending: false });

      console.log('Fetched jobs data:', data);

      if (error) throw error;
      
      setJobs(data || []);
      setLastFetchTime(now);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  };

  const handleTrackHelper = async (job) => {
    // Open Google Maps in new tab instead of showing embedded map
    if (job.helper_current_location) {
      const mapsUrl = `https://www.google.com/maps?q=${job.helper_current_location}&z=15`;
      window.open(mapsUrl, '_blank');
    } else if (job.helper_location) {
      const mapsUrl = `https://www.google.com/maps?q=${job.helper_location}&z=15`;
      window.open(mapsUrl, '_blank');
    } else {
      alert('Helper location not available yet. Please try again in a moment.');
    }
  };

  const directionsCallback = (result, status) => {
    if (status === 'OK') {
      setDirections(result);
      const route = result.routes[0];
      setDistance(route.legs[0].distance.text);
      setDuration(route.legs[0].duration.text);
    }
  };

  const getJobsByStatus = (status) => {
    const filtered = (() => {
      if (status === 'pending') {
        return jobs.filter(job => job.status === 'pending');
      } else if (status === 'aborted') {
        return abortedJobs; // Use separate aborted jobs list
      } else if (status === 'active') {
        return jobs.filter(job => ['accepted', 'helper_on_way', 'helper_arrived', 'in_progress', 'payment_pending'].includes(job.status));
      } else if (status === 'completed') {
        return jobs.filter(job => job.status === 'fully_completed');
      }
      return [];
    })();
    
    console.log(`Jobs with status '${status}':`, filtered);
    return filtered;
  };

  const renderJobCard = (job) => (
    <div key={job.id} className="glass-light rounded-xl p-6 hover:bg-gray-800/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            {job.title}
            {job.is_emergency && (
              <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 animate-pulse">
                🚨 Emergency
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
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">📍 Location:</span>
            <span className="text-white text-xs">{job.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">📅 Created:</span>
            <span className="text-white">{new Date(job.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">👤 {userRole === 'elderly' ? 'Helper' : 'Elderly'}:</span>
            <span className="text-white">
              {userRole === 'elderly' 
                ? (job.helper?.full_name || 'Not assigned') 
                : (job.elderly?.full_name || 'Contact via app')
              }
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information for Accepted Jobs */}
      {['accepted', 'helper_on_way', 'helper_arrived', 'in_progress', 'payment_pending'].includes(job.status) && (
        <ContactInfo job={job} userRole={userRole} />
      )}

      {/* Job Workflow Component */}
      <JobWorkflow 
        job={job}
        user={user}
        userRole={userRole}
        onJobUpdate={fetchJobs}
        onNavigate={onNavigate}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* User Profile Section */}
      {userProfile && (
        <div className="glass-light rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Welcome back, {userProfile.full_name}!</h3>
              <p className="text-slate-400 capitalize">{userRole} Dashboard</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-2xl">⭐</span>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {userProfile.total_ratings > 0 ? userProfile.average_rating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {userProfile.total_ratings > 0 
                      ? `${userProfile.total_ratings} rating${userProfile.total_ratings !== 1 ? 's' : ''}`
                      : 'No ratings yet'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-light rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-red-400">{getJobsByStatus('aborted').length}</div>
          <div className="text-slate-400 text-sm mt-1">Aborted Jobs</div>
        </div>
        <div className="glass-light rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-blue-400">{getJobsByStatus('active').length}</div>
          <div className="text-slate-400 text-sm mt-1">Active Jobs</div>
        </div>
        <div className="glass-light rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-green-400">{getJobsByStatus('completed').length}</div>
          <div className="text-slate-400 text-sm mt-1">Completed</div>
        </div>
        <div className="glass-light rounded-xl p-6 text-center">
          <div className="text-3xl font-bold gradient-text">{jobs.length}</div>
          <div className="text-slate-400 text-sm mt-1">Total Jobs</div>
        </div>
      </div>

      {/* Pending Jobs - Only for Elderly */}
      {userRole === 'elderly' && getJobsByStatus('pending').length > 0 && (
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-6">Waiting for Helper</h2>
          <div className="grid gap-6">
            {getJobsByStatus('pending').map(renderJobCard)}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {getJobsByStatus('active').length > 0 && (
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-6">Active Jobs</h2>
          <div className="grid gap-6">
            {getJobsByStatus('active').map(renderJobCard)}
          </div>
        </div>
      )}


      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="glass-light rounded-xl p-12 text-center">
          <svg className="w-20 h-20 mx-auto text-slate-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 6V9a2 2 0 00-2-2H10a2 2 0 00-2 2v3.1M15 13l-3-3-3 3" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Jobs Yet</h3>
          <p className="text-slate-400 mb-6">
            {userRole === 'elderly' 
              ? 'Create your first job to get assistance from helpers in your community'
              : 'No jobs assigned yet. Check the Accept Jobs section for available opportunities'
            }
          </p>
        </div>
      )}

      {/* Map Modal */}
      {showMap && selectedJob && userLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Helper Location Tracking</h3>
            {distance && duration && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="glass-light rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Distance</p>
                  <p className="text-white font-semibold">{distance}</p>
                </div>
                <div className="glass-light rounded-lg p-3">
                  <p className="text-slate-400 text-sm">ETA</p>
                  <p className="text-white font-semibold">{duration}</p>
                </div>
              </div>
            )}
            <div className="rounded-xl h-96 mb-4 overflow-hidden">
              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={userLocation}
                  zoom={13}
                  options={{ styles: mapStyles }}
                >
                  <Marker
                    position={userLocation}
                    icon={{
                      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                      fillColor: '#4CAF50',
                      fillOpacity: 1,
                      strokeWeight: 0,
                      scale: 2,
                      anchor: { x: 12, y: 24 }
                    }}
                  />
                  {helperLocation && (
                    <>
                      <Marker
                        position={helperLocation}
                        icon={{
                          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                          fillColor: '#F44336',
                          fillOpacity: 1,
                          strokeWeight: 0,
                          scale: 2,
                          anchor: { x: 12, y: 24 }
                        }}
                      />
                      <Polyline
                        path={[userLocation, helperLocation]}
                        options={{
                          strokeColor: '#4CAF50',
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          geodesic: true
                        }}
                      />
                    </>
                  )}
                  {helperLocation && !directions && (
                    <DirectionsService
                      options={{
                        destination: helperLocation,
                        origin: userLocation,
                        travelMode: 'DRIVING'
                      }}
                      callback={directionsCallback}
                    />
                  )}
                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              </LoadScript>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowMap(false);
                  setSelectedJob(null);
                  setDirections(null);
                  setHelperLocation(null);
                  if (locationUpdateInterval) {
                    clearInterval(locationUpdateInterval);
                    setLocationUpdateInterval(null);
                  }
                }}
                className="flex-1 btn-secondary rounded-xl py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
