
  ❒ data [options] <command> <args>

  Commands:

    DataHub:

      push        [path]        Push data to the DataHub
      get         [pkg-id]      Get data from DataHub
      purge       [owner/name]  Permanently deletes data from DataHub

    Data Package specific:

      info        [pkg-id]      Get info on data
      normalize                 Normalize datapackage.json
      validate                  Validate Data Package structure

    Administrative:

      config                    Set up configuration
      help        [cmd]         Show help on cmd

  Options:

  -h, --help              Output usage information
  -v, --version           Output the version

# Package Identifiers [pkg-id]

  A package identifier is:

- A url like http://www.mydatapackages.com/my-package/
- A local path
- A DataHub package identifier in the form `<owner>/<name>`


# Examples

  Push a Data Package (in the current directory)

      $ data push

  Get a Data Package from the DataHub owned by `core` and with name `finance-vix`

      $ data get core/finance-vix/

  Get a Data Package on github

      $ data get https://github.com/datasets/gdp


# About the **DataHub** command line tool!

  DataHub = 📦  + 🐘  A home for all your data, nicely packaged ❒

  We hope this tool will bring you much joy as you work with your data and the DataHub.


