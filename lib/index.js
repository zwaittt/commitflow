#!/usr/bin/env node

const { exec: _exec } = require('node:child_process')
const { promisify } = require('node:util')
const { EOL } = require('node:os')
const { getPackageManager, appendScript, getPackageJson, writePackageJson, getHookShell } = require('./utils')

const exec = promisify(_exec)

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

  const spinner = (await import('ora')).default('Installation...').start()

  devDeps.length && await exec(`${packageManager} ${args.join(' ')}`)
  spinner.succeed('Installation done.')

  const husky = require('husky')
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
  console.log(''.padEnd(3, EOL))
  console.log('✨ Ready to go!', EOL)
}

run()
