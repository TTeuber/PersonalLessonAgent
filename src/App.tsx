import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProfileSetup } from './components/Setup/UserProfileSetup';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SubjectView } from './components/SubjectView/SubjectView';
import { CourseView } from './components/CourseView/CourseView';
import { ModuleView } from './components/ModuleView/ModuleView';
import { useUserContext } from './hooks/useUserContext';

function App() {
  const { userContext, loading, saveUserContext } = useUserContext();

  // Show loading spinner while checking for user context
  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // If no user context, show setup screen
  if (!userContext) {
    return (
      <ThemeProvider>
        <UserProfileSetup
          onComplete={async (context) => {
            await saveUserContext(context);
          }}
        />
      </ThemeProvider>
    );
  }

  // User context exists, show main app with routing
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard userContext={userContext} />} />
          <Route path="/subject/:subjectId" element={<SubjectView />} />
          <Route path="/subject/:subjectId/course/:courseId" element={<CourseView />} />
          <Route path="/subject/:subjectId/course/:courseId/module/:moduleId" element={<ModuleView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
