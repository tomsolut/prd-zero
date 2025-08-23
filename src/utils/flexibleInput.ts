import inquirer from 'inquirer';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Logger } from './logger.js';

export interface FlexibleInputOptions {
  minLength?: number;
  maxLength?: number;
  multiline?: boolean;
  defaultValue?: string;
  examples?: string[];
  allowEditor?: boolean;
}

/**
 * Flexible input function that allows both direct input and nano editor
 */
export async function askFlexibleInput(
  message: string,
  options: FlexibleInputOptions = {}
): Promise<string> {
  const {
    minLength = 0,
    maxLength = 1000,
    multiline = false,
    defaultValue = '',
    examples = [],
    allowEditor = true,
  } = options;

  // Display the question with instructions
  Logger.info(chalk.cyan(message));
  
  if (allowEditor && multiline) {
    Logger.item(chalk.gray('Eingabemöglichkeiten:'));
    Logger.item(chalk.gray('  1. Direkt eingeben (Enter zum Abschließen)'));
    Logger.item(chalk.gray('  2. "nano" eingeben für Nano-Editor'));
    Logger.item(chalk.gray('  3. "editor" eingeben für Standard-Editor'));
    if (examples.length > 0) {
      Logger.item(chalk.gray('\nBeispiel: ' + examples[0]));
    }
  } else if (multiline) {
    Logger.item(chalk.gray('Tipp: Verwende Semikolon (;) für neue Zeilen'));
    if (examples.length > 0) {
      Logger.item(chalk.gray('Beispiel: ' + examples[0]));
    }
  }

  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: '>',
      default: defaultValue,
      validate: (value: string) => {
        // Check if user wants to use editor
        if (allowEditor && (value === 'nano' || value === 'editor')) {
          return true;
        }
        
        // Normal validation
        const trimmed = value.trim();
        if (trimmed.length < minLength) {
          return `Mindestens ${minLength} Zeichen erforderlich`;
        }
        if (trimmed.length > maxLength) {
          return `Maximal ${maxLength} Zeichen erlaubt`;
        }
        return true;
      },
    },
  ]);

  // Check if user wants to use an editor
  if (allowEditor && (input === 'nano' || input === 'editor')) {
    return await openInEditor(message, defaultValue, input === 'nano', minLength, maxLength);
  }

  // Process direct input
  let processedInput = input;
  if (multiline) {
    // Replace semicolons with newlines for multiline input
    processedInput = input.replace(/;/g, '\n');
  }

  return processedInput.trim();
}

/**
 * Open text in nano or default editor
 */
