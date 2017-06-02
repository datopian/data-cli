<p align="center">
  <a href="https://staging.datapackaged.com/">
    <img alt="datahub" src="https://staging.datapackaged.com/static/img/data-hub-logo.png" width="546">
  </a>
</p>

<p align="center">
  The DataHub CLI is used to manage DataHub data packages from the command line.
</p>

[![Build Status](https://travis-ci.org/datopian/datahub-cli.svg?branch=master)](https://travis-ci.org/datopian/datahub-cli)

# Usage

## Install

```
$ npm install -g
```

After installing run `$ data --help` to see all available options.

### Get Data Package

`get` command lets you download a Data Package:

```
$ data get {publisher}/{package}
```

#### Example

Following command will download `finance-vix` package from `core` publisher:

```
$ data get core/finance-vix
```

### Set credentials to authenticate for DataHub registry

```
# Fill with required info
$ data configure

> Username: < your user name >
> Your secret token (input hidden): < your secret token >
> Server URL: < https://example.com >
```
Your Configurations will be saved in `~/.datahub/config`

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
