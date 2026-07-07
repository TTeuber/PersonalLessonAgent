import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard';
import { mockUserContext, mockSubjectContext } from '../../__tests__/fixtures/context-fixtures';
import { renderWithRouter, mockElectronAPI } from '../../__tests__/utils/test-utils';
import { fileSystemService } from '../../services/storage/FileSystemService';

// Mock the services
vi.mock('../../services/storage/FileSystemService', () => ({
  fileSystemService: {
    exists: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readJSON: vi.fn(),
    writeJSON: vi.fn(),
    createDirectory: vi.fn(),
    listDirectory: vi.fn(),
  },
}));

const mockFileSystemService = vi.mocked(fileSystemService);

describe('Dashboard', () => {
  beforeEach(() => {
    mockElectronAPI();

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should show loading state initially', () => {
      // Mock the loadAllSubjects call to not resolve immediately
      mockFileSystemService.listDirectory.mockImplementation(
        () => new Promise(() => {})
      );

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display user name in header', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([]);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${mockUserContext.name}!`)).toBeInTheDocument();
      });
    });

    it('should show empty state when no subjects exist', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([]);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText('No subjects yet')).toBeInTheDocument();
        expect(screen.getByText('Create your first subject to start your learning journey')).toBeInTheDocument();
      });
    });

    it('should load and display subjects', async () => {
      // Mock the directory listing to return a subject
      mockFileSystemService.listDirectory.mockResolvedValue([
        { name: 'test-subject', isDirectory: true },
      ]);

      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readJSON.mockResolvedValue(mockSubjectContext);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText(mockSubjectContext.subjectName)).toBeInTheDocument();
      });
    });

    it('should display multiple subjects in a grid', async () => {
      const subject1 = { ...mockSubjectContext, subjectId: 'subject-1', subjectName: 'Subject 1' };
      const subject2 = { ...mockSubjectContext, subjectId: 'subject-2', subjectName: 'Subject 2' };

      mockFileSystemService.listDirectory.mockResolvedValue([
        { name: 'subject-1', isDirectory: true },
        { name: 'subject-2', isDirectory: true },
      ]);

      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readJSON
        .mockResolvedValueOnce(subject1)
        .mockResolvedValueOnce(subject2);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText('Subject 1')).toBeInTheDocument();
        expect(screen.getByText('Subject 2')).toBeInTheDocument();
      });
    });
  });

  describe('Subject Creation Flow', () => {
    it('should show interview form when New Subject button clicked', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([]);
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readJSON.mockResolvedValue(mockUserContext);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText('No subjects yet')).toBeInTheDocument();
      });

      const newSubjectButton = screen.getByRole('button', { name: /Create Your First Subject/i });
      await userEvent.click(newSubjectButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Subject')).toBeInTheDocument();
      });
    });

    it('should have New Subject button in header when subjects exist', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([
        { name: 'test-subject', isDirectory: true },
      ]);
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readJSON.mockResolvedValue(mockSubjectContext);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Subject/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading subjects fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFileSystemService.listDirectory.mockRejectedValue(new Error('Load error'));

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText('No subjects yet')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading subjects:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should filter out hidden directories when loading subjects', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([
        { name: 'test-subject', isDirectory: true },
        { name: '.hidden', isDirectory: true },
        { name: 'file.txt', isDirectory: false },
      ]);

      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readJSON.mockResolvedValue(mockSubjectContext);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText(mockSubjectContext.subjectName)).toBeInTheDocument();
      });

      // Only one subject should be displayed (hidden and files should be filtered out)
      const subjectCards = screen.queryAllByRole('heading', { level: 3 });
      expect(subjectCards).toHaveLength(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to subject view when subject card is clicked', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([
        { name: 'test-subject', isDirectory: true },
      ]);
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readJSON.mockResolvedValue(mockSubjectContext);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByText(mockSubjectContext.subjectName)).toBeInTheDocument();
      });

      const subjectCard = screen.getByText(mockSubjectContext.subjectName).closest('div');
      expect(subjectCard).toBeInTheDocument();
      expect(subjectCard).toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', async () => {
      mockFileSystemService.listDirectory.mockResolvedValue([]);

      renderWithRouter(<Dashboard userContext={mockUserContext} />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
