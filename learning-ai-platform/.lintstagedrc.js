module.exports = {
  'client/**/*.{js,jsx,ts,tsx,vue}': [
    'eslint --fix',
    'prettier --write'
  ],
  'server/**/*.{js,ts}': [
    'eslint --fix',
    'prettier --write'
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write'
  ]
};
