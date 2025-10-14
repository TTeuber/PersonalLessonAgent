/**
 * InterviewForm Component
 * Renders a form based on an array of questions
 */

import { useState, type FormEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../Shared/Button';
import type { Question } from '../../services/agents/InitialQuestions';

interface InterviewFormProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading?: boolean;
  currentStep?: number;
  totalSteps?: number;
  submitButtonText?: string;
}

/**
 * Form component for interview questions
 */
export function InterviewForm({
  questions,
  onSubmit,
  isLoading = false,
  currentStep,
  totalSteps,
  submitButtonText = 'Continue',
}: InterviewFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    questions.forEach((q) => {
      initial[q.id] = '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    questions.forEach((question) => {
      if (question.required && !answers[question.id]?.trim()) {
        newErrors[question.id] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator */}
      {currentStep !== undefined && totalSteps !== undefined && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((question) => (
        <div key={question.id}>
          <label
            htmlFor={question.id}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {question.label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {question.type === 'text' && (
            <input
              type="text"
              id={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors[question.id] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}

          {question.type === 'textarea' && (
            <textarea
              id={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              disabled={isLoading}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none ${
                errors[question.id] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}

          {question.type === 'select' && question.options && (
            <select
              id={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors[question.id] ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select an option...</option>
              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {/* Help text */}
          {question.helpText && !errors[question.id] && (
            <p className="mt-1 text-sm text-gray-500">{question.helpText}</p>
          )}

          {/* Error message */}
          {errors[question.id] && (
            <p className="mt-1 text-sm text-red-600">{errors[question.id]}</p>
          )}
        </div>
      ))}

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              {submitButtonText}
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
