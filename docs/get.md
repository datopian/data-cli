```
■ data get <url>
```

Get a dataset from the given URL.

URL can be one of:

* dataset in DataHub (e.g., https://datahub.io/core/co2-ppm)
* dataset in GitHub (e.g., https://github.com/datasets/co2-ppm)
* direct URL to dataset

## Options:

```
-h, --help               Outputs usage information
```

## Example:

```
# Get dataset from DataHub
# Following dataset will be saved in core/co2-ppm
■ data get https://datahub.io/core/co2-ppm

# From GitHub
# Following dataset will be saved in datasets/co2-ppm
■ data get https://github.com/datasets/co2-ppm
```
