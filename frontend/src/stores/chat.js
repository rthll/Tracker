import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../composables/api.js'

export const useChatStore = defineStore('chat', () => {
  const panelAberto          = ref(false)
  const conversations        = ref([])
  const activeId             = ref(null)
  const messages             = ref([])
  const loading              = ref(false)
  const loadingConversations = ref(false)

  async function carregarConversas() {
    loadingConversations.value = true
    try {
      conversations.value = await api.getChatConversations()
    } catch (err) {
      console.warn('[chat] carregarConversas:', err)
    } finally {
      loadingConversations.value = false
    }
  }

  async function criarConversa() {
    try {
      const conv = await api.createChatConversation()
      conversations.value.unshift(conv)
      await _carregarMensagens(conv.id)
      return conv
    } catch (err) {
      console.warn('[chat] criarConversa:', err)
    }
  }

  async function selecionarConversa(id) {
    if (activeId.value === id) return
    await _carregarMensagens(id)
  }

  async function _carregarMensagens(id) {
    activeId.value = id
    messages.value = []
    try {
      messages.value = await api.getChatMessages(id)
    } catch (err) {
      console.warn('[chat] carregarMensagens:', err)
    }
  }

  async function enviarMensagem(content) {
    if (!activeId.value || !content.trim() || loading.value) return
    const text = content.trim()
    messages.value.push({
      id: `tmp-u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    })
    loading.value = true
    try {
      const response = await api.sendChatMessage(activeId.value, text)
      messages.value.push(response)
      _atualizarConversa(activeId.value, response.createdAt, text)
    } catch (err) {
      console.warn('[chat] enviarMensagem:', err)
      messages.value.push({
        id: `tmp-e-${Date.now()}`,
        role: 'assistant',
        content: 'Erro ao obter resposta. Tente novamente.',
        createdAt: new Date().toISOString(),
      })
    } finally {
      loading.value = false
    }
  }

  function _atualizarConversa(id, updatedAt, firstContent) {
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx < 0) return
    const conv = { ...conversations.value[idx], updatedAt }
    if (conv.title === 'Nova conversa') {
      conv.title = firstContent.slice(0, 50) + (firstContent.length > 50 ? '…' : '')
    }
    conversations.value.splice(idx, 1)
    conversations.value.unshift(conv)
  }

  async function abrirPanel() {
    panelAberto.value = true
    if (conversations.value.length === 0) {
      await carregarConversas()
    }
    if (conversations.value.length === 0) {
      await criarConversa()
    } else if (!activeId.value) {
      await _carregarMensagens(conversations.value[0].id)
    }
  }

  return {
    panelAberto,
    conversations,
    activeId,
    messages,
    loading,
    loadingConversations,
    abrirPanel,
    carregarConversas,
    criarConversa,
    selecionarConversa,
    enviarMensagem,
  }
})
