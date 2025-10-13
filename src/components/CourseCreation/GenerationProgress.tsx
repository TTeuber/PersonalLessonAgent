/**
 * GenerationProgress Component
 * Displays progress indicator during AI generation
 */

import { Loader, CheckCircle } from 'lucide-react';

interface GenerationProgressProps {
  step: 'interview' | 'designing' | 'saving' | 'complete';
  message?: string;
}

/**
 * Step information
 */
const STEP_INFO = {
  interview: {
    label: 'Interviewing',
    description: 'Gathering information about your learning goals...',
  },
  designing: {
    label: 'Designing Course',
    description: 'Creating a personalized course structure...',
  },
  saving: {
    label: 'Saving Course',
    description: 'Saving your course and preparing modules...',
  },
  complete: {
    label: 'Complete',
    description: 'Your course is ready!',
  },
};

/**
 * Generation progress indicator component
 */
export function GenerationProgress({ step, message }: GenerationProgressProps) {
  const stepInfo = STEP_INFO[step];
  const isComplete = step === 'complete';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12">
      {/* Animated icon */}
      <div className="mb-8">
        {isComplete ? (
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Status text */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {stepInfo.label}
      </h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        {message || stepInfo.description}
      </p>

      {/* Progress steps */}
      <div className="flex items-center gap-4">
        <Step label="Interview" active={step === 'interview'} complete={['designing', 'saving', 'complete'].includes(step)} />
        <Connector complete={['designing', 'saving', 'complete'].includes(step)} />
        <Step label="Design" active={step === 'designing'} complete={['saving', 'complete'].includes(step)} />
        <Connector complete={['saving', 'complete'].includes(step)} />
        <Step label="Save" active={step === 'saving'} complete={step === 'complete'} />
      </div>

      {/* Additional info for non-complete states */}
      {!isComplete && (
        <p className="text-sm text-gray-500 mt-8 text-center">
          This may take a moment. Please wait...
        </p>
      )}
    </div>
  );
}

/**
 * Individual step indicator
 */
function Step({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
          complete
            ? 'bg-green-600 border-green-600'
            : active
            ? 'bg-blue-600 border-blue-600 animate-pulse'
            : 'bg-white border-gray-300'
        }`}
      >
        {complete ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : active ? (
          <Loader className="w-5 h-5 text-white animate-spin" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        )}
      </div>
      <span
        className={`text-xs font-medium ${
          complete || active ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Connector line between steps
 */
function Connector({ complete }: { complete: boolean }) {
  return (
    <div
      className={`w-16 h-0.5 transition-colors ${
        complete ? 'bg-green-600' : 'bg-gray-300'
      }`}
    />
  );
}
