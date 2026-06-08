<template>
  <section class="auth-card" id="authGate">
    <div class="auth-copy">
      <span class="panel-kicker">Acesso</span>
      <h1>Tracker de Macronutrientes</h1>
      <p>Entre com sua conta para salvar refeições, metas, histórico e alimentos personalizados na nuvem.</p>
    </div>

    <div class="auth-form">
      <div class="field-group">
        <label for="authEmail" class="form-label">E-mail</label>
        <input type="email" id="authEmail" v-model="email" class="form-control" autocomplete="email" placeholder="seu@email.com" @input="onEmailInput">
      </div>

      <div class="field-group">
        <label for="authPassword" class="form-label">Senha</label>
        <input type="password" id="authPassword" v-model="password" class="form-control" autocomplete="current-password" placeholder="Mínimo de 6 caracteres" @keydown.enter="loginUsuario">
      </div>

      <Transition name="auth-code">
        <div v-if="cadastroCodigoSolicitado" class="field-group" id="authSignupCodeGroup">
          <label for="authSignupCode" class="form-label">Código de cadastro</label>
          <input type="text" id="authSignupCode" v-model="signupCode" class="form-control" autocomplete="one-time-code" inputmode="numeric" maxlength="6" placeholder="6 dígitos" @keydown.enter="confirmarCadastroUsuario">
          <p class="field-hint">Informe o código de 6 dígitos recebido por e-mail.</p>
          <button class="btn btn-link auth-link-action" type="button" :disabled="loadingReenviar" @click="reenviarCodigoCadastro">Não recebi o código — reenviar</button>
        </div>
      </Transition>

      <p class="auth-status" :class="statusClass" role="status">{{ status }}</p>

      <div class="auth-actions">
        <button class="btn btn-primary" id="btnLogin" type="button" :disabled="loadingLogin" @click="loginUsuario">Entrar</button>
        <button class="btn btn-outline-secondary" id="btnRegister" type="button" :disabled="loadingRegister" @click="acaoCadastro">{{ cadastroCodigoSolicitado ? 'Confirmar cadastro' : 'Criar conta' }}</button>
        <button class="btn btn-link auth-link-action" id="btnResetPassword" type="button" :disabled="loadingReset" @click="resetarSenhaUsuario">Esqueci minha senha</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from '../composables/api.js'

const email    = ref('')
const password = ref('')
const signupCode = ref('')
const status   = ref('Verificando sessão...')
const statusTipo = ref('')
const loadingLogin    = ref(false)
const loadingRegister = ref(false)
const loadingReset    = ref(false)
const loadingReenviar = ref(false)
const cadastroCodigoSolicitado = ref(false)
const cadastroPendenteEmail    = ref('')

const statusClass = computed(() =>
  'auth-status' + (statusTipo.value ? ` is-${statusTipo.value}` : '')
)

function setStatus(msg, tipo = '') {
  status.value = msg || ''
  statusTipo.value = tipo
  // also update window._stores.ui for controller.js compat
  window._stores?.ui?.setAuthStatus(msg, tipo)
}

function onEmailInput() {
  if (cadastroCodigoSolicitado.value && cadastroPendenteEmail.value
      && email.value.trim().toLowerCase() !== cadastroPendenteEmail.value) {
    resetarEtapaCodigo()
  }
}

function resetarEtapaCodigo() {
  cadastroCodigoSolicitado.value = false
  cadastroPendenteEmail.value = ''
  signupCode.value = ''
  setStatus('')
}

async function loginUsuario() {
  if (!email.value || !password.value) { setStatus('Informe e-mail e senha.', 'error'); return }
  loadingLogin.value = true
  try {
    setStatus('Entrando...')
    await window.TrackerAuth.login(email.value, password.value)
  } catch (err) {
    setStatus(formatarErro(err), 'error')
  } finally {
    loadingLogin.value = false
  }
}

async function acaoCadastro() {
  if (cadastroCodigoSolicitado.value) {
    await confirmarCadastroUsuario()
  } else {
    await cadastrarUsuario()
  }
}

