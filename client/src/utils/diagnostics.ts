import apiService from '../services/api';

export const runDiagnostics = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    }>
  };

  // Test 1: Basic API connectivity
  try {
    await apiService.healthCheck();
    results.tests.push({
      name: 'API Health Check',
      status: 'pass',
      message: 'API is responding'
    });
  } catch (error: any) {
    results.tests.push({
      name: 'API Health Check',
      status: 'fail',
      message: `API health check failed: ${error.message}`,
      details: error
    });
  }

  // Test 2: Games service health
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/games/health`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      results.tests.push({
        name: 'Games Service Health',
        status: 'pass',
        message: 'Games service is healthy',
        details: data
      });
      
      // Additional check for user progress
      if (!data.stats?.userHasProgress) {
        results.tests.push({
          name: 'User GameProgress',
          status: 'warning',
          message: 'User does not have GameProgress record - this might cause leaderboard issues'
        });
      } else {
        results.tests.push({
          name: 'User GameProgress',
          status: 'pass',
          message: 'User has GameProgress record'
        });
      }
    } else {
      results.tests.push({
        name: 'Games Service Health',
        status: 'fail',
        message: `Games service health check failed: ${response.status} ${response.statusText}`
      });
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Games Service Health',
      status: 'fail',
      message: `Games service health check error: ${error.message}`,
      details: error
    });
  }

  // Test 3: Leaderboard endpoint
  try {
    const { leaderboard } = await apiService.getGameLeaderboard('weekly');
    results.tests.push({
      name: 'Leaderboard API',
      status: 'pass',
      message: `Leaderboard loaded successfully with ${leaderboard.entries?.length || 0} entries`,
      details: { entriesCount: leaderboard.entries?.length || 0 }
    });
  } catch (error: any) {
    results.tests.push({
      name: 'Leaderboard API',
      status: 'fail',
      message: `Leaderboard failed: ${error.message}`,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    });
  }

  // Test 4: Game progress endpoint
  try {
    const { progress } = await apiService.getGameProgress();
    results.tests.push({
      name: 'Game Progress API',
      status: 'pass',
      message: 'Game progress loaded successfully',
      details: progress
    });
  } catch (error: any) {
    results.tests.push({
      name: 'Game Progress API',
      status: 'fail',
      message: `Game progress failed: ${error.message}`,
      details: error
    });
  }

  return results;
};

export const logDiagnostics = async () => {
  console.log('🔍 Running diagnostics...');
  const results = await runDiagnostics();
  
  console.log('📊 Diagnostic Results:', results);
  
  const passedTests = results.tests.filter(t => t.status === 'pass').length;
  const failedTests = results.tests.filter(t => t.status === 'fail').length;
  const warningTests = results.tests.filter(t => t.status === 'warning').length;
  
  console.log(`✅ Passed: ${passedTests}, ❌ Failed: ${failedTests}, ⚠️ Warnings: ${warningTests}`);
  
  if (failedTests > 0) {
    console.log('❌ Failed tests:');
    results.tests.filter(t => t.status === 'fail').forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
      if (test.details) {
        console.log('    Details:', test.details);
      }
    });
  }
  
  return results;
};