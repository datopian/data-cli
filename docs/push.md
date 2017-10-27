■ data push [PATH]

  `PATH` (optional) is the path to the data file or data package.

Options:

  -h, --help               Output usage information
  --published              Set dataset as 'published' so it is public in the website (default is 'unlisted')

**Examples**

Uploads Data Package to DataHub in current working directory:

  ■ data push

Uploads Data Package to DataHub with path:

  ■ data push core/finance-vix/

  core/finance-vix/ should have datapackage.json

By default, all pushed datasets are unlisted. To make them published:

  ■ data push core/finance-vix/ --published
