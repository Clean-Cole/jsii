import * as spec from '@jsii/spec';

import { ObjectTable } from './objects';
import { process, SerializerHost, SerializationClass } from './serialization';

// Remove unnecessary double-quoting of snapshots in this file
expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string',
  print: (value) => value as string,
});

const findSymbol: jest.MockedFn<SerializerHost['findSymbol']> = jest
  .fn()
  .mockName('SerializerHost.findSymbol');
const lookupType: jest.MockedFn<SerializerHost['lookupType']> = jest
  .fn()
  .mockName('SerializerHost.lookupType');

const objects = new ObjectTable(lookupType);
const host: SerializerHost = {
  debug: () => void undefined,
  findSymbol,
  lookupType,
  objects,
};

describe('serialize errors', () => {
  describe(SerializationClass.Array, () => {
    const arrayType: spec.OptionalValue = {
      optional: false,
      type: {
        collection: {
          kind: spec.CollectionKind.Array,
          elementtype: { primitive: spec.PrimitiveType.Number },
        },
      },
    };

    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'serialize',
          "I'm array-like, but not quite an array",
          arrayType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is a string
              │      "I'm array-like, but not quite an array"
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an array
          `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'serialize', 1337, arrayType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is a number
              │      1337
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an array
          `);
    });

    test('when provided with a date', () => {
      expect(() =>
        process(host, 'serialize', new Date(65_535), arrayType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is an instance of Date
              │      1970-01-01T00:01:05.535Z
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an array
          `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'serialize',
          { this: ['is', 'not', 'an', 'Array'] },
          arrayType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is an object
              │      { this: [Array] }
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an array
          `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'serialize', undefined, arrayType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is undefined
              ╰── 🔍 Failure reason(s):
                  ╰─ A value is required (type is non-optional)
          `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'serialize', null, arrayType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is null
              ╰── 🔍 Failure reason(s):
                  ╰─ A value is required (type is non-optional)
          `);
    });

    test('when provided with an array including a bad value', () => {
      expect(() =>
        process(host, 'serialize', ['Not a number'], arrayType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as array<number>
              ├── 🛑 Failing value is an array
              │      [ 'Not a number' ]
              ╰── 🔍 Failure reason(s):
                  ╰─ Index 0: Unable to serialize value as number
                      ├── 🛑 Failing value is a string
                      │      'Not a number'
                      ╰── 🔍 Failure reason(s):
                          ╰─ Value is not a number
          `);
    });
  });

  describe(SerializationClass.Date, () => {
    const dateType: spec.OptionalValue = {
      optional: false,
      type: {
        primitive: spec.PrimitiveType.Date,
      },
    };

    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'serialize',
          "I'm array-like, but not quite an array",
          dateType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as date
              ├── 🛑 Failing value is a string
              │      "I'm array-like, but not quite an array"
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an instance of Date
          `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'serialize', 1337, dateType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as date
              ├── 🛑 Failing value is a number
              │      1337
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an instance of Date
          `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'serialize',
          { this: ['is', 'not', 'an', 'Array'] },
          dateType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as date
              ├── 🛑 Failing value is an object
              │      { this: [Array] }
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an instance of Date
          `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'serialize', undefined, dateType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as date
              ├── 🛑 Failing value is undefined
              ╰── 🔍 Failure reason(s):
                  ╰─ A value is required (type is non-optional)
          `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'serialize', null, dateType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as date
              ├── 🛑 Failing value is null
              ╰── 🔍 Failure reason(s):
                  ╰─ A value is required (type is non-optional)
          `);
    });

    test('when provided with an array', () => {
      expect(() =>
        process(host, 'serialize', ['Not a number'], dateType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as date
              ├── 🛑 Failing value is an array
              │      [ 'Not a number' ]
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an instance of Date
          `);
    });
  });

  describe(SerializationClass.Enum, () => {
    const ENUM_TYPE_FQN = 'phony.module.EnumType';
    const ENUM_TYPE: spec.EnumType = {
      assembly: 'phony',
      fqn: ENUM_TYPE_FQN,
      kind: spec.TypeKind.Enum,
      members: [],
      name: 'EnumType',
      namespace: 'module',
    };
    const ENUM_MAP = {} as const;
    const enumType: spec.OptionalValue = {
      optional: false,
      type: { fqn: ENUM_TYPE_FQN },
    };

    beforeEach((done) => {
      lookupType.mockImplementation((fqn) => {
        expect(fqn).toBe(ENUM_TYPE_FQN);
        return ENUM_TYPE;
      });
      findSymbol.mockImplementation((fqn) => {
        expect(fqn).toBe(ENUM_TYPE_FQN);
        return ENUM_MAP;
      });
      done();
    });

    test('when provided with a string that is not in the enum', () => {
      expect(() =>
        process(
          host,
          'serialize',
          "I'm array-like, but not quite an array",
          enumType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is a string
        │      "I'm array-like, but not quite an array"
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not present in enum phony.module.EnumType
      `);
    });

    test('when provided with a number that is not in the enum', () => {
      expect(() => process(host, 'serialize', 1337, enumType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not present in enum phony.module.EnumType
      `);
    });

    test('when provided with a date', () => {
      expect(() =>
        process(host, 'serialize', new Date(65_535), enumType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is an instance of Date
        │      1970-01-01T00:01:05.535Z
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string or number
      `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'serialize',
          { this: ['is', 'not', 'an', 'Array'] },
          enumType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string or number
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'serialize', undefined, enumType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'serialize', null, enumType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array including a bad value', () => {
      expect(() =>
        process(host, 'serialize', ['Not a number'], enumType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as phony.module.EnumType
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string or number
      `);
    });
  });

  describe(SerializationClass.Json, () => {
    const jsonType: spec.OptionalValue = {
      optional: false,
      type: {
        primitive: spec.PrimitiveType.Json,
      },
    };

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'serialize', undefined, jsonType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as json
              ├── 🛑 Failing value is undefined
              ╰── 🔍 Failure reason(s):
                  ╰─ A value is required (type is non-optional)
          `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'serialize', null, jsonType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as json
              ├── 🛑 Failing value is null
              ╰── 🔍 Failure reason(s):
                  ╰─ A value is required (type is non-optional)
          `);
    });
  });

  describe(SerializationClass.Map, () => {
    const mapType: spec.OptionalValue = {
      optional: false,
      type: {
        collection: {
          kind: spec.CollectionKind.Map,
          elementtype: { primitive: spec.PrimitiveType.Number },
        },
      },
    };
    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'serialize',
          "I'm array-like, but not quite an array",
          mapType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as map<number>
              ├── 🛑 Failing value is a string
              │      "I'm array-like, but not quite an array"
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an object
          `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'serialize', 1337, mapType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as map<number>
              ├── 🛑 Failing value is a number
              │      1337
              ╰── 🔍 Failure reason(s):
                  ╰─ Value is not an object
          `);
    });

    test('when provided with an object with invalid values', () => {
      expect(() =>
        process(
          host,
          'serialize',
          { this: ['is', 'not', 'an', 'Array'] },
          mapType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
              Dummy value: Unable to serialize value as map<number>
              ├── 🛑 Failing value is an object
              │      { this: [Array] }
              ╰── 🔍 Failure reason(s):
                  ╰─ Key 'this': Unable to serialize value as number
                      ├── 🛑 Failing value is an array
                      │      [ 'is', 'not', 'an', 'Array' ]
                      ╰── 🔍 Failure reason(s):
                          ╰─ Value is not a number
          `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'serialize', undefined, mapType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as map<number>
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'serialize', null, mapType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as map<number>
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array', () => {
      expect(() =>
        process(host, 'serialize', ['Not a number'], mapType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as map<number>
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value is an array
      `);
    });
  });

  describe(SerializationClass.Scalar, () => {
    const stringType: spec.OptionalValue = {
      optional: false,
      type: {
        primitive: spec.PrimitiveType.String,
      },
    };

    test('when provided with a number', () => {
      expect(() => process(host, 'serialize', 1337, stringType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as string
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string
      `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'serialize',
          { this: ['is', 'not', 'an', 'Array'] },
          stringType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as string
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'serialize', undefined, stringType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as string
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'serialize', null, stringType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as string
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array', () => {
      expect(() =>
        process(host, 'serialize', ['Not a number'], stringType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to serialize value as string
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string
      `);
    });
  });
});

describe('deserialize errors', () => {
  describe(SerializationClass.Array, () => {
    const arrayType: spec.OptionalValue = {
      optional: false,
      type: {
        collection: {
          kind: spec.CollectionKind.Array,
          elementtype: { primitive: spec.PrimitiveType.Number },
        },
      },
    };

    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          "I'm array-like, but not quite an array",
          arrayType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is a string
        │      "I'm array-like, but not quite an array"
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not an array
      `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'deserialize', 1337, arrayType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not an array
      `);
    });

    test('when provided with a date', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          new Date(65_535),
          arrayType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is an instance of Date
        │      1970-01-01T00:01:05.535Z
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not an array
      `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          { this: ['is', 'not', 'an', 'Array'] },
          arrayType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not an array
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'deserialize', undefined, arrayType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'deserialize', null, arrayType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array including a bad value', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          ['Not a number'],
          arrayType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as array<number>
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Index 0: Unable to deserialize value as number
                ├── 🛑 Failing value is a string
                │      'Not a number'
                ╰── 🔍 Failure reason(s):
                    ╰─ Value is not a number
      `);
    });
  });

  describe(SerializationClass.Date, () => {
    const dateType: spec.OptionalValue = {
      optional: false,
      type: {
        primitive: spec.PrimitiveType.Date,
      },
    };

    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          "I'm array-like, but not quite an array",
          dateType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as date
        ├── 🛑 Failing value is a string
        │      "I'm array-like, but not quite an array"
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.date" key
      `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'deserialize', 1337, dateType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as date
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.date" key
      `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          { this: ['is', 'not', 'an', 'Array'] },
          dateType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as date
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.date" key
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'deserialize', undefined, dateType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as date
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'deserialize', null, dateType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as date
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array', () => {
      expect(() =>
        process(host, 'deserialize', ['Not a number'], dateType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as date
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.date" key
      `);
    });
  });

  describe(SerializationClass.Enum, () => {
    const ENUM_TYPE_FQN = 'phony.module.EnumType';
    const ENUM_TYPE: spec.EnumType = {
      assembly: 'phony',
      fqn: ENUM_TYPE_FQN,
      kind: spec.TypeKind.Enum,
      members: [],
      name: 'EnumType',
      namespace: 'module',
    };
    const ENUM_MAP = {} as const;
    const enumType: spec.OptionalValue = {
      optional: false,
      type: { fqn: ENUM_TYPE_FQN },
    };

    beforeEach((done) => {
      lookupType.mockImplementation((fqn) => {
        expect(fqn).toBe(ENUM_TYPE_FQN);
        return ENUM_TYPE;
      });
      findSymbol.mockImplementation((fqn) => {
        expect(fqn).toBe(ENUM_TYPE_FQN);
        return ENUM_MAP;
      });
      done();
    });

    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          "I'm array-like, but not quite an array",
          enumType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is a string
        │      "I'm array-like, but not quite an array"
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.enum" key
      `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'deserialize', 1337, enumType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.enum" key
      `);
    });

    test('when provided with a date', () => {
      expect(() =>
        process(host, 'deserialize', new Date(65_535), enumType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is an instance of Date
        │      1970-01-01T00:01:05.535Z
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.enum" key
      `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          { this: ['is', 'not', 'an', 'Array'] },
          enumType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.enum" key
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'deserialize', undefined, enumType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'deserialize', null, enumType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array including a bad value', () => {
      expect(() =>
        process(host, 'deserialize', ['Not a number'], enumType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as phony.module.EnumType
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value does not have the "$jsii.enum" key
      `);
    });
  });

  describe(SerializationClass.Json, () => {
    const jsonType: spec.OptionalValue = {
      optional: false,
      type: {
        primitive: spec.PrimitiveType.Json,
      },
    };

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'deserialize', undefined, jsonType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as json
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'deserialize', null, jsonType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as json
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });
  });

  describe(SerializationClass.Map, () => {
    const mapType: spec.OptionalValue = {
      optional: false,
      type: {
        collection: {
          kind: spec.CollectionKind.Map,
          elementtype: { primitive: spec.PrimitiveType.Number },
        },
      },
    };
    test('when provided with a string', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          "I'm array-like, but not quite an array",
          mapType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as map<number>
        ├── 🛑 Failing value is a string
        │      "I'm array-like, but not quite an array"
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not an object
      `);
    });

    test('when provided with a number', () => {
      expect(() => process(host, 'deserialize', 1337, mapType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as map<number>
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not an object
      `);
    });

    test('when provided with an object with invalid values', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          { this: ['is', 'not', 'an', 'Array'] },
          mapType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as map<number>
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Key 'this': Unable to deserialize value as number
                ├── 🛑 Failing value is an array
                │      [ 'is', 'not', 'an', 'Array' ]
                ╰── 🔍 Failure reason(s):
                    ╰─ Value is not a number
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'deserialize', undefined, mapType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as map<number>
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() => process(host, 'deserialize', null, mapType, `dummy value`))
        .toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as map<number>
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array', () => {
      expect(() =>
        process(host, 'deserialize', ['Not a number'], mapType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as map<number>
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value is an array
      `);
    });
  });

  describe(SerializationClass.Scalar, () => {
    const stringType: spec.OptionalValue = {
      optional: false,
      type: {
        primitive: spec.PrimitiveType.String,
      },
    };

    test('when provided with a number', () => {
      expect(() =>
        process(host, 'deserialize', 1337, stringType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as string
        ├── 🛑 Failing value is a number
        │      1337
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string
      `);
    });

    test('when provided with an object', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          { this: ['is', 'not', 'an', 'Array'] },
          stringType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as string
        ├── 🛑 Failing value is an object
        │      { this: [Array] }
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string
      `);
    });

    test('when provided with undefined', () => {
      expect(() =>
        process(host, 'deserialize', undefined, stringType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as string
        ├── 🛑 Failing value is undefined
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with null', () => {
      expect(() =>
        process(host, 'deserialize', null, stringType, `dummy value`),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as string
        ├── 🛑 Failing value is null
        ╰── 🔍 Failure reason(s):
            ╰─ A value is required (type is non-optional)
      `);
    });

    test('when provided with an array', () => {
      expect(() =>
        process(
          host,
          'deserialize',
          ['Not a number'],
          stringType,
          `dummy value`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        Dummy value: Unable to deserialize value as string
        ├── 🛑 Failing value is an array
        │      [ 'Not a number' ]
        ╰── 🔍 Failure reason(s):
            ╰─ Value is not a string
      `);
    });
  });
});
