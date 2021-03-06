module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    jquery: true
  },
  extends: ['airbnb-base'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'no-console': 0,
    'no-unused-vars': 0,
    'no-use-before-define': 0
    "no-plusplus": 0,
    "no-plusplus":0
  }
};
