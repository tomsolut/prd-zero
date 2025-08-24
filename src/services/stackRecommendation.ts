/**
 * Stack Recommendation Service for Solo Developers
 * Based on proven success stories and research
 */

export interface StackOption {
  name: string;
  tier: 'boring' | 'modern' | 'indie_hacker';
  technologies: {
    frontend: string;
    backend: string;
    database: string;
    hosting: string;
    auth: string;
    payments: string;
  };
  scores: {
    learning_curve_weeks: number;
    community_support: number;
    documentation_quality: number;
    maintenance_burden: number;
    monthly_cost_1000_users: number;
    development_speed: number;
  };
  pros: string[];
  cons: string[];
  innovation_tokens: number;
  best_for: string;
  success_stories: string[];
  getting_started: {
    first_steps: string[];
    learning_resources: string[];
    estimated_poc_time: string;
  };
}

export class StackRecommendationService {
  /**
   * Proven solo developer stacks based on real success stories
   */
  private static readonly PROVEN_STACKS: StackOption[] = [
    {
      name: 'The Boring Stack',
      tier: 'boring',
      technologies: {
        frontend: 'React',
        backend: 'Node.js + Express',
        database: 'PostgreSQL',
        hosting: 'Vercel + Railway',
        auth: 'NextAuth',
        payments: 'Stripe'
      },
      scores: {
        learning_curve_weeks: 1,
        community_support: 9,
        documentation_quality: 9,
        maintenance_burden: 3,
        monthly_cost_1000_users: 25,
        development_speed: 8
      },
      pros: ['Massive community', 'Excellent docs', 'Battle-tested', 'Easy hiring'],
      cons: ['Not cutting-edge', 'Requires backend knowledge'],
      innovation_tokens: 0,
      best_for: 'Developers who want proven solutions and minimal surprises',
      success_stories: [
        'Used by thousands of successful indie projects',
        'Foundation for many YC startups'
      ],
      getting_started: {
        first_steps: [
          'Install Node.js',
          'Create React app with Vite',
          'Setup PostgreSQL locally',
          'Initialize Express server'
        ],
        learning_resources: [
          'React Official Tutorial',
          'Node.js + Express Crash Course',
          'PostgreSQL Tutorial'
        ],
        estimated_poc_time: '2-3 days'
      }
    },
    {
      name: 'The Modern Boring Stack',
      tier: 'modern',
      technologies: {
        frontend: 'Next.js',
        backend: 'Next.js API Routes',
        database: 'PostgreSQL (via Supabase)',
        hosting: 'Vercel',
        auth: 'Supabase Auth',
        payments: 'Stripe'
      },
      scores: {
        learning_curve_weeks: 2,
        community_support: 8,
        documentation_quality: 8,
        maintenance_burden: 2,
        monthly_cost_1000_users: 20,
        development_speed: 9
      },
      pros: ['Full-stack in one framework', 'Great DX', 'Built-in optimizations', 'Serverless'],
      cons: ['Vendor lock-in risk', 'Next.js specific patterns'],
      innovation_tokens: 1,
      best_for: 'Developers who want modern tools with good defaults',
      success_stories: [
        'Cal.com - $25M funding',
        'Hashnode - serving millions of developers'
      ],
      getting_started: {
        first_steps: [
          'Create Next.js app',
          'Setup Supabase project',
          'Connect to Vercel',
          'Add authentication'
        ],
        learning_resources: [
          'Next.js Learn Course',
          'Supabase Quickstart',
          'Vercel Deployment Guide'
        ],
        estimated_poc_time: '1-2 days'
      }
    },
    {
      name: 'The Indie Hacker Stack',
      tier: 'indie_hacker',
      technologies: {
        frontend: 'Next.js + TypeScript',
        backend: 'tRPC + Prisma',
        database: 'PostgreSQL (PlanetScale)',
        hosting: 'Vercel',
        auth: 'Clerk',
        payments: 'Stripe + Lemon Squeezy'
      },
      scores: {
        learning_curve_weeks: 4,
        community_support: 7,
        documentation_quality: 7,
        maintenance_burden: 4,
        monthly_cost_1000_users: 35,
        development_speed: 10
      },
      pros: ['Type-safe end-to-end', 'Rapid development', 'Modern patterns', 'Great DX'],
      cons: ['Steeper learning curve', 'More moving parts', 'Newer ecosystem'],
      innovation_tokens: 2,
      best_for: 'Experienced developers who want cutting-edge productivity',
      success_stories: [
        'Create T3 App - popular starter',
        'Many successful indie SaaS products'
      ],
      getting_started: {
        first_steps: [
          'Use create-t3-app',
          'Setup PlanetScale database',
          'Configure Clerk auth',
          'Define tRPC routes'
        ],
        learning_resources: [
          'T3 Stack Tutorial',
          'tRPC Documentation',
          'Prisma Getting Started'
        ],
        estimated_poc_time: '3-5 days'
      }
    },
    {
      name: 'The Minimalist Stack (Pieter Levels Style)',
      tier: 'boring',
      technologies: {
        frontend: 'Vanilla JS + jQuery',
        backend: 'PHP',
        database: 'SQLite/MySQL',
        hosting: 'VPS (DigitalOcean/Hetzner)',
        auth: 'Basic PHP Sessions',
        payments: 'Stripe'
      },
      scores: {
        learning_curve_weeks: 1,
        community_support: 6,
        documentation_quality: 6,
        maintenance_burden: 5,
        monthly_cost_1000_users: 10,
        development_speed: 7
      },
      pros: ['Dead simple', 'No build tools', 'Direct control', 'Extremely cheap'],
      cons: ['Old-school approach', 'Manual optimizations', 'Less structure'],
      innovation_tokens: 0,
      best_for: 'Developers who want maximum simplicity and control',
      success_stories: [
        'Pieter Levels - $170k/month with PHP',
        'Nomad List, Remote OK, etc.'
      ],
      getting_started: {
        first_steps: [
          'Setup PHP locally',
          'Create index.php',
          'Add SQLite database',
          'Deploy to VPS'
        ],
        learning_resources: [
          'PHP The Right Way',
          'SQLite Tutorial',
          'Basic VPS Setup Guide'
        ],
        estimated_poc_time: '1 day'
      }
    }
  ];

