/**
 * InterviewFormFlow Component
 * Manages multi-step form-based interview process
 */

import { useState } from 'react';
import { CheckCircle, Save } from 'lucide-react';
import { InterviewForm } from './InterviewForm';
import { InterviewStorage } from '../../services/storage/InterviewStorage';
import type { Question } from '../../services/agents/InitialQuestions';
import type { InterviewAgent } from '../../services/agents/InterviewAgent';
import type { HierarchicalContext } from '../../types/context';
import type { SavedInterviewState } from '../../services/storage/InterviewStorage';

interface InterviewFormFlowProps {
  title: string;
  description?: string;
  initialQuestions: Question[];
  agent: InterviewAgent;
  context: Partial<HierarchicalContext>;
  onComplete: () => void;
  completionMessage?: string;
  subjectId?: string;
  interviewType: 'subject' | 'course';
  savedState?: SavedInterviewState | null;
}

type FlowStep = 'initial' | 'followup' | 'complete';

/**
 * Form-based interview flow component
 */
export function InterviewFormFlow({
  title,
  description,
  initialQuestions,
  agent,
  context,
  onComplete,
  completionMessage = 'Thank you for providing all the information. Let me design your course...',
  subjectId,
  interviewType,
  savedState = null,
}: InterviewFormFlowProps) {
  // Initialize state from savedState if provided, otherwise use defaults
  const [currentStep, setCurrentStep] = useState<FlowStep>(savedState?.currentStep || 'initial');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(
    savedState?.followUpQuestions || initialQuestions
  );
  const [isLoading, setIsLoading] = useState(false);
  const [stepNumber, setStepNumber] = useState(savedState?.stepNumber || 1);
  const [allAnswers, setAllAnswers] = useState<Record<string, string>>(savedState?.allAnswers || {});
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(savedState?.timestamp || null);

  const handleFormSubmit = async (answers: Record<string, string>) => {
    setIsLoading(true);

    // Merge answers with previous answers
    const mergedAnswers = { ...allAnswers, ...answers };
    setAllAnswers(mergedAnswers);

    try {
      // Process answers with the agent
      const isComplete = await agent.processAnswers(mergedAnswers, context);

      if (isComplete) {
        // Interview is complete
        setCurrentStep('complete');

        // Save final state before completing (only if subjectId is provided)
        if (subjectId) {
          const interviewResult = agent.getInterviewResult();
          InterviewStorage.save(subjectId, {
            type: interviewType,
            subjectId,
            allAnswers: mergedAnswers,
            courseName: interviewResult && 'courseName' in interviewResult ? interviewResult.courseName : undefined,
            courseContext: interviewResult && 'courseContext' in interviewResult ? interviewResult.courseContext : undefined,
            currentStep: 'complete',
            stepNumber,
            followUpQuestions: undefined,
          });
          setLastSaveTime(new Date().toISOString());
        }

        // Wait a moment to show completion state, then notify parent
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        // Check for follow-up questions
        const followUpQuestions = agent.getFollowUpQuestions();

        if (followUpQuestions && followUpQuestions.length > 0) {
          // Show follow-up questions
          const newStep = stepNumber + 1;
          setCurrentQuestions(followUpQuestions);
          setCurrentStep('followup');
          setStepNumber(newStep);

          // Auto-save state (only if subjectId is provided)
          if (subjectId) {
            InterviewStorage.save(subjectId, {
              type: interviewType,
              subjectId,
              allAnswers: mergedAnswers,
              currentStep: 'followup',
              stepNumber: newStep,
              followUpQuestions,
            });
            setLastSaveTime(new Date().toISOString());
          }
        } else {
          // No follow-up questions but not complete - this shouldn't happen
          // Default to completing the interview
          setCurrentStep('complete');
          setTimeout(() => {
            onComplete();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error processing interview answers:', error);
      alert('Error processing your answers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          {lastSaveTime && currentStep !== 'complete' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Save className="w-4 h-4" />
              <span>
                Draft saved {InterviewStorage.getTimeAgo(lastSaveTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {currentStep === 'complete' ? (
            // Completion state
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Interview Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {completionMessage}
              </p>
            </div>
          ) : (
            // Form step
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {currentStep === 'initial' ? 'Tell me about your course' : 'A few more questions'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStep === 'initial'
                    ? 'Please answer the following questions to help me understand what you want to learn.'
                    : 'Based on your answers, I need a bit more information to design the perfect course for you.'}
                </p>
              </div>

              <InterviewForm
                questions={currentQuestions}
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                currentStep={stepNumber}
                totalSteps={stepNumber + (currentStep === 'followup' ? 0 : 1)} // Estimate total steps
                submitButtonText={isLoading ? 'Processing...' : 'Continue'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
