import JobHistory from '../components/JobHistory';

export default function JobHistoryPage({ user, userRole }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Job History</h1>
        <div className="text-sm text-gray-400">
          View all your completed jobs and their details
        </div>
      </div>
      
      <JobHistory user={user} userRole={userRole} />
    </div>
  );
}
