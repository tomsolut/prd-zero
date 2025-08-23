import Handlebars from 'handlebars';
import { PRDData } from '../types/index.js';
import { FileSystem } from '../utils/fileSystem.js';
import { Logger } from '../utils/logger.js';

const DEFAULT_TEMPLATE = `# Product Requirements Document (PRD)

## Project: {{project.name}}

**Generated:** {{generatedAt}}  
**Session Duration:** {{sessionDuration}} minutes

---

## Executive Summary

{{project.description}}

### Problem Statement
{{project.problemStatement}}

### Unique Value Proposition
{{project.uniqueValue}}

### Target Audience
{{project.targetAudience}}

---

## MVP Scope

### Core Features
{{#each mvp.coreFeatures}}
{{inc @index}}. {{this}}
{{/each}}

### Success Metrics
{{#each mvp.successMetrics}}
- {{this}}
{{/each}}

{{#if mvp.nonGoals}}
### Non-Goals (Out of Scope)
{{#each mvp.nonGoals}}
- {{this}}
{{/each}}
{{/if}}

{{#if mvp.constraints}}
### Constraints
{{#each mvp.constraints}}
- {{this}}
{{/each}}
{{/if}}

---

## Timeline

**Total Duration:** {{timeline.totalWeeks}} weeks

### Development Phases
{{#each timeline.phases}}
#### {{this.name}} ({{this.duration}} weeks)
Deliverables:
{{#each this.deliverables}}
- {{this}}
{{/each}}

{{/each}}

{{#if timeline.milestones}}
### Milestones
{{#each timeline.milestones}}
- **{{this.name}}** - {{this.date}}
  {{#each this.criteria}}
  - {{this}}
  {{/each}}
{{/each}}
{{/if}}

---

## Technical Stack

{{#if techStack.frontend}}
### Frontend
{{#each techStack.frontend}}
- {{this}}
{{/each}}
{{/if}}

{{#if techStack.backend}}
### Backend
{{#each techStack.backend}}
- {{this}}
{{/each}}
{{/if}}

{{#if techStack.database}}
### Database
{{#each techStack.database}}
- {{this}}
{{/each}}
{{/if}}

{{#if techStack.hosting}}
### Hosting & Deployment
{{#each techStack.hosting}}
- {{this}}
{{/each}}
{{/if}}

---

## Risk Assessment

{{#each risks}}
### Risk {{inc @index}}: {{this.description}}
- **Impact:** {{this.impact}}
- **Likelihood:** {{this.likelihood}}
- **Mitigation:** {{this.mitigation}}

{{/each}}

{{#unless risks}}
*No risks identified*
{{/unless}}

---

## Assumptions

{{#each assumptions}}
- {{this}}
{{/each}}

{{#unless assumptions}}
*No assumptions documented*
{{/unless}}

---

## Open Questions

{{#each openQuestions}}
- {{this}}
{{/each}}

{{#unless openQuestions}}
*No open questions*
{{/unless}}

---

## Next Steps

{{#each nextSteps}}
1. {{this}}
{{/each}}

{{#unless nextSteps}}
*Next steps to be determined*
{{/unless}}

---

*This PRD was generated using [prd-zero](https://github.com/tomsolut/prd-zero) - MVP planning tool for solo developers*
`;

export class PRDGenerator {
  private template: HandlebarsTemplateDelegate;

  constructor(customTemplate?: string) {
    // Register Handlebars helpers
    Handlebars.registerHelper('inc', function(value: number) {
      return value + 1;
    });

    Handlebars.registerHelper('formatDate', function(date: Date) {
      return new Date(date).toLocaleDateString();
    });

    this.template = Handlebars.compile(customTemplate || DEFAULT_TEMPLATE);
  }

  generate(data: PRDData): string {
    const context = {
      ...data,
      generatedAt: new Date(data.generatedAt).toLocaleString(),
      sessionDuration: Math.round(data.sessionDuration),
    };

    return this.template(context);
  }

  async save(data: PRDData, outputDir: string): Promise<string> {
    const content = this.generate(data);
    const fileName = FileSystem.generateFileName(
      `prd_${data.project.name.toLowerCase().replace(/\s+/g, '-')}`,
      'md'
    );
    const filePath = FileSystem.getOutputPath(outputDir, fileName);

    await FileSystem.writeFile(filePath, content);
    
    // Also save JSON version
    const jsonFileName = fileName.replace('.md', '.json');
    const jsonPath = FileSystem.getOutputPath(outputDir, jsonFileName);
    await FileSystem.saveJSON(jsonPath, data);

    Logger.success(`PRD saved to: ${filePath}`);
    Logger.success(`JSON data saved to: ${jsonPath}`);

    return filePath;
  }

  async loadTemplate(templatePath: string): Promise<void> {
    try {
      const templateContent = await FileSystem.readFile(templatePath);
      this.template = Handlebars.compile(templateContent);
      Logger.success('Custom template loaded');
    } catch (error) {
      Logger.error('Failed to load custom template, using default');
      this.template = Handlebars.compile(DEFAULT_TEMPLATE);
    }
  }
}