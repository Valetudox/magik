<script setup lang="ts">
import AppHeader from './AppHeader.vue'

interface Props {
  pageTitle: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="entity-detail-page">
    <AppHeader>
      <template #title>
        <slot name="title">{{ props.pageTitle }}</slot>
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
