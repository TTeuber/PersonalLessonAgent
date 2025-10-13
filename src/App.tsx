import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProfileSetup } from './components/Setup/UserProfileSetup';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useUserContext } from './hooks/useUserContext';

function App() {
  const { userContext, loading, saveUserContext } = useUserContext();

  // Show loading spinner while checking for user context
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user context, show setup screen
  if (!userContext) {
    return (
      <UserProfileSetup
        onComplete={async (context) => {
          await saveUserContext(context);
        }}
      />
    );
  }

  // User context exists, show main app with routing
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard userContext={userContext} />} />
        {/* Placeholder routes for Phase 2+ */}
        <Route path="/subject/:subjectId" element={<div>Subject View (Coming in Phase 2)</div>} />
        <Route path="/subject/:subjectId/course/:courseId" element={<div>Course View (Coming in Phase 2)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
