// Test script to verify job completion flow and database trigger
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJobCompletion() {
  try {
    console.log('Testing job completion flow...');
    
    // 1. Check if there are any jobs in 'payment_pending' status
    const { data: pendingJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'payment_pending');
    
    console.log('Jobs in payment_pending status:', pendingJobs?.length || 0);
    
    // 2. Check if job_history table exists and has data
    const { data: historyJobs, error: historyError } = await supabase
      .from('job_history')
      .select('*')
      .limit(5);
    
    if (historyError) {
      console.error('Error accessing job_history table:', historyError);
    } else {
      console.log('Jobs in history table:', historyJobs?.length || 0);
      if (historyJobs?.length > 0) {
        console.log('Sample history job:', historyJobs[0]);
      }
    }
    
    // 3. Check if the trigger function exists
    const { data: functions } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'move_job_to_history');
    
    console.log('Trigger function exists:', functions?.length > 0);
    
    // 4. Check if the trigger exists
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'trigger_move_job_to_history');
    
    console.log('Trigger exists:', triggers?.length > 0);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testJobCompletion();
