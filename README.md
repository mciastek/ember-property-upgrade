# Ember Property Migration Tool [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mciastek/ember-property-upgrade/blob/master/LICENSE) [![Build Status](https://travis-ci.com/mciastek/ember-property-upgrade.svg?branch=master)](https://travis-ci.com/mciastek/ember-property-upgrade)

Simple tool for migrating computed properties (used with `.property()`) from syntax [deprecated in Ember 3.9](https://deprecations.emberjs.com/v3.x/#toc_computed-property-property).

## Usage
After installation a CLI is available in your project.

```bash
./node_modules/.bin/ember-property-upgrade [filesGlob] [options] --help
```

- `[filesGlob]` - glob expression, which points to files, e.g. `'src/**/*.js'`
- `[options]` - defined in [Options](#options) section

Alternatively you can install module globally and access it via alias `ember-property-upgrade`.

## How it works

This tool helps with smooth migration to new computed property syntax. Simply run the CLI and you are done!

**Before**
```js
const Person = EmberObject.extend({
  fullName: computed(function() {
    return `${this.firstName} ${this.lastName}`;
  }).property('firstName', 'lastName'),

  isYoung: Ember.computed(function() {
    return this.age < 50;
  }).property('age'),

  hasFriends: function() {
    return this.friends.length > 0;
  }.property('friends'),
});
```

**After**
```js
const Person = EmberObject.extend({
  fullName: computed('firstName', 'lastName', function () {
    return `${this.firstName} ${this.lastName}`;
  }),

  isYoung: Ember.computed('age', function () {
    return this.age < 50;
  }),

  hasFriends: Ember.computed('friends', function () {
    return this.friends.length > 0;
  })
});
```

## Options

| Option | Type | Description | Default  |
|---------------------------|-------------|---------------|---------|
| `--format` | Boolean | Enable auto formatting after code parsing | `false` |
| `--prettier-config-file` | String | Path to Prettier config file (accepts JS and JSON files) |  |
| `--prettier-config` | String | Prettier config as JSON string |  |
| `--framework-pkg` | String | Name of Ember's import alias | `'Ember'` |
| `--computed-fn-name` | String | Name of computed property function name | `'computed'` |

## Usage without CLI

Migration tool can be used directly in Node.js environment.

```js
const { transform } = require('ember-property-upgrade');

// or using ES modules

import { transform } from 'ember-property-upgrade';
```

Usage
```js
// Transforming the code
// input {String} - code input
// options {TransformOptions} - options for parser

const parsedCode = transform(input, options);
```

## License

Created by [Mirosław Ciastek](https://github.com/mciastek). Released under the [MIT License](https://github.com/mciastek/ember-property-upgrade/blob/master/LICENSE).