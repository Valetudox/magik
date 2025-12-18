<script setup lang="ts">
import { computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'

interface Props {
  title: string
  subtitle: string
  goBackUrl: string
}

const props = defineProps<Props>()

const breadcrumbItems = computed(() => [
  { title: props.title, href: props.goBackUrl },
  { title: props.subtitle, disabled: true },
])
</script>

<template>
  <div class="entity-detail-page">
    <AppHeader>
      <template #title>
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0" />
      </template>
      <template #actions>
        <slot name="headerActions" />
      </template>
    </AppHeader>

    <v-container fluid>
      <v-row>
        <v-col cols="2">
          <slot name="sidebar" />
        </v-col>
        <v-col cols="10">
          <slot />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.entity-detail-page :deep(.v-breadcrumbs) {
  font-size: inherit;
}

.entity-detail-page :deep(.v-breadcrumbs-item--link) {
  text-decoration: underline;
}

.entity-detail-page :deep(.v-breadcrumbs-item--link:hover) {
  opacity: 0.8;
}
</style>
