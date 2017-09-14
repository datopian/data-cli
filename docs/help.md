
  ❒ data [options] <command> <args>

  Commands:

    DataHub:

      push        [path]        Push data at `path` to the DataHub

    General:

      get         [url]         Retrieve data at `url` to local disk
      info        [path/url]    Get info on data (file or dataset) at path or url
      cat         path [out]    Read data at path and write to out (or stdout)

    Data Package specific:

      normalize   [path]        Normalize datapackage.json according to the specification
      validate                  Validate Data Package structure

    Administrative:

      help        [cmd]         Show help on cmd
      login                     Login or signup to the DataHub

  Options:

  -h, --help              Output usage information
  -v, --version           Output the version

  **Examples**

  Push a Data Package (in the current directory)

      ■ data push

  Get a Data Package from the DataHub owned by `core` and with name `finance-vix`

      ■ data get core/finance-vix/

  Get a Data Package on github

      ■ data get https://github.com/datasets/gdp


  **About**

  DataHub is a home for all your data, nicely packaged ❒

  We hope this tool will bring you much joy as you work with your data and the DataHub.


