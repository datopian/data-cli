## Overview

**"Data-cli"** is an important part of the [DataHub](https://datahub.io/docs/about) project. This is a command line tool, that helps you to manipulate your data (as `git` manipulates the code).

For example you have a set of data as a result of your work, let it be few data-files and a description. And you want to share it with your colleagues. With the **"data-cli"** you just need to:
```shell
cd data-folder
data init  # convent my data files into the data-package
> "Answer a few questions here, e.g. dataset name, files to include, etc"
data push  # upload the dataset onto a DataHub
> "As a result you'll got a link to share:
http://datahub.io/user-name/data-package-name
```
That's it! Your data is online. You can make your data public or private, add some pretty graphics, and many more. Please read http://datahub.io/docs for details.

With `data-cli` you can also:
* Get data from online sources
* Get info about data files and datasets (local and remote)
* Validate your data to ensure its quality
* init a new dataset

## List of the `data-cli` commands

Full description for each command ([help pages](https://github.com/datahq/data-cli/tree/master/docs)):
- [data push](https://github.com/datahq/data-cli/blob/master/docs/push.md)
- [data get](https://github.com/datahq/data-cli/blob/master/docs/get.md)
- [data info](https://github.com/datahq/data-cli/blob/master/docs/info.md)
- [data cat](https://github.com/datahq/data-cli/blob/master/docs/cat.md)
- [data init](https://github.com/datahq/data-cli/blob/master/docs/init.md)
- [data validate](https://github.com/datahq/data-cli/blob/master/docs/validate.md)


Also you can run "help" command in your terminal to see command docs:
```shell
data help
> 'General description'
data help push
> 'push command description'
# etc...
```

## Installation

```
npm install data-cli --global
```
After installation you can run `data-cli` by the name `data`:
```
data --version
> 0.8.9
```

If you're not using NPM you can install `data-cli` binaries following [this instructions](https://datahub.io/docs/getting-started/installing-data#installing-binaries).

# For developers

[![Build Status](https://travis-ci.org/datahq/data-cli.svg?branch=master)](https://travis-ci.org/datahq/data-cli)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Issues](https://img.shields.io/badge/issue-tracker-orange.svg)](https://github.com/datahq/data-cli/issues)

## Configuration

Configuration is in `~/.config/datahub/config.json`. In general, you should not need to edit this by hand. You can also override any variables in there using environment variables or on the command line by using the same name e.g.

```
$ data login --api https://api-testing.datahub.io
```

NB: you can set a custom location for the `config.json` config file using the `DATAHUB_JSON` environment variable e.g.:

```
export DATAHUB_JSON=~/.config/datahub/my-special-config.json
```

## Environment

*You need to have Node.js version >7.6*

**NOTE:** if you're a developer, you need to set `datahub=dev` environment variable so your usage of the CLI isn't tracked in the analytics:

It is recommended that you set this up permanently, e.g., MacOS users need to edit `~/.bash_profile` file - add this script in your `~/.bash_profile`:

```bash
# The next line sets 'datahub' env var so data-cli doesn't send tracking data to Analytics
export datahub=dev
```

and then restart your terminal.

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