async function openInEditor(
  message: string,
  defaultContent: string,
  useNano: boolean,
  minLength: number,
  maxLength: number
): Promise<string> {
  // Create temporary file
  const tmpFile = join(tmpdir(), `prd-zero-${Date.now()}.txt`);
  
  // Prepare content with instructions
  let fileContent = '';
  if (useNano) {
    fileContent = `# ${message}
# 
# Nano-Editor Anleitung:
# - Schreibe deinen Text unten
# - Ctrl+O = Speichern
# - Ctrl+X = Beenden
# - Ctrl+K = Zeile löschen
# 
# Mindestlänge: ${minLength} Zeichen
# Maximallänge: ${maxLength} Zeichen
# 
# Lösche diese Kommentarzeilen nicht, sie werden automatisch entfernt.
# ============================================================

${defaultContent}`;
  } else {
    fileContent = `# ${message}
# 
# Editor-Anleitung:
# - Schreibe deinen Text unten
# - Speichern und beenden Sie den Editor
# 
# Mindestlänge: ${minLength} Zeichen
# Maximallänge: ${maxLength} Zeichen
# 
# Lösche diese Kommentarzeilen nicht, sie werden automatisch entfernt.
# ============================================================

${defaultContent}`;
  }

  // Write to temp file
  writeFileSync(tmpFile, fileContent, 'utf-8');

  // Determine which editor to use
  const editor = useNano ? 'nano' : (process.env.EDITOR || 'vi');

  try {
    // Open editor
    await new Promise<void>((resolve, reject) => {
      const editorProcess = spawn(editor, [tmpFile], {
        stdio: 'inherit',
        shell: true,
      });

      editorProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });

      editorProcess.on('error', (err) => {
        reject(err);
      });
    });

    // Read the edited content
    const editedContent = readFileSync(tmpFile, 'utf-8');
    
    // Remove instruction comments and clean up
    const cleanContent = editedContent
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .filter(line => !line.match(/^=+$/))
      .join('\n')
      .trim();

    // Clean up temp file
    unlinkSync(tmpFile);

    // Validate content
    if (cleanContent.length < minLength) {
      Logger.error(`Text zu kurz (${cleanContent.length}/${minLength} Zeichen). Bitte erneut eingeben.`);
      return await askFlexibleInput(message, { minLength, maxLength, multiline: true, defaultValue: cleanContent, allowEditor: true });
    }

    if (cleanContent.length > maxLength) {
      Logger.error(`Text zu lang (${cleanContent.length}/${maxLength} Zeichen). Bitte kürzen.`);
      return await askFlexibleInput(message, { minLength, maxLength, multiline: true, defaultValue: cleanContent.substring(0, maxLength), allowEditor: true });
    }

    return cleanContent;
  } catch (error) {
    // Clean up temp file on error
    try {
      unlinkSync(tmpFile);
    } catch {}

    Logger.error('Editor konnte nicht geöffnet werden. Bitte direkt eingeben.');
    return await askFlexibleInput(message, { minLength, maxLength, multiline: true, defaultValue: defaultContent, allowEditor: false });
  }
}

/**
 * Ask for multiline list input (for arrays of items)
 */
export async function askListInput(
  message: string,
  options: {
    minItems?: number;
    maxItems?: number;
    itemMinLength?: number;
    defaultItems?: string[];
  } = {}
): Promise<string[]> {
  const {
    minItems = 0,
    maxItems = 20,
    itemMinLength = 1,
    defaultItems = [],
  } = options;

  Logger.info(chalk.cyan(message));
  Logger.item(chalk.gray('Eingabemöglichkeiten:'));
  Logger.item(chalk.gray('  1. Einzelne Einträge mit Komma trennen'));
  Logger.item(chalk.gray('  2. "nano" für Nano-Editor (ein Eintrag pro Zeile)'));
  Logger.item(chalk.gray(`  Mindestens ${minItems}, maximal ${maxItems} Einträge`));

  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: '>',
      default: defaultItems.join(', '),
    },
  ]);

  // Check if user wants editor
  if (input === 'nano' || input === 'editor') {
    const editorContent = await openInEditor(
      `${message}\n# Ein Eintrag pro Zeile`,
      defaultItems.join('\n'),
      input === 'nano',
      0,
      10000
    );
    
    const items = editorContent
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length >= itemMinLength);
    
    return validateListItems(items, minItems, maxItems, message, itemMinLength);
  }

  // Process comma-separated input
  const items = input
    .split(',')
    .map((item: string) => item.trim())
    .filter((item: string) => item.length >= itemMinLength);

  return validateListItems(items, minItems, maxItems, message, itemMinLength);
}

/**
 * Validate list items
 */
function validateListItems(
  items: string[],
  minItems: number,
  maxItems: number,
  _message: string,
  _itemMinLength: number
): string[] {
  if (items.length < minItems) {
    Logger.warning(`Zu wenige Einträge (${items.length}/${minItems}). Bitte mehr hinzufügen.`);
    return [];
  }

  if (items.length > maxItems) {
    Logger.warning(`Zu viele Einträge (${items.length}/${maxItems}). Nur die ersten ${maxItems} werden verwendet.`);
    return items.slice(0, maxItems);
  }

  return items;
}