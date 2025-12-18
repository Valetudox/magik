<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export interface HeaderSubMenuItem {
  title: string
  to: string
  icon?: string
  external?: boolean
}

export interface HeaderMenuItem {
  title: string
  to?: string
  icon?: string
  external?: boolean
  children?: HeaderSubMenuItem[]
}

interface Props {
  appTitle?: string
  menuItems?: HeaderMenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  appTitle: 'Magik',
  menuItems: () => {
    const isDev = import.meta.env.DEV
    const devUrls = {
      decisions: 'http://localhost:5173/',
      audio: 'http://localhost:5174/',
      tableDocuments: 'http://localhost:5175/',
      specifications: 'http://localhost:5003/',
    }
    const prodUrls = {
      decisions: '/decisions/',
      audio: '/audio/',
      tableDocuments: '/table-documents/',
      specifications: '/specifications/',
    }
    return [
      {
        title: 'Architect',
        icon: 'mdi-drawing',
        children: [
          {
            title: 'Decisions',
            to: isDev ? devUrls.decisions : prodUrls.decisions,
            icon: 'mdi-file-document-multiple',
            external: true,
          },
          {
            title: 'Specifications',
            to: isDev ? devUrls.specifications : prodUrls.specifications,
            icon: 'mdi-file-document-outline',
            external: true,
          },
        ],
      },
      {
        title: 'Tools',
        icon: 'mdi-tools',
        children: [
          {
            title: 'Audio',
            to: isDev ? devUrls.audio : prodUrls.audio,
            icon: 'mdi-microphone',
            external: true,
          },
          {
            title: 'Table Documents',
            to: isDev ? devUrls.tableDocuments : prodUrls.tableDocuments,
            icon: 'mdi-table-large',
            external: true,
          },
        ],
      },
    ]
  },
})

// Detect if we're in development mode
const isDev = import.meta.env.DEV

const route = useRoute()

// Compute active tab index based on current URL
const activeTabIndex = computed(() => {
  const currentUrl = window.location.href
  const currentPath = window.location.pathname

  return props.menuItems.findIndex((item) => {
    // Check if main item is active
    if (item.to) {
      if (item.external) {
        return isDev ? currentUrl.startsWith(item.to) : currentPath.startsWith(item.to)
      }
      return route.path.startsWith(item.to)
    }

    // Check if any child is active
    if (item.children) {
      return item.children.some((child) => {
        if (child.external) {
          return isDev ? currentUrl.startsWith(child.to) : currentPath.startsWith(child.to)
        }
        return route.path.startsWith(child.to)
      })
    }

    return false
  })
})

function navigateToItem(item: HeaderMenuItem | HeaderSubMenuItem) {
  if (item.to) {
    if (item.external) {
      window.location.href = item.to
    }
  }
}
</script>

<template>
  <div>
    <!-- Top bar with menu, actions, and user avatar -->
    <v-app-bar color="primary" density="compact" flat>
      <v-tabs :model-value="activeTabIndex" color="white">
        <template v-for="(item, index) in menuItems" :key="index">
          <!-- Tab with dropdown submenu -->
          <v-menu v-if="item.children && item.children.length > 0" open-on-hover>
            <template #activator="{ props: menuProps }">
              <v-tab :value="index" v-bind="menuProps">
                <v-icon v-if="item.icon" start>{{ item.icon }}</v-icon>
                {{ item.title }}
                <v-icon end size="small">mdi-chevron-down</v-icon>
              </v-tab>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="(child, childIndex) in item.children"
                :key="childIndex"
                :prepend-icon="child.icon"
                :title="child.title"
                @click="navigateToItem(child)"
              />
            </v-list>
          </v-menu>

          <!-- Simple tab without dropdown -->
          <v-tab v-else :value="index" @click="navigateToItem(item)">
            <v-icon v-if="item.icon" start>{{ item.icon }}</v-icon>
            {{ item.title }}
          </v-tab>
        </template>
      </v-tabs>

      <v-spacer />

      <!-- Action buttons slot with 3 dummy buttons as default -->
      <slot name="actions">
        <v-btn icon variant="flat" size="small" color="white">
          <v-icon color="primary">mdi-microphone</v-icon>
        </v-btn>
        <v-btn icon variant="text" size="small">
          <v-icon>mdi-bell-outline</v-icon>
        </v-btn>
        <v-btn icon variant="text" size="small">
          <v-icon>mdi-cog-outline</v-icon>
        </v-btn>
      </slot>
    </v-app-bar>

    <!-- Title bar with breadcrumbs and actions -->
    <v-toolbar color="surface" density="compact" border>
      <v-toolbar-title class="ml-4">
        <slot name="title" />
      </v-toolbar-title>
      <v-spacer />
      <slot name="title-actions" />
    </v-toolbar>
  </div>
</template>
