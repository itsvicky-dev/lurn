// Debug helper functions for testing the fixes
export const debugPlaygroundContext = () => {
  const playgrounds = JSON.parse(localStorage.getItem('playgrounds_user_id') || '[]');
  console.log('🔧 Playground Debug:', {
    playgroundCount: playgrounds.length,
    playgrounds: playgrounds.map((p: any) => ({
      id: p.id,
      name: p.name,
      language: p.language,
      codeLength: p.code?.length || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))
  });
  return playgrounds;
};

export const debugLearningPaths = (learningPaths: any[]) => {
  console.log('📚 Learning Paths Debug:', {
    totalPaths: learningPaths.length,
    paths: learningPaths.map(path => ({
      id: path.id,
      title: path.title,
      status: path.status,
      difficulty: path.difficulty,
      progress: path.progress?.percentageComplete || 0,
      modulesCount: path.modules?.length || 0,
      firstModuleStatus: path.modules?.[0]?.status || 'none',
      hasAvailableModules: path.modules?.some((m: any) => m.status === 'available' || m.status === 'in_progress')
    }))
  });
  return learningPaths;
};

export const debugDashboardState = (playgrounds: any[], learningPaths: any[]) => {
  const activePaths = learningPaths.filter(path => 
    path.status === 'in_progress' || 
    (path.status === 'not_started' && path.progress && path.progress.percentageComplete > 0) ||
    (path.modules && path.modules.some((module: any) => 
      module.status === 'available' || 
      module.status === 'in_progress' || 
      module.status === 'completed'
    ))
  );

  console.log('🏠 Dashboard Debug:', {
    playgroundCount: playgrounds.length,
    totalLearningPaths: learningPaths.length,
    activeLearningPaths: activePaths.length,
    activePathTitles: activePaths.map(p => p.title),
    allPathStatuses: learningPaths.map(p => ({ title: p.title, status: p.status, difficulty: p.difficulty }))
  });

  return {
    playgroundCount: playgrounds.length,
    activeLearningPaths: activePaths.length,
    issues: {
      noPlaygrounds: playgrounds.length === 0,
      noActivePaths: activePaths.length === 0,
      allPathsLocked: learningPaths.every(p => p.modules?.every((m: any) => m.status === 'locked')),
      allPathsBeginner: learningPaths.every(p => p.difficulty === 'beginner')
    }
  };
};

// Add this to window for easy debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAITutor = {
    debugPlaygroundContext,
    debugLearningPaths,
    debugDashboardState
  };
}