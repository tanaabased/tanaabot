import environmentTask from '../lib/environment.js';

const args = process.argv.slice(2);
if (args.length !== 1 || !['--refresh', '--ensure', '--check', '--export'].includes(args[0])) {
  process.stderr.write('Usage: bun scripts/environment-task.js --refresh|--check\n');
  process.exitCode = 2;
} else {
  environmentTask(args[0]);
}
