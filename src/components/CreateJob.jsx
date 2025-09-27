import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function CreateJob({ user }) {
  const [submitted, setSubmitted] = useState(false);
  const nav = useNavigate();
  
  useEffect(() => {
    if (!user) {
      setLoading(true);
      setTimeout(() => {
        nav('/elderly-dashboard', { replace: true });
      }, 0);
    }
  }, [user, nav]);
  const [loading, setLoading] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    payment_amount: '',
    estimated_duration: '',
    urgency: 'medium'
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        };
        setDeviceLocation(newLocation);
        setFormData(prev => ({
          ...prev,
          location: `${newLocation.lat}, ${newLocation.lng}`
        }));
        setLocationError(null);
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError('Error getting location: ' + error.message);
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) {
      console.log('Submission already in progress');
      return;
    }
    
    console.log('Form submitted');
    setLoading(true);

    try {
      const locationString = deviceLocation
        ? `${deviceLocation.lat},${deviceLocation.lng}`
        : formData.location;

      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            location: locationString,
            elderly_id: user.id,
            status: 'pending',
            payment_amount: parseFloat(formData.payment_amount),
            estimated_duration: formData.estimated_duration,
            urgency: formData.urgency
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Job created successfully');
      setSubmitted(true);
      setLoading(false);
      setTimeout(() => {
        nav('/elderly-dashboard', { replace: true });
      }, 0);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error creating job. Please try again.');
    } finally {
      if (!submitted) {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (submitted) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold gradient-text mb-6">Create New Job</h2>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div>
          <label className="block text-slate-200 mb-2 flex items-center gap-2">
            <span>📝</span> Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter job title"
          />
        </div>

        <div>
          <label className="block text-slate-200 mb-2 flex items-center gap-2">
            <span>📋</span> Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
            placeholder="Enter job description"
          />
        </div>

        <div>
          <label className="block text-slate-200 mb-2 flex items-center gap-2">
            <span>📍</span> Location
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter location manually or use GPS"
              />
              <button
                type="button"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGettingLocation ? '🔄' : '🎯'} Use GPS
              </button>
            </div>
            <div className="mt-2">
              {deviceLocation ? (
                <p className="text-green-600 flex items-center gap-1">
                  ✅ Location captured: {deviceLocation.lat}, {deviceLocation.lng}
                </p>
              ) : locationError ? (
                <p className="text-red-600 flex items-center gap-1">
                  ⚠️ {locationError}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-200 mb-2 flex items-center gap-2">
            <span>💰</span> Money Offered ($)
          </label>
          <input
            type="number"
            name="payment_amount"
            value={formData.payment_amount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="block text-slate-200 mb-2 flex items-center gap-2">
            <span>⏱️</span> Duration
          </label>
          <input
            type="text"
            name="estimated_duration"
            value={formData.estimated_duration}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="e.g. 2 hours, 1 day"
          />
        </div>

        <div>
          <label className="block text-slate-200 mb-2 flex items-center gap-2">
            <span>🚨</span> Priority Level
          </label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">🚨 Emergency</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            console.log('Button clicked');
            if (!loading) {
              handleSubmit(e);
            }
          }}
          className="w-full btn-primary rounded-xl py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Job'}
        </button>
      </form>
    </div>
  );
}