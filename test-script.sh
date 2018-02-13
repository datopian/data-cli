#!/bin/bash
set -ev
echo '>>> Now running shell script...'
npm i -g data-cli
data --version
data help
data info https://datahub.io/core/finance-vix

echo '>>> Install data-cli with yarn...'
npm uninstall -g data-cli
if [ $(uname) = 'Darwin' ]; then
  brew install yarn
else
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
  sudo apt-get update && sudo apt-get install yarn
fi

export PATH="$(yarn global bin):$PATH"
yarn global add data-cli
data --version
data info https://datahub.io/core/finance-vix
