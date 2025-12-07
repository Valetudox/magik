<script setup lang="ts">
import { AppHeader } from '@magik/ui-shared'
</script>

<template>
  <v-app>
    <AppHeader app-title="Magik - Audio Recordings">
      <template #title>
        <div id="header-title-slot">
          Magik - Audio Recordings
        </div>
      </template>
    </AppHeader>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
