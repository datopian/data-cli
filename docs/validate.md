
# Validate a descriptor

## Usage:

```
# Validates datapackage.json in given path/URL or in cwd if not given:
■ data validate [path | URL]

# If a descriptor is invalid, it will print out validation errors.
```

## Options:

```
-h, --help               Output usage information
```

## Example:

```
# Validate descriptor in current working directory:
■ data validate

# Validate descriptor from local path:
■ data validate test/fixtures/datapackage.json

# Validate descriptor from URL:
■ data validate https://bits-staging.datapackaged.com/metadata/core/gdp/_v/latest/datapackage.json
```
