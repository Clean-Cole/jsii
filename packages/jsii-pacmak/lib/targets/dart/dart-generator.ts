import * as spec from '@jsii/spec';
import {
  Assembly,
  ClassType,
  InterfaceType,
  Method,
  Property,
  UnionTypeReference,
} from '@jsii/spec';
import 'fs';
import { toSnakeCase } from 'codemaker';
import * as fs from 'fs-extra';
import * as reflect from 'jsii-reflect';
import { RosettaTabletReader } from 'jsii-rosetta';
import * as path from 'path';
import * as YAML from 'yaml';

import { Generator } from '../../generator';
import { debug } from '../../logging';
import { DartDocGenerator } from './dart-doc-generator';
import { DartTypeResolver } from './dart-type-resolver';
import { DartNameUtils } from './name-utils';

export class DartGenerator extends Generator {
  private typeresolver!: DartTypeResolver;

  private readonly nameutils: DartNameUtils = new DartNameUtils();
  private dartDocGenerator!: DartDocGenerator;

  public constructor(
    private readonly assembliesCurrentlyBeingCompiled: string[],
    private readonly rosetta: RosettaTabletReader,
  ) {
    super();
  }

  public generate(fingerprint: boolean) {
    /*this.dartRuntimeGenerator = new DartRuntimeGenerator(
      this.code,
      this.typeresolver,
    );*/
    this.dartDocGenerator = new DartDocGenerator(
      this.code,
      this.rosetta,
      this.assembly,
    );
    this.typeresolver = new DartTypeResolver(
      this.assembly,
      (fqn: string) => this.findModule(fqn),
      (fqn: string) => this.findType(fqn),
      this.assembliesCurrentlyBeingCompiled,
    );
    this.typeresolver.resolveNamespacesDependencies();
    super.generate(fingerprint);
  }

  public async load(
    packageRoot: string,
    assembly: reflect.Assembly,
  ): Promise<void> {
    await super.load(packageRoot, assembly);
  }

  public async save(
    outdir: string,
    // tarball: string,
    // { license, notice }: Legalese,
  ): Promise<string[]> {
    // filegen.generateProjectFile(this.typeresolver.namespaceDependencies);
    const assm = this.assembly;
    const pubName: string = assm.targets!.dart!.pubName;
    // if (!pubName) {
    //   throw new Error(
    //     `The module ${assm.name} does not have a Dart pubName setting`,
    //   );
    // }
    await fs.mkdirp(path.join(outdir, pubName));

    // Saving the generated code.
    return this.code.save(outdir);
  }

  protected onBeginAssembly(assembly: Assembly, _fingerprint: boolean) {
    this.typeresolver.resolveNamespacesDependencies();
    // Create the pubspec.yaml
    const globalPubSpecPath = 'pubspec.yaml';
    this._writeStringToFile(
      YAML.stringify({
        name: toSnakeCase(this.assembly.name),
        version: `${this.assembly.version}`,
        publish_to: 'none',
        homepage: `${this.assembly.homepage}`,
        description: '',
        dev_dependencies: {
          test: '>=1.15.0 <2.0.0',
          lints: '^2.0.0',
        },
        dependencies: {
          path: 'any',
        },
        environment: {
          sdk: '>=2.10.0 <3.0.0',
        },
      }),
      globalPubSpecPath,
    );
    for (const fqn of Object.keys(assembly.submodules ?? {})) {
      const moduleName = fqn.split('.')[1];
      this._openFile(moduleName, undefined, false);
      this.code.line('// Howdy');
      this._emitJsiiRuntimeImports(assembly, fqn);
      this.code.line();
      this._closeFile(moduleName, undefined, false);
    }
  }
  private _emitJsiiRuntimeImports(_assembly: Assembly, _fqn: string) {
    const allTypes = this.assembly.types ?? Object;
    for (const fqnType of Object.entries(allTypes)) {
      if (fqnType[0].includes(_fqn)) {
        const item = fqnType[1];
        this.code.line(
          `export 'src/${toSnakeCase(item.name)}.dart'; // ${item.kind}`,
        );
      }
    }
  }

