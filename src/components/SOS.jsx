import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { sendSOSEmail, createSOSEmailTemplate } from '../utils/emailService';

export default function SOS({ user }) {
  const [isEmergency, setIsEmergency] = useState(false);
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [activeAlert, setActiveAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkActiveAlert();
  }, []);

  const checkActiveAlert = async () => {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveAlert(data);
    } catch (err) {
      console.error('Error checking active alert:', err);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationString = `${position.coords.latitude},${position.coords.longitude}`;
          resolve(locationString);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const triggerSOS = async () => {
    setLoading(true);
    setError('');

    try {
      const currentLocation = await getCurrentLocation();
      
      // Get user profile for email notifications
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: user.id,
          location: currentLocation,
          message: message || 'Emergency assistance needed',
          status: 'active'
        });

      if (error) throw error;

      // Get emergency contacts and send emails
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_emergency', true);

      // Send email notifications to emergency contacts
      if (contacts && contacts.length > 0) {
        const userInfo = {
          name: userProfile?.email?.split('@')[0] || 'CareConnect User',
          email: userProfile?.email || '',
          phone: userProfile?.phone || ''
        };

        const emailPromises = contacts.map(async (contact) => {
          if (contact.email) {
            try {
              const emailTemplate = createSOSEmailTemplate(
                userInfo,
                currentLocation,
                message || 'Emergency assistance needed',
                new Date().toISOString()
              );

              await sendSOSEmail(contact.email, userInfo, currentLocation, message || 'Emergency assistance needed');
              console.log(`SOS email sent to ${contact.email}`);
            } catch (emailError) {
              console.error(`Failed to send email to ${contact.email}:`, emailError);
            }
          }
        });

        await Promise.allSettled(emailPromises);
      }

      setActiveAlert({
        user_id: user.id,
        location: currentLocation,
        message: message || 'Emergency assistance needed',
        status: 'active',
        created_at: new Date().toISOString()
      });

      setMessage('');
      alert(`SOS Alert sent! ${contacts?.length || 0} emergency contacts have been notified via email.`);
    } catch (err) {
      console.error('Error triggering SOS:', err);
      setError('Failed to send SOS alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    if (!activeAlert) return;

    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      setActiveAlert(null);
      alert('SOS Alert cancelled.');
    } catch (err) {
      console.error('Error cancelling SOS:', err);
      setError('Failed to cancel SOS alert.');
    }
  };

  if (activeAlert) {
    return (
      <div className="space-y-6">
        <div className="glass-error rounded-xl p-6 text-center">
          <div className="animate-pulse">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">SOS ALERT ACTIVE</h2>
          <p className="text-white mb-4">Emergency assistance has been requested</p>
          <p className="text-sm text-gray-300 mb-6">
            Alert sent at: {new Date(activeAlert.created_at).toLocaleString()}
          </p>
          <button
            onClick={cancelSOS}
            className="btn-secondary rounded-xl px-8 py-3 font-semibold"
          >
            Cancel Alert
          </button>
        </div>

        <div className="glass-light rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">Alert Details</h3>
          <p className="text-slate-400 text-sm">{activeAlert.message}</p>
          <p className="text-slate-400 text-sm mt-2">
            Location: {activeAlert.location}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">Emergency SOS</h2>
        <p className="text-slate-400 mb-8">
          Press the SOS button in case of emergency. Your location and emergency contacts will be notified immediately.
        </p>
      </div>

      {error && (
        <div className="glass-error rounded-xl p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="glass-light rounded-xl p-6">
        <textarea
          placeholder="Optional message (e.g., 'Medical emergency', 'Need immediate help')"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-4 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          rows="3"
        />
      </div>

      <div className="text-center">
        <button
          onClick={triggerSOS}
          disabled={loading}
          className="w-48 h-48 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl flex flex-col items-center justify-center text-white font-bold text-xl disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : (
            <>
              <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>SOS</span>
              <span className="text-sm font-normal">Emergency</span>
            </>
          )}
        </button>
      </div>

      <div className="glass-light rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">What happens when you press SOS:</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Your current location is automatically captured
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Emergency contacts are notified immediately
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Nearby helpers are alerted
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Alert remains active until cancelled or resolved
          </li>
        </ul>
      </div>
    </div>
  );
}
