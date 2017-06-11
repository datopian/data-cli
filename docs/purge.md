
# Purge a Data Package in DataHub

## Usage:

```
# Permanently deletes a Data Package from DataHub
# Run from the package root directory (datapackage.json should be presented)
$ data purge
```

## Options:

```
-f, --force              Force purge (delete immediately)
-h, --help               Output usage information
```

## Example:

```
$ data purge
> Package Name:  finance-vix

$ data purge -f
$ data purge --force
```
