import generate from '@babel/generator';

import {
  parse,
  ParserOptions,
} from '@babel/parser';

import traverse, { Node, NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export interface TransformOptions {
  packageName: string;
  computedFunName: string;
}

const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
};

const TRANSFORM_OPTIONS: TransformOptions = {
  packageName: 'Ember',
  computedFunName: 'computed',
};

const isComputedExpression = (node: Node, identifierName: string) => {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'computed'
  );
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

        const expressionBody = callExpression.callee.object;

        if (isComputedExpression(expressionBody, options.computedFunName)) {
          expressionBody.arguments.unshift(...propertyArgs);

          path.parentPath.parentPath.replaceWith(
            expressionBody,
          );
        } else {
          path.parentPath.parentPath.replaceWith(t.callExpression(
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

  return code;
};
