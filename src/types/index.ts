export interface ProjectInfo {
  name: string;
  description: string;
  targetAudience: string;
  problemStatement: string;
  uniqueValue: string;
}

export interface MVPScope {
  problemStatement: string;
  solutionApproach: string;
  coreFeatures: string[];
  nonGoals: string[];
  outOfScope: string[];
  successMetrics: string[];
  constraints: string[];
}

export interface Timeline {
  totalWeeks: number;
  phases: Phase[];
  milestones: Milestone[];
}

export interface Phase {
  name: string;
  duration: number;
  deliverables: string[];
}

export interface Milestone {
  name: string;
  date: string;
  criteria: string[];
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  hosting?: string[];
  tools?: string[];
}

export interface PRDData {
  project: ProjectInfo;
  mvp: MVPScope;
  timeline: Timeline;
  techStack: TechStack;
  risks: Risk[];
  assumptions: string[];
  openQuestions: string[];
  nextSteps: string[];
  generatedAt: Date;
  sessionDuration: number;
}

export interface Risk {
  description: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface SessionData {
  id: string;
  startTime: Date;
  lastUpdate: Date;
  progress: number;
  currentStep: string;
  data: Partial<PRDData>;
}

export interface QuestionAnswer {
  question: string;
  answer: any;
  timestamp: Date;
}