import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Feedback({ user, userRole, onNavigate }) {
  const { jobId } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId);
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    fetchPendingJobs();
    if (jobId) {
      setSelectedJobId(jobId);
      setShowRatingForm(true);
    }
  }, [jobId]);

  const fetchPendingJobs = async () => {
    try {
      // Get completed jobs where user hasn't given feedback yet
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          elderly:elderly_id(id, full_name, average_rating, total_ratings),
          helper:helper_id(id, full_name, average_rating, total_ratings)
        `)
        .eq('status', 'fully_completed')
        .or(userRole === 'elderly' ? `elderly_id.eq.${user.id}` : `helper_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      console.log('Fetched jobs:', jobs);

      if (jobsError) throw jobsError;

      // Filter out jobs where user has already given feedback
      const { data: existingRatings, error: ratingsError } = await supabase
        .from('ratings')
        .select('job_id')
        .eq('rater_id', user.id);

      if (ratingsError) throw ratingsError;

      const ratedJobIds = existingRatings.map(r => r.job_id);
      const pendingFeedbackJobs = jobs.filter(job => !ratedJobIds.includes(job.id));

      setPendingJobs(pendingFeedbackJobs);
    } catch (err) {
      console.error('Error fetching pending jobs:', err);
      setError('Failed to load jobs needing feedback');
    }
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get job details to find who to rate
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('elderly_id, helper_id')
        .eq('id', selectedJobId)
        .single();

      if (jobError) throw jobError;

      // Determine who is being rated
      const ratedUserId = userRole === 'elderly' ? jobData.helper_id : jobData.elderly_id;
      const raterUserId = user.id;

      // Insert rating
      const { error: ratingError } = await supabase
        .from('ratings')
        .insert({
          job_id: selectedJobId,
          rater_id: raterUserId,
          rated_user_id: ratedUserId,
          rating: rating,
          comment: comment.trim() || null
        });

      if (ratingError) throw ratingError;

      // Update the rated user's average rating and total ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_user_id', ratedUserId);

      if (ratingsError) throw ratingsError;

      console.log('All ratings for user:', ratingsData);

      const totalRatings = ratingsData.length;
      const averageRating = totalRatings > 0 ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;

      console.log('Calculated stats:', { totalRatings, averageRating: averageRating.toFixed(2), ratedUserId });

      // Update profile with new ratings using proper numeric formatting
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
          total_ratings: totalRatings
        })
        .eq('id', ratedUserId)
        .select('id, full_name, average_rating, total_ratings');

      console.log('Profile update result:', { updateData, updateError });

      if (updateError) {
        console.error('Profile update failed:', updateError);
        throw updateError;
      }

      if (updateData && updateData.length > 0) {
        console.log('Successfully updated profile:', updateData[0]);
      }

      // Reset form and refresh list
      setRating(0);
      setComment('');
      setShowRatingForm(false);
      setSelectedJobId(null);
      fetchPendingJobs(); // Refresh the list

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Force page refresh to update main menu ratings
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Feedback & Reviews</h2>
      </div>

      {success && (
        <div className="glass-success rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-400 font-medium">Feedback submitted successfully!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-error rounded-xl p-4 mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Jobs Needing Feedback */}
      <div className="space-y-4">
        {pendingJobs.length === 0 ? (
          <div className="glass-light rounded-xl p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-white font-medium mb-2">All Caught Up!</h3>
            <p className="text-slate-400 text-sm">You've provided feedback for all completed jobs. New feedback opportunities will appear here after job completion.</p>
          </div>
        ) : (
          pendingJobs.map((job) => (
            <div key={job.id} className="glass-light rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg mb-2">{job.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{job.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">💰 Payment:</span>
                      <span className="text-green-400 font-medium ml-2">${job.payment_amount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">📅 Completed:</span>
                      <span className="text-white ml-2">{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">👤 {userRole === 'elderly' ? 'Helper' : 'Elderly'}:</span>
                      <span className="text-white ml-2">
                        {userRole === 'elderly' ? job.helper?.full_name : job.elderly?.full_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">⭐ Their Rating:</span>
                      <span className="text-white ml-2">
                        {(() => {
                          const person = userRole === 'elderly' ? job.helper : job.elderly;
                          return person?.total_ratings > 0 
                            ? `${person.average_rating.toFixed(1)} (${person.total_ratings})`
                            : 'No ratings yet';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setShowRatingForm(true);
                    setRating(0);
                    setComment('');
                  }}
                  className="btn-primary rounded-xl px-6 py-2 font-medium"
                >
                  Give Feedback
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="glass rounded-2xl p-8 max-w-md w-full mt-4">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Rate Your Experience</h3>
            
            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-white font-medium mb-3">
                  How would you rate the {userRole === 'elderly' ? 'helper' : 'elderly person'}?
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-all duration-200 hover:scale-110 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-center text-slate-400 text-sm mt-2">
                  {rating === 0 && 'Click to rate'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  rows="4"
                  maxLength="500"
                />
                <p className="text-slate-400 text-xs mt-1">{comment.length}/500 characters</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRatingForm(false);
                    setRating(0);
                    setComment('');
                  }}
                  className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={loading || rating === 0}
                  className="flex-1 btn-primary rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
