import type { Meta, StoryObj } from '@storybook/vue3'
import { VBtn, VIcon } from 'vuetify/components'
import AppHeader from './AppHeader.vue'

const meta = {
  title: 'Components/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# AppHeader

A two-level header component with a top bar and horizontal navigation.

## Overview

AppHeader provides a consistent header structure with:
- **Top bar**: App title/logo, action buttons, and user avatar
- **Navigation bar**: Horizontal menu with optional dropdown submenus

## Props

- \`appTitle\`: Application title displayed in the top bar (default: "Magik")
- \`menuItems\`: Array of navigation items with optional children for dropdowns
- \`userName\`: User's display name for avatar fallback initials
- \`userAvatar\`: URL to user's avatar image

## Slots

- \`title\`: Custom content for the app title area
- \`actions\`: Custom action buttons (defaults to bell and settings icons)
        `,
      },
    },
  },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default header with simple menu items (no dropdowns).
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The default AppHeader with simple navigation items and default action buttons.',
      },
    },
  },
  args: {
    appTitle: 'Magik',
    userName: 'John Doe',
  },
}

/**
 * Header with dropdown submenus in navigation.
 */
export const WithDropdowns: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Navigation items can have children to create dropdown submenus. Hover over items to see the dropdown.',
      },
    },
  },
  args: {
    appTitle: 'Magik',
    userName: 'Jane Smith',
    menuItems: [
      {
        title: 'Dashboard',
        to: '/dashboard',
        icon: 'mdi-view-dashboard',
      },
      {
        title: 'Documents',
        icon: 'mdi-file-document-multiple',
        children: [
          { title: 'Decisions', to: '/decisions', icon: 'mdi-file-document' },
          { title: 'Specifications', to: '/specifications', icon: 'mdi-file-document-outline' },
          { title: 'Tables', to: '/tables', icon: 'mdi-table-large' },
        ],
      },
      {
        title: 'Tools',
        icon: 'mdi-tools',
        children: [
          { title: 'Audio Recorder', to: '/audio', icon: 'mdi-microphone' },
          { title: 'Code Generator', to: '/codegen', icon: 'mdi-code-tags' },
        ],
      },
      {
        title: 'Settings',
        to: '/settings',
        icon: 'mdi-cog',
      },
    ],
  },
}

/**
 * Header with custom action buttons.
 */
export const CustomActions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use the `actions` slot to customize the action buttons in the top bar.',
      },
    },
  },
  args: {
    appTitle: 'Magik',
    userName: 'Admin User',
    menuItems: [
      { title: 'Home', to: '/', icon: 'mdi-home' },
      { title: 'Projects', to: '/projects', icon: 'mdi-folder' },
    ],
  },
  render: (args) => ({
    components: { AppHeader, VBtn, VIcon },
    setup() {
      return { args }
    },
    template: `
      <AppHeader v-bind="args">
        <template #actions>
          <VBtn icon variant="text" size="small" title="Search">
            <VIcon>mdi-magnify</VIcon>
          </VBtn>
          <VBtn icon variant="text" size="small" title="Help">
            <VIcon>mdi-help-circle-outline</VIcon>
          </VBtn>
          <VBtn icon variant="text" size="small" title="Notifications">
            <VIcon>mdi-bell-badge-outline</VIcon>
          </VBtn>
        </template>
      </AppHeader>
    `,
  }),
}

/**
 * Header with user avatar image.
 */
export const WithAvatarImage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'When `userAvatar` is provided, it displays an image instead of initials.',
      },
    },
  },
  args: {
    appTitle: 'Magik',
    userName: 'Alex Johnson',
    userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    menuItems: [
      { title: 'Dashboard', to: '/dashboard', icon: 'mdi-view-dashboard' },
      { title: 'Reports', to: '/reports', icon: 'mdi-chart-bar' },
    ],
  },
}

/**
 * Header with custom title slot content.
 */
export const CustomTitle: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use the `title` slot to provide custom content like breadcrumbs or logos.',
      },
    },
  },
  args: {
    userName: 'User',
    menuItems: [
      { title: 'Home', to: '/', icon: 'mdi-home' },
    ],
  },
  render: (args) => ({
    components: { AppHeader, VIcon },
    setup() {
      return { args }
    },
    template: `
      <AppHeader v-bind="args">
        <template #title>
          <div class="d-flex align-center">
            <VIcon class="mr-2">mdi-rocket-launch</VIcon>
            <span class="font-weight-bold">Custom App Title</span>
          </div>
        </template>
      </AppHeader>
    `,
  }),
}
