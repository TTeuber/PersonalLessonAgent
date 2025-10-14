/**
 * SubjectView Component
 * Displays all courses for a subject with ability to create new courses
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, GraduationCap, AlertCircle } from 'lucide-react';
import { Header } from '../Shared/Header';
import { Button } from '../Shared/Button';
import { CourseCard } from './CourseCard';
import { InterviewFormFlow } from '../CourseCreation/InterviewFormFlow';
import { CoursePlanReview } from '../CourseCreation/CoursePlanReview';
import { GenerationProgress } from '../CourseCreation/GenerationProgress';
import { ContextManager } from '../../services/storage/ContextManager';
import { fileSystemService } from '../../services/storage/FileSystemService';
import { InterviewAgent } from '../../services/agents/InterviewAgent';
import { CourseDesignerAgent } from '../../services/agents/CourseDesignerAgent';
import { toKebabCase } from '../../services/storage/DataPaths';
import { COURSE_INITIAL_QUESTIONS } from '../../services/agents/InitialQuestions';
import { InterviewStorage } from '../../services/storage/InterviewStorage';
import type { Course } from '../../types/course';
import type { SubjectContext, CourseContext, HierarchicalContext } from '../../types/context';
import type { Module } from '../../types/module';
import type { SavedInterviewState } from '../../services/storage/InterviewStorage';

type CreationStep = 'idle' | 'interview' | 'review' | 'saving';

/**
 * SubjectView component
 */
