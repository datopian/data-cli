#!/bin/bash
set -ev
echo '>>> Now running shell script...'
npm i -g git+https://github.com/datahq/data-cli.git
data --version
data help
data info https://datahub.io/core/finance-vix

echo '>>> Installing data-cli with yarn...'
npm uninstall -g data-cli

yarn global add git+https://github.com/datahq/data-cli.git
data --version
data info https://datahub.io/core/finance-vix