  /**
   * Get stack recommendations based on user skills and requirements
   */
  public static getRecommendations(
    userSkills: string[],
    _projectType: string, // Will be used in future enhancements
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): StackOption[] {
    const recommendations = [...this.PROVEN_STACKS];
    
    // Sort based on user context
    recommendations.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Prefer stacks that match user skills
      const skillsA = this.countMatchingSkills(userSkills, a);
      const skillsB = this.countMatchingSkills(userSkills, b);
      scoreA += skillsA * 2;
      scoreB += skillsB * 2;
      
      // Adjust for experience level
      if (experienceLevel === 'beginner') {
        scoreA += (10 - a.scores.learning_curve_weeks) * 3;
        scoreB += (10 - b.scores.learning_curve_weeks) * 3;
      } else if (experienceLevel === 'advanced') {
        scoreA += a.scores.development_speed;
        scoreB += b.scores.development_speed;
      }
      
      // Prefer lower innovation tokens for beginners
      if (experienceLevel !== 'advanced') {
        scoreA -= a.innovation_tokens * 2;
        scoreB -= b.innovation_tokens * 2;
      }
      
      return scoreB - scoreA;
    });
    
    return recommendations.slice(0, 3);
  }

  /**
   * Count how many user skills match the stack
   */
  private static countMatchingSkills(userSkills: string[], stack: StackOption): number {
    const stackTechs = [
      stack.technologies.frontend,
      stack.technologies.backend,
      stack.technologies.database
    ].join(' ').toLowerCase();
    
    return userSkills.filter(skill => 
      stackTechs.includes(skill.toLowerCase())
    ).length;
  }

  /**
   * Get learning plan for a specific stack
   */
  public static getLearningPlan(stack: StackOption, userSkills: string[]): {
    newToLearn: string[];
    estimatedHours: number;
    resources: string[];
    weeklyPlan: string[];
  } {
    const newToLearn: string[] = [];
    
    // Check what's new to learn
    const techs = [
      stack.technologies.frontend,
      stack.technologies.backend,
      stack.technologies.database
    ];
    
    techs.forEach(tech => {
      const techLower = tech.toLowerCase();
      const isKnown = userSkills.some(skill => 
        techLower.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(techLower.split(' ')[0])
      );
      
      if (!isKnown) {
        newToLearn.push(tech);
      }
    });
    
    const estimatedHours = newToLearn.length * 20; // 20 hours per new technology
    
    return {
      newToLearn,
      estimatedHours,
      resources: stack.getting_started.learning_resources,
      weeklyPlan: [
        'Week 1: Setup environment and basic tutorials',
        'Week 2: Build a simple CRUD app',
        'Week 3: Add authentication and deployment',
        'Week 4: Production optimizations'
      ]
    };
  }
}