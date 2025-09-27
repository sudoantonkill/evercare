import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function HelperLocationTracker({ jobId, helperId, isActive }) {
  const [locationInterval, setLocationInterval] = useState(null);

  useEffect(() => {
    if (isActive && jobId && helperId) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isActive, jobId, helperId]);

  const startLocationTracking = () => {
    // Clear any existing interval
    if (locationInterval) {
      clearInterval(locationInterval);
    }

    // Get initial location
    updateLocation();

    // Set up 15-second interval for location updates
    const interval = setInterval(() => {
      updateLocation();
    }, 15000); // 15 seconds

    setLocationInterval(interval);
  };

  const stopLocationTracking = () => {
    if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
    }
  };

  const updateLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = `${position.coords.latitude},${position.coords.longitude}`;
        
        try {
          // Call the database function to update helper location
          const { error } = await supabase.rpc('update_helper_location', {
            p_job_id: jobId,
            p_helper_id: helperId,
            p_location: location
          });

          if (error) {
            console.error('Error updating helper location:', error);
          }
        } catch (err) {
          console.error('Error calling location update function:', err);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // This component doesn't render anything visible
  return null;
}
