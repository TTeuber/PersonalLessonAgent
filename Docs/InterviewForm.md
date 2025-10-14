## Form-Based Interview System

The application uses a **form-based interview approach** for creating subjects and courses, replacing the previous chat-based system. This provides a more consistent, predictable user experience.

### How It Works

**1. Initial Form Phase:**
- User starts course creation
- System displays predefined questions in a form (defined in `InitialQuestions.ts`)
- Questions are carefully crafted to gather essential information
- User fills out all required fields and submits

**2. AI Processing Phase:**
- `InterviewAgent.processAnswers()` sends answers to AI
- AI analyzes answers and makes a decision:
  - **Option A:** Generate 2-4 targeted follow-up questions
  - **Option B:** Complete interview with gathered information

**3. Follow-Up Phase (if needed):**
- AI uses `generate_follow_up_questions` tool
- Returns structured question array with:
  - `id`: Unique identifier
  - `label`: Question text
  - `type`: text, textarea, or select
  - `required`: Boolean
  - `options`: Array of choices (for select type)
  - `helpText`: Optional guidance
- System renders new form with AI-generated questions
- Process repeats until AI has sufficient information

**4. Completion Phase:**
- AI uses `complete_course_interview` or `complete_subject_interview` tool
- Returns structured context with all gathered information
- System proceeds to course design phase

### Key Benefits

- **Consistent UX**: Users always see forms, never unpredictable chat
- **Better Validation**: Required fields enforced before submission
- **Progress Tracking**: Visual progress bar shows completion percentage
- **Mobile-Friendly**: Forms work better than chat on small screens
- **Efficient**: AI can ask multiple questions at once
- **Structured Data**: All answers collected in organized format

### Implementation Pattern

```typescript
// 1. Create agent
const agent = new InterviewAgent('course');

// 2. Process initial answers
const isComplete = await agent.processAnswers(answers, context);

// 3. Check for follow-ups
if (!isComplete && agent.hasFollowUpQuestions()) {
  const followUpQuestions = agent.getFollowUpQuestions();
  // Render new form with followUpQuestions
}

// 4. When complete, get result
if (agent.isComplete()) {
  const result = agent.getInterviewResult();
  // Proceed to course design
}
```

### Question Definition Example

```typescript
{
  id: 'learningObjectives',
  label: 'What do you want to learn in this course?',
  type: 'textarea',
  placeholder: 'List specific skills, concepts, or outcomes...',
  required: true,
  helpText: 'Be as specific as possible'
}
```