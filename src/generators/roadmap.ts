import Handlebars from 'handlebars';
import { PRDData, Timeline } from '../types/index.js';
import { FileSystem } from '../utils/fileSystem.js';
import { Logger } from '../utils/logger.js';

const ROADMAP_TEMPLATE = `# Development Roadmap

## {{project.name}}

**Timeline:** {{timeline.totalWeeks}} weeks  
**Start Date:** {{startDate}}  
**Target Launch:** {{endDate}}

---

## Sprint Plan

{{#each sprints}}
### Sprint {{this.number}}: {{this.name}}
**Duration:** Week {{this.startWeek}} - Week {{this.endWeek}}  
**Focus:** {{this.focus}}

#### Goals
{{#each this.goals}}
- [ ] {{this}}
{{/each}}

#### Deliverables
{{#each this.deliverables}}
- {{this}}
{{/each}}

---

{{/each}}

## Gantt Chart View

\`\`\`
{{#each phases}}
{{padEnd this.name 20}} |{{generateBar this.startWeek this.duration ../timeline.totalWeeks}}|
{{/each}}
\`\`\`

Week: {{generateWeekNumbers timeline.totalWeeks}}

## Key Milestones

{{#each timeline.milestones}}
- **{{this.name}}** ({{this.date}})
  - Success Criteria:
    {{#each this.criteria}}
    - {{this}}
    {{/each}}
{{/each}}

## Critical Path

{{#each criticalPath}}
{{inc @index}}. **{{this.task}}** (Week {{this.week}})
   - Dependencies: {{#if this.dependencies}}{{join this.dependencies ", "}}{{else}}None{{/if}}
   - Risk: {{this.risk}}
{{/each}}

## Resource Allocation

### Development Resources
- **Planning Phase:** 1 developer (part-time)
- **Development Phase:** 1 developer (full-time)
- **Testing Phase:** 1 developer + QA support
- **Launch Phase:** 1 developer + marketing support

### Budget Estimates
- **Development:** {{estimateBudget timeline.totalWeeks "dev"}}
- **Infrastructure:** {{estimateBudget timeline.totalWeeks "infra"}}
- **Marketing:** {{estimateBudget timeline.totalWeeks "marketing"}}
- **Total:** {{estimateBudget timeline.totalWeeks "total"}}

---

*Generated with [prd-zero](https://github.com/tomsolut/prd-zero)*
`;

interface Sprint {
  number: number;
  name: string;
  startWeek: number;
  endWeek: number;
  focus: string;
  goals: string[];
  deliverables: string[];
}

interface CriticalPathItem {
  task: string;
  week: number;
  dependencies: string[];
  risk: string;
}

export class RoadmapGenerator {
  private template: HandlebarsTemplateDelegate;

  constructor() {
    this.registerHelpers();
    this.template = Handlebars.compile(ROADMAP_TEMPLATE);
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('inc', (value: number) => value + 1);
    
    Handlebars.registerHelper('padEnd', (str: string, length: number) => {
      return str.padEnd(length, ' ');
    });

    Handlebars.registerHelper('generateBar', (start: number, duration: number, total: number) => {
      const bar = new Array(total).fill(' ');
      for (let i = start - 1; i < start - 1 + duration && i < total; i++) {
        bar[i] = '█';
      }
      return bar.join('');
    });

    Handlebars.registerHelper('generateWeekNumbers', (total: number) => {
      const numbers = [];
      for (let i = 1; i <= total; i++) {
        numbers.push(i.toString().padStart(2, '0'));
      }
      return '      ' + numbers.join('');
    });

    Handlebars.registerHelper('join', (arr: string[], separator: string) => {
      return arr.join(separator);
    });

    Handlebars.registerHelper('estimateBudget', (weeks: number, type: string) => {
      const rates = {
        dev: 5000,
        infra: 500,
        marketing: 1000,
        total: 6500,
      };
      const monthly = (rates as any)[type] || 0;
      const total = Math.round((weeks / 4) * monthly);
      return `$${total.toLocaleString()}`;
    });
  }

