#!/usr/bin/env node

import fs from 'fs';
import util from 'util';

import chalk from 'chalk';
import program from 'commander';
import glob from 'glob';

import { transform } from './index';

const clear = require('clear');

// tslint:disable-next-line no-empty
const noop = () => {};

clear();

program
  .version('', '-v, --version')
  .description('CLI for migration to new computed properties in Ember')
  .option('--no-format', 'Disable auto formatting')
  .option('--prettier-config [value]', 'Path to Prettier config file')
  .option(
    '--framework-pkg [value]',
    'Name of Ember\'s import alias',
    noop,
    'Ember',
  )
  .option(
    '--computed-fn-name [value]',
    'Name of computed property function name',
    noop,
    'computed',
  )
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const [filesGlob] = program.args;

const getParsedFile = async (filePath: string) => {
  try {
    const code = await readFile(filePath, { encoding: 'utf8' });
    const result = transform(code);

    await writeFile(filePath, result, { encoding: 'utf8' });
  } catch (error) {
    throw error;
  }
};

const parseFiles = (matches: string[]) => {
  return matches.map(getParsedFile);
};

glob(filesGlob, (err, matches) => {
  if (err) {
    // tslint:disable-next-line no-console
    console.log(chalk.red('Something went wrong!'));

    return console.error(err);
  }

  Promise.all(parseFiles(matches))
    .then(() => {
      // tslint:disable-next-line no-console
      console.log(chalk.green('All done!'));
      process.exit(0);
    })
    .catch((error: Error) => {
      // tslint:disable-next-line no-console
      console.log(chalk.red('Something went wrong!'));

      return console.error(error);
    });
});
