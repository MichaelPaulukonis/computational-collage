import globals from 'globals'

import path from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginJs from '@eslint/js'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: pluginJs.configs.recommended
})

export default [
  {
    plugins: ['p5js'],

    env: {
      browser: true,
      es2021: true,
      'p5js/p5': true
    },

    extends: ['eslint:recommended', 'plugin:p5js/p5'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    ignores: ['libs/']
  },
  ...compat.extends('standard')
]
