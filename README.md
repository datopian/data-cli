[![Build Status](https://travis-ci.org/datahq/data-cli.svg?branch=master)](https://travis-ci.org/datahq/data-cli)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Issues](https://img.shields.io/badge/issue-tracker-orange.svg)](https://github.com/datahq/data-cli/issues)

# Usage

## Install

To install `data`, you need to download the package from the [releases section](https://github.com/datahq/data-cli/releases).

Once it is downloaded and installed run the following command to see all available options:

```
$ data --help
```

## Configuration

Configuration is in `~/.config/datahub/config.json`. In general, you should not need to edit this by hand. You can also override any variables in there using environment variables or on the command line by using the same name e.g.

```
$ data login --api https://api-testing.datahub.io
```

NB: you can set a custom location for the `config.json` config file using the `DATAHUB_JSON` environment variable e.g.:

```
export DATAHUB_JSON=~/.config/datahub/my-special-config.json
```

# For developers

*You need to have Node.js version >7.6*

## Install

```
$ npm install
```

## Running tests

We use Ava for our tests. For running tests use:

```
$ [sudo] npm test
```

To run tests in watch mode:

```
$ [sudo] npm run watch:test
```

We also have tests for `push` command that publishes some of test datasets to DataHub. While Travis runs all tests on every commit, the `push` tests are run only on tagged commits. To run these tests locally you need to have credentials for 'test' user and use following command:

```
$ [sudo] npm test test/push/push.test.js
```

## Lint

We use XO for checking our code for JS standard/convention/style:

```bash
# When you run tests, it first runs lint:
$ npm test

# To run lint separately:
$ npm run lint # shows errors only

# Fixing erros automatically:
$ xo --fix
```
