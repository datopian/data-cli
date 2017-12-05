```
■ data cat [OPTIONS] PATH-OR-URL [OUT-PATH]
```
Read a data file and write its output to stdout or `OUT-PATH` if `OUT-PATH` provided.

Input data formats supported:

* csv
* excel

Output data files supported:

* ascii table (default - if no format specified)
* csv
* excel (.xlsx)
* markdown (.md)

## Options

--format      explicitly provide input file format, e.g., if it does not have conventional name

## Examples

Reading from stdin:

```
■ cat PATH | data cat _ [OUT-PATH]

■ curl URL | data cat _ [OUT-PATH]
```
