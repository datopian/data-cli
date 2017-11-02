
# Preview a Dataset

## Usage:

```
# Get information about Dataset:
■ data info [path]
```

## Options:

```
-h, --help               Output usage information
--format                 Explicitly provide input file format, e.g., if it does not have conventional name
```

## Example:

```
# Get information about Dataset in current working directory:
■ data info

# Get information about Dataset providing local path:
■ data info dir/finance-vix

# Or you can get info about remote dataset:
■ data info https://raw.githubusercontent.com/datasets/gdp/master/datapackage.json

# Additionally, you can preview local or remote tabular data file:
■ data info https://raw.githubusercontent.com/datahq/core-datasets-tools/master/examples.csv