async function cadastrarUsuario() {
  if (!email.value || password.value.length < 6) { setStatus('Informe e-mail e senha com pelo menos 6 caracteres.', 'error'); return }
  loadingRegister.value = true
  try {
    setStatus('Enviando código de cadastro...')
    const resultado = await api.requestSignupCode(email.value)
    cadastroPendenteEmail.value = email.value.toLowerCase()
    cadastroCodigoSolicitado.value = true
    const dev = resultado.devCode ? ` Código em desenvolvimento: ${resultado.devCode}` : ''
    setStatus(`Código enviado para ${email.value}. Ele expira em ${resultado.expiresInMinutes} minutos.${dev}`, 'success')
  } catch (err) {
    setStatus(formatarErro(err), 'error')
  } finally {
    loadingRegister.value = false
  }
}

async function confirmarCadastroUsuario() {
  if (!email.value || password.value.length < 6) { setStatus('Informe e-mail e senha com pelo menos 6 caracteres.', 'error'); return }
  if (!/^\d{6}$/.test(signupCode.value)) { setStatus('Informe o código de 6 dígitos recebido por e-mail.', 'error'); return }
  if (cadastroPendenteEmail.value && cadastroPendenteEmail.value !== email.value.toLowerCase()) { setStatus('Solicite um novo código para este e-mail.', 'error'); return }
  loadingRegister.value = true
  try {
    setStatus('Confirmando cadastro...')
    await api.completeSignup(email.value, password.value, signupCode.value)
    setStatus('Cadastro confirmado. Entrando...', 'success')
    await window.TrackerAuth.login(email.value, password.value)
    resetarEtapaCodigo()
  } catch (err) {
    setStatus(formatarErro(err), 'error')
  } finally {
    loadingRegister.value = false
  }
}

async function resetarSenhaUsuario() {
  if (!email.value) { setStatus('Informe seu e-mail para receber a redefinição de senha.', 'error'); return }
  loadingReset.value = true
  try {
    setStatus('Enviando e-mail de redefinição...')
    await window.TrackerAuth.resetPassword(email.value)
    setStatus('E-mail de redefinição enviado. Verifique sua caixa de entrada.', 'success')
  } catch (err) {
    setStatus(formatarErro(err), 'error')
  } finally {
    loadingReset.value = false
  }
}

async function reenviarCodigoCadastro() {
  if (!email.value || password.value.length < 6) { setStatus('Informe e-mail e senha antes de reenviar o código.'); return }
  loadingReenviar.value = true
  try {
    setStatus('Reenviando código...')
    const resultado = await api.requestSignupCode(email.value)
    cadastroPendenteEmail.value = email.value.toLowerCase()
    signupCode.value = ''
    const dev = resultado.devCode ? ` Código em desenvolvimento: ${resultado.devCode}` : ''
    setStatus(`Novo código enviado para ${email.value}. Ele expira em ${resultado.expiresInMinutes} minutos.${dev}`, 'success')
  } catch (err) {
    setStatus(formatarErro(err), 'error')
  } finally {
    loadingReenviar.value = false
  }
}

function formatarErro(err) {
  const mapa = {
    'auth/invalid-credential':       'E-mail ou senha incorretos.',
    'auth/user-not-found':           'Não há conta com este e-mail.',
    'auth/wrong-password':           'Senha incorreta.',
    'auth/email-already-in-use':     'Este e-mail já possui uma conta.',
    'auth/weak-password':            'A senha deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests':        'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed':   'Erro de conexão. Verifique sua internet.',
    'auth/user-disabled':            'Esta conta foi desativada.',
    'auth/invalid-email':            'Endereço de e-mail inválido.',
  }
  return mapa[err?.code] || err?.message || 'Erro inesperado. Tente novamente.'
}

// Expose setStatus so controller.js can call it (for "Verificando sessão..." etc.)
defineExpose({ setStatus })
</script>
