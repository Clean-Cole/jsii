import * as fs from 'fs-extra';
import * as path from 'path';
import * as zlib from 'zlib';

import {
  Assembly,
  SPEC_FILE_NAME,
  SPEC_FILE_NAME_COMPRESSED,
} from './assembly';
import { validateAssembly } from './validate-assembly';

/**
 * Finds the path to the SPEC_FILE_NAME file, which will either
 * be the assembly or hold instructions to find the assembly.
 *
 * @param directory path to a directory with an assembly file
 * @returns path to the SPEC_FILE_NAME file
 */
export function getAssemblyFile(directory: string) {
  const dotJsiiFile = path.join(directory, SPEC_FILE_NAME);

  if (!fs.existsSync(dotJsiiFile)) {
    throw new Error(
      `Expected to find ${SPEC_FILE_NAME} file in ${directory}, but no such file found`,
    );
  }

  return dotJsiiFile;
}

/**
 * Writes the assembly file either as .jsii or .jsii.gz if zipped
 *
 * @param directory the directory path to place the assembly file
 * @param assembly the contents of the assembly
 * @param compress whether or not to zip the assembly (.jsii.gz)
 * @returns whether or not the assembly was zipped
 */
export function writeAssembly(
  directory: string,
  assembly: Assembly,
  { compress = false }: { compress?: boolean } = {},
) {
  if (compress) {
    // write .jsii file with instructions on opening the compressed file
    fs.writeJsonSync(path.join(directory, SPEC_FILE_NAME), {
      schema: 'jsii/file-redirect',
      compression: 'gzip',
      filename: SPEC_FILE_NAME_COMPRESSED,
    });

    // write actual assembly contents in .jsii.gz
    fs.writeFileSync(
      path.join(directory, SPEC_FILE_NAME_COMPRESSED),
      zlib.gzipSync(JSON.stringify(assembly)),
    );
  } else {
    fs.writeJsonSync(path.join(directory, SPEC_FILE_NAME), assembly, {
      encoding: 'utf8',
      spaces: 2,
    });
  }

  return compress;
}

/**
 * Parses the assembly buffer and, if instructed to, redirects to the
 * compressed assembly buffer.
 *
 * @param assemblyBuffer buffer containing SPEC_FILE_NAME contents
 * @param compressed properties necessary for handling compressed assemblies
 * @param validate whether or not to validate the assembly
 */
export function loadAssemblyFromBuffer(
  assemblyBuffer: Buffer,
  compressed?: {
    /** path to the assembly file */
    pathToAssembly: string;
    /** function which returns the compressed assembly buffer */
    compressedAssemblyCb: (filename: string) => Buffer;
  },
  validate = true,
): Assembly {
  let contents = JSON.parse(assemblyBuffer.toString('utf-8'));

  // check if the file holds instructions to the actual assembly file
  if (isRedirect(contents)) {
    if (!compressed) {
      throw new Error(
        `The assembly buffer redirects to a compressed assembly but no compressed assembly was found.`,
      );
    }
    contents = findRedirectAssembly(
      compressed.pathToAssembly,
      contents,
      compressed.compressedAssemblyCb,
    );
  } else if (compressed) {
    console.warn(
      '[WARNING]',
      `${SPEC_FILE_NAME} is does not redirect to a compressed assembly but the 'compressed' property was passed`,
    );
  }

  return validate ? validateAssembly(contents) : (contents as Assembly);
}

/**
 * Loads the assembly file and, if present, follows instructions
 * found in the file to unzip compressed assemblies.
 *
 * @param directory the directory of the assembly file
 * @param validate whether to validate the contents of the file
 * @returns the assembly file as an Assembly object
 */
export function loadAssemblyFromPath(
  directory: string,
  validate = true,
): Assembly {
  const assemblyFile = getAssemblyFile(directory);
  return loadAssemblyFromFile(assemblyFile, validate);
}

/**
 * Loads the assembly file and, if present, follows instructions
 * found in the file to unzip compressed assemblies.
 *
 * @param pathToFile the path to the SPEC_FILE_NAME file
 * @param validate whether to validate the contents of the file
 * @returns the assembly file as an Assembly object
 */
export function loadAssemblyFromFile(
  pathToFile: string,
  validate = true,
): Assembly {
  let contents = readAssembly(pathToFile);

  // check if the file holds instructions to the actual assembly file
  if (isRedirect(contents)) {
    contents = findRedirectAssembly(
      pathToFile,
      contents,
      (filename: string) => {
        return fs.readFileSync(filename);
      },
    );
  }

  return validate ? validateAssembly(contents) : (contents as Assembly);
}

function isRedirect(contents: any): boolean {
  return contents.schema === 'jsii/file-redirect';
}

function readAssembly(pathToFile: string) {
  return fs.readJsonSync(pathToFile, {
    encoding: 'utf-8',
  });
}

function findRedirectAssembly(
  pathToFile: string,
  contents: Record<string, string>,
  cb: (filename: string) => Buffer,
) {
  validateRedirectSchema(contents);
  const redirectAssemblyFile = path.join(
    path.dirname(pathToFile),
    contents.filename,
  );
  return JSON.parse(zlib.gunzipSync(cb(redirectAssemblyFile)).toString());
}

function validateRedirectSchema(contents: Record<string, string>) {
  const errors = [];
  if (contents.compression !== 'gzip') {
    errors.push(
      `compression must be 'gzip' but received '${contents.compression}'`,
    );
  }
  if (contents.filename === undefined) {
    errors.push("schema must include property 'filename'");
  }

  if (errors.length !== 0) {
    throw new Error(`Invalid redirect schema:\n  ${errors.join('\n  ')}`);
  }
}
