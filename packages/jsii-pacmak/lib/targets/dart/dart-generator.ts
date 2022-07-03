import * as spec from '@jsii/spec';
import {
  Assembly,
  ClassType,
  Initializer,
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
import { DartDocGenerator } from './dart-doc-generator';
import { DartTypeResolver } from './dart-type-resolver';
import { DartNameUtils } from './name-utils';

const DART_DEBUG_MODE = true;

export class DartGenerator extends Generator {
  private resolver!: DartTypeResolver;

  private readonly utils: DartNameUtils = new DartNameUtils();
  private dartDocGenerator!: DartDocGenerator;
  private readonly _savedNestedInterfaces: InterfaceType[] = [];

  public constructor(
    private readonly assembliesCurrentlyBeingCompiled: string[],
    private readonly rosetta: RosettaTabletReader,
  ) {
    super();
  }

  private debug(msg: string): void {
    if (!DART_DEBUG_MODE) return;

    return this.code.line(`/// ${msg}`);
  }

  public generate(fingerprint: boolean) {
    /*this.dartRuntimeGenerator = new DartRuntimeGenerator(
      this.code,
      this.resolver,
    );*/
    this.dartDocGenerator = new DartDocGenerator(
      this.code,
      this.rosetta,
      this.assembly,
    );
    this.resolver = new DartTypeResolver(
      this.assembly,
      (fqn: string) => this.findModule(fqn),
      (fqn: string) => this.findType(fqn),
      this.assembliesCurrentlyBeingCompiled,
    );
    this.resolver.resolveNamespacesDependencies();
    super.generate(fingerprint);
  }

  public async load(
    packageRoot: string,
    assembly: reflect.Assembly,
  ): Promise<void> {
    await super.load(packageRoot, assembly);
  }

  public async save(
    outDir: string,
    // tarball: string,
    // { license, notice }: Legalese,
  ): Promise<string[]> {
    // filegen.generateProjectFile(this.resolver.namespaceDependencies);
    const assembly = this.assembly;
    const pubName: string = assembly.targets!.dart!.pubName;
    // if (!pubName) {
    //   throw new Error(
    //     `The module ${assembly.name} does not have a Dart pubName setting`,
    //   );
    // }
    await fs.mkdirp(path.join(outDir, pubName));

    // Saving the generated code.
    return this.code.save(outDir);
  }

  protected onBeginAssembly(assembly: Assembly, _fingerprint: boolean) {
    this.resolver.resolveNamespacesDependencies();
    // Create the pubspec.yaml
    const globalPubSpecPath = 'pubspec.yaml';
    const pubName: string = assembly.targets?.dart?.pubName;
    this._writeStringToFile(
      YAML.stringify({
        name: pubName,
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
      if (this.resolver.findModule(_jsiiNs)) {
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
    const implementations = this.resolver.resolveImplementedInterfaces(ifc);
    const interfaceName = this.utils.convertInterfaceName(ifc);
    this._openFile(ifc.namespace ?? '', interfaceName, this.isNested(ifc));
    if (this.isNested(ifc)) {
      this._savedNestedInterfaces.push(ifc);
      return;
    }
    this.debug(`onBeginInterface ${ifc.name}`);

    this.code.line();
    this.dartDocGenerator.emitDocs(ifc, { api: 'type', fqn: ifc.fqn });
    // this.dartRuntimeGenerator.emitAttributesForInterface(ifc);
    let implementsStr = '';
    if (implementations.length > 0) {
      implementsStr = `implements ${implementations.join(', ')}`;
    }
    this.code.openBlock(`abstract class ${interfaceName} ${implementsStr}`);
  }
  protected onEndInterface(ifc: InterfaceType): void {
    this.debug(`onEndInterface ${ifc.name}`);
    if (this.isNested(ifc)) {
      return;
    }
    if (this.isNested(ifc)) return;
    this.code.closeBlock();
    const interfaceName = this.utils.convertInterfaceName(ifc);
    this._closeFile(ifc.namespace ?? '', interfaceName, this.isNested(ifc));
  }

  protected onBeginClass(cls: spec.ClassType, abstract: boolean) {
    let baseTypeNames: string[] = [];
    const className = this.utils.convertClassName(cls);
    const moduleName = cls.namespace ?? toSnakeCase(cls.assembly);
    this._openFile(moduleName, className, this.isNested(cls));
    if (this.isNested(cls)) return;
    this.debug(`onBeginClass ${cls.name}`);
    const absPrefix = abstract ? 'abstract ' : '';
    if (cls.interfaces && cls.interfaces.length > 0) {
      const implementations = this.resolver.resolveImplementedInterfaces(cls);
      baseTypeNames = baseTypeNames.concat(implementations);
    }
    this.dartDocGenerator.emitDocs(cls, {
      api: 'type',
      fqn: cls.fqn,
    });
    const implementsExpr = ` implements ${baseTypeNames.join(', ')}`;
    this.code.openBlock(`${absPrefix}class ${className}${implementsExpr}`);
  }
  protected onEndClass(cls: spec.ClassType) {
    this.debug(`onEndClass ${cls.name}`);
    this.code.closeBlock();

    // Now we print off a bunch of classes to use as interfaces
    for (const intType of this._savedNestedInterfaces) {
      this.code.openBlock(`class ${intType.name}`);
      this.code.closeBlock();
    }

    const className = this.utils.convertClassName(cls);
    const moduleName = cls.namespace ?? toSnakeCase(cls.assembly);
    this._closeFile(moduleName, className, this.isNested(cls));
  }

  protected onInterfaceMethod(ifc: InterfaceType, method: Method): void {
    this.debug(`onInterfaceMethod ${ifc.name}.${method.name}`);
    const returnType = method.returns
      ? this.resolver.toDartType(method.returns.type)
      : 'void';
    const nullable = method.returns?.optional ? '?' : '';
    const methodProps = DartGenerator.#_renderMethodParameters(method);
    this.code.line(
      `${returnType}${nullable} ${this.utils.convertMethodName(
        method.name,
      )}(${methodProps});`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  static #_renderMethodParameters(_method: Method): string {
    return '';
  }

  private _getProperty(prop: Property): string {
    const returnDartType = this.resolver.toDartType(prop.type);
    const optional = prop.optional ? '?' : '';
    return `${returnDartType}${optional} ${prop.name}`;
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
    this.debug(`onInterfaceMethodOverload ${_overload.name}`);
  }

  protected onInterfaceProperty(ifc: InterfaceType, prop: Property): void {
    this.debug(`onInterfaceProperty ${prop.name}`);
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
    this.debug(`onMethod ${method.name}`);
    const returnType = method.returns
      ? this.resolver.toDartType(method.returns.type)
      : 'void';
    const staticKeyWord = method.static ? 'const ' : '';
    const methodName = this.utils.convertMethodName(method.name);
    const isOptional = method.returns && method.returns.optional ? '?' : '';
    const signature = `${returnType}${isOptional} ${methodName}(${DartGenerator.#_renderMethodParameters(
      method,
    )})`;
    this.code.openBlock(`${staticKeyWord}${signature}`);
    if (returnType !== 'void') {
      this.code.line(`return ${returnType}();`);
    }
    this.code.closeBlock();
  }

  protected onMethodOverload(
    cls: ClassType,
    _overload: Method,
    _originalMethod: Method,
  ): void {
    this.debug('onMethodOverload');
    this._doMethod(cls, _originalMethod, _overload);
  }

  protected onProperty(_cls: ClassType, prop: Property): void {
    this.debug(`onProperty ${prop.name}`);
    const props = this._getProperty(prop);
    this.code.line(`static ${props};`);
  }

  protected onInitializer(cls: ClassType, _initializer: Initializer) {
    this.debug(`onInitializer ${cls.name}`);
    const className = this.utils.convertClassName(cls);
    this.code.line(`${className}();`);
  }

  protected onStaticMethod(cls: ClassType, method: Method): void {
    this.debug(`onStaticMethod ${cls.name}.${method.name}`);
    this._doMethod(cls, method);
  }

  protected onStaticMethodOverload(
    _cls: ClassType,
    _overload: Method,
    _originalMethod: Method,
  ): void {
    this.debug(`onStaticMethodOverload ${_overload.name}`);
    // this._doMethod(cls, method, undefined, true);
  }

  protected onStaticProperty(_cls: ClassType, prop: Property): void {
    this.debug(`onStaticProperty ${prop.name}`);
    const props = this._getProperty(prop);
    const defaultValue = `''`;
    this.code.line(`static ${props} = ${defaultValue};`);
  }

  protected onUnionProperty(
    _cls: ClassType,
    prop: Property,
    _union: UnionTypeReference,
  ): void {
    this.debug(`onUnionProperty ${prop.name}`);
    // const unTypes = union?.union?.types ?? [];
    // const props = unTypes.map((value) => {
    //   return this.resolver.toDartType(value);
    // });
    // this.code.line(`${prop.name} ${props.join(' | ')}`);
  }

  private _doMethod(
    _parentType: ClassType | InterfaceType,
    _method: Method,
    _overloadMethod: Method | undefined = undefined,
  ): void {
    this.debug('_doMethod');
  }
}
