/**
 * Predefined initial questions for subject and course interviews
 */

export interface Question {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

/**
 * Initial questions for subject creation
 */
export const SUBJECT_INITIAL_QUESTIONS: Question[] = [
  {
    id: 'subjectName',
    label: 'What subject do you want to learn?',
    type: 'text',
    placeholder: 'e.g., Embedded Development, Audio DSP, Web Development',
    required: true,
    helpText: 'Give it a clear, concise name',
  },
  {
    id: 'background',
    label: 'What is your current knowledge level in this subject?',
    type: 'textarea',
    placeholder: 'Describe your experience, what you already know, and any related skills...',
    required: true,
    helpText: 'This helps me tailor the content to your level',
  },
  {
    id: 'tools',
    label: 'What tools, hardware, or resources do you have available?',
    type: 'textarea',
    placeholder: 'e.g., Development boards, software, IDE preferences, etc.',
    required: false,
    helpText: 'Only relevant for technical subjects',
  },
  {
    id: 'goals',
    label: 'What are your learning goals and motivations?',
    type: 'textarea',
    placeholder: 'What do you hope to achieve? What projects do you want to build?',
    required: true,
    helpText: 'This helps me understand what you want to accomplish',
  },
];

/**
 * Initial questions for course creation
 */
export const COURSE_INITIAL_QUESTIONS: Question[] = [
  {
    id: 'courseName',
    label: 'What specific topic do you want this course to cover?',
    type: 'text',
    placeholder: 'e.g., ARM Cortex-M Interrupts, Building Audio Effects, React Hooks',
    required: true,
    helpText: 'Be specific - this is one course within your subject',
  },
  {
    id: 'learningObjectives',
    label: 'What do you want to learn in this course?',
    type: 'textarea',
    placeholder: 'List specific skills, concepts, or outcomes you want to achieve...',
    required: true,
    helpText: 'Be as specific as possible',
  },
  {
    id: 'knowledgeLevel',
    label: 'What is your current knowledge level on this specific topic?',
    type: 'textarea',
    required: true,
    placeholder: 'Describe your experience, what you already know, and any related skills...',
    // options: [
    //   'Complete beginner - I have no experience with this topic',
    //   'Novice - I have some basic understanding',
    //   'Intermediate - I have practical experience but want to deepen my knowledge',
    //   'Advanced - I want to master advanced concepts and techniques',
    // ],
  },
  // {
  //   id: 'learningStyle',
  //   label: 'What is your preferred balance of theory vs. hands-on practice?',
  //   type: 'select',
  //   required: true,
  //   options: [
  //     'Theory-focused - I want to understand concepts deeply',
  //     'Balanced - Mix of theory and practice',
  //     'Practice-focused - I learn best by doing',
  //   ],
  // },
  {
    id: 'projectIdea',
    label: 'Do you have a specific project or application in mind?',
    type: 'textarea',
    placeholder: 'Describe any project you want to build or problem you want to solve...',
    required: false,
    helpText: 'This helps me design practical exercises',
  },
  {
    id: 'challenges',
    label: 'Are there any specific challenges or topics you want to focus on?',
    type: 'textarea',
    placeholder: 'Any particular areas you find confusing or want to master?',
    required: false,
  },
  {
    id: 'other',
    label: 'Anything else you want to share?',
    type: 'textarea',
    placeholder: 'Any other details you want to share...',
    required: false,
  }
];
