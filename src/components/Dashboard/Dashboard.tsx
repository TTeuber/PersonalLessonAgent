import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Book } from 'lucide-react';
import { Header } from '../Shared/Header';
import { Button } from '../Shared/Button';
import { ThemeToggle } from '../Shared/ThemeToggle';
import { InterviewFormFlow } from '../CourseCreation/InterviewFormFlow';
import { GenerationProgress } from '../CourseCreation/GenerationProgress';
import { ContextManager } from '../../services/storage/ContextManager';
import { fileSystemService } from '../../services/storage/FileSystemService';
import { InterviewAgent } from '../../services/agents/InterviewAgent';
import { toKebabCase } from '../../services/storage/DataPaths';
import { SUBJECT_INITIAL_QUESTIONS } from '../../services/agents/InitialQuestions';
import type { SubjectContext, UserContext, HierarchicalContext } from '../../types/context';

type CreationStep = 'idle' | 'interview' | 'saving';

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
  const [creationStep, setCreationStep] = useState<CreationStep>('idle');

  // Interview state
  const [interviewAgent, setInterviewAgent] = useState<InterviewAgent | null>(null);
  const [interviewContext, setInterviewContext] = useState<Partial<HierarchicalContext> | null>(null);

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

  const handleNewSubject = async () => {
    try {
      setCreationStep('interview');

      // Load user context for the interview
      const context = await contextManager.loadHierarchicalContext();
      setInterviewContext(context);

      // Create interview agent
      const agent = new InterviewAgent('subject');
      setInterviewAgent(agent);
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Error starting interview. Please try again.');
      setCreationStep('idle');
    }
  };

  const handleInterviewComplete = async () => {
    if (!interviewAgent) return;

    const result = interviewAgent.getInterviewResult();
    if (result && 'subjectName' in result) {
      await saveSubject(result.subjectName, result.subjectContext);
    }
  };

  const saveSubject = async (name: string, subjectContext: Record<string, unknown>) => {
    setCreationStep('saving');

    try {
      const subjectId = toKebabCase(name);

      // Check if subject already exists
      const exists = await fileSystemService.exists(`${subjectId}/subject-context.json`);
      if (exists) {
        alert('A subject with this name already exists');
        setCreationStep('idle');
        return;
      }

      // Create subject context
      const fullSubjectContext: SubjectContext = {
        subjectName: name,
        subjectId,
        createdAt: new Date().toISOString(),
        ...subjectContext,
      };

      // Create subject directory
      await fileSystemService.createDirectory(subjectId);

      // Save subject context
      await contextManager.saveContext('subject', fullSubjectContext, subjectId);

      // Reset state and reload
      setCreationStep('idle');
      setInterviewAgent(null);
      setInterviewContext(null);
      await loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Error saving subject. Please try again.');
      setCreationStep('idle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show subject creation flow
  if (creationStep !== 'idle') {
    if (creationStep === 'interview' && interviewAgent && interviewContext) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          <Header
            title="Create New Subject"
            onBack={() => setCreationStep('idle')}
          />
          <div className="flex-1">
            <InterviewFormFlow
              title="Subject Interview"
              description="Answer a few questions to help me understand what you want to learn"
              initialQuestions={SUBJECT_INITIAL_QUESTIONS}
              agent={interviewAgent}
              context={interviewContext}
              onComplete={handleInterviewComplete}
              completionMessage="Thank you for providing all the information. Creating your subject..."
              interviewType="subject"
            />
          </div>
        </div>
      );
    }

    if (creationStep === 'saving') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <GenerationProgress step="saving" message="Creating your subject..." />
        </div>
      );
    }
  }

  // Main dashboard view
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
        {subjects.length === 0 ? (
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
    </div>
  );
}
