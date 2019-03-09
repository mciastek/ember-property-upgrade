import { getFixtureFile } from './helpers';

import { transform } from 'lib';

const INPUT_CODE = getFixtureFile('basic-input.js');
const OUTPUT_CODE = getFixtureFile('basic-output.js');

describe('ember-property-upgrade', () => {
  describe('when has proper input', () => {
    it('transforms input', () => {
      const output = transform(INPUT_CODE);

      expect(output).toBeDefined();
      expect(output).toBe(OUTPUT_CODE);
    });
  });
});
