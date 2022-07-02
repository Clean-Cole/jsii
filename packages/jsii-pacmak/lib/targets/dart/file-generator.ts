import { Assembly } from '@jsii/spec';
import { CodeMaker } from 'codemaker';
import * as path from 'path';
import * as YAML from 'yaml';

import { TargetName } from '..';
import * as logging from '../../logging';
import { debug } from '../../logging';
import { toNuGetVersionRange, toReleaseVersion } from '../version-utils';
import { DartNameUtils } from './name-utils';
// Represents a dependency in the dependency tree.
export class DartDependency {
  public readonly version: string;

  public constructor(
    public readonly namespace: string,
    public readonly packageId: string,
    public readonly fqn: string,
    version: string,
    public readonly partOfCompilation: boolean,
  ) {
    this.version = toNuGetVersionRange(version);
  }
}

// Generates misc files such as the .csproj and the AssemblyInfo.cs file
// Uses the same instance of CodeMaker as the rest of the code so that the files get created when calling the save() method
export class DartFileGenerator {
  private readonly assm: Assembly;
  private readonly tarballFileName: string;
  private readonly code: CodeMaker;
  private readonly assemblyInfoNamespaces: string[] = [
    'Amazon.JSII.Runtime.Deputy',
  ];
  private readonly nameutils: DartNameUtils = new DartNameUtils();

  // We pass in an instance of CodeMaker so that the files get later saved
  // when calling the save() method on the .NET Generator.
  public constructor(assm: Assembly, tarballFileName: string, code: CodeMaker) {
    this.assm = assm;
    this.tarballFileName = tarballFileName;
    this.code = code;
  }

  // Generates the pubspec.yml file
  public generateProjectFile(dependencies: Map<string, DartDependency>) {
    debug('generateProjectFile', dependencies);
    const assembly = this.assm;
    const pubName: string = assembly.targets!.dart!.pubName;
    const projectFilePath: string = path.join('pubspec.yml');
    const pubSpecData = {
      name: pubName,
      description: this.getDescription(),
      version: this.getDecoratedVersion(this.assm),
      homepage: '',
      documentation: '',
      environment: {
        sdk: '>=2.17.0 <3.0.0',
      },
      dependencies: {
        path: 'any',
      },
      dev_dependencies: {
        test: '>=1.15.0 <2.0.0',
      },
    };

    // Sending the yaml content to the codemaker to ensure the file is written
    // and added to the file list for tracking
    this.code.openFile(projectFilePath);
    this.code.open(YAML.stringify(pubSpecData));
    this.code.close();
    this.code.closeFile(projectFilePath);

    logging.debug(`Written to ${projectFilePath}`);
  }

  // Generates the AssemblyInfo.cs file
  public generateAssemblyInfoFile() {
    const packageId: string = this.assm.targets!.dotnet!.packageId;
    const filePath: string = path.join(packageId, 'AssemblyInfo.cs');
    this.code.openFile(filePath);
    this.assemblyInfoNamespaces.map((n) => this.code.line(`using ${n};`));
    this.code.line();
    const assembly = `[assembly: JsiiAssembly("${this.assm.name}", "${this.assm.version}", "${this.tarballFileName}")]`;
    this.code.line(assembly);
    this.code.closeFile(filePath);
  }

  // Generates the description
  private getDescription(): string {
    const docs = this.assm.docs;
    if (docs) {
      const stability = docs.stability;
      if (stability) {
        return `${
          this.assm.description
        } (Stability: ${this.nameutils.capitalizeWord(stability)})`;
      }
    }
    return this.assm.description;
  }

  // Generates the decorated version
  private getDecoratedVersion(assembly: Assembly): string {
    const suffix = assembly.targets!.dart!.versionSuffix;
    if (suffix) {
      // suffix is guaranteed to start with a leading `-`
      return `${assembly.version}${suffix}`;
    }
    return toReleaseVersion(assembly.version, TargetName.DART);
  }
}
