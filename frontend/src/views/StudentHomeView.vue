<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
</script>

<template>
  <div class="text-2xl">Hello {{ userStore.user?.firstName }}!</div>
</template>
