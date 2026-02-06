import tsParser from '@typescript-eslint/parser';
import noArbitraryClassname from './eslint-rules/no-arbitrary-classname.js';
import noLayoutInlineStyle from './eslint-rules/no-layout-inline-style.js';

export default [
  {
    files: ['resources/js/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'design-system': {
        rules: {
          'no-arbitrary-classname': noArbitraryClassname,
          'no-layout-inline-style': noLayoutInlineStyle,
        },
      },
    },
    rules: {
      'design-system/no-arbitrary-classname': 'warn',
      'design-system/no-layout-inline-style': 'warn',
    },
  },
];
