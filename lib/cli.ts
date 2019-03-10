#!/usr/bin/env node

import '@babel/polyfill';

import fs from 'fs';
import path from 'path';
import util from 'util';

import chalk from 'chalk';
import program from 'commander';
import glob from 'glob';
import ora from 'ora';

import packageInfo from '../package.json';
import { Options, transform } from './index';

// tslint:disable-next-line no-empty
const noop = () => {};

const DONE_MESSAGE = 'Done!';
const FAILED_MESSAGE = 'Something went wrong!';
const PROCESSING_MESSAGE = 'Processing files...';

program
  .version(packageInfo.version, '-v, --version')
  .description(`
    CLI for migration to new computed properties in Ember
    Usage: ember-property-upgrade [filesGlob] [options]
  `)
  .option('--no-format', 'Disable auto formatting after code parsing')
  .option('--prettier-config-file [value]', 'Path to Prettier config file')
  .option('--prettier-config [value]', 'Prettier config as JSON string')
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

const spinner = ora(PROCESSING_MESSAGE);

const getPrettierConfigFromFile = (filePath: string) => {
  const resolvedPath = path.resolve(process.cwd(), filePath);

  if (fs.existsSync(resolvedPath)) {
    const result = fs.readFileSync(resolvedPath, 'utf8');

    try {
      return JSON.parse(result);
    } catch (e) {
      try {
        return require(resolvedPath);
      } catch (error) {
        spinner.fail(`${FAILED_MESSAGE} Check you prettier file.`);

        return console.error(error);
      }
    }
  }

  console.warn(chalk.yellow(`Config file "${filePath}" doesn't exist!`));

  return undefined;
};

const getPrettierConfig = (optionsString?: string, filePath?: string) => {
  if (optionsString) {
    try {
      return JSON.parse(optionsString);
    } catch (error) {
      console.warn(chalk.yellow(`Parsing options string failed`));
      console.error(error);
    }
  }

  if (filePath) {
    return getPrettierConfigFromFile(filePath);
  }

  return undefined;
};

const transformOptions: Options = {
  packageName: program.frameworkPkg,
  computedFunName: program.computedFnName,
  autoFormat: program.format,
  autoFormatOptions: getPrettierConfig(
    program.prettierConfig,
    program.prettierConfigFile,
  ),
};

const drawProgress = (current: number, total: number) => {
  spinner.text = `${PROCESSING_MESSAGE} ${current}/${total}`;
};

const getParsedFile = async (filePath: string) => {
  try {
    const code = await readFile(filePath, { encoding: 'utf8' });
    const result = transform(code, transformOptions);

    await writeFile(filePath, result, { encoding: 'utf8' });
  } catch (error) {
    throw error;
  }
};

const parseFiles = (matches: string[]) => {
  let current = 1;
  spinner.start();

  drawProgress(current, matches.length);

  return matches.map((filePath) => (
    getParsedFile(filePath)
      .then(() => {
        drawProgress(current, matches.length);
        current += 1;

        return filePath;
      })
  ));
};

glob(filesGlob, (err, matches) => {
  if (err) {
    spinner.fail(FAILED_MESSAGE);

    return console.error(err);
  }

  Promise.all(parseFiles(matches))
    .then(() => {
      spinner.succeed(DONE_MESSAGE);
      process.exit(0);
    })
    .catch((error: Error) => {
      spinner.fail(FAILED_MESSAGE);

      return console.error(error);
    });
});
