import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Popup from '../components/Popup';

export default function CreateJob({ user, onNavigate }) {
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    category: '',
    urgency: 'medium',
    location: '',
    estimated_duration: '',
    payment_amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});

  const categories = [
    'Healthcare Assistance',
    'Household Chores',
    'Transportation',
    'Grocery Shopping',
    'Companionship',
    'Technology Help',
    'Garden Maintenance',
    'Pet Care',
    'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority - in 4 - 5 hours', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Priority - in 2 - 3 hours', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority - in 1 - 2 hours', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent - within 1 hour', color: 'text-red-600' }
  ];

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude}, ${longitude}`);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const handleLocationCapture = async () => {
    try {
      const location = await getCurrentLocation();
      setJobData(prev => ({ ...prev, location }));
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get current location. Please enter manually.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate required fields
      if (!jobData.title || !jobData.description || !jobData.category) {
        throw new Error('Please fill in all required fields');
      }

      const { error } = await supabase
        .from('jobs')
        .insert({
          elderly_id: user.id,
          title: jobData.title,
          description: jobData.description,
          category: jobData.category,
          urgency: jobData.urgency,
          location: jobData.location,
          estimated_duration: jobData.estimated_duration,
          payment_amount: jobData.payment_amount ? parseFloat(jobData.payment_amount) : null,
          status: 'pending'
        });

      if (error) throw error;

      setSuccess(true);
      setJobData({
        title: '',
        description: '',
        category: '',
        urgency: 'medium',
        location: '',
        estimated_duration: '',
        payment_amount: ''
      });

      // Show success popup
      setPopupConfig({
        title: 'Job Created Successfully!',
        message: 'Your request has been posted. Helpers will be notified. Redirecting to home page...',
        type: 'success',
        redirectTo: 'home'
      });
      setShowPopup(true);
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err.message || 'Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Job
            </h1>
            <p className="text-gray-600 mt-2">Request assistance from community helpers</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">Job created successfully! Helpers will be notified.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={jobData.title}
                onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Help with grocery shopping"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={jobData.description}
                onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe what help you need in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={jobData.category}
                  onChange={(e) => setJobData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  value={jobData.urgency}
                  onChange={(e) => setJobData(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jobData.location}
                  onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter address or coordinates"
                />
                <button
                  type="button"
                  onClick={handleLocationCapture}
                  className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  📍 Current
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={jobData.estimated_duration}
                  onChange={(e) => setJobData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., 2 hours, 30 minutes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={jobData.payment_amount}
                  onChange={(e) => setJobData(prev => ({ ...prev, payment_amount: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Job...
                  </div>
                ) : (
                  'Create Job Request'
                )}
              </button>
            </div>
          </form>
        </div>
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
