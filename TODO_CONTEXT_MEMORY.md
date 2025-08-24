# TODO: Context Memory Implementation

## 📌 Priorität: HOCH
**Problem:** KI hat kein Gedächtnis zwischen Fragen und gibt inkonsistente/generische Empfehlungen

---

## Phase 1: Context Memory Service ⏱️ 2h
- [ ] Neue Datei `src/services/contextMemory.ts` erstellen
- [ ] Interface `ContextEntry` definieren
  - [ ] questionType, question, answer, timestamp, category
- [ ] Interface `ProjectContext` definieren
  - [ ] name, targetAudience, problem, features, techStack
- [ ] Klasse `ContextMemoryService` implementieren
  - [ ] `addEntry()` Methode
  - [ ] `updateProjectContext()` Methode
  - [ ] `getContextForPrompt()` Methode
  - [ ] `getRelatedAnswers()` Methode
  - [ ] `detectInconsistencies()` Methode
- [ ] Unit Tests für ContextMemoryService

## Phase 2: AIService Erweiterung ⏱️ 1h
- [ ] `src/services/aiService.ts` modifizieren
- [ ] Parameter `contextHistory?: string` zu `challengeAnswerOptimized()` hinzufügen
- [ ] Parameter `contextHistory?: string` zu `suggestImprovementOptimized()` hinzufügen
- [ ] Kontext in Prompts einbauen
- [ ] Fallback für fehlenden Kontext implementieren
- [ ] Token-Count für Kontext berücksichtigen

## Phase 3: PromptTemplates Anpassung ⏱️ 1h
- [ ] `src/services/promptTemplates.ts` erweitern
- [ ] Kontext-Platzhalter `{contextHistory}` in alle Challenge-Prompts einbauen
- [ ] Konsistenz-Check-Sektion zu jedem Prompt hinzufügen
- [ ] Spezielle Kontext-Prompts für verschiedene QuestionTypes
  - [ ] PROBLEM_VALIDATION: Check gegen definierte Zielgruppe
  - [ ] MVP_SCOPE: Check gegen definiertes Problem
  - [ ] TECH_STACK: Check gegen Skills und Timeline
  - [ ] LAUNCH_PLAN: Check gegen MVP-Scope

## Phase 4: AIEnhancedQuestions Integration ⏱️ 2h
- [ ] `src/questions/aiEnhanced.ts` modifizieren
- [ ] ContextMemoryService importieren und initialisieren
- [ ] In `askWithAIOptimized()`:
  - [ ] Context Memory nach jeder Antwort aktualisieren
  - [ ] Kontext an AIService übergeben
  - [ ] Inkonsistenz-Warnungen anzeigen
- [ ] In `askListWithAI()`:
  - [ ] Listen-Einträge im Kontext speichern
- [ ] Methode `getProjectSummary()` hinzufügen
- [ ] Methode `checkConsistency()` hinzufügen

## Phase 5: Types & Interfaces ⏱️ 30min
- [ ] `src/types/ai.ts` erweitern
- [ ] Interface `ContextEntry` exportieren
- [ ] Interface `ProjectContext` exportieren
- [ ] Interface `ConsistencyCheck` hinzufügen
- [ ] Type `QuestionCategory` definieren

## Phase 6: Integration in Commands ⏱️ 1h
- [ ] `src/commands/init.ts` anpassen
- [ ] Context Memory an AIEnhancedQuestions übergeben
- [ ] Context Summary am Ende der Session anzeigen
- [ ] Context in Session-Output speichern (context.json)

## Phase 7: Testing & Debugging ⏱️ 1h
- [ ] Build: `npm run build`
- [ ] Test mit AthleteLog Beispiel:
  - [ ] Projektname: "AthleteLog"
  - [ ] Zielgruppe: "14-19-jährige Baseball-Leistungssportler"
  - [ ] Verifizieren dass KI diese Info in späteren Fragen berücksichtigt
- [ ] Test Inkonsistenz-Erkennung:
  - [ ] Widersprüchliche Eingaben testen
  - [ ] Verifizieren dass KI warnt
- [ ] Performance-Test:
  - [ ] Token-Usage mit Kontext überwachen
  - [ ] Response-Zeit messen

## Bonus Features (Optional) ⏱️ 2h
- [ ] Context Reset Funktion
- [ ] Context Export/Import
- [ ] Visual Context Display (Tree-View)
- [ ] Context-basierte Auto-Vervollständigung
- [ ] Historien-Navigation (vorherige Sessions laden)

---

## 🎯 Definition of Done

✅ KI erinnert sich an alle vorherigen Antworten
✅ KI gibt konsistente, aufbauende Empfehlungen
✅ KI erkennt und warnt bei Widersprüchen
✅ User Experience deutlich verbessert
✅ Keine generischen Templates mehr
✅ Tests erfolgreich durchgelaufen

---

## 📝 Notizen für Implementierung

### Beispiel Context Output:
```
PROJEKT-KONTEXT:
================
Projektname: AthleteLog
Zielgruppe: 14-19-jährige Baseball-Leistungssportler im Sportinternat
Problem: Überbelastungsverletzungen durch zu späte Warnsignal-Erkennung
Lösung: Tägliches Mood-Tracking mit Fokus auf Schlafqualität
Features: [1. Mood-Eingabe, 2. Schlaf-Tracking, 3. Weekly-Report]
Timeline: 8 Wochen
Tech Stack: [Noch nicht definiert]
```

### Kritische Stellen:
1. Token-Limit beachten (Context nicht zu groß werden lassen)
2. Strukturierung des Kontexts (was ist relevant für welche Frage?)
3. Performance bei langen Sessions
4. Speicherung zwischen Browser-Refreshs (localStorage?)

---

## 🚦 Status Tracking

**Erstellt:** 2025-08-24
**Letzte Aktualisierung:** 2025-08-24
**Status:** NICHT BEGONNEN
**Priorität:** HOCH
**Geschätzte Zeit:** 7-9 Stunden
**Blocker:** Keine