export function SubjectView() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<SubjectContext | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creationStep, setCreationStep] = useState<CreationStep>('idle');

  // Interview state
  const [interviewAgent, setInterviewAgent] = useState<InterviewAgent | null>(null);
  const [interviewContext, setInterviewContext] = useState<Partial<HierarchicalContext> | null>(null);
  const [savedInterviewState, setSavedInterviewState] = useState<SavedInterviewState | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Course design state
  const [courseName, setCourseName] = useState('');
  const [courseOutline, setCourseOutline] = useState<any>(null);

  const contextManager = new ContextManager(fileSystemService);

  // Helper function to force create course from saved draft
  const forceCreateFromDraft = async () => {
    if (!subjectId) {
      console.error('[ForceCreate] No subjectId available');
      return;
    }

    const saved = InterviewStorage.load(subjectId);
    if (!saved || saved.type !== 'course') {
      console.error('[ForceCreate] No saved course interview found');
      alert('No saved course interview found for this subject');
      return;
    }

    if (!saved.courseName || !saved.courseContext) {
      console.error('[ForceCreate] Saved state is missing courseName or courseContext');
      alert('Saved interview data is incomplete');
      return;
    }

    console.log('[ForceCreate] Found saved state:', saved);
    console.log('[ForceCreate] Creating course:', saved.courseName);

    try {
      // Close any modal
      setShowResumeModal(false);

      // Set the course name state so handleApproveCourse can access it
      setCourseName(saved.courseName);

      // Directly call designCourse with saved data
      await designCourse(saved.courseName, saved.courseContext);
    } catch (error) {
      console.error('[ForceCreate] Error:', error);
      alert(`Error creating course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (subjectId) {
      loadSubjectAndCourses();
    }
  }, [subjectId]);

  // Expose forceCreateFromDraft to window for console access
  useEffect(() => {
    if (subjectId && typeof window !== 'undefined') {
      (window as any).forceCreateCourse = forceCreateFromDraft;
      console.log('[SubjectView] Force create function available: window.forceCreateCourse()');

      return () => {
        delete (window as any).forceCreateCourse;
      };
    }
  }, [subjectId]);

  const loadSubjectAndCourses = async () => {
    if (!subjectId) return;

    try {
      setLoading(true);
      const context = await contextManager.loadHierarchicalContext(subjectId);
      if (context.subject) {
        setSubject(context.subject);
      }

      const loadedCourses = await contextManager.loadAllCourses(subjectId);
      setCourses(loadedCourses);

      // Check for saved interview state
      if (InterviewStorage.has(subjectId)) {
        const saved = InterviewStorage.load(subjectId);
        if (saved && saved.type === 'course') {
          setSavedInterviewState(saved);
          setShowResumeModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading subject and courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCourse = async () => {
    if (!subjectId) return;

    // Check if there's a saved draft
    if (InterviewStorage.has(subjectId)) {
      const saved = InterviewStorage.load(subjectId);
      if (saved && saved.type === 'course') {
        setSavedInterviewState(saved);
        setShowResumeModal(true);
        return;
      }
    }

    // Start new interview
    await startNewInterview();
  };

  const startNewInterview = async () => {
    if (!subjectId) return;

    try {
      setCreationStep('interview');

      // Load context for the interview
      const context = await contextManager.loadHierarchicalContext(subjectId);
      setInterviewContext(context);

      // Create interview agent
      const agent = new InterviewAgent('course');
      setInterviewAgent(agent);
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Error starting interview. Please try again.');
      setCreationStep('idle');
    }
  };

  const handleResumeInterview = async () => {
    if (!subjectId || !savedInterviewState) return;

    try {
      setShowResumeModal(false);
      setCreationStep('interview');

      // Load context for the interview
      const context = await contextManager.loadHierarchicalContext(subjectId);
      setInterviewContext(context);

      // Create interview agent and restore its state
      const agent = new InterviewAgent('course');

      // Restore agent state from saved data
      // The agent will need to reprocess the answers to restore its internal state
      await agent.processAnswers(savedInterviewState.allAnswers, context);

      setInterviewAgent(agent);
    } catch (error) {
      console.error('Error resuming interview:', error);
      alert('Error resuming interview. Please try again.');
      setCreationStep('idle');
      setShowResumeModal(false);
    }
  };

  const handleStartFresh = () => {
    if (!subjectId) return;

    // Clear saved state
    InterviewStorage.clear(subjectId);
    setSavedInterviewState(null);
    setShowResumeModal(false);

    // Start new interview
    startNewInterview();
  };

  const handleInterviewComplete = async () => {
    if (!interviewAgent || !subjectId) return;

    const result = interviewAgent.getInterviewResult();
    if (result && 'courseName' in result) {
      setCourseName(result.courseName);
      // Move to course design
      await designCourse(result.courseName, result.courseContext);
    }
  };

  const designCourse = async (name: string, courseContext: Record<string, unknown>) => {
    if (!subjectId) return;

    setCreationStep('review');

    try {
      const context = await contextManager.loadHierarchicalContext(subjectId);
      // Add course context to the hierarchical context
      context.course = {
        courseName: name,
        courseId: toKebabCase(name),
        ...courseContext,
      } as CourseContext;

      console.log('Course context for designer:', context);

      // Build detailed user message with interview data
      let userMessage = `I have completed an interview with a learner. Here are the interview results:\n\n`;

      userMessage += `## Course Details:\n`;
      userMessage += `- **Course Name:** ${name}\n`;
      userMessage += `- **Subject:** ${context.subject?.subjectName || 'Not specified'}\n\n`;

      userMessage += `## Interview Answers:\n`;
      if (courseContext && typeof courseContext === 'object') {
        Object.entries(courseContext).forEach(([key, value]) => {
          if (key !== 'createdAt' && key !== 'courseId') {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            const formattedValue = Array.isArray(value)
              ? value.join(', ')
              : typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : String(value);
            userMessage += `- **${formattedKey}:** ${formattedValue}\n`;
          }
        });
      }

      userMessage += `\n## Learner Profile:\n`;
      userMessage += `- **Learning Style:** ${context.user?.learningStylePreference || 'Not specified'}\n`;
      userMessage += `- **Preferred IDE:** ${context.user?.preferredIDE || 'Not specified'}\n`;

      if (context.subject) {
        userMessage += `\n## Subject Context:\n`;
        Object.entries(context.subject).forEach(([key, value]) => {
          if (key !== 'subjectId' && key !== 'subjectName' && key !== 'createdAt') {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            userMessage += `- **${formattedKey}:** ${value}\n`;
          }
        });
      }

      userMessage += `\n**Please design a comprehensive course structure with 5-10 modules based on this interview data.**`;

      console.log('User message for designer:', userMessage);

      const designer = new CourseDesignerAgent();
      const response = await designer.run(
        userMessage,
        context as any
      );

      console.log('Designer response:', response);

      const outline = designer.getCourseOutline();
      console.log('Course outline:', outline);

      if (outline) {
        setCourseOutline(outline);
      } else {
        throw new Error(
          `Failed to generate course outline. AI response: ${response.text}. ` +
          `Stop reason: ${response.stopReason}`
        );
      }
    } catch (error) {
      console.error('Error designing course:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error occurred';
      alert(`Error designing course: ${errorMessage}`);
      setCreationStep('idle');
    }
  };

  const handleApproveCourse = async () => {
    console.log('[ApproveCourse] Starting approval process');
    console.log('[ApproveCourse] subjectId:', subjectId);
    console.log('[ApproveCourse] courseName:', courseName);
    console.log('[ApproveCourse] courseOutline:', courseOutline);

    if (!subjectId || !courseName || !courseOutline) {
      console.error('[ApproveCourse] Missing required data:', { subjectId, courseName, hasOutline: !!courseOutline });
      alert('Missing required data to create course. Please try again.');
      return;
    }

    setCreationStep('saving');

    try {
      const courseId = toKebabCase(courseName);
      const interviewResult = interviewAgent?.getInterviewResult();

      // Create course context
      const baseContext = interviewResult && 'courseContext' in interviewResult
        ? interviewResult.courseContext
        : {};

      const courseContext: CourseContext = {
        courseName,
        courseId,
        createdAt: new Date().toISOString(),
        goal: (baseContext as any).goal || '',
        prerequisitesCovered: (baseContext as any).prerequisitesCovered || [],
        ...baseContext,
      };

      // Save course context
      await contextManager.saveCourseContext(subjectId, courseId, courseContext);

      // Create modules from outline
      const modules: Module[] = courseOutline.modules.map((m: any) => ({
        id: `${m.type}-${String(m.order + 1).padStart(2, '0')}-${toKebabCase(m.title)}`,
        type: m.type,
        title: m.title,
        completed: false,
        order: m.order,
        ...(m.type === 'lesson' && { contentPath: '' }),
        ...(m.type === 'exercise' && { descriptionPath: '', projectPath: '' }),
        ...(m.type === 'quiz' && { questionsPath: '' }),
      }));

      // Save modules
      await contextManager.saveCourseModules(subjectId, courseId, modules);

      // Clear saved interview state (course creation succeeded)
      if (subjectId) {
        InterviewStorage.clear(subjectId);
      }

      // Reset state and reload
      setCreationStep('idle');
      setInterviewAgent(null);
      setInterviewContext(null);
      setCourseOutline(null);
      setSavedInterviewState(null);
      await loadSubjectAndCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course. Please try again.');
      setCreationStep('idle');
    }
  };

  const handleRejectCourse = () => {
    setCreationStep('idle');
    setInterviewAgent(null);
    setInterviewContext(null);
    setCourseOutline(null);
  };

  const handleCourseClick = (course: Course) => {
    navigate(`/subject/${subjectId}/course/${course.courseId}`);
  };

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

  // Show course creation flow
  if (creationStep !== 'idle') {
    if (creationStep === 'interview' && interviewAgent && interviewContext && subjectId) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header
            title="Create New Course"
            onBack={() => setCreationStep('idle')}
          />
          <div className="flex-1">
            <InterviewFormFlow
              title="Course Interview"
              description="Answer a few questions to help me design the perfect course for you"
              initialQuestions={COURSE_INITIAL_QUESTIONS}
              agent={interviewAgent}
              context={interviewContext}
              onComplete={handleInterviewComplete}
              subjectId={subjectId}
              interviewType="course"
              savedState={savedInterviewState}
            />
          </div>
        </div>
      );
    }

    if (creationStep === 'review' && courseOutline) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header
            title="Review Course Plan"
            onBack={handleRejectCourse}
          />
          <div className="flex-1">
            <CoursePlanReview
              courseName={courseName}
              modules={courseOutline.modules}
              onApprove={handleApproveCourse}
              onReject={handleRejectCourse}
              isProcessing={false}
            />
          </div>
        </div>
      );
    }

    if (creationStep === 'saving') {
      return (
        <div className="min-h-screen bg-gray-50">
          <GenerationProgress step="saving" message="Saving your course..." />
        </div>
      );
    }
  }

  // Main subject view
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={subject?.subjectName || 'Subject'}
        onBack={() => navigate('/')}
        actions={
          <Button onClick={handleNewCourse}>
            <Plus className="w-5 h-5 mr-2" />
            New Course
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No courses yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first course to start learning {subject?.subjectName}
            </p>
            <Button onClick={handleNewCourse} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Course
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                onClick={() => handleCourseClick(course)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Resume Interview Modal */}
      {showResumeModal && savedInterviewState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Resume Previous Interview?
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  You have an unfinished course interview from{' '}
                  {InterviewStorage.getTimeAgo(savedInterviewState.timestamp)}.
                </p>
                {savedInterviewState.courseName && savedInterviewState.courseContext ? (
                  <p className="text-sm text-gray-500">
                    Course: <strong>{savedInterviewState.courseName}</strong>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 mt-6">
              {savedInterviewState.courseName && savedInterviewState.courseContext && (
                <Button
                  onClick={forceCreateFromDraft}
                  className="w-full"
                >
                  Create Course Now
                </Button>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={handleStartFresh}
                  variant="secondary"
                  className="flex-1"
                >
                  Start Fresh
                </Button>
                <Button
                  onClick={handleResumeInterview}
                  variant="outline"
                  className="flex-1"
                >
                  Resume Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
