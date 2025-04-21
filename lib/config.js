exports.dependencies = [
  'husky@8',
  '@commitlint/config-conventional',
  '@commitlint/cz-commitlint',
  'commitizen',
  'inquirer@8',
  '@commitlint/cli',
  'lint-staged',
];

exports.hooks = [
  'pre-commit',
  'commit-msg',
  'prepare-commit-msg',
];
