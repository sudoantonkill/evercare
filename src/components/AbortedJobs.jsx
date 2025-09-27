import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AbortedJobs({ user, userRole }) {
  const [abortedJobs, setAbortedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAbortedJobs();
  }, [user]);

  const fetchAbortedJobs = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('aborted_jobs')
        .select('*')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .order('aborted_at', { ascending: false });

      if (error) throw error;
      setAbortedJobs(data || []);
    } catch (err) {
      console.error('Error fetching aborted jobs:', err);
      setError('Failed to load aborted jobs');
    } finally {
      setLoading(false);
    }
  };

  const renderAbortedJobCard = (job) => (
    <div key={job.id} className="glass-light rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2">{job.title}</h3>
          <p className="text-slate-400 text-sm mb-3">{job.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">💰 Payment:</span>
              <span className="text-green-400 font-medium ml-2">
                ${job.payment_amount || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">⏰ Duration:</span>
              <span className="text-white ml-2">{job.estimated_duration || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-400">🏷️ Category:</span>
              <span className="text-white ml-2">{job.category || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400">📍 Location:</span>
              <span className="text-white ml-2">{job.location || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4 mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">❌ Aborted:</span>
            <span className="text-red-400 ml-2">{new Date(job.aborted_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400">📅 Originally Created:</span>
            <span className="text-white ml-2">{new Date(job.original_created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400">📊 Status When Aborted:</span>
            <span className="text-orange-400 ml-2 capitalize">{job.original_status.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-400">👤 Aborted By:</span>
            <span className="text-white ml-2">
              {job.aborted_by === user.id ? 'You' : 'Other party'}
            </span>
          </div>
        </div>
        
        {job.abort_reason && (
          <div className="mt-3">
            <span className="text-slate-400">💬 Reason:</span>
            <p className="text-white mt-1 text-sm bg-gray-800/50 p-2 rounded-lg">
              {job.abort_reason}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        <span className="text-white font-medium ml-3">Loading aborted jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-error rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchAbortedJobs}
          className="mt-4 btn-primary rounded-xl px-6 py-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-red-400">Aborted Jobs</h2>
        <div className="text-slate-400 text-sm">
          {abortedJobs.length} job{abortedJobs.length !== 1 ? 's' : ''} aborted
        </div>
      </div>

      {abortedJobs.length === 0 ? (
        <div className="glass-light rounded-xl p-12 text-center">
          <svg className="w-20 h-20 mx-auto text-slate-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Aborted Jobs</h3>
          <p className="text-slate-400">
            You haven't aborted any jobs yet. Aborted jobs will appear here for your reference.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {abortedJobs.map(renderAbortedJobCard)}
        </div>
      )}
    </div>
  );
}
