import * as spec from '@jsii/spec';
import { toCamelCase } from 'codemaker';

import { jsiiToPascalCase } from '../../naming-util';

export class DartNameUtils {
  public convertPropertyName(original: string) {
    if (this.isInvalidName(original)) {
      throw new Error(`Invalid property name: ${original}`);
    }
    return this.capitalizeWord(original);
  }

  public convertTypeName(original: string) {
    if (this.isInvalidName(original)) {
      throw new Error(`Invalid type name: ${original}`);
    }
    return this.capitalizeWord(original);
  }

  public convertMethodName(original: string) {
    if (this.isInvalidName(original)) {
      throw new Error(`Invalid method name: ${original}`);
    }
    return this.capitalizeWord(original);
  }

  public convertEnumMemberName(original: string) {
    if (this.isInvalidName(original)) {
      throw new Error(`Invalid enum member name: ${original}`);
    }
    return this.capitalizeWord(original);
  }

  public convertInterfaceName(original: spec.InterfaceType) {
    if (this.isInvalidName(original.name)) {
      throw new Error(`Invalid interface name: ${original.name}`);
    }
    if (original.datatype) {
      // Datatype interfaces need to be prefixed by I so that they don't clash with the prop object implementation
      return `I${this.capitalizeWord(original.name)}`;
    }
    // Non datatype interfaces are guaranteed by JSII to be prefixed by I already
    return this.capitalizeWord(original.name);
  }

  public convertClassName(original: spec.ClassType | spec.InterfaceType) {
    if (this.isInvalidName(original.name)) {
      throw new Error(`Invalid class name: ${original.name}`);
    }
    // Tentatively get the class name
    let name = this.capitalizeWord(original.name);
    if (original.methods) {
      original.methods.forEach((method) => {
        if (method.name.toLowerCase() === original.name.toLowerCase()) {
          // This class has a member with the same name, need to slugify the class name
          name = this.capitalizeWord(this.slugify(original.name));
        }
      });
    }
    if (original.properties) {
      original.properties.forEach((property) => {
        if (property.name.toLowerCase() === original.name.toLowerCase()) {
          // This class has a member with the same name, need to slugify the class name
          name = this.capitalizeWord(this.slugify(original.name));
        }
      });
    }

    return name;
  }

  public convertPackageName(original: string) {
    if (this.isInvalidName(original)) {
      throw new Error(`Invalid package name: ${original}`);
    }
    return original
      .split('-')
      .map((s: string) => this.capitalizeWord(s))
      .join('.');
  }

  public convertParameterName(original: string) {
    if (this.isInvalidName(original)) {
      throw new Error(`Invalid parameter name: ${original}`);
    }
    const name = toCamelCase(original);
    return this.escapeParameterName(name);
  }

  public capitalizeWord(original: string) {
    return jsiiToPascalCase(original);
  }

  /* We only want valid names for members */
  private isInvalidName(str: string) {
    // Can not be empty, or contains $
    // Can only start with a letter or an underscore
    return (
      str === null ||
      /^\s*$/.exec(str) !== null ||
      str.includes('$') ||
      !/^[A-Za-z_]/.exec(str)
    );
  }

  private escapeParameterName(name: string): string {
    if (!name) {
      return name;
    }
    if (RESERVED_KEYWORDS.includes(name)) {
      return `@${name}`;
    }
    return name;
  }

  private slugify(name: string): string {
    if (!name) {
      return name;
    }
    return `${name}_`;
  }
}

// Pulled from https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/
const RESERVED_KEYWORDS = [
  'abstract',
  'else',
  'import',
  'super',
  'as',
  'enum',
  'in',
  'switch',
  'assert',
  'export',
  'interface',
  'sync',
  'async',
  'extends',
  'is',
  'this',
  'await',
  'extension',
  'library',
  'throw',
  'break',
  'external',
  'mixin',
  'true',
  'case',
  'factory',
  'new',
  'try',
  'class',
  'final',
  'catch',
  'false',
  'null',
  'typedef',
  'on',
  'var',
  'const',
  'finally',
  'operator',
  'void',
  'continue',
  'for',
  'part',
  'while',
  'covariant',
  'Function',
  'rethrow',
  'with',
  'default',
  'get',
  'return',
  'yield',
  'deferred',
  'hide',
  'set',
  'do',
  'if',
  'show',
  'dynamic',
  'implements',
  'static',
];
