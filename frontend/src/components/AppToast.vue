<template>
  <div class="app-toast-container" aria-live="polite" aria-atomic="false">
    <transition-group name="toast" tag="div">
      <div
        v-for="t in uiStore.toasts"
        :key="t.id"
        :class="`app-toast app-toast-${t.tipo}`"
        :role="t.tipo === 'error' ? 'alert' : 'status'"
      >{{ t.mensagem }}</div>
    </transition-group>
  </div>
</template>

<script setup>
import { useUIStore } from '../stores/ui.js'
const uiStore = useUIStore()
</script>
