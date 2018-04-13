const pkg = require('../../package.json')
const updateNotifier = require('update-notifier')
const boxen = require('boxen')

module.exports = () => {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000
  })

  if (!notifier.update) {
    return
  }

  // Depending on running OS show appropriate instructions:
  const introduction = 'If you\'ve installed data tool using our executable binary then follow instructions below:\n'
  const instructions = {
    'darwin': `\ncurl -L https://github.com/datahq/data-cli/releases/download/v${notifier.update.latest}/data-macos.gz -o ./data.gz
gunzip -f data.gz && chmod +x data && sudo mv data /usr/local/bin/data`,
    'linux': `\nwget https://github.com/datahq/data-cli/releases/download/v${notifier.update.latest}/data-linux.gz
gunzip -f data-linux.gz && chmod +x data-linux && sudo mv data-linux /usr/local/bin/data`,
    'win32': `\nDepending on your Windows distribution and configurations, you may need to use different path when moving the executable.\n
You need to run 'move' command as administrator:
curl -k --insecure -L https://github.com/datahq/data-cli/releases/download/v${notifier.update.latest}/data-win.exe.gz -o ./data.gz
gzip -d data.gz && move data "C:\\Windows\\System32\\data.exe"`
  }
  const summary = `\ndata -v # should print ${notifier.update.latest}`

  if (notifier.update) {
    notifier.notify({
      defer: false,
      isGlobal: true
    })
    console.log(introduction + instructions[process.platform] + summary)
  } else {
    return
  }
}
