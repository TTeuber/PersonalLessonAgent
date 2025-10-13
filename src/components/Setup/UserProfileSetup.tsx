import React, { useState } from 'react';
import { User, Code, BookOpen } from 'lucide-react';
import { Button } from '../Shared/Button';
import type { UserContext } from '../../types/context';

interface UserProfileSetupProps {
  onComplete: (userContext: UserContext) => void;
}

const IDE_OPTIONS = [
  { id: 'webstorm', name: 'WebStorm' },
  { id: 'idea', name: 'IntelliJ IDEA' },
  { id: 'pycharm', name: 'PyCharm' },
  { id: 'code', name: 'VS Code' },
  { id: 'clion', name: 'CLion' },
  { id: 'goland', name: 'GoLand' },
  { id: 'rider', name: 'Rider' },
  { id: 'phpstorm', name: 'PHPStorm' },
  { id: 'rubymine', name: 'RubyMine' },
];

const LEARNING_STYLES = [
  { id: 'hands-on', name: 'Hands-on', description: 'Learn by doing with lots of exercises' },
  { id: 'theory-first', name: 'Theory First', description: 'Understand concepts before practicing' },
  { id: 'balanced', name: 'Balanced', description: 'Mix of theory and practice' },
] as const;

/**
 * First-run user profile setup component
 */
export function UserProfileSetup({ onComplete }: UserProfileSetupProps) {
  const [name, setName] = useState('');
  const [preferredIDE, setPreferredIDE] = useState('code');
  const [learningStylePreference, setLearningStylePreference] = useState<'hands-on' | 'theory-first' | 'balanced'>('balanced');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    const userContext: UserContext = {
      name: name.trim(),
      preferredIDE,
      learningStylePreference,
      createdAt: new Date().toISOString(),
    };

    onComplete(userContext);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <User className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Personal Lesson Agent</h1>
          <p className="text-gray-600">Let's set up your learning profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              What's your name?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              autoFocus
            />
          </div>

          {/* Preferred IDE */}
          <div>
            <label htmlFor="ide" className="block text-sm font-medium text-gray-700 mb-2">
              <Code className="w-4 h-4 inline mr-2" />
              Preferred IDE
            </label>
            <select
              id="ide"
              value={preferredIDE}
              onChange={(e) => setPreferredIDE(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {IDE_OPTIONS.map((ide) => (
                <option key={ide.id} value={ide.id}>
                  {ide.name}
                </option>
              ))}
            </select>
          </div>

          {/* Learning Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Learning Style Preference
            </label>
            <div className="space-y-3">
              {LEARNING_STYLES.map((style) => (
                <label
                  key={style.id}
                  className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: learningStylePreference === style.id ? '#2563eb' : '#e5e7eb',
                    backgroundColor: learningStylePreference === style.id ? '#eff6ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="learningStyle"
                    value={style.id}
                    checked={learningStylePreference === style.id}
                    onChange={(e) => setLearningStylePreference(e.target.value as typeof learningStylePreference)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{style.name}</div>
                    <div className="text-sm text-gray-600">{style.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            Get Started
          </Button>
        </form>
      </div>
    </div>
  );
}
