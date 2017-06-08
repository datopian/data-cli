const parseIdentifier = (dhpkgid) => {
  let [publisher, pkg, path ] = dhpkgid.split('/')
  return {
    publisher,
    pkg,
    path
  }
}

module.exports.parseIdentifier = parseIdentifier
