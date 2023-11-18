#!/usr/bin/env node

const { execSync } = require('node:child_process')
const { EOL } = require('node:os')
const { createRequire } = require('node:module')
const { getPackageManager, appendScript, getPackageJson, writePackageJson, getHookShell } = require('./utils')

async function run() {
  const packageManager = getPackageManager()

  const devDeps = [
    'husky',
    '@commitlint/config-conventional',
    '@commitlint/cz-commitlint',
    'commitizen',
    'inquirer@8',
    '@commitlint/cli',
    'lint-staged',
  ]

  const hooks = [
    'pre-commit',
    'commit-msg',
    'prepare-commit-msg',
  ]

  let arg0 = 'add'
  const args = [arg0, ...devDeps, '-D']

  if (packageManager === 'npm')
    arg0 = 'install'

  console.log('Installing dependencies:', EOL)
  console.log(devDeps.map(item => ` - \x1B[36m${item}\x1B[0m`).join(EOL))
  console.log(EOL)

  execSync(`${packageManager} ${args.join(' ')}`, {
    stdio: 'inherit',
  })

  const _require = createRequire(`${process.cwd()}/node_modules`)
  const husky = _require('husky')
  husky.install()

  hooks.forEach((stage) => {
    husky.set(`.husky/${stage}`, getHookShell(stage))
  })

  const pkgJson = getPackageJson()
  pkgJson['lint-staged'] = {
    '*.{js,jsx,ts,tsx}': ['eslint --fix'],
  }
  pkgJson.commitlint = {
    extends: ['@commitlint/config-conventional'],
  }
  pkgJson.config = {
    commitizen: {
      path: '@commitlint/cz-commitlint',
    },
  }

  appendScript(pkgJson, 'commit', 'cz')
  appendScript(pkgJson, 'prepare', '[ ! -n \"$CI\" ] && husky install')

  writePackageJson(pkgJson)

  console.log('update package.json')
  console.log(''.padEnd(2, EOL))
  console.log('✨ Ready to go!', EOL)
}

run()
