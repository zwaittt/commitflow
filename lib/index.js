#!/usr/bin/env node

const { execSync: exec } = require('node:child_process');
const { createRequire } = require('node:module');
const { EOL } = require('node:os');
const Process = require('node:process');
const prompts = require('prompts');
const { name, version } = require('../package.json');
const { getPackageManager, appendScript, getPackageJson, writePackageJson, getHookShell } = require('./utils');
const { dependencies, hooks } = require('./config');

/**
 * @typedef {{ skipPrompts: boolean }} Options
 * @param {Options} options 
 * @returns 
 */
async function run(options) {
  console.log('[\x1B[32m\x1B[36m%s\x1B[0m]: \x1B[1m%s\x1B[0m', `${name}`, `v${version}`, EOL);

  const defaultGlob = '*.{js,jsx,ts,tsx}';
  const questions = [
    {
      type: 'text',
      name: 'fileMatch',
      initial: defaultGlob,
      message: 'What files do you want to be \x1B[36mlint-staged\x1B[0m?',
    },
  ];

  const response = (process.env.CI || options.skipPrompts) ? { fileMatch: defaultGlob } : await prompts(questions);
  
  console.log(EOL, 'You can edit \x1B[36mlint-staged\x1B[0m in package.json to add more lint steps.', EOL);

  const packageManager = getPackageManager();

  let arg0 = 'add';
  if (packageManager === 'npm')
    arg0 = 'install';
  const args = [arg0, ...dependencies, '-D'];

  console.log(`using \x1B[1m${packageManager}\x1B[0m to install dependencies:`, EOL);
  console.log(dependencies.map(item => `  - \x1B[36m${item}\x1B[0m`).join(EOL));
  exec(`${packageManager} ${args.join(' ')}`, {
    stdio: 'inherit',
  });

  const _require = createRequire(`${process.cwd()}/node_modules`);
  const husky = _require('husky');
  husky.install();

  hooks.forEach((stage) => {
    husky.set(`.husky/${stage}`, getHookShell(stage));
  });

  const pkgJson = getPackageJson();
  pkgJson['lint-staged'] = {
    [response.fileMatch]: ['eslint --fix'],
  };
  pkgJson.commitlint = {
    'extends': ['@commitlint/config-conventional'],
  };
  pkgJson.config = {
    commitizen: {
      path: '@commitlint/cz-commitlint',
    },
  };

  appendScript(pkgJson, 'commit', 'cz');
  appendScript(pkgJson, 'prepare', '[ ! -n \"$CI\" ] && husky install || exit 0');

  writePackageJson(pkgJson);

  console.log('package.json configured.');
  console.log(''.padEnd(3, EOL));
  console.log('✨ Ready to go!', EOL);
}

if (module.require.main === module) {
  const runArgs = process.argv.slice(2);
  if (runArgs.includes('--help') || runArgs.includes('-h')) {
    console.log(`Usage: \x1B[36m${name}\x1B[0m`);
    console.log('  --help, -h    Show help');
    console.log('  --yes, -y     Skip prompts');
    Process.exit();
  }
  run({
    skipPrompts: runArgs.includes('--yes') || runArgs.includes('-y'),
  });
} else {
  module.exports = run;
}
