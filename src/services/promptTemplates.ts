/**
 * Prompt Template Manager for specialized AI coaching
 */

import { QuestionType } from './questionTypeDetector.js';
import { Warning } from '../types/ai.js';

export type Language = 'de' | 'en';

export class PromptTemplates {
  private static readonly SYSTEM_PROMPTS: Record<Language, string> = {
    de: `Du bist ein erfahrener Solo-Entwickler-Coach mit 10+ Jahren Erfahrung beim Launchen erfolgreicher MVPs. Du kennst die typischen Fallen: Analysis Paralysis (70% der Solo-MVPs scheitern daran), Feature Creep, Over-Engineering, und unrealistische Timelines. 

Deine Expertise basiert auf Research erfolgreicher Solo-Entwickler wie Pieter Levels ($170k/Monat) und den Lean Startup-Prinzipien. Du enforcest strikt: max 3 Features, max 12 Wochen Timeline, max 2 Innovation Tokens, Validation vor Development.

WICHTIG: Wenn ein JSON-Format angefordert wird, antworte NUR mit dem JSON-Objekt. Kein Text davor oder danach.

Antworte auf Deutsch. Sei direkt aber konstruktiv. Fokus auf Prevention der typischen Solo-Entwickler-Fallen.`,
    
    en: `You are an experienced solo developer coach with 10+ years of experience launching successful MVPs. You know the typical traps: Analysis Paralysis (70% of solo MVPs fail from this), Feature Creep, Over-Engineering, and unrealistic timelines.

Your expertise is based on research of successful solo developers like Pieter Levels ($170k/month) and Lean Startup principles. You strictly enforce: max 3 features, max 12 weeks timeline, max 2 innovation tokens, validation before development.

IMPORTANT: When a JSON format is requested, respond ONLY with the JSON object. No text before or after.

Be direct but constructive. Focus on preventing typical solo developer pitfalls.`
  };

  private static readonly CHALLENGE_PROMPTS: Record<QuestionType, Record<Language, string>> = {
    [QuestionType.PROJECT_NAME]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"
QUESTION_TYPE: "project_name"
{contextHistory}

Als Solo-Entwickler-Coach, bewerte diesen Projektnamen:

MVP-NAMING KRITERIEN:
- Spezifisch und memorable (nicht generisch)
- SEO-optimiert und suchbar
- Domain-Verfügbarkeit realistisch
- Klare Verbindung zum Problem/Lösung
- Keine Trademark-Konflikte wahrscheinlich

RED FLAGS:
- Zu generische Namen ("Daily Log", "Track App")
- Zu breiter Scope impliziert ("All-in-One")
- Schwer auszusprechen/merken
- SEO-unmöglich (zu viele Konkurrenzen)
- Feature Creep suggerierend

ERFOLGREICHE MVP-NAMEN:
- NomadList (spezifisch, memorable)
- PhotoPea (klar, einfach)
- RemoteOK (direkt, action-oriented)

WICHTIG: Antworte NUR mit einem JSON-Objekt. Kein Text vor oder nach dem JSON.

Gib EXAKT dieses JSON-Format zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Namens-Analyse max 100 Wörter",
  "warnings": [
    {
      "type": "too_generic|too_broad|seo_difficult|trademark_risk",
      "severity": "low|medium|high",
      "message": "Spezifische Warnung"
    }
  ],
  "suggestion": "Optimierter Name (nur wenn nötig)",
  "next_actions": ["Domain prüfen", "5 Nutzer nach Meinung fragen"],
  "seo_score": 1-10,
  "memorability_score": 1-10
}

Antworte NUR mit dem JSON. Keine zusätzlichen Erklärungen.`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "project_name"
{contextHistory}

As a solo developer coach, evaluate this project name:

MVP NAMING CRITERIA:
- Specific and memorable (not generic)
- SEO-optimized and searchable
- Domain availability realistic
- Clear connection to problem/solution
- No likely trademark conflicts

RED FLAGS:
- Too generic names ("Daily Log", "Track App")
- Implies too broad scope ("All-in-One")
- Hard to pronounce/remember
- SEO-impossible (too much competition)
- Suggests feature creep

SUCCESSFUL MVP NAMES:
- NomadList (specific, memorable)
- PhotoPea (clear, simple)
- RemoteOK (direct, action-oriented)

IMPORTANT: Respond ONLY with a JSON object. No text before or after the JSON.

Return EXACTLY this JSON format:
{
  "assessment": "good|warning|critical",
  "feedback": "Name analysis max 100 words",
  "warnings": [
    {
      "type": "too_generic|too_broad|seo_difficult|trademark_risk",
      "severity": "low|medium|high",
      "message": "Specific warning"
    }
  ],
  "suggestion": "Optimized name (only if needed)",
  "next_actions": ["Check domain", "Ask 5 users for opinion"],
  "seo_score": 1-10,
  "memorability_score": 1-10
}

Respond ONLY with the JSON. No additional explanations.`
    },
    [QuestionType.PROJECT_DESCRIPTION]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"
