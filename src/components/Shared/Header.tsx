import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backPath?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

/**
 * Reusable header component with optional back button and actions
 */
export function Header({ title, showBackButton = false, backPath, onBack, actions }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  // Show back button if explicitly requested or if onBack is provided
  const shouldShowBackButton = showBackButton || !!onBack;

  return (
    <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/30">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {shouldShowBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
