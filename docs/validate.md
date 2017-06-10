
#  **data validate** command


## Options:
```
-h, --help               Output usage information
```
    
## Usage:
```
# Validate datapackage.json in given path/URL or in cwd if not given:
$ data validate [path | URL]
```
  
## Example:
```
# Validate descriptor in current working directory: 
$ data validate
```
```
# Validate descriptor in local path:
$ data validate test/fixtures/datapackage.json
```
```
# Validate descriptor in URL:
$ data validate https://bits-staging.datapackaged.com/metadata/core/gdp/_v/latest/datapackage.json
```
