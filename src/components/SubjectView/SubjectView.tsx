/**
 * SubjectView Component
 * Displays all courses for a subject with ability to create new courses
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, GraduationCap } from 'lucide-react';
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
import type { Course } from '../../types/course';
import type { SubjectContext, CourseContext, HierarchicalContext } from '../../types/context';
import type { Module } from '../../types/module';

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

  // Course design state
  const [courseName, setCourseName] = useState('');
  const [courseOutline, setCourseOutline] = useState<any>(null);

  const contextManager = new ContextManager(fileSystemService);

  useEffect(() => {
    if (subjectId) {
      loadSubjectAndCourses();
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
    } catch (error) {
      console.error('Error loading subject and courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCourse = async () => {
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

      const designer = new CourseDesignerAgent();
      await designer.run(
        'Design a course structure based on the interview.',
        context as any
      );

      const outline = designer.getCourseOutline();
      if (outline) {
        setCourseOutline(outline);
      } else {
        throw new Error('Failed to generate course outline');
      }
    } catch (error) {
      console.error('Error designing course:', error);
      alert('Error designing course. Please try again.');
      setCreationStep('idle');
    }
  };

  const handleApproveCourse = async () => {
    if (!subjectId || !courseName || !courseOutline) return;

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

      // Reset state and reload
      setCreationStep('idle');
      setInterviewAgent(null);
      setInterviewContext(null);
      setCourseOutline(null);
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
    if (creationStep === 'interview' && interviewAgent && interviewContext) {
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
    </div>
  );
}
