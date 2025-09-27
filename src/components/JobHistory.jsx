import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function JobHistory({ user, userRole }) {
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchJobHistory();
    }
  }, [user]);

  const fetchJobHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching job history for user:', user.id, 'role:', userRole);
      
      const { data, error } = await supabase
        .from('job_history')
        .select('*')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .order('archived_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Job history data received:', data);
      setJobHistory(data || []);
      
      // If no history found, automatically move completed jobs
      if (!data || data.length === 0) {
        await moveCompletedJobsToHistory();
      }
    } catch (err) {
      console.error('Error fetching job history:', err);
      setError(`Failed to load job history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkForCompletedJobs = async () => {
    try {
      console.log('Checking for completed jobs that might need to be archived...');
      
      const { data: completedJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .in('status', ['completed', 'fully_completed'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error checking completed jobs:', error);
        return;
      }

      console.log('Found completed jobs:', completedJobs);
      
      if (completedJobs && completedJobs.length > 0) {
        setError(`Found ${completedJobs.length} completed job(s) that need to be moved to history. Click "Move Completed Jobs to History" to archive them.`);
      }
    } catch (err) {
      console.error('Error checking completed jobs:', err);
    }
  };

  const moveCompletedJobsToHistory = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any existing errors
      
      console.log('Starting to move completed jobs to history...');
      
      // Get completed jobs for this user
      const { data: completedJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .in('status', ['completed', 'fully_completed']);

      if (jobsError) {
        console.error('Error fetching completed jobs:', jobsError);
        throw jobsError;
      }

      console.log('Found completed jobs:', completedJobs);

      if (!completedJobs || completedJobs.length === 0) {
        setError('No completed jobs found to move to history');
        return;
      }

      let movedCount = 0;

      // Move each completed job to history
      for (const job of completedJobs) {
        console.log(`Processing job: ${job.title} (${job.id})`);
        
        // Check if already in history
        const { data: existingHistory, error: checkError } = await supabase
          .from('job_history')
          .select('id')
          .eq('job_id', job.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing history:', checkError);
          continue;
        }

        if (existingHistory) {
          console.log(`Job ${job.title} already in history, skipping`);
          continue;
        }

        // Get user profiles
        const { data: elderlyProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', job.elderly_id)
          .maybeSingle();

        const { data: helperProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', job.helper_id)
          .maybeSingle();

        // Calculate actual duration
        let actualDuration = null;
        if (job.job_started_at && job.job_ended_at) {
          const start = new Date(job.job_started_at);
          const end = new Date(job.job_ended_at);
          const diffMs = end - start;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          actualDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        }

        // Insert into job history
        const historyData = {
          job_id: job.id,
          elderly_id: job.elderly_id,
          helper_id: job.helper_id,
          elderly_name: elderlyProfile?.full_name || elderlyProfile?.email || 'Unknown',
          helper_name: helperProfile?.full_name || helperProfile?.email || 'Unknown',
          title: job.title,
          description: job.description,
          category: job.category,
          urgency: job.urgency,
          location: job.location,
          estimated_duration: job.estimated_duration,
          actual_duration: actualDuration,
          payment_amount: job.payment_amount,
          job_created_at: job.created_at,
          job_started_at: job.job_started_at,
          job_ended_at: job.job_ended_at,
          helper_arrived_at: job.helper_arrived_at
        };

        console.log('Inserting job history:', historyData);

        const { error: insertError } = await supabase
          .from('job_history')
          .insert(historyData);

        if (insertError) {
          console.error('Error moving job to history:', insertError);
          setError(`Error moving job "${job.title}": ${insertError.message}`);
        } else {
          console.log(`Successfully moved job "${job.title}" to history`);
          movedCount++;
        }
      }

      console.log(`Moved ${movedCount} jobs to history`);
      
      // Refresh the job history
      await fetchJobHistory();
      
      if (movedCount > 0) {
        // Clear the error message since we successfully moved jobs
        setError('');
      }
      
    } catch (err) {
      console.error('Error moving completed jobs to history:', err);
      setError(`Failed to move jobs to history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (interval) => {
    if (!interval) return 'Not recorded';
    
    // Parse PostgreSQL interval format
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }
    return interval;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold gradient-text">Job History</h2>
        <div className="glass-light rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading job history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold gradient-text">Job History</h2>
        <div className="glass-error rounded-xl p-6">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchJobHistory}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Job History</h2>
        <button
          onClick={fetchJobHistory}
          className="btn-secondary rounded-xl px-4 py-2 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {jobHistory.length === 0 ? (
        <div className="glass-light rounded-xl p-12 text-center">
          <svg className="w-20 h-20 mx-auto text-slate-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Completed Jobs</h3>
          <p className="text-slate-400 mb-4">
            Your completed jobs will appear here once you finish them.
          </p>
          <button
            onClick={moveCompletedJobsToHistory}
            className="btn-primary rounded-xl px-6 py-2 flex items-center gap-2 mx-auto"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {loading ? 'Moving Jobs...' : 'Move Completed Jobs to History'}
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobHistory.map((job) => (
            <div key={job.id} className="glass-light rounded-xl p-6 hover:bg-gray-800/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                    {job.title}
                    <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                      ✅ Completed
                    </span>
                  </h3>
                  <p className="text-slate-400 mt-2">{job.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">💰 Payment:</span>
                    <span className="text-green-400 font-medium">${job.payment_amount || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">⏰ Estimated:</span>
                    <span className="text-white">{job.estimated_duration || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">⏱️ Actual:</span>
                    <span className="text-white">{formatDuration(job.actual_duration)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">🏷️ Category:</span>
                    <span className="text-white">{job.category || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">🚨 Priority:</span>
                    <span className={`font-medium ${getUrgencyColor(job.urgency)}`}>
                      {job.urgency ? job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📍 Location:</span>
                    <span className="text-white text-xs">{job.location || 'Not specified'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">👤 {userRole === 'elderly' ? 'Helper' : 'Elderly'}:</span>
                    <span className="text-white">
                      {userRole === 'elderly' ? job.helper_name : job.elderly_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📅 Created:</span>
                    <span className="text-white">{new Date(job.job_created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">✅ Completed:</span>
                    <span className="text-white">{new Date(job.archived_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-white font-medium mb-3">Job Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-slate-400">Created</div>
                    <div className="text-white font-medium">
                      {job.job_created_at ? new Date(job.job_created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Helper Arrived</div>
                    <div className="text-white font-medium">
                      {job.helper_arrived_at ? new Date(job.helper_arrived_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Started</div>
                    <div className="text-white font-medium">
                      {job.job_started_at ? new Date(job.job_started_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Ended</div>
                    <div className="text-white font-medium">
                      {job.job_ended_at ? new Date(job.job_ended_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
