import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle, MessageSquare, ClipboardList, Check, X } from 'lucide-react';
import type { Quiz, QuizQuestion } from '../../types/module';
import type { HierarchicalContext } from '../../types/context';
import { AITutorChat } from './AITutorChat';
import { FileSystemService } from '../../services/storage/FileSystemService';

interface QuizViewProps {
  module: Quiz;
  context: HierarchicalContext;
  onComplete: () => void;
  onBack: () => void;
}

export function QuizView({ module, context, onComplete, onBack }: QuizViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [chatWidth, setChatWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadQuizQuestions();
  }, [module.questionsPath]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      // Constrain width between 300px and 800px
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      setChatWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const loadQuizQuestions = async () => {
    try {
      setLoading(true);
      const fs = new FileSystemService();
      const questionsData = await fs.readJSON<{ questions: QuizQuestion[] }>(module.questionsPath);
      setQuestions(questionsData.questions || []);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionIndex, answer);
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.size < questions.length) {
      if (!confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers.get(index)?.trim().toLowerCase() || '';
      const correctAnswer = question.correctAnswer.trim().toLowerCase();

      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);
  };

  const handleMarkComplete = () => {
    if (confirm('Mark this quiz as complete?')) {
      onComplete();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const renderQuestion = (question: QuizQuestion, index: number) => {
    const userAnswer = answers.get(index) || '';
    const isCorrect = submitted && userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    const isIncorrect = submitted && userAnswer.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase();

    return (
      <div
        key={index}
        className={`bg-white dark:bg-gray-800 border rounded-lg p-6 ${
          submitted ? (isCorrect ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20') : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        {/* Question Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold flex items-center justify-center text-sm">
            {index + 1}
          </div>
          <div className="flex-1">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{question.question}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Type: {question.type.replace('-', ' ')}
            </p>
          </div>
          {submitted && (
            <div>
              {isCorrect ? (
                <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Correct</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                  <X className="w-5 h-5" />
                  <span className="text-sm font-medium">Incorrect</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Answer Input */}
        {!submitted && (
          <div className="mb-4">
            {question.type === 'multiple-choice' && question.options ? (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={userAnswer === option}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            ) : question.type === 'code-completion' ? (
              <textarea
                value={userAnswer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your code here..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={6}
              />
            ) : (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        )}

        {/* Show Answer and Explanation After Submission */}
        {submitted && (
          <div className="mt-4 space-y-3">
            {isIncorrect && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Correct Answer:</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-mono">{question.correctAnswer}</p>
              </div>
            )}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Explanation:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Quiz Content - Left Side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Course</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showChat ? 'Hide' : 'Show'} Tutor</span>
            </button>
            {submitted && !module.completed && (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}
            {module.completed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ClipboardList className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{module.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quiz #{module.order}</p>
              </div>
            </div>

            {/* Score Display */}
            {submitted && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Quiz Complete!</p>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {score} / {questions.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round((score / questions.length) * 100)}% correct
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No questions found for this quiz.</p>
              </div>
            ) : (
              <>
                {/* Questions */}
                <div className="space-y-6">
                  {questions.map((question, index) => renderQuestion(question, index))}
                </div>

                {/* Submit Button */}
                {!submitted && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleSubmit}
                      disabled={answers.size === 0}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Submit Quiz
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Tutor Chat - Right Side with Resize Handle */}
      {showChat && (
        <>
          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-ew-resize transition-colors flex-shrink-0"
            style={{ touchAction: 'none' }}
          />

          {/* Chat Panel */}
          <div
            className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col flex-shrink-0"
            style={{ width: `${chatWidth}px` }}
          >
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">AI Tutor</h2>
            </div>
            <AITutorChat
              context={context}
              moduleContent={submitted ? `Quiz completed. Score: ${score}/${questions.length}` : 'Quiz in progress'}
            />
          </div>
        </>
      )}
    </div>
  );
}
