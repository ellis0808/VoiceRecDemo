<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
}
</script>

<template>
  <div>
    <button class="border px-3 py-2" @click="logout">Logout</button>
  </div>
</template>
