
  ■ data push [PATH]

  `PATH` (optional) is the path to the data file or data package.

## Options:

  -h, --help               Output usage information.

  --format                 Explicitly set the format for a file. Useful when a file does not have conventional
                           naming. E.g., `--format=csv`

  -i, --interactive        Enable interactive mode. Useful when pushing a single file.

  --schedule               Setup a schedule so the DataHub will automatically re-import the remote file on
                           a regular basis. E.g., `every 90s`, `every 5m`, `every 2d`. The number is always
                           an integer, selector is `s/m/h/d/w` (second -> week) and you can’t schedule for
                           less than 60 seconds.

  --sheets                 Set which sheets should be processed when pushing Excel files. By default, only
                           the first sheet is processed. You can use `--sheets=all` option to push "all" sheets.
                           You also can list sheet numbers, e.g., `--sheets=1,2`. If you wanted to push only
                           the second sheet, you would do `--sheets=2`. Sheet number starts from 1.

  --name                   Set the name of the dataset without interaction when pushing the single file. Eg: `--name=my-dataset`

### findability options:

This options define the dataset visibility on the DataHub.io site:

  --public (default)       Everybody can see the dataset in the search results.
                           Everybody can access the dataset by the URL link.

  --unlisted               Other users will not see the dataset in the search results.
                           You will see the dataset in the search results.
                           Everybody can access the dataset by the URL link.

  --private                Other users cannot access the dataset.
                           Other users will not see the dataset in the search results.
                           You will see the dataset in the search results.

## Examples:

Uploads Data Package to DataHub in current working directory:

  ■ data push

Uploads Data Package to DataHub with path (core/finance-vix/ should have datapackage.json):

  ■ data push core/finance-vix/

By default, all pushed datasets are public. To make them unlisted:

  ■ data push core/finance-vix/ --unlisted

Uploads a file from URL to DataHub on weekly basis and sets file format as CSV:

  ■ data push URL --schedule="every 1w" --format=csv

Uploads a Excel file and processes only the second sheet:

  ■ data push myExcel.xlsx --sheets=2
