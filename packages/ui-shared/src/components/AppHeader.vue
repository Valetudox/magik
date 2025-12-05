<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export interface HeaderMenuItem {
  title: string
  to: string
  icon?: string
  external?: boolean
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
      specifications: 'http://localhost:5003/',
    }
    const prodUrls = {
      decisions: '/decisions/',
      audio: '/audio/',
      specifications: '/specifications/',
    }
    return [
      {
        title: 'Decisions',
        to: isDev ? devUrls.decisions : prodUrls.decisions,
        icon: 'mdi-file-document-multiple',
        external: true,
      },
      {
        title: 'Audio',
        to: isDev ? devUrls.audio : prodUrls.audio,
        icon: 'mdi-microphone',
        external: true,
      },
      {
        title: 'Specifications',
        to: isDev ? devUrls.specifications : prodUrls.specifications,
        icon: 'mdi-file-document-outline',
        external: true,
      },
    ]
  },
})

// Detect if we're in development mode
const isDev = import.meta.env.DEV

const route = useRoute()

// Determine which tab is active based on current route
const activeTab = computed(() => {
  const currentUrl = window.location.href
  const currentPath = window.location.pathname

  const index = props.menuItems.findIndex((item) => {
    if (item.external) {
      // In dev mode, check full URL including port
      if (isDev) {
        // Match by checking if current URL starts with the item URL
        // e.g., http://localhost:5173/ matches http://localhost:5173/anything
        return currentUrl.startsWith(item.to)
      }
      // In prod mode, check pathname
      return currentPath.startsWith(item.to)
    }
    return route.path.startsWith(item.to)
  })
  return index >= 0 ? index : null
})

function navigateToItem(item: HeaderMenuItem) {
  if (item.external) {
    // External link - use full page navigation
    window.location.href = item.to
  }
}
</script>

<template>
  <v-app-bar color="primary" prominent>
    <v-app-bar-title>
      <div id="header-title-slot">
        <slot name="title">
          {{ appTitle }}
        </slot>
      </div>
    </v-app-bar-title>

    <v-spacer />

    <div id="header-actions-slot">
      <slot name="actions" />
    </div>

    <v-tabs :model-value="activeTab" color="white" align-tabs="end" class="mr-4">
      <v-tab
        v-for="(item, index) in menuItems"
        :key="index"
        :prepend-icon="item.icon"
        @click="navigateToItem(item)"
      >
        {{ item.title }}
      </v-tab>
    </v-tabs>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