QUESTION_TYPE: "project_description"
{contextHistory}

Als Solo-Entwickler-Coach, bewerte diese Projektbeschreibung:

BESCHREIBUNGS-KRITERIEN:
- Klar und prägnant (2-3 Sätze)
- Zielgruppe explizit genannt
- Kernfunktionalität erklärt
- Problem-Lösung-Fit erkennbar
- Keine Feature-Liste (das kommt später)

RED FLAGS:
- Zu vage ("hilft Nutzern", "macht es einfacher")
- Feature-Auflistung statt Kern-Nutzen
- Keine spezifische Zielgruppe
- Zu technisch/jargon-lastig
- Über 3 Sätze

WICHTIG: Antworte NUR mit einem JSON-Objekt. Kein Text vor oder nach dem JSON.

Gib EXAKT dieses JSON-Format zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Beschreibungs-Analyse max 100 Wörter",
  "warnings": [
    {
      "type": "too_vague|too_long|missing_audience|feature_list",
      "severity": "low|medium|high",
      "message": "Spezifische Warnung"
    }
  ],
  "suggestion": "Verbesserte Beschreibung (nur wenn nötig)",
  "next_actions": ["Zielgruppe spezifizieren", "Kernnutzen klarer formulieren"],
  "clarity_score": 1-10
}

Antworte NUR mit dem JSON. Keine zusätzlichen Erklärungen.`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "project_description"
{contextHistory}

As a solo developer coach, evaluate this project description:

DESCRIPTION CRITERIA:
- Clear and concise (2-3 sentences)
- Target audience explicitly mentioned
- Core functionality explained
- Problem-solution fit evident
- No feature list (that comes later)

RED FLAGS:
- Too vague ("helps users", "makes it easier")
- Feature listing instead of core value
- No specific target audience
- Too technical/jargon-heavy
- Over 3 sentences

IMPORTANT: Respond ONLY with a JSON object. No text before or after the JSON.

Return EXACTLY this JSON format:
{
  "assessment": "good|warning|critical",
  "feedback": "Description analysis max 100 words",
  "warnings": [
    {
      "type": "too_vague|too_long|missing_audience|feature_list",
      "severity": "low|medium|high",
      "message": "Specific warning"
    }
  ],
  "suggestion": "Improved description (only if needed)",
  "next_actions": ["Specify target audience", "Clarify core value"],
  "clarity_score": 1-10
}

Respond ONLY with the JSON. No additional explanations.`
    },
    [QuestionType.MVP_FEATURE_COUNT]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"
QUESTION_TYPE: "mvp_feature_count"
{contextHistory}

Als Solo-Entwickler-Coach, bewerte diese Feature-Anzahl für den MVP:

OPTIMALE MVP-GRÖSSE:
- 3 Features = Ideal für Solo-Developer (empfohlen)
- 4-5 Features = Noch machbar, aber riskant
- >5 Features = Zu viel, Scope Creep garantiert
- <3 Features = Möglicherweise zu wenig Value

RED FLAGS:
- Mehr als 5 Features geplant
- Unrealistische Zeitschätzung für Feature-Anzahl
- Keine klare Priorisierung erkennbar

WICHTIG: Antworte NUR mit einem JSON-Objekt. Kein Text vor oder nach dem JSON.
WICHTIG: Füge KEINE nächste Frage oder Aufforderung in deine Antwort ein.

Gib EXAKT dieses JSON-Format zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Bewertung der Feature-Anzahl max 100 Wörter",
  "warnings": [
    {
      "type": "scope_creep|too_few|too_many",
      "severity": "low|medium|high",
      "message": "Spezifische Warnung"
    }
  ],
  "feature_count": [Zahl aus der Antwort],
  "next_actions": ["Features in User Stories definieren", "Effort pro Feature schätzen"],
  "parking_lot": ["Trainer-Dashboard", "Team-Vergleiche", "KI-Prognosen", "Eltern-Zugang"]
}

