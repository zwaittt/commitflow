const urzx = require('@urzx/eslint-config').default

module.exports = [
  ...urzx({
    node: true,
  }),
  {
    rules: {
      'no-console': 'off',
      'n/prefer-global/process': 'off',
      'n/no-sync': 'off',
    },
  },
]