  protected onBeginNamespace(_jsiiNs: string) {
    /* noop */
  }
  protected onEndNamespace(_jsiiNs: string) {
    try {
      if (this.typeresolver.findModule(_jsiiNs)) {
        // We are in a module which means we don't have anything to do yet.
        return;
      }
      // eslint-disable-next-line no-empty,@typescript-eslint/no-unused-vars
    } catch (e) {}

    const namespace = _jsiiNs.split('.')[1];

    // Create the pubspec.yaml
    const pubSpecPath = path.join(`${namespace}`, 'pubspec.yaml');
    this._writeStringToFile(
      YAML.stringify({
        name: namespace,
        version: `${this.assembly.version}`,
        publish_to: 'none',
        homepage: `${this.assembly.homepage}`,
        description: '',
        dev_dependencies: {
          test: '>=1.15.0 <2.0.0',
          lints: '^2.0.0',
        },
        dependencies: {
          path: 'any',
        },
        environment: {
          sdk: '>=2.10.0 <3.0.0',
        },
      }),
      pubSpecPath,
    );

    // Create the .gitignore file
    const gitIgnorePath = path.join(`${namespace}`, '.gitignore');
    this._writeStringToFile(
      '# Files and directories created by pub.\n' +
        '.dart_tool/\n' +
        '.packages\n' +
        '\n' +
        '# Conventional directory for build outputs.\n' +
        'build/\n' +
        '\n' +
        '# Omit committing pubspec.lock for library packages; see\n' +
        '# https://dart.dev/guides/libraries/private-files#pubspeclock.\n' +
        'pubspec.lock\n',
      gitIgnorePath,
    );

    const licensePath = path.join(`${namespace}`, 'LICENSE');
    this._writeStringToFile('', licensePath);

    const changeLogPath = path.join(`${namespace}`, 'CHANGELOG.md');
    this._writeStringToFile('', changeLogPath);

    // Create the README.md file
    const readmePath = path.join(namespace, 'README.md');
    this._writeStringToFile(this.assembly?.readme?.markdown ?? '', readmePath);
  }

  private _writeStringToFile(content: string, filePath: string) {
    this.code.openFile(filePath);
    this.code.line(content);
    this.code.closeFile(filePath);
  }

  protected onBeginInterface(ifc: InterfaceType): void {
    if (this.isNested(ifc)) {
      debug(`'this class is nested' ${ifc.fqn}`);
    } else {
      const implementations =
        this.typeresolver.resolveImplementedInterfaces(ifc);
      const interfaceName = this.nameutils.convertInterfaceName(ifc);
      this._openFile(ifc.namespace ?? '', interfaceName, this.isNested(ifc));
      this.code.line();
      this.dartDocGenerator.emitDocs(ifc, { api: 'type', fqn: ifc.fqn });
      // this.dartRuntimeGenerator.emitAttributesForInterface(ifc);
      let implementsStr = '';
      if (implementations.length > 0) {
        implementsStr = `implements ${implementations.join(', ')}`;
      }
      this.code.openBlock(`abstract class ${interfaceName} ${implementsStr}`);
    }
  }
  protected onEndInterface(ifc: InterfaceType): void {
    this.code.closeBlock();
    const interfaceName = this.nameutils.convertInterfaceName(ifc);
    this._closeFile(ifc.namespace ?? '', interfaceName, this.isNested(ifc));
  }

  protected onBeginClass(cls: spec.ClassType, abstract: boolean) {
    let baseTypeNames: string[] = [];
    const className = this.nameutils.convertClassName(cls);
    const moduleName = cls.namespace ?? toSnakeCase(cls.assembly);
    this._openFile(moduleName, className, this.isNested(cls));

    if (this.isNested(cls)) {
      debug(`'this class is nested' ${cls.fqn}`);
    } else {
      const absPrefix = abstract ? 'abstract ' : '';
      if (cls.interfaces && cls.interfaces.length > 0) {
        const implementations =
          this.typeresolver.resolveImplementedInterfaces(cls);
        baseTypeNames = baseTypeNames.concat(implementations);
      }
      this.dartDocGenerator.emitDocs(cls, {
        api: 'type',
        fqn: cls.fqn,
      });
      const implementsExpr = ` implements ${baseTypeNames.join(', ')}`;
      this.code.openBlock(`${absPrefix}class ${className}${implementsExpr}`);
    }
  }
  protected onEndClass(cls: spec.ClassType) {
    this.code.closeBlock();
    const className = this.nameutils.convertClassName(cls);
    const moduleName = cls.namespace ?? toSnakeCase(cls.assembly);
    this._closeFile(moduleName, className, this.isNested(cls));
  }

