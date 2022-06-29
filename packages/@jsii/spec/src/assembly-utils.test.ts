import * as fs from 'fs-extra';
import * as path from 'path';
import { create } from 'tar';

import {
  SPEC_FILE_NAME,
  SPEC_FILE_NAME_COMPRESSED,
  Assembly,
  SchemaVersion,
} from './assembly';
import {
  loadAssemblyFromPath,
  getAssemblyFile,
  writeAssembly,
  loadAssemblyFromTarball,
} from './assembly-utils';
import { makeTempDir } from './utils';

const TEST_ASSEMBLY: Assembly = {
  schema: SchemaVersion.LATEST,
  name: 'jsii-test-dep',
  version: '1.2.4',
  license: 'Apache-2.0',
  description: 'A test assembly',
  homepage: 'https://github.com/aws/jsii',
  repository: { type: 'git', url: 'git://github.com/aws/jsii.git' },
  author: {
    name: 'Amazon Web Services',
    url: 'https://aws.amazon.com',
    organization: true,
    roles: ['author'],
  },
  fingerprint: 'F1NG3RPR1N7',
  dependencies: {
    'jsii-test-dep-dep': '3.2.1',
  },
  jsiiVersion: '1.0.0',
};

let tmpdir: string;
beforeEach(() => {
  tmpdir = makeTempDir();
});

afterEach(() => {
  fs.removeSync(tmpdir);
});

describe('writeAssembly', () => {
  test('can write compressed assembly', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: true });

    expect(
      fs.existsSync(path.join(tmpdir, SPEC_FILE_NAME_COMPRESSED)),
    ).toBeTruthy();

    // includes .jsii files with instructions for finding compressed file
    const instructions = fs.readJsonSync(path.join(tmpdir, SPEC_FILE_NAME), {
      encoding: 'utf-8',
    });
    expect(instructions).toEqual({
      schema: 'jsii/file-redirect',
      compression: 'gzip',
      filename: SPEC_FILE_NAME_COMPRESSED,
    });
  });

  test('can write uncompressed assembly', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: false });

    expect(fs.existsSync(path.join(tmpdir, SPEC_FILE_NAME))).toBeTruthy();
  });
});

describe('getAssemblyFile', () => {
  test('finds SPEC_FILE_NAME file when there is no compression', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: false });

    expect(getAssemblyFile(tmpdir)).toEqual(path.join(tmpdir, SPEC_FILE_NAME));
  });

  test('finds SPEC_FILE_NAME file even when there is compression', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: true });

    expect(getAssemblyFile(tmpdir)).toEqual(path.join(tmpdir, SPEC_FILE_NAME));
  });

  test('throws if SPEC_FILE_NAME file does not exist', () => {
    expect(() => getAssemblyFile(tmpdir)).toThrow(
      `Expected to find ${SPEC_FILE_NAME} file in ${tmpdir}, but no such file found`,
    );
  });
});

describe('loadAssemblyFromPath', () => {
  test('loads compressed assembly', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: true });

    expect(loadAssemblyFromPath(tmpdir)).toEqual(TEST_ASSEMBLY);
  });

  test('loads uncompressed assembly', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: false });

    expect(loadAssemblyFromPath(tmpdir)).toEqual(TEST_ASSEMBLY);
  });

  test('compressed and uncompressed assemblies are loaded identically', () => {
    const compressedTmpDir = makeTempDir();
    const uncompressedTmpDir = makeTempDir();

    writeAssembly(compressedTmpDir, TEST_ASSEMBLY, { compress: true });
    writeAssembly(uncompressedTmpDir, TEST_ASSEMBLY, { compress: false });

    expect(loadAssemblyFromPath(compressedTmpDir)).toEqual(
      loadAssemblyFromPath(uncompressedTmpDir),
    );

    fs.removeSync(compressedTmpDir);
    fs.removeSync(uncompressedTmpDir);
  });

  test('throws if redirect schema is invalid', () => {
    fs.writeJsonSync(path.join(tmpdir, SPEC_FILE_NAME), {
      schema: 'jsii/file-redirect',
      compression: '7zip',
    });

    expect(() => loadAssemblyFromPath(tmpdir)).toThrow(
      [
        'Invalid redirect schema:',
        "  compression must be 'gzip' but received '7zip'",
        "  schema must include property 'filename'",
      ].join('\n'),
    );
  });

  test('throws if assembly is invalid', () => {
    fs.writeJsonSync(
      path.join(tmpdir, SPEC_FILE_NAME),
      {
        assembly: 'not a valid assembly',
      },
      {
        encoding: 'utf8',
        spaces: 2,
      },
    );

    expect(() => loadAssemblyFromPath(tmpdir)).toThrow(/Invalid assembly/);
  });
});

describe('loadAssemblyFromTarball', () => {
  test('loads uncompressed assembly', () => {
    writeAssembly(tmpdir, TEST_ASSEMBLY, { compress: false });
    const tarball = path.join(tmpdir, 'tar.tgz');
    create(
      {
        file: tarball,
        sync: true,
      },
      [tmpdir],
    );

    expect(loadAssemblyFromTarball(tarball, tmpdir)).toEqual(TEST_ASSEMBLY);
  });
});
