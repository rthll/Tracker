<template>
  <Teleport to="body">
    <button class="chat-fab" @click="chatStore.abrirPanel()" aria-label="Abrir assistente de IA">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" aria-hidden="true">
        <rect x="3" y="8" width="18" height="13" rx="2"/>
        <path d="M8 8V6a4 4 0 0 1 8 0v2"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/>
        <path d="M9 19h6"/>
      </svg>
    </button>
  </Teleport>
</template>

<script setup>
import { useChatStore } from '../stores/chat.js'
const chatStore = useChatStore()
</script>
