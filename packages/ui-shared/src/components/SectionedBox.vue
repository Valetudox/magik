<script setup lang="ts">
interface Props {
  title: string
}

const props = defineProps<Props>()
</script>

<template>
  <v-card class="sectioned-box">
    <v-card-title>{{ props.title }}</v-card-title>
    <v-card-text>
      <slot />
      <template v-if="$slots.footer">
        <v-divider class="my-4" />
        <slot name="footer" />
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.sectioned-box :deep(.box-section + .box-section) {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
