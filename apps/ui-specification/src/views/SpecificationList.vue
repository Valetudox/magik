<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, type SpecificationSummary } from '../services/api'

const router = useRouter()
const specifications = ref<SpecificationSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

const headers = [
  { title: 'Title', key: 'title', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
]

onMounted(async () => {
  loading.value = true
  try {
    specifications.value = await api.getSpecifications()
  } catch (e) {
    error.value =
      'Failed to load specifications. Make sure the backend is running on http://localhost:4002'
    console.error(e)
  } finally {
    loading.value = false
  }
})

function goToDetail(_event: unknown, { item }: { item: SpecificationSummary }) {
  router.push(`/${item.id}`)
}
</script>

<template>
  <div>
    <Teleport to="#header-title-slot">
      <div>Specifications</div>
    </Teleport>

    <v-container fluid>
      <!-- Loading state -->
      <v-row v-if="loading" class="fill-height" align="center" justify="center">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4">Loading specifications...</p>
        </v-col>
      </v-row>

      <!-- Error state -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- Data table -->
      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-text-field
                v-model="search"
                label="Search specifications"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </v-card-title>
            <v-data-table
              :headers="headers"
              :items="specifications"
              :search="search"
              hover
              class="clickable-rows"
              @click:row="goToDetail"
            >
              <template #[`item.title`]="{ item }">
                <strong>{{ item.title }}</strong>
              </template>

              <template #no-data>
                <v-alert type="info" variant="text"> No specifications found </v-alert>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}

.clickable-rows :deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
