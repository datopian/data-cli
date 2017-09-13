```
$ data cat PATH-OR-URL [OUT-PATH]
```

Read a data file and write its output to stdout or [OUT-PATH]

Input data files supported:

* csv
* excel

Output data files supported:

* csv
* excel (.xlsx)
* markdown (.md)

## Options:

```
-h, --help               Outputs usage information
```

Reading from stdin:

```
$ cat PATH | data cat _ [OUT-PATH]

$ curl URL | data cat _ [OUT-PATH]
```
