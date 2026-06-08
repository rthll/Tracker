<template>
  <div class="conta-modal-overlay" id="contaModalOverlay" :hidden="!uiStore.contaModalAberta" @click.self="fechar">
    <div class="conta-modal" role="dialog" aria-modal="true" aria-labelledby="contaModalTitulo" tabindex="-1">
      <div class="conta-modal-header">
        <div>
          <span class="panel-kicker">Perfil</span>
          <h2 id="contaModalTitulo">Minha conta</h2>
        </div>
        <button class="conta-modal-close" id="btnFecharConta" type="button" aria-label="Fechar" @click="fechar">&times;</button>
      </div>

      <div class="conta-info-block">
        <span class="conta-info-label">E-mail</span>
        <span class="conta-info-value" id="contaEmailExibido">{{ userEmail }}</span>
      </div>

      <div class="conta-danger-zone">
        <p class="conta-danger-title">Zona de perigo</p>
        <p class="conta-danger-desc">A exclusão de conta é permanente e não pode ser desfeita. Todos os seus dados de refeições, metas, alimentos personalizados e histórico serão removidos.</p>

        <div id="contaConfirmacaoExclusao" :hidden="!confirmandoExclusao">
          <p class="conta-danger-confirm">Você tem certeza absoluta? Esta ação é irreversível.</p>
          <p class="conta-status" :class="contaStatusClass">{{ contaStatus }}</p>
          <div class="conta-confirm-actions">
            <button class="btn btn-danger" id="btnConfirmarExcluirConta" type="button" :disabled="excluindo" @click="confirmarExclusao">Sim, excluir minha conta</button>
            <button class="btn btn-link" id="btnCancelarExclusao" type="button" @click="confirmandoExclusao = false">Cancelar</button>
          </div>
        </div>

        <button class="btn btn-outline-danger" id="btnExcluirConta" type="button" :hidden="confirmandoExclusao" @click="confirmandoExclusao = true">Excluir conta</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '../stores/ui.js'
import { useAuthStore } from '../stores/auth.js'
import { api } from '../composables/api.js'

const uiStore   = useUIStore()
const authStore = useAuthStore()

const confirmandoExclusao = ref(false)
const contaStatus         = ref('')
const contaStatusTipo     = ref('')
const excluindo           = ref(false)

const userEmail   = computed(() => authStore.user?.email || '—')
const contaStatusClass = computed(() => contaStatusTipo.value ? `is-${contaStatusTipo.value}` : '')

function fechar() {
  uiStore.contaModalAberta = false
  confirmandoExclusao.value = false
  contaStatus.value = ''
}

async function confirmarExclusao() {
  excluindo.value = true
  contaStatus.value = 'Excluindo conta...'
  contaStatusTipo.value = ''
  try {
    await api.deleteAccount()
    await window.TrackerAuth.logout()
    fechar()
  } catch (err) {
    contaStatus.value = err?.message || 'Erro ao excluir conta.'
    contaStatusTipo.value = 'error'
    excluindo.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && uiStore.contaModalAberta) fechar()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>
