<template>
  <Teleport to="body">
    <Transition name="chat-overlay">
      <div v-if="chatStore.panelAberto" class="chat-panel-overlay" @click="chatStore.panelAberto = false" />
    </Transition>

    <Transition name="chat-panel-slide">
      <div v-if="chatStore.panelAberto" class="chat-panel" role="dialog" aria-label="Assistente de IA">

        <!-- Header -->
        <div class="chat-panel-header">
          <button
            v-if="isMobile && mobileView === 'chat'"
            class="chat-header-back"
            @click="mobileView = 'list'"
            aria-label="Ver conversas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Conversas
          </button>
          <span v-else class="chat-header-title">Assistente IA</span>
          <button class="chat-header-close" @click="chatStore.panelAberto = false" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="chat-panel-body">

          <!-- Sidebar: conversations list -->
          <aside class="chat-panel-sidebar" :class="{ 'is-mobile-hidden': isMobile && mobileView === 'chat' }">
            <button class="btn btn-outline-secondary btn-sm w-100" @click="novaConversa" :disabled="loadingNew">
              {{ loadingNew ? '...' : '+ Nova conversa' }}
            </button>
            <ul class="chat-conv-list">
              <li v-if="chatStore.loadingConversations" class="chat-conv-state">Carregando...</li>
              <li v-else-if="chatStore.conversations.length === 0" class="chat-conv-state">Nenhuma conversa</li>
              <li
                v-for="conv in chatStore.conversations"
                :key="conv.id"
                class="chat-conv-item"
                :class="{ 'is-active': conv.id === chatStore.activeId }"
                @click="selecionarConversa(conv.id)"
              >{{ conv.title }}</li>
            </ul>
          </aside>

          <!-- Main: messages + input -->
          <main class="chat-panel-main" :class="{ 'is-mobile-hidden': isMobile && mobileView === 'list' }">
            <div v-if="!chatStore.activeId" class="chat-empty-state">
              <p>Selecione uma conversa ou crie uma nova.</p>
            </div>
            <template v-else>
              <div class="chat-messages" ref="messagesEl">
                <div
                  v-for="msg in chatStore.messages"
                  :key="msg.id"
                  class="chat-message"
                  :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
                >
                  <div
                    class="chat-bubble"
                    v-html="msg.role === 'assistant' ? renderMarkdown(msg.content) : escapeHtml(msg.content)"
                  />
                </div>
                <div v-if="chatStore.loading" class="chat-message is-assistant">
                  <div class="chat-bubble">
                    <span class="chat-typing-indicator">
                      <span /><span /><span />
                    </span>
                  </div>
                </div>
              </div>

              <div class="chat-input-row">
                <textarea
                  ref="inputEl"
                  v-model="inputText"
                  class="chat-input"
                  placeholder="Digite sua mensagem..."
                  rows="1"
                  @keydown="onKeydown"
                  @input="autoResize"
                />
                <button
                  class="chat-send-btn"
                  @click="enviar"
                  :disabled="chatStore.loading || !inputText.trim()"
                  aria-label="Enviar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </template>
          </main>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../stores/chat.js'

const chatStore = useChatStore()

const messagesEl = ref(null)
const inputEl    = ref(null)
const inputText  = ref('')
const loadingNew = ref(false)
const isMobile   = ref(window.innerWidth <= 767)
const mobileView = ref('list') // 'list' | 'chat'

function onResize() { isMobile.value = window.innerWidth <= 767 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// Reset to list view when panel opens
watch(() => chatStore.panelAberto, (open) => {
  if (open && isMobile.value) mobileView.value = 'list'
})

// Scroll to bottom whenever messages change or loading indicator toggles
async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}
watch(() => chatStore.messages.length, scrollToBottom)
watch(() => chatStore.loading, scrollToBottom)

async function selecionarConversa(id) {
  await chatStore.selecionarConversa(id)
  mobileView.value = 'chat'
}

async function novaConversa() {
  loadingNew.value = true
  try {
    await chatStore.criarConversa()
    mobileView.value = 'chat'
  } finally {
    loadingNew.value = false
  }
}

async function enviar() {
  const text = inputText.value.trim()
  if (!text || chatStore.loading) return
  inputText.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  await chatStore.enviarMensagem(text)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    enviar()
  }
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function escapeInline(text) {
  let t = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>')
  return t
}

function renderMarkdown(raw) {
  const lines = String(raw).split('\n')
  const out = []
  let inList = false

  for (const line of lines) {
    const listMatch = line.match(/^[\-\*•] (.+)$/)
    if (listMatch) {
      if (!inList) { out.push('<ul class="chat-md-list">'); inList = true }
      out.push(`<li>${escapeInline(listMatch[1])}</li>`)
    } else {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(line === '' ? '<br>' : escapeInline(line) + '<br>')
    }
  }
  if (inList) out.push('</ul>')

  return out.join('')
}
</script>
