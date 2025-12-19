import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, computed } from 'vue'
import ClickMenu, { type ClickMenuItem } from './ClickMenu.vue'

const meta = {
  title: 'Components/ClickMenu',
  component: ClickMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# ClickMenu

A generic wrapper component that shows a custom menu on double-click without adding wrapper elements.

## Overview

ClickMenu is the foundation for \`Editable\`. It uses Vue 3's \`cloneVNode\` to inject event handlers
directly into its child element, meaning **no wrapper element** is added to the DOM.

## How It Works

1. Accepts an array of menu items with \`key\`, \`title\`, \`icon\`, and optional \`class\`
2. On double-click, shows the menu at cursor position
3. Emits \`@select\` with the item's key when clicked

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`items\` | \`ClickMenuItem[]\` | required | Menu items to display |
| \`disabled\` | \`boolean\` | \`false\` | Disable the menu |

## ClickMenuItem Interface

\`\`\`ts
interface ClickMenuItem {
  key: string      // Unique identifier emitted on select
  title: string    // Display text
  icon?: string    // MDI icon (e.g., 'mdi-pencil')
  class?: string   // CSS class (e.g., 'text-error')
  disabled?: boolean
}
\`\`\`

## Usage

\`\`\`vue
<ClickMenu :items="menuItems" @select="handleSelect">
  <span>Double-click me</span>
</ClickMenu>
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof ClickMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic usage with simple menu items.
 */
export const Basic: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const items: ClickMenuItem[] = [
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
      ]
      const onSelect = (key: string) => alert(`Selected: ${key}`)
      return { items, onSelect }
    },
    template: `
      <ClickMenu :items="items" @select="onSelect">
        <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          Double-click me to see the menu
        </div>
      </ClickMenu>
    `,
  }),
}

/**
 * Dynamic menu items that change based on state (like Select/Clear selection).
 */
export const DynamicItems: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const isSelected = ref(false)
      const items = computed((): ClickMenuItem[] => [
        isSelected.value
          ? { key: 'clear', icon: 'mdi-close-circle-outline', title: 'Clear selection' }
          : { key: 'select', icon: 'mdi-check-circle-outline', title: 'Select' },
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
      ])
      const onSelect = (key: string) => {
        if (key === 'select') {isSelected.value = true}
        if (key === 'clear') {isSelected.value = false}
        alert(`Selected: ${key}`)
      }
      return { items, isSelected, onSelect }
    },
    template: `
      <ClickMenu :items="items" @select="onSelect">
        <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          <strong>{{ isSelected ? 'SELECTED' : 'Not selected' }}</strong>
          <br>
          Double-click to toggle selection
        </div>
      </ClickMenu>
    `,
  }),
}

/**
 * Usage in a table with different menus per row.
 */
export const InTable: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const data = ref([
        { id: 1, name: 'Option A', status: 'active' },
        { id: 2, name: 'Option B', status: 'draft' },
        { id: 3, name: 'Option C', status: 'archived' },
      ])
      const getItems = (row: { status: string }): ClickMenuItem[] => [
        { key: 'view', icon: 'mdi-eye', title: 'View' },
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        row.status === 'archived'
          ? { key: 'restore', icon: 'mdi-restore', title: 'Restore' }
          : { key: 'archive', icon: 'mdi-archive', title: 'Archive' },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
      ]
      const onSelect = (key: string, row: { name: string }) => {
        alert(`${key} on ${row.name}`)
      }
      return { data, getItems, onSelect }
    },
    template: `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Name</th>
            <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.id">
            <td style="border: 1px solid #ccc; padding: 0;">
              <ClickMenu :items="getItems(row)" @select="onSelect($event, row)">
                <div style="padding: 8px; cursor: pointer;">{{ row.name }}</div>
              </ClickMenu>
            </td>
            <td style="border: 1px solid #ccc; padding: 8px;">{{ row.status }}</td>
          </tr>
        </tbody>
      </table>
    `,
  }),
}

/**
 * With tooltip - ClickMenu wraps the tooltip component.
 */
export const WithTooltip: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const items: ClickMenuItem[] = [
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
      ]
      const onSelect = (key: string) => alert(`Selected: ${key}`)
      return { items, onSelect }
    },
    template: `
      <ClickMenu :items="items" @select="onSelect">
        <v-tooltip location="right">
          <template #activator="{ props }">
            <span v-bind="props" style="cursor: pointer; text-decoration: underline dotted;">
              Hover for tooltip, double-click for menu
            </span>
          </template>
          <span>This is a tooltip!</span>
        </v-tooltip>
      </ClickMenu>
    `,
  }),
}

/**
 * Disabled state - menu does not appear on double-click.
 */
export const Disabled: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const disabled = ref(true)
      const toggle = () => { disabled.value = !disabled.value }
      const items: ClickMenuItem[] = [
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
      ]
      const onSelect = (key: string) => alert(`Selected: ${key}`)
      return { disabled, toggle, items, onSelect }
    },
    template: `
      <div>
        <button @click="toggle" style="margin-bottom: 16px; padding: 8px 16px;">
          Toggle disabled: {{ disabled ? 'ON' : 'OFF' }}
        </button>
        <ClickMenu :items="items" :disabled="disabled" @select="onSelect">
          <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
            {{ disabled ? 'Menu disabled' : 'Double-click for menu' }}
          </div>
        </ClickMenu>
      </div>
    `,
  }),
}

/**
 * With disabled menu items.
 */
export const DisabledItems: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const items: ClickMenuItem[] = [
        { key: 'view', icon: 'mdi-eye', title: 'View' },
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit', disabled: true },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error', disabled: true },
      ]
      const onSelect = (key: string) => alert(`Selected: ${key}`)
      return { items, onSelect }
    },
    template: `
      <ClickMenu :items="items" @select="onSelect">
        <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          Double-click - Edit and Delete are disabled
        </div>
      </ClickMenu>
    `,
  }),
}

/**
 * Many menu items.
 */
export const ManyItems: Story = {
  args: {
    items: [],
  },
  render: () => ({
    components: { ClickMenu },
    setup: () => {
      const items: ClickMenuItem[] = [
        { key: 'view', icon: 'mdi-eye', title: 'View details' },
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'duplicate', icon: 'mdi-content-copy', title: 'Duplicate' },
        { key: 'move', icon: 'mdi-folder-move', title: 'Move to folder' },
        { key: 'share', icon: 'mdi-share', title: 'Share' },
        { key: 'archive', icon: 'mdi-archive', title: 'Archive' },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
      ]
      const onSelect = (key: string) => alert(`Selected: ${key}`)
      return { items, onSelect }
    },
    template: `
      <ClickMenu :items="items" @select="onSelect">
        <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          Double-click for many options
        </div>
      </ClickMenu>
    `,
  }),
}
