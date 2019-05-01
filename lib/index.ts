import {
  parse,
  ParserOptions,
} from '@babel/parser';

import traverse, { Node, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import recast from 'recast';

import prettier, { Options as PrettierOptions } from 'prettier';

export interface TransformOptions {
  packageName: string;
  computedFunName: string;
  iteratorMethodNames: string[];
  autoFormat: boolean;
  autoFormatOptions?: PrettierOptions;
}

export type Options = Partial<TransformOptions>;

interface UpdateParams<N> {
  pathToReplace: NodePath<N>;
  expressionBody: any; // tslint:disable-line no-any
  propertyArgs: t.Identifier[];
  options: TransformOptions;
}

const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
};

const TRANSFORM_OPTIONS: TransformOptions = {
  packageName: 'Ember',
  computedFunName: 'computed',
  iteratorMethodNames: ['map', 'filter', 'sort'],
  autoFormat: false,
  autoFormatOptions: {
    parser: 'babel',
  },
};

const isIteratorCallExpression = (
  node: Node,
  transformOptions: TransformOptions,
) => {
  const computedCallExpression = (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    transformOptions.iteratorMethodNames.includes(node.callee.name)
  );

  const computedMemberExpression = (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    // @ts-ignore
    node.callee.object.name === transformOptions.packageName &&
    transformOptions.iteratorMethodNames.includes(node.callee.property.name)
  );

  return computedCallExpression || computedMemberExpression;
};

const isComputedExpression = (
  node: Node,
  transformOptions: TransformOptions,
) => {
  const computedCallExpression = (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === transformOptions.computedFunName
  );

  const computedMemberExpression = (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    // @ts-ignore
    node.callee.object.name === transformOptions.packageName &&
    node.callee.property.name === transformOptions.computedFunName
  );

  return computedCallExpression || computedMemberExpression;
};

const updateIteratorCall = ({
  pathToReplace,
  expressionBody,
  propertyArgs,
}: UpdateParams<t.Node>) => {
  const computedArray = t.arrayExpression(
    propertyArgs as t.Identifier[],
  );

  expressionBody.arguments.splice(
    expressionBody.arguments.length - 1,
    0,
    computedArray,
  );

  pathToReplace.replaceWith(
    expressionBody,
  );
};

const updateComputedCall = ({
  pathToReplace,
  expressionBody,
  propertyArgs,
}: UpdateParams<t.Node>) => {
  expressionBody.arguments.unshift(...propertyArgs);

  pathToReplace.replaceWith(
    expressionBody,
  );
};

const updateCall = ({
  pathToReplace,
  expressionBody,
  propertyArgs,
  options,
}: UpdateParams<t.Node>) => {
  pathToReplace.replaceWith(t.callExpression(
    t.memberExpression(
      t.identifier(options.packageName),
      t.identifier(options.computedFunName),
    ),
    [
      ...propertyArgs,
      expressionBody,
    ],
  ));
};

const updateForProperties = (
  path: NodePath<t.Identifier>,
  options: TransformOptions,
) => {
  const callExpression = path.parentPath.parent as t.CallExpression;
  const propertyArgs = callExpression.arguments;

  // @ts-ignore
  const expressionBody = callExpression.callee.object;
  const pathToReplace = path.parentPath.parentPath;

  const updateParams: UpdateParams<t.Node> = {
    pathToReplace,
    expressionBody,
    propertyArgs: propertyArgs as t.Identifier[],
    options,
  };

  if (isIteratorCallExpression(expressionBody, options)) {
    updateIteratorCall(updateParams);
  } else if (isComputedExpression(expressionBody, options)) {
    updateComputedCall(updateParams);
  } else {
    updateCall(updateParams);
  }
};

export const transform = (input: string, settings: Options = {}) => {
  let canTransform = false;

  const ast = recast.parse(input, {
    parser: {
      // tslint:disable-next-line no-any
      parse: (source: any) => parse(source, DEFAULT_PARSER_OPTIONS),
    },
  });

  const options: TransformOptions = {
    ...TRANSFORM_OPTIONS,
    ...settings,
    autoFormatOptions: {
      ...TRANSFORM_OPTIONS.autoFormatOptions,
      ...settings.autoFormatOptions,
    },
  };

  traverse(ast, {
    Identifier(path: NodePath<t.Identifier>) {
      if (path.node.name === 'property') {
        updateForProperties(path, options);
        canTransform = true;
      }
    },
  });

  if (!canTransform) {
    return '';
  }

  const { code } = recast.print(ast);

  if (options.autoFormat) {
    const formattedCode = prettier.format(code, options.autoFormatOptions);

    return formattedCode;
  }

  return code;
};