  private generateSprints(data: PRDData): Sprint[] {
    const sprints: Sprint[] = [];
    const sprintDuration = 2; // 2-week sprints
    const totalSprints = Math.ceil(data.timeline.totalWeeks / sprintDuration);

    let currentWeek = 1;
    let phaseIndex = 0;
    let phaseProgress = 0;

    for (let i = 0; i < totalSprints; i++) {
      const sprint: Sprint = {
        number: i + 1,
        name: '',
        startWeek: currentWeek,
        endWeek: Math.min(currentWeek + sprintDuration - 1, data.timeline.totalWeeks),
        focus: '',
        goals: [],
        deliverables: [],
      };

      // Determine which phase this sprint belongs to
      const phase = data.timeline.phases[phaseIndex];
      if (phase) {
        sprint.name = phase.name;
        sprint.focus = `${phase.name} activities`;
        
        // Add phase-specific goals
        if (phaseProgress === 0) {
          sprint.goals.push(`Begin ${phase.name.toLowerCase()} phase`);
        }
        
        // Distribute deliverables across sprints in this phase
        const sprintsInPhase = Math.ceil(phase.duration / sprintDuration);
        const delivsPerSprint = Math.ceil(phase.deliverables.length / sprintsInPhase);
        const startIdx = Math.floor(phaseProgress / sprintDuration) * delivsPerSprint;
        const endIdx = Math.min(startIdx + delivsPerSprint, phase.deliverables.length);
        
        sprint.deliverables = phase.deliverables.slice(startIdx, endIdx);
        
        // Add some generic goals based on phase
        if (phase.name.toLowerCase().includes('planning')) {
          sprint.goals.push('Complete technical architecture', 'Finalize design mockups');
        } else if (phase.name.toLowerCase().includes('development')) {
          sprint.goals.push('Implement core features', 'Write unit tests');
        } else if (phase.name.toLowerCase().includes('test')) {
          sprint.goals.push('Complete QA testing', 'Fix critical bugs');
        } else if (phase.name.toLowerCase().includes('launch')) {
          sprint.goals.push('Deploy to production', 'Monitor initial usage');
        }

        phaseProgress += sprintDuration;
        if (phaseProgress >= phase.duration) {
          phaseIndex++;
          phaseProgress = 0;
        }
      }

      sprints.push(sprint);
      currentWeek += sprintDuration;
    }

    return sprints;
  }

  private generateCriticalPath(data: PRDData): CriticalPathItem[] {
    const criticalPath: CriticalPathItem[] = [];
    let week = 1;

    // Planning critical items
    criticalPath.push({
      task: 'Complete technical architecture',
      week: Math.ceil(data.timeline.phases[0]?.duration / 2) || 1,
      dependencies: [],
      risk: 'Low',
    });

    // Development critical items
    if (data.mvp.coreFeatures.length > 0) {
      const devPhase = data.timeline.phases.find(p => p.name.toLowerCase().includes('develop'));
      if (devPhase) {
        week = data.timeline.phases[0]?.duration || 0;
        criticalPath.push({
          task: `Implement ${data.mvp.coreFeatures[0]}`,
          week: week + Math.ceil(devPhase.duration / 3),
          dependencies: ['Technical architecture'],
          risk: 'Medium',
        });
      }
    }

    // Testing critical item
    const testPhase = data.timeline.phases.find(p => p.name.toLowerCase().includes('test'));
    if (testPhase) {
      week = data.timeline.phases.slice(0, -1).reduce((sum, p) => sum + p.duration, 0);
      criticalPath.push({
        task: 'Complete user acceptance testing',
        week: week + Math.ceil(testPhase.duration / 2),
        dependencies: ['Core features'],
        risk: 'Medium',
      });
    }

    // Launch critical item
    criticalPath.push({
      task: 'Production deployment',
      week: data.timeline.totalWeeks - 1,
      dependencies: ['User acceptance testing'],
      risk: 'High',
    });

    return criticalPath;
  }

  generate(data: PRDData): string {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + data.timeline.totalWeeks * 7);

    // Calculate phase start weeks
    let weekCounter = 1;
    const phasesWithWeeks = data.timeline.phases.map(phase => {
      const result = {
        ...phase,
        startWeek: weekCounter,
      };
      weekCounter += phase.duration;
      return result;
    });

    const context = {
      project: data.project,
      timeline: data.timeline,
      phases: phasesWithWeeks,
      sprints: this.generateSprints(data),
      criticalPath: this.generateCriticalPath(data),
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    };

    return this.template(context);
  }

  async save(data: PRDData, outputDir: string): Promise<string> {
    const content = this.generate(data);
    const fileName = FileSystem.generateFileName(
      `roadmap_${data.project.name.toLowerCase().replace(/\s+/g, '-')}`,
      'md'
    );
    const filePath = FileSystem.getOutputPath(outputDir, fileName);

    await FileSystem.writeFile(filePath, content);
    Logger.success(`Roadmap saved to: ${filePath}`);

    return filePath;
  }
}