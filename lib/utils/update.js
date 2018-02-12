const pkg = require('../../package.json')
const updateNotifier = require('update-notifier')
const boxen = require('boxen')

module.exports = () => {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60
  })

  if (!notifier.update) {
    return
  }

  // Depending on running OS show appropriate instructions:
  let instructions = 'If you\'ve installed data tool using our executable binary then follow instructions below:\n'
  if (process.platform === 'darwin') {
    // Instructions for macos:
    instructions += `\n$ curl -L https://github.com/datahq/data-cli/releases/download/v${notifier.update.latest}/data-macos.gz -o ./data.gz`
    instructions += '\n$ gunzip -f data.gz && chmod +x data && sudo mv data /usr/local/bin/data'
  } else if (process.platform === 'linux') {
    // Instructions for linux:
    instructions += `\n$ wget https://github.com/datahq/data-cli/releases/download/v${notifier.update.latest}/data-linux.gz`
    instructions += '\n$ gunzip -f data-linux.gz && chmod +x data-linux && sudo mv data-linux /usr/local/bin/data'
  } else if (process.platform === 'win32') {
    // Instructions for windows:
    instructions += '\nDepending on your Windows distribution and configurations, you may need to use different path when moving the executable.\n'
    instructions += '\nYou need to run `move` command as administrator:'
    instructions += `\n$ curl -k --insecure -L https://github.com/datahq/data-cli/releases/download/v${notifier.update.latest}/data-win.exe.gz -o ./data.gz`
    instructions += '\n$ gzip -d data.gz && move data "C:\\Windows\\System32\\data.exe"'
  }
  instructions += `\n$ data -v # should print ${notifier.update.latest}`

  if (notifier.update) {
    notifier.notify({
      defer: false,
      isGlobal: true
    })
    console.log(boxen(instructions, {padding: 1, margin: 1, align: 'left', borderColor: 'yellow', borderStyle: 'round'}))
  } else {
    return
  }
}
