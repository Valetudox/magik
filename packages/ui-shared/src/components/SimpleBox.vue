<script setup lang="ts">
interface Props {
  title: string
}

const props = defineProps<Props>()
</script>

<template>
  <v-card>
    <v-card-title>
      <slot name="header">{{ props.title }}</slot>
    </v-card-title>
    <v-card-text>
      <slot />
    </v-card-text>
  </v-card>
</template>
