# PostgreSQL

For database work in Tanaabot Cloud, run `tanaabot-db -c 'SELECT 1 AS connected'` through the
approved outer executor for the Cloud TCP proxy. Replace the example with the SQL needed for
the task. The command reads the saved PostgreSQL environment and returns JSON rows on stdout.
Keep credentials in the environment. Use `tanaabot-db --help` for options and `--debug` for
connection progress on stderr.
