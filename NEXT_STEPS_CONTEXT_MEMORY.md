# Context Memory Implementation - Next Steps

## 🔴 Problem Identifiziert

Die aktuelle AI-Integration hat ein kritisches Problem: **Kein Kontext-Gedächtnis zwischen Fragen**

### Symptome:
- KI gibt generische Empfehlungen, obwohl spezifische Informationen bereits eingegeben wurden
- Beispiel: User definiert "14-19-jährige Baseball-Leistungssportler", aber KI empfiehlt später generisch "16-19 jährige Volleyball-Leistungssportler"
- Jede Frage wird isoliert behandelt ohne Bezug zu vorherigen Antworten
- Inkonsistente und widersprüchliche Empfehlungen

### Root Cause:
```typescript
// Aktuell in aiService.ts - KEIN KONTEXT!
public async challengeAnswerOptimized(question: string, answer: string): Promise<OptimizedAIResponse | null> {
  // Nur aktuelle Frage/Antwort wird gesendet
  const prompt = PromptTemplates.getChallengePrompt(questionType, language, question, answer);
  // FEHLT: Kontext der vorherigen Antworten
}
```

## 💡 Lösung: Context Memory Service

### Konzept
Ein Session-übergreifendes Gedächtnis-System, das:
1. Alle bisherigen Frage-Antwort-Paare speichert
2. Strukturierten Kontext für KI aufbaut
3. Kohärente, aufbauende Empfehlungen ermöglicht

### Architektur
```
┌─────────────────────────────────────────┐
│         User Input (Antwort)            │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│       Context Memory Service            │
│  • Speichert Q&A Historie               │
│  • Kategorisiert nach Projektbereich    │
│  • Baut strukturierten Kontext auf      │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│           AI Service                    │
│  • Erhält vollständigen Kontext         │
│  • Gibt kohärente Empfehlungen          │
│  • Erkennt Widersprüche                 │
└─────────────────────────────────────────┘
```

## 📋 Implementierungsplan

### Phase 1: Context Memory Service (NEU)
**Datei:** `src/services/contextMemory.ts`

```typescript
interface ContextEntry {
  questionType: QuestionType;
  question: string;
  answer: string;
  timestamp: Date;
  category: 'project' | 'mvp' | 'tech' | 'timeline' | 'launch';
}

export class ContextMemoryService {
  private history: ContextEntry[] = [];
  private projectContext: ProjectContext = {};
  
  addEntry(entry: ContextEntry): void {
    this.history.push(entry);
    this.updateProjectContext(entry);
  }
  
  getContextForPrompt(): string {
    // Strukturierter Kontext für AI
    return `
    BISHERIGE PROJEKT-DEFINITION:
    - Projektname: ${this.projectContext.name}
    - Zielgruppe: ${this.projectContext.targetAudience}
    - Problem: ${this.projectContext.problem}
    - Bereits definierte Features: ${this.projectContext.features}
    
    KONSISTENZ-CHECK ERFORDERLICH:
    Neue Antworten müssen zu obigen Definitionen passen.
    `;
  }
  
  getRelatedAnswers(questionType: QuestionType): ContextEntry[] {
    // Gibt verwandte vorherige Antworten zurück
  }
}
```

### Phase 2: AIService Erweiterung
**Datei:** `src/services/aiService.ts`

```typescript
public async challengeAnswerOptimized(
  question: string, 
  answer: string,
  contextHistory?: string  // NEU!
): Promise<OptimizedAIResponse | null> {
  
  // Kontext in Prompt einbauen
  const contextualPrompt = contextHistory 
    ? `${contextHistory}\n\nAKTUELLE FRAGE: "${question}"\nANTWORT: "${answer}"`
    : `FRAGE: "${question}"\nANTWORT: "${answer}"`;
    
  // Rest der Implementierung...
}
```

### Phase 3: PromptTemplates Anpassung
**Datei:** `src/services/promptTemplates.ts`

```typescript
// Erweiterte Challenge Prompts mit Kontext-Awareness
[QuestionType.PROBLEM_VALIDATION]: {
  de: `
  {contextHistory}  // NEU: Vorherige Antworten
  
  AKTUELLE FRAGE: "{question}"
  AKTUELLE ANTWORT: "{answer}"
  
  KONSISTENZ-CHECK:
  - Passt die Antwort zur bereits definierten Zielgruppe?
  - Ist das Problem spezifisch für diese Zielgruppe?
  - Widerspricht es vorherigen Aussagen?
  
  [Rest des Prompts...]
  `
}
```

### Phase 4: AIEnhancedQuestions Integration
**Datei:** `src/questions/aiEnhanced.ts`

```typescript
export class AIEnhancedQuestions {
  private contextMemory: ContextMemoryService; // NEU!
  
  async askWithAIOptimized(question: string, ...): Promise<string> {
    // Antwort erhalten
    let answer = await askFlexibleInput(question, inputOptions);
    
    // Context Memory aktualisieren
    this.contextMemory.addEntry({
      questionType: QuestionTypeDetector.detectType(question),
      question,
      answer,
      timestamp: new Date(),
      category: this.detectCategory(question)
    });
    
    // AI Challenge mit Kontext
    const contextHistory = this.contextMemory.getContextForPrompt();
    const response = await this.aiService.challengeAnswerOptimized(
      question, 
      answer,
      contextHistory  // NEU: Kontext mitgeben!
    );
    
    // Rest der Implementierung...
  }
}
```

### Phase 5: Testing & Verfeinerung
- Build und Test mit realem Beispiel-Flow
- Verifizierung dass KI konsistente Empfehlungen gibt
- Fine-tuning der Kontext-Strukturierung

## 🎯 Erwartete Verbesserungen

### Vorher (JETZT):
```
User: "14-19-jährige Baseball-Leistungssportler"
KI: [ignoriert dies später]
KI: "Beispiel: 16-19 jährige Volleyball-Leistungssportler" ❌
```

### Nachher (MIT CONTEXT MEMORY):
```
User: "14-19-jährige Baseball-Leistungssportler"
KI: [speichert im Kontext]
KI: "Für Ihre 14-19-jährigen Baseball-Sportler empfehle ich..." ✅
```

## 🚀 Vorteile

1. **Kohärente Empfehlungen**: KI baut auf vorherigen Antworten auf
2. **Widerspruchserkennung**: KI warnt bei inkonsistenten Eingaben
3. **Personalisierte Vorschläge**: Spezifisch für das definierte Projekt
4. **Bessere UX**: User fühlt sich verstanden und ernstgenommen
5. **Reduzierte Frustration**: Keine generischen Templates mehr

## 📅 Zeitschätzung

- Phase 1 (Context Memory Service): 2 Stunden
- Phase 2 (AIService): 1 Stunde
- Phase 3 (PromptTemplates): 1 Stunde
- Phase 4 (Integration): 2 Stunden
- Phase 5 (Testing): 1 Stunde

**Gesamt: ~7 Stunden**

## 🔄 Nächste Schritte beim Fortsetzen

1. Diese Datei lesen für Kontext
2. `TODO_CONTEXT_MEMORY.md` für strukturierte Aufgabenliste
3. Mit Phase 1 beginnen: `contextMemory.ts` erstellen
4. Systematisch durch alle Phasen arbeiten
5. Testen mit dem AthleteLog Beispiel