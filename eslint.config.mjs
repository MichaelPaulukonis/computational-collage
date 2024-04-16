import globals from 'globals'

import path from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import p5config from 'eslint-config-p5js'
import p5sound from 'eslint-config-p5js/sound.js'
import pluginJs from '@eslint/js'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: pluginJs.configs.recommended })

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...p5config.globals,
        ...p5sound.globals
      }
    },
    ignores: [
      'libs/'
    ]
  },
  ...compat.extends('standard')
]
