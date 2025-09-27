import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateJobHistory() {
  console.log('🔍 Checking for completed jobs...');
  
  try {
    // First, let's see what jobs exist and their statuses
    const { data: allJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return;
    }

    console.log(`📊 Found ${allJobs?.length || 0} total jobs`);
    
    // Group jobs by status
    const jobsByStatus = {};
    allJobs?.forEach(job => {
      if (!jobsByStatus[job.status]) {
        jobsByStatus[job.status] = [];
      }
      jobsByStatus[job.status].push(job);
    });

    console.log('📈 Jobs by status:');
    Object.entries(jobsByStatus).forEach(([status, jobs]) => {
      console.log(`  ${status}: ${jobs.length} jobs`);
    });

    // Check current job history
    const { data: historyJobs, error: historyError } = await supabase
      .from('job_history')
      .select('*');

    if (historyError) {
      console.error('Error fetching job history:', historyError);
      return;
    }

    console.log(`📚 Current job history entries: ${historyJobs?.length || 0}`);

    // Find completed jobs that aren't in history yet
    const completedStatuses = ['completed', 'fully_completed'];
    const completedJobs = allJobs?.filter(job => 
      completedStatuses.includes(job.status)
    ) || [];

    console.log(`✅ Found ${completedJobs.length} completed jobs`);

    if (completedJobs.length === 0) {
      console.log('ℹ️  No completed jobs found. Creating a sample completed job for testing...');
      
      // Create a sample completed job for testing
      const sampleJob = {
        title: 'Sample Grocery Shopping',
        description: 'Help with weekly grocery shopping',
        category: 'shopping',
        urgency: 'medium',
        location: '123 Main St, City',
        estimated_duration: '2 hours',
        payment_amount: 25.00,
        status: 'fully_completed',
        elderly_id: '00000000-0000-0000-0000-000000000001', // Placeholder
        helper_id: '00000000-0000-0000-0000-000000000002', // Placeholder
        job_started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        job_ended_at: new Date().toISOString(),
        helper_arrived_at: new Date(Date.now() - 3900000).toISOString() // 65 minutes ago
      };

      console.log('⚠️  Note: This is a sample job with placeholder IDs. In a real scenario, you would have actual user IDs.');
      return;
    }

    // For each completed job not in history, manually add it
    for (const job of completedJobs) {
      // Check if this job is already in history
      const existingHistory = historyJobs?.find(h => h.job_id === job.id);
      if (existingHistory) {
        console.log(`⏭️  Job "${job.title}" already in history, skipping`);
        continue;
      }

      console.log(`📝 Adding job "${job.title}" to history...`);

      // Get user names
      const { data: elderlyProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', job.elderly_id)
        .single();

      const { data: helperProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', job.helper_id)
        .single();

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
      const { error: insertError } = await supabase
        .from('job_history')
        .insert({
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
        });

      if (insertError) {
        console.error(`❌ Error adding job "${job.title}" to history:`, insertError);
      } else {
        console.log(`✅ Successfully added job "${job.title}" to history`);
      }
    }

    // Final check
    const { data: finalHistory } = await supabase
      .from('job_history')
      .select('*');

    console.log(`🎉 Job history now contains ${finalHistory?.length || 0} entries`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
populateJobHistory().then(() => {
  console.log('✨ Script completed');
  process.exit(0);
});
