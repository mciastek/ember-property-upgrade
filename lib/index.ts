import generate from '@babel/generator';

import {
  parse,
  ParserOptions,
} from '@babel/parser';

import traverse, { Node, NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import prettier, { Options as PrettierOptions } from 'prettier';

export interface TransformOptions {
  packageName: string;
  computedFunName: string;
  iteratorMethodNames: string[];
  autoFormat: boolean;
  autoFormatOptions?: PrettierOptions;
}

const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
};

const TRANSFORM_OPTIONS: TransformOptions = {
  packageName: 'Ember',
  computedFunName: 'computed',
  iteratorMethodNames: ['map', 'filter', 'sort'],
  autoFormat: true,
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

export const transform = (input: string, settings = {}) => {
  const ast = parse(input, DEFAULT_PARSER_OPTIONS);
  const options = {
    ...TRANSFORM_OPTIONS,
    settings,
  };

  let callExpression: t.CallExpression;
  let propertyArgs;

  traverse(ast, {
    Identifier(path: NodePath<t.Identifier>) {
      if (path.node.name === 'property') {
        callExpression = path.parentPath.parent as t.CallExpression;
        propertyArgs = callExpression.arguments;

        // @ts-ignore
        const expressionBody = callExpression.callee.object;
        const pathToReplace = path.parentPath.parentPath;

        if (isIteratorCallExpression(expressionBody, options)) {
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
        } else if (isComputedExpression(expressionBody, options)) {
          expressionBody.arguments.unshift(...propertyArgs);

          pathToReplace.replaceWith(
            expressionBody,
          );
        } else {
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
        }
      }
    },
  });

  const { code } = generate(ast);

  if (options.autoFormat) {
    const formattedCode = prettier.format(code, options.autoFormatOptions);

    return formattedCode;
  }

  return code;
};
