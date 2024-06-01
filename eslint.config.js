const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  {
    ignores: ["dist/", "node_modules/", "build/", "*.zip"],
  },
  {
    languageOptions: {
      globals: {
        chrome: "readonly",
        browser: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "consistent-return": "off",
      "comma-dangle": "off",
      "spaced-comment": "off",
      "global-require": "off",
    },
  },
  eslintPluginPrettierRecommended,
];
