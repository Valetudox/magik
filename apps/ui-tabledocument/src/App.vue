<script setup lang="ts">
import { AppHeader } from '@magik/ui-shared'
</script>

<template>
  <v-app>
    <AppHeader app-title="Magik - Table Documents">
      <template #title>
        <div id="header-title-slot" />
      </template>
    </AppHeader>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
