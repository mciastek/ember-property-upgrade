import { getFixtureFile } from './helpers';

import { transform } from 'lib/index';

describe('ember-property-upgrade', () => {
  let input: string;

  describe('for basic examples', () => {
    beforeAll(() => {
      input = getFixtureFile('basic-example.js');
    });

    it('transforms input', () => {
      const result = transform(input);

      expect(result).toBeDefined();
      expect(result).toMatchSnapshot();
    });
  });

  describe('for complex examples', () => {
    beforeAll(() => {
      input = getFixtureFile('complex-example.js');
    });

    it('transforms input', () => {
      const result = transform(input);

      expect(result).toBeDefined();
      expect(result).toMatchSnapshot();
    });
  });
});