Antworte NUR mit dem JSON. Keine zusätzlichen Fragen oder Aufforderungen.`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "mvp_feature_count"
{contextHistory}

As a solo developer coach, evaluate this feature count for the MVP:

OPTIMAL MVP SIZE:
- 3 features = Ideal for solo developer (recommended)
- 4-5 features = Still manageable, but risky
- >5 features = Too much, scope creep guaranteed
- <3 features = Possibly insufficient value

RED FLAGS:
- More than 5 features planned
- Unrealistic time estimate for feature count
- No clear prioritization evident

IMPORTANT: Respond ONLY with a JSON object. No text before or after the JSON.
IMPORTANT: Do NOT include any next question or prompt in your response.

Return EXACTLY this JSON format:
{
  "assessment": "good|warning|critical",
  "feedback": "Feature count evaluation max 100 words",
  "warnings": [
    {
      "type": "scope_creep|too_few|too_many",
      "severity": "low|medium|high",
      "message": "Specific warning"
    }
  ],
  "feature_count": [number from answer],
  "next_actions": ["Define features as user stories", "Estimate effort per feature"],
  "parking_lot": ["Trainer dashboard", "Team comparisons", "AI predictions", "Parent access"]
}

Respond ONLY with the JSON. No additional questions or prompts.`
    },
    [QuestionType.PROBLEM_VALIDATION]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"
QUESTION_TYPE: "problem_validation"

Als Solo-Entwickler-Coach, analysiere diese Problem-Definition nach "Mom Test"-Prinzipien:

RED FLAGS zu checken:
- Vage Probleme ("Menschen brauchen", "Nutzer wollen")
- Generische Zielgruppen ("Entwickler", "Unternehmen")  
- Solution-First-Thinking (beschreibt Lösung statt Problem)
- Pain Level <6 (möglicherweise kein echtes Problem)
- Keine spezifische Persona

VALIDATION REQUIREMENTS:
- Spezifische Person als Zielgruppe (nicht Rolle/Branche)
- Konkretes, messbares Problem
- Aktueller Schmerz/Kosten erkennbar
- Pain Level ≥6 für zahlungsbereitschaft

