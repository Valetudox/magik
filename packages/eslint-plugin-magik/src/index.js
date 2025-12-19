/**
 * @fileoverview Magik ESLint plugin
 * @author Magik Team
 */

import { exportsFirst } from './rules/exports-first.js'

export const rules = {
  'exports-first': exportsFirst,
}
