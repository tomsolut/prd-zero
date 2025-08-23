import { z } from 'zod';

export const ProjectInfoSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  targetAudience: z.string().min(10).max(300),
  problemStatement: z.string().min(20).max(500),
  uniqueValue: z.string().min(10).max(300),
});

export const MVPScopeSchema = z.object({
  coreFeatures: z.array(z.string().min(5).max(200)).min(1).max(10),
  nonGoals: z.array(z.string().min(5).max(200)).min(0).max(10),
  successMetrics: z.array(z.string().min(5).max(200)).min(1).max(10),
  constraints: z.array(z.string().min(5).max(200)).min(0).max(10),
});

export const PhaseSchema = z.object({
  name: z.string().min(1).max(50),
  duration: z.number().min(1).max(52),
  deliverables: z.array(z.string().min(5).max(200)).min(1),
});

export const MilestoneSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string(),
  criteria: z.array(z.string().min(5).max(200)).min(1),
});

export const TimelineSchema = z.object({
  totalWeeks: z.number().min(1).max(52),
  phases: z.array(PhaseSchema).min(1).max(10),
  milestones: z.array(MilestoneSchema).min(0).max(20),
});

export const TechStackSchema = z.object({
  frontend: z.array(z.string()).optional(),
  backend: z.array(z.string()).optional(),
  database: z.array(z.string()).optional(),
  hosting: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});

export const RiskSchema = z.object({
  description: z.string().min(10).max(300),
  impact: z.enum(['low', 'medium', 'high']),
  likelihood: z.enum(['low', 'medium', 'high']),
  mitigation: z.string().min(10).max(300),
});

export const PRDDataSchema = z.object({
  project: ProjectInfoSchema,
  mvp: MVPScopeSchema,
  timeline: TimelineSchema,
  techStack: TechStackSchema,
  risks: z.array(RiskSchema),
  assumptions: z.array(z.string().min(5).max(200)),
  openQuestions: z.array(z.string().min(5).max(200)),
  nextSteps: z.array(z.string().min(5).max(200)),
  generatedAt: z.date(),
  sessionDuration: z.number(),
});

export const SessionDataSchema = z.object({
  id: z.string(),
  startTime: z.date(),
  lastUpdate: z.date(),
  progress: z.number().min(0).max(100),
  currentStep: z.string(),
  data: PRDDataSchema.partial(),
});