  protected onInterfaceMethod(_ifc: InterfaceType, method: Method): void {
    const returnType = method.returns
      ? this.typeresolver.toDartType(method.returns.type)
      : 'void';
    const nullable = method.returns?.optional ? '?' : '';
    const methodProps = this._renderMethodParameters(method);
    this.code.line(
      `${returnType}${nullable} ${this.nameutils.convertMethodName(
        method.name,
      )}(${methodProps});`,
    );
  }

  private _renderMethodParameters(_method: Method): string {
    return '';
  }

  private isNested(type: spec.Type): boolean {
    if (!this.assembly.types || !type.namespace) {
      return false;
    }
    const parent = `${type.assembly}.${type.namespace}`;
    return parent in this.assembly.types;
  }

  private _openFile(
    moduleName: string,
    objectName: string | undefined,
    isNested: boolean,
  ) {
    if (isNested) return;
    if (objectName === undefined) {
      objectName = path.join('lib', moduleName);
    } else {
      objectName = path.join('lib', 'src', objectName);
    }
    const fullPath = path.join(moduleName, toSnakeCase(objectName));
    this.code.openFile(`${fullPath}.dart`);
  }
  private _closeFile(
    moduleName: string,
    objectName: string | undefined,
    isNested: boolean,
  ) {
    if (isNested) return;
    if (objectName === undefined) {
      objectName = path.join('lib', moduleName);
    } else {
      objectName = path.join('lib', 'src', objectName);
    }
    const fullPath = path.join(moduleName, toSnakeCase(objectName));
    this.code.closeFile(`${fullPath}.dart`);
  }
  protected onInterfaceMethodOverload(
    _ifc: InterfaceType,
    _overload: Method,
    _originalMethod: Method,
  ): void {
    // console.log('onInterfaceMethodOverload', ifc, overload, originalMethod);
  }

  protected onInterfaceProperty(ifc: InterfaceType, prop: Property): void {
    // console.log('onInterfaceProperty', ifc, prop);
    if (!prop.abstract) {
      throw new Error(`Interface properties must be abstract: ${prop.name}`);
    }

    if (prop.protected) {
      throw new Error(
        `Protected properties are not allowed on interfaces: ${prop.name}`,
      );
    }

    if (prop.static) {
      throw new Error(
        `Property ${ifc.name}.${prop.name} is marked as static, but interfaces must not contain static members.`,
      );
    }
    this.dartDocGenerator.emitDocs(prop, {
      api: 'member',
      fqn: ifc.fqn,
      memberName: prop.name,
    });
  }

  protected onMethod(_cls: ClassType, method: Method): void {
    const returnType = method.returns
      ? this.typeresolver.toDartType(method.returns.type)
      : 'void';
    const staticKeyWord = method.static ? 'static ' : '';
    const methodName = this.nameutils.convertMethodName(method.name);
    const isOptional = method.returns && method.returns.optional ? '?' : '';
    const signature = `${returnType}${isOptional} ${methodName}(${this._renderMethodParameters(
      method,
    )})`;
    this.code.openBlock(`${staticKeyWord}${signature}`);
    this.code.closeBlock();
  }

  protected onMethodOverload(
    _cls: ClassType,
    _overload: Method,
    _originalMethod: Method,
  ): void {
    // console.log('onMethodOverload', _cls, _overload, _originalMethod);
  }

  protected onProperty(_cls: ClassType, _prop: Property): void {
    // console.log('onProperty', cls, prop);
  }

  protected onStaticMethod(_cls: ClassType, _method: Method): void {
    // console.log('onStaticMethod', cls, method);
  }

  protected onStaticMethodOverload(
    _cls: ClassType,
    _overload: Method,
    _originalMethod: Method,
  ): void {
    // console.log('onStaticMethodOverload', cls, overload, originalMethod);
  }

  protected onStaticProperty(_cls: ClassType, _prop: Property): void {
    // console.log('onStaticProperty', cls, prop);
  }

  protected onUnionProperty(
    _cls: ClassType,
    _prop: Property,
    _union: UnionTypeReference,
  ): void {
    // console.log('onUnionProperty', _cls, _prop, _union);
  }
}
