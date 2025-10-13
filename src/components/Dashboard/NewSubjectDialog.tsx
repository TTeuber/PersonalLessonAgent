import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Shared/Button';
import { ContextManager } from '../../services/storage/ContextManager';
import { fileSystemService } from '../../services/storage/FileSystemService';
import { toKebabCase } from '../../services/storage/DataPaths';
import type { SubjectContext } from '../../types/context';

interface NewSubjectDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Dialog for creating a new subject
 * In Phase 2, this will trigger an AI interview
 * For now, it's a simple form
 */
export function NewSubjectDialog({ onClose, onSuccess }: NewSubjectDialogProps) {
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const contextManager = new ContextManager(fileSystemService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subjectName.trim()) {
      setError('Please enter a subject name');
      return;
    }

    try {
      setLoading(true);

      const subjectId = toKebabCase(subjectName);

      // Check if subject already exists
      const exists = await fileSystemService.exists(`${subjectId}/subject-context.json`);
      if (exists) {
        setError('A subject with this name already exists');
        setLoading(false);
        return;
      }

      // Create subject context
      const subjectContext: SubjectContext = {
        subjectName: subjectName.trim(),
        subjectId,
        createdAt: new Date().toISOString(),
      };

      // Create subject directory
      await fileSystemService.createDirectory(subjectId);

      // Save subject context
      await contextManager.saveContext('subject', subjectContext, subjectId);

      onSuccess();
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Failed to create subject. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Subject</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              id="subjectName"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Embedded Development, Audio DSP"
              autoFocus
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              In Phase 2, AI will interview you to understand this subject better
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
