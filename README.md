[![Build Status](https://travis-ci.org/datahq/datahub-cli.svg?branch=master)](https://travis-ci.org/datahq/datahub-cli)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Issues](https://img.shields.io/badge/issue-tracker-orange.svg)](https://github.com/datopian/datahub-cli/issues)

# Usage

## Install

To install `datahub-cli`, you need to download the package from the [releases section](https://github.com/datopian/datahub-cli/releases).

Once it is downloaded and installed run the following command to see all available options:

```
$ data --help
```

## Configuration

Configuration is in `~/.datahub.json`. In general, you should not need to edit this by hand. You can also override any variables in there using environment variables or on the command line by using the same name e.g.

```
$ data login --api https://api-testing.datahub.io
```

# For developers

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
