import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Book } from 'lucide-react';
import { Header } from '../Shared/Header';
import { Button } from '../Shared/Button';
import { NewSubjectDialog } from './NewSubjectDialog';
import { ContextManager } from '../../services/storage/ContextManager';
import { fileSystemService } from '../../services/storage/FileSystemService';
import type { SubjectContext, UserContext } from '../../types/context';

interface DashboardProps {
  userContext: UserContext;
}

/**
 * Main dashboard showing all subjects
 */
export function Dashboard({ userContext }: DashboardProps) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);

  const contextManager = new ContextManager(fileSystemService);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const loadedSubjects = await contextManager.loadAllSubjects();
      setSubjects(loadedSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSubject = () => {
    setShowNewSubjectDialog(true);
  };

  const handleSubjectCreated = () => {
    setShowNewSubjectDialog(false);
    loadSubjects(); // Reload subjects list
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Welcome, ${userContext.name || 'Learner'}!`}
        actions={
          <Button onClick={handleNewSubject}>
            <Plus className="w-5 h-5 mr-2" />
            New Subject
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No subjects yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first subject to start your learning journey
            </p>
            <Button onClick={handleNewSubject} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Subject
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => navigate(`/subject/${subject.subjectId}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Book className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {subject.subjectName}
                </h3>
                <p className="text-sm text-gray-500">
                  Created {new Date(subject.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNewSubjectDialog && (
        <NewSubjectDialog
          onClose={() => setShowNewSubjectDialog(false)}
          onSuccess={handleSubjectCreated}
        />
      )}
    </div>
  );
}
