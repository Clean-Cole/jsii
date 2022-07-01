import * as assert from 'assert';

export enum TargetLanguage {
  PYTHON = 'python',
  CSHARP = 'csharp',
  JAVA = 'java',
  GO = 'go',
  DART = 'dart',
}

const VALID_TARGET_LANGUAGES = new Set(Object.values(TargetLanguage));

export function targetName(language: TargetLanguage.PYTHON): 'python';
export function targetName(language: TargetLanguage.DART): 'dart';
export function targetName(language: TargetLanguage.CSHARP): 'dotnet';
export function targetName(language: TargetLanguage.JAVA): 'java';
export function targetName(language: TargetLanguage.GO): 'go';
export function targetName(language: TargetLanguage): 'python' | 'dotnet' | 'java' | 'go' | 'dart';
/**
 * @param language a possible value for `TargetLanguage`.
 *
 * @returns the name of the target configuration block for the given language.
 */
export function targetName(language: TargetLanguage): 'python' | 'dotnet' | 'java' | 'go' | 'dart' {
  // The TypeScript compiler should guarantee the below `switch` statement covers all possible
  // values of the TargetLanguage enum, but we add an assert here for clarity of intent.
  assert(VALID_TARGET_LANGUAGES.has(language), `Invalid/unexpected target language identifier: ${language}`);

  switch (language) {
    case TargetLanguage.DART:
      return 'dart';
    case TargetLanguage.PYTHON:
      return 'python';
    case TargetLanguage.CSHARP:
      return 'dotnet';
    case TargetLanguage.JAVA:
      return 'java';
    case TargetLanguage.GO:
      return 'go';
  }
}
