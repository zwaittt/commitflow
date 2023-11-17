const { existsSync, readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

/**
 * @typedef { { [key: string]: string | Content } } PackageJson
 * @returns { PackageJson }
 */
const getPackageJson = function () {
  const cwd = process.cwd()
  const pkgJson = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf-8'))
  return pkgJson
}

/**
 * @param { PackageJson } content
 */
const writePackageJson = function (content) {
  const cwd = process.cwd()
  writeFileSync(resolve(cwd, 'package.json'), JSON.stringify(content, null, 2))
}

/**
 * @typedef {'npm' | 'yarn' | 'pnpm'} PackageManager
 * @returns { PackageManager }
 */
const getPackageManager = function () {
  const agent = process.env.npm_config_user_agent
  if (agent)
    return agent.split('/')[0]

  const cwd = process.cwd()
  const pkgJson = getPackageJson()
  if (pkgJson.packageManager)
    return pkgJson.packageManager.split('@')[0]

  if (existsSync(resolve(cwd, 'pnpm-lock.yaml')) || existsSync(resolve(cwd, 'node_modules/.pnpm')))
    return 'pnpm'

  if (existsSync(resolve(cwd, 'yarn.lock')) || existsSync(resolve(cwd, '.yarn')))
    return 'yarn'

  return 'npm'
}

/**
 * @param pkg { PackageJson  }
 * @param scriptName { string }
 * @param cmd { string }
 * @returns { void }
 * @see {@link https://github.com/typicode/husky-init/blob/main/src/index.ts#L3 husky-init}
 */
const appendScript = function (pkg, scriptName, cmd) {
  pkg.scripts ||= {}
  if (pkg.scripts[scriptName] !== undefined) {
    if (pkg.scripts[scriptName].includes(cmd)) {
      console.log(
        `  "${cmd}" command already exists in ${scriptName} script, skipping.`,
      )
    }
    else {
      console.log(`  appending "${cmd}" command to ${scriptName} script`)
      pkg.scripts[scriptName] += ` && ${cmd}`
    }
  }
  else {
    console.log(`  setting ${scriptName} script to command "${cmd}"`)
    pkg.scripts[scriptName] = cmd
  }
}

/**
 * @param { string } stage
 * @returns { string }
 */
const getHookShell = function (stage) {
  return readFileSync(resolve(__dirname, `sh/${stage}.sh`), 'utf-8')
}

module.exports = {
  getPackageJson,
  writePackageJson,
  getPackageManager,
  appendScript,
  getHookShell,
}
