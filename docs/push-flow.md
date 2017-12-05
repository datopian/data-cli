```
■ data push-flow [PATH]
```
  `PATH` (optional) is the path to the data package.

## Options:

  -h, --help               Output usage information

## Examples:

\- Uploads Data Package to DataHub in current working directory

  ■ data push-flow

  data package should have .datahub/flow.yaml

\- Uploads Data Package to DataHub with path:

  ■ data push-flow core/finance-vix/

  core/finance-vix/ should have datapackage.json and .datahub/flow.yaml
