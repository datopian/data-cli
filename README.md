[![Build Status](https://travis-ci.org/datopian/datahub-cli.svg?branch=master)](https://travis-ci.org/datopian/datahub-cli)

# DataHub CLI in JavaScript

The DataHub CLI is used to manage DataHub data packages from the command line.

# Install

### For development
```
npm install
```

### For Command Line Usage

```
npm install -g
```

# Command Line Usage

### Options

```
data --help [-h]
data --version [-V]
```

### Commands

#### get - download data from DataHub

```
data get {publisher}/{package}

```

#### configure - set credentials to authenticate for DataHub registry

```
data configure [config]

# Fill with required info
data configure
> Username: < your user name >
> Your secret token (input hidden): < your secret token >
> Server URL: < https://example.com >

```
Your Configurations will be saved in `~/.datahub/config`

# Tests

```
npm test
```
