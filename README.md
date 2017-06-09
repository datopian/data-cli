<p align="center">
  <a href="https://staging.datapackaged.com/">
    <img alt="datahub" src="https://staging.datapackaged.com/static/img/data-hub-logo.png" width="546">
  </a>
</p>

<p align="center">
  The DataHub CLI is used to manage DataHub data packages from the command line.
</p>

[![Build Status](https://travis-ci.org/datopian/datahub-cli.svg?branch=master)](https://travis-ci.org/datopian/datahub-cli)
[![Issues](https://img.shields.io/badge/issue-tracker-orange.svg)](https://github.com/datopian/datahub-cli/issues)

# Usage

## Install

To install `datahub-cli`, you need to download the package from the [releases section](https://github.com/datopian/datahub-cli/releases).

Once it is downloaded and installed run the following command to see all available options:

```
$ data --help
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