Gib zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Spezifische Analyse max 100 Wörter",
  "warnings": [
    {
      "type": "vague_problem|generic_target|solution_first|low_pain",
      "severity": "low|medium|high",
      "message": "Spezifische Warnung"
    }
  ],
  "suggestion": "Verbesserte Version (nur wenn nötig)",
  "next_actions": ["5 Mom Test Interview-Fragen", "Spezifischere Persona definieren"],
  "validation_required": true/false
}`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "problem_validation"

As a solo developer coach, analyze this problem definition using "Mom Test" principles:

RED FLAGS to check:
- Vague problems ("people need", "users want")
- Generic target groups ("developers", "businesses")
- Solution-first thinking (describes solution instead of problem)
- Pain level <6 (possibly not a real problem)
- No specific persona

VALIDATION REQUIREMENTS:
- Specific person as target (not role/industry)
- Concrete, measurable problem
- Current pain/cost identifiable
- Pain level ≥6 for willingness to pay

Return:
{
  "assessment": "good|warning|critical",
  "feedback": "Specific analysis max 100 words",
  "warnings": [
    {
      "type": "vague_problem|generic_target|solution_first|low_pain",
      "severity": "low|medium|high",
      "message": "Specific warning"
    }
  ],
  "suggestion": "Improved version (only if needed)",
  "next_actions": ["5 Mom Test interview questions", "Define more specific persona"],
  "validation_required": true/false
}`
    },

    [QuestionType.VALUE_PROPOSITION]: {
      de: `FRAGE: "{question}"  
ANTWORT: "{answer}"
QUESTION_TYPE: "value_proposition"

Als Solo-Entwickler-Coach, bewerte diese Value Proposition:

CONSTRAINTS zu prüfen:
- 15-Wort-Limit für Value Prop
- Messbare Success Metrics (SMART-Kriterien)
- Konkrete Benefits (nicht "besser", "einfacher")
- Differenzierung von Alternativen erkennbar

RED FLAGS:
- Vage Versprechen ohne Messbarkeit
- Generic Value Props ("Zeit sparen", "effizienter")
- Unmessbare Success Metrics
- Keine klare Zielgruppe in Value Prop

Gib zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Value Prop Clarity Score + Begründung max 100 Wörter",
  "warnings": [
    {
      "type": "too_long|too_vague|unmeasurable|generic",
      "severity": "low|medium|high", 
      "message": "Spezifische Verbesserung"
    }
  ],
  "suggestion": "15-Wort optimierte Value Prop",
  "next_actions": ["SMART Metrics definieren", "A/B Test Value Props"],
  "measurability_score": 1-10
}`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "value_proposition"

As a solo developer coach, evaluate this value proposition:

CONSTRAINTS to check:
- 15-word limit for value prop
- Measurable success metrics (SMART criteria)
- Concrete benefits (not "better", "easier")
- Clear differentiation from alternatives

RED FLAGS:
- Vague promises without measurability
- Generic value props ("save time", "more efficient")
- Unmeasurable success metrics
- No clear target audience in value prop

Return:
{
  "assessment": "good|warning|critical",
  "feedback": "Value Prop Clarity Score + reasoning max 100 words",
  "warnings": [
    {
      "type": "too_long|too_vague|unmeasurable|generic",
      "severity": "low|medium|high",
      "message": "Specific improvement"
    }
  ],
  "suggestion": "15-word optimized value prop",
  "next_actions": ["Define SMART metrics", "A/B test value props"],
  "measurability_score": 1-10
}`
    },

    [QuestionType.MVP_SCOPE]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"  
QUESTION_TYPE: "mvp_scope"

Als Solo-Entwickler-Coach, prüfe den MVP-Scope gegen Scope-Creep:

HARD LIMITS (CRITICAL wenn überschritten):
- Exakt 3 Features für MVP (mehr = automatisches CRITICAL)
- User Story Format: "Als X möchte ich Y um Z"
- Jedes Feature muss Kern-Problem lösen

RED FLAGS:
- >3 Features erwähnt
- Vage Feature-Beschreibungen
- "Nice-to-Have" Features im MVP
- Features die nicht das Kern-Problem lösen
- Fehlende "Won't Have"-Liste

SCOPE PROTECTION:
- Alles über 3 Features → "Version 2" Parking Lot
- Feature Effort Estimation (XS/S/M/L/XL)  
- MVP Definition: minimal viable, nicht minimal lovable

Gib zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Scope-Analyse max 100 Wörter", 
  "warnings": [
    {
      "type": "scope_creep|vague_features|missing_user_stories|no_parking_lot",
      "severity": "low|medium|high",
      "message": "Spezifische Scope-Warnung"
    }
  ],
  "feature_count": X,
  "scope_violation": true/false,
  "suggestion": "3 fokussierte Features in User Story Format",
  "parking_lot": ["Alle Features >3 hier"],
  "next_actions": ["Scope-Commitment unterschreiben", "Effort schätzen pro Feature"]
}`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "mvp_scope"

As a solo developer coach, check the MVP scope for scope creep:

HARD LIMITS (CRITICAL if exceeded):
- Exactly 3 features for MVP (more = automatic CRITICAL)
- User story format: "As X I want Y so that Z"
- Each feature must solve core problem

RED FLAGS:
- >3 features mentioned
- Vague feature descriptions
- "Nice-to-have" features in MVP
- Features that don't solve core problem
- Missing "Won't Have" list

SCOPE PROTECTION:
- Everything over 3 features → "Version 2" Parking Lot
- Feature Effort Estimation (XS/S/M/L/XL)
- MVP Definition: minimal viable, not minimal lovable

Return:
{
  "assessment": "good|warning|critical",
  "feedback": "Scope analysis max 100 words",
  "warnings": [
    {
      "type": "scope_creep|vague_features|missing_user_stories|no_parking_lot",
      "severity": "low|medium|high",
      "message": "Specific scope warning"
    }
  ],
  "feature_count": X,
  "scope_violation": true/false,
  "suggestion": "3 focused features in user story format",
  "parking_lot": ["All features >3 here"],
  "next_actions": ["Sign scope commitment", "Estimate effort per feature"]
}`
    },

    [QuestionType.TECH_STACK]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"
QUESTION_TYPE: "tech_stack"

Als Senior-Architekt mit 15+ Jahren Erfahrung beim Begleiten von Solo-Entwicklern, führe eine DEEP TECH STACK ANALYSIS durch:

DEEP ANALYSIS FRAMEWORK:

1. SKILLS-GAP-ANALYSIS:
- Welche Technologien sind neu für den User?
- Geschätzter Learning-Aufwand (Stunden) pro neuer Technologie
- "Tutorial Hell"-Risiko: Technologien die einfach aussehen, aber komplex werden
- Missing-Skills-Impact auf Timeline

2. STACK-KOMPATIBILITÄT:
- Funktionieren die Technologien gut zusammen?
- Bekannte Integration-Probleme oder Friction Points
- Community-Support für diese spezifische Kombination
- Documentation-Quality für diese Kombination

3. SOLO-DEVELOPER-REALITÄT:
- Ist der Stack maintainable von einer Person?
- DevOps/Deployment-Komplexität realistisch?
- Debugging-Difficulty wenn Probleme auftreten
- Community-Support verfügbar (Stack Overflow, Discord)

4. PRODUCTION-READINESS:
- Skaliert der Stack bis 1000+ User ohne major refactoring?
- Hosting-Kosten für MVP vs. Growth-Phase
- Security-Considerations für Solo-Developer
- Backup/Monitoring-Komplexität

5. INNOVATION TOKENS DETAIL (max 2 für Solo-Developer):
- Neue Programmiersprache = 1 Token
- Neue Framework/Library = 1 Token
- Neue Database-Type = 1 Token
- Neue Deployment-Platform = 1 Token
- Neue Architecture-Pattern = 1 Token

BORING TECH BIAS:
- PostgreSQL > NoSQL für 90% der Fälle
- Monolith > Microservices für MVPs
- Bekannte Frameworks > Neue/Trendy
- Skills-First > Requirements-First

RED FLAGS:
- >2 Innovation Tokens
- Microservices für MVP
- "Ich lerne nebenbei X" für kritische Komponenten
- Over-Engineering für <1000 Users
- Complex CI/CD für Solo-Developer
- Tutorial Hell Technologien

Gib zurück:
{
  "assessment": "optimal|acceptable|risky|dangerous",
  "feedback": "Tech-Complexity-Analyse max 100 Wörter",
  "skills_gap_analysis": {
    "new_technologies": ["tech1", "tech2"],
    "learning_hours_estimate": 40,
    "tutorial_hell_risk": ["problematic techs"],
    "timeline_impact_weeks": 2
  },
  "compatibility_score": 8,
  "solo_developer_score": 7,
  "innovation_tokens": {
    "used": 3,
    "details": [
      {
        "tech": "NextJS",
        "token_cost": 1,
        "risk_level": "low",
        "reason": "New framework but good docs"
      }
    ]
  },
  "warnings": [
    {
      "type": "learning_overload|compatibility_issue|maintenance_burden|deployment_complexity|tutorial_hell",
      "severity": "low|medium|high",
      "message": "Spezifische Warnung",
      "affected_tech": "konkrete Technologie"
    }
  ],
  "recommendations": {
    "keep": ["Technologien die gut passen"],
    "replace": [
      {
        "current": "Aktuelle Technologie",
        "suggested": "Bessere Alternative",
        "reason": "Warum besser für Solo-Developer"
      }
    ],
    "add_missing": ["Essentials die fehlen"]
  },
  "alternative_stacks": [
    {
      "name": "Boring But Reliable Stack",
      "tech": ["React", "Node.js", "PostgreSQL", "Vercel"],
      "pros": ["Proven", "Great docs", "Solo-developer friendly"],
      "cons": ["Not cutting-edge"],
      "learning_curve_weeks": 1,
      "innovation_tokens": 0
    }
  ],
  "complexity_score": 1-10,
  "next_actions": ["Proof of Concept für kritische Integration", "Timeboxed Learning-Sprint für neue Tech"],
  "final_recommendation": "Detailed final advice"
}`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "tech_stack"

As a senior architect with 15+ years experience mentoring solo developers, perform a DEEP TECH STACK ANALYSIS:

DEEP ANALYSIS FRAMEWORK:

1. SKILLS-GAP ANALYSIS:
- Which technologies are new to the user?
- Estimated learning effort (hours) per new technology
- "Tutorial Hell" risk: Technologies that look simple but become complex
- Missing skills impact on timeline

2. STACK COMPATIBILITY:
- Do the technologies work well together?
- Known integration problems or friction points
- Community support for this specific combination
- Documentation quality for this combination

3. SOLO DEVELOPER REALITY:
- Is the stack maintainable by one person?
- DevOps/deployment complexity realistic?
- Debugging difficulty when problems occur
- Community support available (Stack Overflow, Discord)

4. PRODUCTION READINESS:
- Does the stack scale to 1000+ users without major refactoring?
- Hosting costs for MVP vs. growth phase
- Security considerations for solo developer
- Backup/monitoring complexity

5. INNOVATION TOKENS DETAIL (max 2 for solo developer):
- New programming language = 1 token
- New framework/library = 1 token
- New database type = 1 token
- New deployment platform = 1 token
- New architecture pattern = 1 token

BORING TECH BIAS:
- PostgreSQL > NoSQL for 90% of cases
- Monolith > Microservices for MVPs
- Known frameworks > New/Trendy
- Skills-first > Requirements-first

RED FLAGS:
- >2 innovation tokens
- Microservices for MVP
- "I'll learn X on the side" for critical components
- Over-engineering for <1000 users
- Complex CI/CD for solo developer
- Tutorial Hell technologies

Return:
{
  "assessment": "optimal|acceptable|risky|dangerous",
  "feedback": "Tech complexity analysis max 100 words",
  "skills_gap_analysis": {
    "new_technologies": ["tech1", "tech2"],
    "learning_hours_estimate": 40,
    "tutorial_hell_risk": ["problematic techs"],
    "timeline_impact_weeks": 2
  },
  "compatibility_score": 8,
  "solo_developer_score": 7,
  "innovation_tokens": {
    "used": 3,
    "details": [
      {
        "tech": "NextJS",
        "token_cost": 1,
        "risk_level": "low",
        "reason": "New framework but good docs"
      }
    ]
  },
  "warnings": [
    {
      "type": "learning_overload|compatibility_issue|maintenance_burden|deployment_complexity|tutorial_hell",
      "severity": "low|medium|high",
      "message": "Specific warning",
      "affected_tech": "specific technology"
    }
  ],
  "recommendations": {
    "keep": ["Technologies that fit well"],
    "replace": [
      {
        "current": "Current technology",
        "suggested": "Better alternative",
        "reason": "Why better for solo developer"
      }
    ],
    "add_missing": ["Essential missing items"]
  },
  "alternative_stacks": [
    {
      "name": "Boring But Reliable Stack",
      "tech": ["React", "Node.js", "PostgreSQL", "Vercel"],
      "pros": ["Proven", "Great docs", "Solo-developer friendly"],
      "cons": ["Not cutting-edge"],
      "learning_curve_weeks": 1,
      "innovation_tokens": 0
    }
  ],
  "complexity_score": 1-10,
  "next_actions": ["Proof of concept for critical integration", "Timeboxed learning sprint for new tech"],
  "final_recommendation": "Detailed final advice"
}`
    },

    [QuestionType.LAUNCH_PLAN]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"
QUESTION_TYPE: "launch_plan"

Als Solo-Entwickler-Coach, bewerte Realismus der Launch-Strategie:

TIMELINE CONSTRAINTS (CRITICAL wenn überschritten):
- Max 12 Wochen vom Start bis Launch
- Validation Gates VOR Development
- Fixed Time, Variable Scope (nicht umgekehrt)

VALIDATION-FIRST CHECK:
- Customer Interviews vor Feature-Entwicklung
- Landing Page + Email Signup vor Build
- Payment Intent vor Full Development

RED FLAGS:
- >12 Wochen Timeline
- "Build first, validate later" Mentalität  
- Vage Marketing-Kanäle ("Social Media")
- Unrealistic Pricing ohne Market Research
- Keine messbaren Launch-Metriken

LAUNCH REALISM:
- Go-to-Market realistisch für Solo-Developer
- Pricing validiert durch Customer Research
- Success Metrics messbar und achievable

Gib zurück:
{
  "assessment": "good|warning|critical", 
  "feedback": "Launch-Realismus-Analyse max 100 Wörter",
  "warnings": [
    {
      "type": "timeline_overrun|no_validation_gates|vague_marketing|unrealistic_pricing",
      "severity": "low|medium|high", 
      "message": "Spezifische Launch-Warnung"
    }
  ],
  "timeline_weeks": X,
  "timeline_violation": true/false,
  "validation_gates_missing": ["Welche Gates fehlen"],
  "suggestion": "Realistischer 12-Wochen-Plan",
  "next_actions": ["5 Customer Interviews planen", "Landing Page erstellen", "Validation Gates definieren"],
  "realism_score": 1-10
}`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "launch_plan"

As a solo developer coach, evaluate launch strategy realism:

TIMELINE CONSTRAINTS (CRITICAL if exceeded):
- Max 12 weeks from start to launch
- Validation gates BEFORE development
- Fixed time, variable scope (not vice versa)

VALIDATION-FIRST CHECK:
- Customer interviews before feature development
- Landing page + email signup before build
- Payment intent before full development

RED FLAGS:
- >12 weeks timeline
- "Build first, validate later" mentality
- Vague marketing channels ("social media")
- Unrealistic pricing without market research
- No measurable launch metrics

LAUNCH REALISM:
- Go-to-market realistic for solo developer
- Pricing validated by customer research
- Success metrics measurable and achievable

Return:
{
  "assessment": "good|warning|critical",
  "feedback": "Launch realism analysis max 100 words",
  "warnings": [
    {
      "type": "timeline_overrun|no_validation_gates|vague_marketing|unrealistic_pricing",
      "severity": "low|medium|high",
      "message": "Specific launch warning"
    }
  ],
  "timeline_weeks": X,
  "timeline_violation": true/false,
  "validation_gates_missing": ["Which gates are missing"],
  "suggestion": "Realistic 12-week plan",
  "next_actions": ["Plan 5 customer interviews", "Create landing page", "Define validation gates"],
  "realism_score": 1-10
}`
    },

    [QuestionType.GENERIC]: {
      de: `FRAGE: "{question}"
ANTWORT: "{answer}"

Als Solo-Entwickler-Coach, bewerte diese Antwort kritisch:

Prüfe auf typische Solo-Entwickler-Fallen:
- Zu vage oder zu komplex?
- Feature Creep oder Over-Engineering?
- Unrealistische Zeitschätzungen?
- Fehlende Validierung?

Gib zurück:
{
  "assessment": "good|warning|critical",
  "feedback": "Direktes Feedback max 100 Wörter",
  "warnings": [],
  "suggestion": "Konkrete, MVP-fokussierte Version (nur wenn nötig)",
  "next_actions": ["Spezifische nächste Schritte"]
}`,
      en: `QUESTION: "{question}"
ANSWER: "{answer}"

As a solo developer coach, critically evaluate this answer:

Check for typical solo developer traps:
- Too vague or too complex?
- Feature creep or over-engineering?
- Unrealistic time estimates?
- Missing validation?

Return:
{
  "assessment": "good|warning|critical",
  "feedback": "Direct feedback max 100 words",
  "warnings": [],
  "suggestion": "Concrete, MVP-focused version (only if needed)",
  "next_actions": ["Specific next steps"]
}`
    }
  };

  private static readonly IMPROVEMENT_PROMPTS: Record<Language, string> = {
    de: `FRAGE: "{question}"
ANTWORT: "{answer}"  
QUESTION_TYPE: "{questionType}"
PREVIOUS_WARNINGS: {warnings}

Du bist Solo-Entwickler-Coach. Erstelle eine optimierte Version dieser Antwort, die alle identifizierten Probleme behebt:

{contextSpecificRequirements}

CONSTRAINTS ENFORCEMENT:
- Berücksichtige alle PREVIOUS_WARNINGS
- Mache konkret und messbar
- Fokus auf Solo-Developer-Realität
- Prevention typischer Fallen

Gib die verbesserte Antwort direkt zurück ohne Präfix. Mache sie konkret, umsetzbar und constraint-compliant.`,

    en: `QUESTION: "{question}"
ANSWER: "{answer}"
QUESTION_TYPE: "{questionType}"
PREVIOUS_WARNINGS: {warnings}

You are a solo developer coach. Create an optimized version of this answer that fixes all identified issues:

{contextSpecificRequirements}

CONSTRAINTS ENFORCEMENT:
- Consider all PREVIOUS_WARNINGS
- Make concrete and measurable
- Focus on solo developer reality
- Prevent typical pitfalls

Return the improved answer directly without prefix. Make it concrete, actionable, and constraint-compliant.`
  };

  /**
   * Get system prompt for language
   */
  public static getSystemPrompt(language: Language): string {
    return this.SYSTEM_PROMPTS[language];
  }

  /**
   * Get challenge prompt for question type and language
   */
  public static getChallengePrompt(
    questionType: QuestionType,
    language: Language,
    question: string,
    answer: string,
    contextHistory?: string
  ): string {
    let template = this.CHALLENGE_PROMPTS[questionType][language];
    
    // Replace context history placeholder or add at beginning
    if (contextHistory) {
      // If template has {contextHistory} placeholder, replace it
      if (template.includes('{contextHistory}')) {
        template = template.replace('{contextHistory}', contextHistory);
      } else {
        // Otherwise add at the beginning
        const contextPrefix = language === 'de' 
          ? `${contextHistory}\n\n` 
          : `${contextHistory}\n\n`;
        template = contextPrefix + template;
      }
    } else {
      // Remove empty placeholder if no context
      template = template.replace('{contextHistory}\n', '').replace('{contextHistory}', '');
    }
    
    return template
      .replace('{question}', question)
      .replace('{answer}', answer);
  }

  /**
   * Get improvement prompt
   */
  public static getImprovementPrompt(
    language: Language,
    question: string,
    answer: string,
    questionType: QuestionType,
    warnings: Warning[],
    contextHistory?: string
  ): string {
    const contextRequirements = this.getContextSpecificRequirements(questionType, language);
    
    let prompt = this.IMPROVEMENT_PROMPTS[language];
    
    // Add context history if provided
    if (contextHistory) {
      const contextSection = language === 'de'
        ? `${contextHistory}\n\n`
        : `${contextHistory}\n\n`;
      prompt = contextSection + prompt;
    }
    
    return prompt
      .replace('{question}', question)
      .replace('{answer}', answer)
      .replace('{questionType}', questionType)
      .replace('{warnings}', JSON.stringify(warnings))
      .replace('{contextSpecificRequirements}', contextRequirements);
  }

  /**
   * Get context-specific requirements for improvement
   */
  private static getContextSpecificRequirements(
    questionType: QuestionType,
    language: Language
  ): string {
    const requirements: Record<QuestionType, Record<Language, string>> = {
      [QuestionType.PROJECT_NAME]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Spezifischer und einprägsamer Name
- SEO-optimiert und suchbar
- Klare Verbindung zum Problem/Lösung`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Specific and memorable name
- SEO-optimized and searchable
- Clear connection to problem/solution`
      },
      [QuestionType.PROJECT_DESCRIPTION]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Klar und prägnant (2-3 Sätze)
- Zielgruppe explizit genannt
- Kernfunktionalität erklärt`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Clear and concise (2-3 sentences)
- Target audience explicitly mentioned
- Core functionality explained`
      },
      [QuestionType.PROBLEM_VALIDATION]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Spezifische Persona statt generischer Zielgruppe
- Messbares Problem mit Pain Level ≥6
- Mom Test-konforme Formulierung`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Specific persona instead of generic target group
- Measurable problem with pain level ≥6
- Mom Test compliant formulation`
      },
      [QuestionType.VALUE_PROPOSITION]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Exakt 15 Wörter für Value Prop
- SMART Success Metrics
- Konkrete Benefits statt Vague Promises`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Exactly 15 words for value prop
- SMART success metrics
- Concrete benefits instead of vague promises`
      },
      [QuestionType.MVP_FEATURE_COUNT]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Ideale Anzahl: 3 Features für Solo-Developer
- Klare Scope-Limitierung
- Realistische Umsetzung`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Ideal count: 3 features for solo developer
- Clear scope limitation
- Realistic implementation`
      },
      [QuestionType.MVP_SCOPE]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Exakt 3 Features in User Story Format
- Parking Lot für alle anderen Features
- Klare Won't-Have-Liste`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Exactly 3 features in user story format
- Parking lot for all other features
- Clear won't-have list`
      },
      [QuestionType.TECH_STACK]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Max 2 Innovation Tokens
- Boring Tech Recommendations
- Skills-basierte Entscheidungen`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Max 2 innovation tokens
- Boring tech recommendations
- Skills-based decisions`
      },
      [QuestionType.LAUNCH_PLAN]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Max 12 Wochen Timeline
- Validation Gates vor Development
- Realistische Go-to-Market Strategie`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Max 12 weeks timeline
- Validation gates before development
- Realistic go-to-market strategy`
      },
      [QuestionType.GENERIC]: {
        de: `CONTEXT-SPEZIFISCHE VERBESSERUNG:
- Konkret und messbar
- MVP-fokussiert
- Realistisch für Solo-Developer`,
        en: `CONTEXT-SPECIFIC IMPROVEMENT:
- Concrete and measurable
- MVP-focused
- Realistic for solo developer`
      }
    };

    return requirements[questionType][language];
  }
}