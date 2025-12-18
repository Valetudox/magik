<script setup lang="ts">
import Editable from './Editable.vue'

interface Props {
  title: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
})

defineEmits<{
  edit: []
  editAi: []
}>()
</script>

<template>
  <v-card>
    <v-card-title>{{ props.title }}</v-card-title>
    <Editable
      :editable="props.editable"
      @edit="$emit('edit')"
      @edit-ai="$emit('editAi')"
    >
      <v-card-text>
        <slot />
      </v-card-text>
    </Editable>
  </v-card>
</template>
