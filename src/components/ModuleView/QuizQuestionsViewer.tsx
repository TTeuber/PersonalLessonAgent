import type { QuizQuestion } from '../../types/module';

interface QuizQuestionsViewerProps {
  questions: QuizQuestion[];
}

export function QuizQuestionsViewer({ questions }: QuizQuestionsViewerProps) {
  const renderQuestion = (question: QuizQuestion, index: number) => {
    return (
      <div
        key={index}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
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
        </div>

        {/* Options (for multiple choice) */}
        {question.type === 'multiple-choice' && question.options && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options:</p>
            {question.options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  option === question.correctAnswer
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
                {option === question.correctAnswer && (
                  <span className="ml-auto text-xs font-medium text-green-700 dark:text-green-400">
                    ✓ Correct
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Correct Answer (for non-multiple-choice) */}
        {question.type !== 'multiple-choice' && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">Correct Answer:</p>
            <p className="text-sm text-green-800 dark:text-green-300 font-mono">{question.correctAnswer}</p>
          </div>
        )}

        {/* Explanation */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Explanation:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{question.explanation}</p>
        </div>
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No questions found in this file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Quiz Questions ({questions.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Read-only view of quiz questions with answers and explanations
        </p>
      </div>
      {questions.map((question, index) => renderQuestion(question, index))}
    </div>
  );
}
