import { createApp } from 'vue'
import { pinia } from './stores/pinia.js'
import App from './App.vue'

document.addEventListener('DOMContentLoaded', () => {
  createApp(App).use(pinia).mount('#app')
})
