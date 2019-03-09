import generate from '@babel/generator';
import { parse, ParserOptions } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const DEFAULT_OPTIONS: ParserOptions = {
  sourceType: 'module',
};

export const transform = (input: string) => {
  const ast = parse(input, DEFAULT_OPTIONS);

  let callExpression;
  let propertyArgs;

  traverse(ast, {
    Identifier(path) {
      if (path.node.name === 'property') {
        callExpression = path.parentPath.parent;
        propertyArgs = callExpression.arguments;

        path.parentPath.parentPath.replaceWith(t.callExpression(
          t.memberExpression(t.identifier('Ember'), t.identifier('computed')),
          [
            ...propertyArgs,
            callExpression.callee.object,
          ],
        ));
      }
    },
  });

  const { code } = generate(ast);

  return code;
};
