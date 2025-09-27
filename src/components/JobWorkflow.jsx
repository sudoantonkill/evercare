import { useState } from 'react';
import { supabase } from '../supabaseClient';
import Popup from './Popup';
import HelperLocationTracker from './HelperLocationTracker';

export default function JobWorkflow({ job, user, userRole, onJobUpdate, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const [abortReason, setAbortReason] = useState('');

  const updateJobStatus = async (newStatus, additionalData = {}) => {
    setLoading(true);
    try {
      const updateData = {
        status: newStatus,
        ...additionalData
      };

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', job.id);

      if (error) throw error;

      if (onJobUpdate) {
        onJobUpdate();
      }

      return true;
    } catch (err) {
      console.error('Error updating job status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleHelperArrived = async () => {
    const success = await updateJobStatus('helper_arrived', {
      helper_arrived_at: new Date().toISOString()
    });

    if (success) {
      setPopupConfig({
        title: 'Helper Arrived!',
        message: 'Great! The helper has arrived at the location.',
        type: 'success'
      });
      setShowPopup(true);
    }
  };

  const handleJobStarted = async () => {
    const success = await updateJobStatus('in_progress', {
      job_started_at: new Date().toISOString()
    });

    if (success) {
      setPopupConfig({
        title: 'Job Started!',
        message: 'The job is now in progress. Good luck!',
        type: 'info'
      });
      setShowPopup(true);
    }
  };

  const handleJobEnded = async () => {
    const success = await updateJobStatus('payment_pending', {
      job_ended_at: new Date().toISOString()
    });

    if (success) {
      setPopupConfig({
        title: 'Job Completed!',
        message: 'The job has been completed. Please confirm payment to finalize.',
        type: 'success'
      });
      setShowPopup(true);
    }
  };

  const handlePaymentConfirmation = async (confirmedBy) => {
    const updateField = confirmedBy === 'elderly' ? 'payment_confirmed_by_elderly' : 'payment_confirmed_by_helper';
    
    const success = await updateJobStatus('payment_pending', {
      [updateField]: true
    });

    if (success) {
      // Check if both parties have confirmed payment
      const { data } = await supabase
        .from('jobs')
        .select('payment_confirmed_by_elderly, payment_confirmed_by_helper')
        .eq('id', job.id)
        .single();

      if (data && data.payment_confirmed_by_elderly && data.payment_confirmed_by_helper) {
        // Both confirmed, move to fully completed
        await updateJobStatus('fully_completed');
        
        setPopupConfig({
          title: 'Job Fully Completed!',
          message: 'Payment confirmed by both parties. You can now provide feedback in the Feedback section.',
          type: 'success'
        });
      } else {
        setPopupConfig({
          title: 'Payment Confirmed!',
          message: `Payment ${confirmedBy === 'elderly' ? 'given' : 'received'} confirmed. Waiting for the other party to confirm.`,
          type: 'success'
        });
      }
      setShowPopup(true);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
      'accepted': { text: 'Accepted', color: 'bg-blue-500/20 text-blue-400' },
      'helper_on_way': { text: 'Helper On Way', color: 'bg-purple-500/20 text-purple-400' },
      'helper_arrived': { text: 'Helper Arrived', color: 'bg-indigo-500/20 text-indigo-400' },
      'in_progress': { text: 'In Progress', color: 'bg-orange-500/20 text-orange-400' },
      'completed': { text: 'Completed', color: 'bg-green-500/20 text-green-400' },
      'payment_pending': { text: 'Payment Pending', color: 'bg-pink-500/20 text-pink-400' },
      'fully_completed': { text: 'Fully Completed', color: 'bg-emerald-500/20 text-emerald-400' },
      'cancelled': { text: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
      'aborted': { text: 'Aborted', color: 'bg-red-600/20 text-red-500' }
    };
    
    return statusMap[status] || { text: status, color: 'bg-gray-500/20 text-gray-400' };
  };

  const abortJob = async () => {
    setLoading(true);
    try {
      // First, check if job is already aborted
      const { data: existingAbort, error: checkError } = await supabase
        .from('aborted_jobs')
        .select('id')
        .eq('job_id', job.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingAbort) {
        setPopupConfig({
          title: 'Already Aborted',
          message: 'This job has already been aborted.',
          type: 'info'
        });
        setShowPopup(true);
        setShowAbortConfirm(false);
        return;
      }

      // Get current job data
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job.id)
        .single();

      if (jobError) throw jobError;

      // Check if job can still be aborted
      if (jobData.status === 'aborted' || jobData.status === 'fully_completed') {
        setPopupConfig({
          title: 'Cannot Abort',
          message: `This job is already ${jobData.status} and cannot be aborted.`,
          type: 'info'
        });
        setShowPopup(true);
        setShowAbortConfirm(false);
        return;
      }

      // Insert into aborted_jobs table
      const { error: abortError } = await supabase
        .from('aborted_jobs')
        .insert({
          job_id: job.id,
          elderly_id: jobData.elderly_id,
          helper_id: jobData.helper_id,
          title: jobData.title,
          description: jobData.description,
          category: jobData.category,
          location: jobData.location,
          payment_amount: jobData.payment_amount,
          estimated_duration: jobData.estimated_duration,
          urgency: jobData.urgency,
          original_status: jobData.status,
          aborted_by: user.id,
          abort_reason: abortReason.trim() || null,
          original_created_at: jobData.created_at
        });

      if (abortError) {
        console.error('Error inserting into aborted_jobs:', abortError);
        throw abortError;
      }

      // Update job status to aborted
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'aborted' })
        .eq('id', job.id);

      if (updateError) {
        console.error('Error updating job status:', updateError);
        throw updateError;
      }

      setPopupConfig({
        title: 'Job Aborted',
        message: 'The job has been successfully aborted and moved to aborted jobs.',
        type: 'success'
      });
      setShowPopup(true);
      setShowAbortConfirm(false);
      setAbortReason('');
      
      // Force immediate refresh of jobs list
      if (onJobUpdate) {
        onJobUpdate();
      }
      
      // Also trigger multiple refreshes to ensure UI updates
      setTimeout(() => {
        if (onJobUpdate) {
          onJobUpdate();
        }
      }, 500);
      
      setTimeout(() => {
        if (onJobUpdate) {
          onJobUpdate();
        }
      }, 1500);
    } catch (err) {
      console.error('Error aborting job:', err);
      setPopupConfig({
        title: 'Error',
        message: `Failed to abort job: ${err.message}. Please try again.`,
        type: 'error'
      });
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const renderActionButtons = () => {
    const { status } = job;

    // Helper buttons
    if (userRole === 'helper' && job.helper_id === user.id) {
      switch (status) {
        case 'accepted':
          return (
            <button
              onClick={handleHelperArrived}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Updating...' : '📍 I Have Arrived'}
            </button>
          );
        
        case 'helper_arrived':
          return (
            <button
              onClick={handleJobStarted}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Starting...' : '🚀 Start Job'}
            </button>
          );
        
        case 'in_progress':
          return (
            <button
              onClick={handleJobEnded}
              disabled={loading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Completing...' : '✅ Job Completed'}
            </button>
          );
        
        case 'payment_pending':
          return (
            <button
              onClick={() => handlePaymentConfirmation('helper')}
              disabled={loading || job.payment_confirmed_by_helper}
              className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 ${
                job.payment_confirmed_by_helper 
                  ? 'bg-gray-500 text-gray-300' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              {job.payment_confirmed_by_helper ? '✓ Payment Received' : '💰 Confirm Payment Received'}
            </button>
          );
      }
    }

    // Elderly buttons
    if (userRole === 'elderly' && job.elderly_id === user.id) {
      switch (status) {
        case 'helper_arrived':
          return (
            <button
              onClick={handleJobStarted}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Starting...' : '🚀 Start Job'}
            </button>
          );
        
        case 'in_progress':
          return (
            <button
              onClick={handleJobEnded}
              disabled={loading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Completing...' : '✅ Job Completed'}
            </button>
          );
        
        case 'payment_pending':
          return (
            <button
              onClick={() => handlePaymentConfirmation('elderly')}
              disabled={loading || job.payment_confirmed_by_elderly}
              className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 ${
                job.payment_confirmed_by_elderly 
                  ? 'bg-gray-500 text-gray-300' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              {job.payment_confirmed_by_elderly ? '✓ Payment Given' : '💳 Confirm Payment Given'}
            </button>
          );
      }
    }

    return null;
  };

  const statusDisplay = getStatusDisplay(job.status);
  const isHelperTracking = userRole === 'helper' && job.helper_id === user.id && 
                          ['accepted', 'helper_on_way', 'helper_arrived', 'in_progress'].includes(job.status);

  return (
    <div className="space-y-4">
      {/* Location Tracker for Helper */}
      <HelperLocationTracker 
        jobId={job.id}
        helperId={job.helper_id}
        isActive={isHelperTracking}
      />

      {/* Status Display */}
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
          {statusDisplay.text}
        </span>
        
        {/* Track Helper Button for Elderly */}
        {userRole === 'elderly' && job.elderly_id === user.id && 
         ['accepted', 'helper_on_way', 'helper_arrived', 'in_progress'].includes(job.status) && (
          <button
            onClick={() => {
              if (job.helper_current_location) {
                const mapsUrl = `https://www.google.com/maps?q=${job.helper_current_location}&z=15`;
                window.open(mapsUrl, '_blank');
              } else {
                alert('Helper location not available yet. Please try again in a moment.');
              }
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all transform hover:scale-105"
          >
            🔍 Track Helper
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        {/* Abort Button - Available for both users on active jobs */}
        {['accepted', 'helper_on_way', 'helper_arrived', 'in_progress', 'payment_pending'].includes(job.status) && 
         (job.elderly_id === user.id || job.helper_id === user.id) && (
          <button
            onClick={() => setShowAbortConfirm(true)}
            disabled={loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
          >
            ❌ Abort Job
          </button>
        )}
        
        <div className="flex justify-end">
          {renderActionButtons()}
        </div>
      </div>

      {/* Payment Status Indicators */}
      {job.status === 'payment_pending' && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className={`p-3 rounded-lg text-center ${
            job.payment_confirmed_by_elderly 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {job.payment_confirmed_by_elderly ? '✅' : '⏳'} Elderly Payment
          </div>
          <div className={`p-3 rounded-lg text-center ${
            job.payment_confirmed_by_helper 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {job.payment_confirmed_by_helper ? '✅' : '⏳'} Helper Payment
          </div>
        </div>
      )}

      {/* Popup Component */}
      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        redirectTo={popupConfig.redirectTo}
        autoClose={popupConfig.autoClose !== false}
      />

      {/* Abort Confirmation Modal */}
      {showAbortConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Abort Job</h3>
            <p className="text-slate-400 mb-6 text-center">
              Are you sure you want to abort this job? This action cannot be undone and the job will be removed from both participants.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Reason for aborting (Optional)
                </label>
                <textarea
                  value={abortReason}
                  onChange={(e) => setAbortReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-red-500 resize-none"
                  rows="3"
                  maxLength="200"
                />
                <p className="text-slate-400 text-xs mt-1">{abortReason.length}/200 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAbortConfirm(false);
                    setAbortReason('');
                  }}
                  className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={abortJob}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Aborting...' : 'Abort Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
