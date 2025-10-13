import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadQuizQuestions();
  }, [module.questionsPath]);

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

  const renderQuestion = (question: QuizQuestion, index: number) => {
    const userAnswer = answers.get(index) || '';
    const isCorrect = submitted && userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    const isIncorrect = submitted && userAnswer.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase();

    return (
      <div
        key={index}
        className={`bg-white border rounded-lg p-6 ${
          submitted ? (isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-gray-200'
        }`}
      >
        {/* Question Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm">
            {index + 1}
          </div>
          <div className="flex-1">
            <p className="text-lg font-medium text-gray-900">{question.question}</p>
            <p className="text-sm text-gray-500 mt-1">
              Type: {question.type.replace('-', ' ')}
            </p>
          </div>
          {submitted && (
            <div>
              {isCorrect ? (
                <div className="flex items-center gap-1 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Correct</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-700">
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
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={userAnswer === option}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : question.type === 'code-completion' ? (
              <textarea
                value={userAnswer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your code here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={6}
              />
            ) : (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        )}

        {/* Show Answer and Explanation After Submission */}
        {submitted && (
          <div className="mt-4 space-y-3">
            {isIncorrect && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Correct Answer:</p>
                <p className="text-sm text-blue-800 font-mono">{question.correctAnswer}</p>
              </div>
            )}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Explanation:</p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Quiz Content - Left Side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Course</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
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
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
                <p className="text-sm text-gray-500 mt-1">Quiz #{module.order}</p>
              </div>
            </div>

            {/* Score Display */}
            {submitted && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 mb-2">Quiz Complete!</p>
                  <p className="text-4xl font-bold text-blue-600 mb-2">
                    {score} / {questions.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round((score / questions.length) * 100)}% correct
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading quiz...</p>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No questions found for this quiz.</p>
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

      {/* AI Tutor Chat - Right Side */}
      {showChat && (
        <div className="w-96 border-l bg-gray-50 flex flex-col">
          <div className="p-4 bg-white border-b flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">AI Tutor</h2>
          </div>
          <AITutorChat
            context={context}
            moduleContent={submitted ? `Quiz completed. Score: ${score}/${questions.length}` : 'Quiz in progress'}
          />
        </div>
      )}
    </div>
  );
}
