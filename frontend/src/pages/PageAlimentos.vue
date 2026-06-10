<template>
  <div class="page-heading">
    <div>
      <span class="panel-kicker">Alimentos</span>
      <h2>Cadastro e favoritos</h2>
    </div>
    <p>Cadastre os valores por 100g e use os alimentos no registro rápido.</p>
  </div>

  <section class="content-grid single-page-grid">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span class="panel-kicker">{{ editandoId ? 'Edição' : 'Cadastro' }}</span>
          <h2>{{ editandoId ? 'Editar alimento' : 'Cadastrar alimento' }}</h2>
        </div>
      </div>
      <div class="form-grid">
        <div class="field-group span-12">
          <label class="form-label">Nome do alimento</label>
          <input type="text" v-model="form.nome" class="form-control" placeholder="Ex.: Frango grelhado">
        </div>
        <div class="field-group span-6 span-md-3">
          <label class="form-label">Carboidratos</label>
          <input type="number" v-model.number="form.carboidratos" class="form-control" placeholder="0.00" min="0" step="0.01" inputmode="decimal">
        </div>
        <div class="field-group span-6 span-md-3">
          <label class="form-label">Proteínas</label>
          <input type="number" v-model.number="form.proteinas" class="form-control" placeholder="0.00" min="0" step="0.01" inputmode="decimal">
        </div>
        <div class="field-group span-6 span-md-3">
          <label class="form-label">Gorduras</label>
          <input type="number" v-model.number="form.gorduras" class="form-control" placeholder="0.00" min="0" step="0.01" inputmode="decimal">
        </div>
        <div class="field-group span-6 span-md-3">
          <label class="form-label">Calorias</label>
          <input type="number" v-model.number="form.calorias" class="form-control" placeholder="0.00" min="0" step="0.01" inputmode="decimal">
        </div>
        <div class="field-group span-12 food-form-actions">
          <button class="btn btn-primary w-100" @click="salvarAlimento" type="button">
            {{ editandoId ? 'Salvar alterações' : 'Cadastrar alimento' }}
          </button>
          <button v-if="editandoId" class="btn btn-outline-secondary w-100" @click="cancelarEdicao" type="button">
            Cancelar edição
          </button>
        </div>
      </div>
    </article>

    <article class="panel">
      <div class="quick-block-heading">
        <h3>Alimentos personalizados</h3>
        <span><strong>{{ alimentosPersonalizados.length }}</strong> cadastrados</span>
      </div>
      <p class="field-hint food-base-hint">
        Base TACO carregada: <strong>{{ alimentosTaco.length }}</strong> alimentos disponíveis no registro rápido.
      </p>
      <div class="chip-list food-library">
        <span v-if="!alimentosPersonalizados.length" class="chip-empty">Nenhum alimento personalizado cadastrado.</span>
        <template v-else>
          <div
            v-for="alimento in alimentosPersonalizados"
            :key="alimento.id"
            class="food-chip food-chip-custom"
            :class="{ 'is-editing': alimento.id === editandoId }">
            <button
              type="button"
              class="food-chip-main"
              @click="selecionarAlimento(alimento.id)">
              <span class="food-chip-name">{{ alimento.nome }}</span>
              <span class="food-chip-macros">Personalizado | {{ fmt(alimento.calorias) }} kcal/100g</span>
            </button>
            <div class="food-chip-actions">
              <button
                type="button"
                class="editar-registro"
                :aria-label="`Editar ${alimento.nome}`"
                @click="iniciarEdicao(alimento)">Editar</button>
              <button
                type="button"
                class="remover"
                :aria-label="`Remover ${alimento.nome}`"
                @click="removerAlimento(alimento)">x</button>
            </div>
          </div>
        </template>
      </div>
    </article>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFoodStore } from '../stores/food.js'
import { useTrackerStore } from '../stores/tracker.js'
import { useUIStore } from '../stores/ui.js'

const foodStore    = useFoodStore()
const trackerStore = useTrackerStore()
const uiStore      = useUIStore()

const alimentosPersonalizados = computed(() =>
  [...foodStore.alimentosPersonalizados].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
)
const alimentosTaco = computed(() => foodStore.alimentosTaco)

const form       = ref({ nome: '', carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })
const editandoId = ref(null)

function fmt(v) { return String(Math.round(Number(v) || 0)) }

function limparForm() {
  form.value = { nome: '', carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 }
  editandoId.value = null
}

function salvarAlimento() {
  const { nome, carboidratos, proteinas, gorduras, calorias } = form.value
  if (!nome.trim()) {
    uiStore.mostrarToast('Informe o nome do alimento.', 'error')
    return
  }
  const dados = { nome: nome.trim(), carboidratos, proteinas, gorduras, calorias }
  if (editandoId.value) {
    trackerStore.atualizarAlimento(editandoId.value, dados)
    uiStore.mostrarToast('Alimento atualizado com sucesso.', 'success')
  } else {
    trackerStore.adicionarAlimento(dados)
    uiStore.mostrarToast('Alimento cadastrado com sucesso.', 'success')
  }
  limparForm()
}

function iniciarEdicao(alimento) {
  editandoId.value = alimento.id
  form.value = {
    nome:         alimento.nome,
    carboidratos: alimento.carboidratos,
    proteinas:    alimento.proteinas,
    gorduras:     alimento.gorduras,
    calorias:     alimento.calorias,
  }
}

function cancelarEdicao() {
  limparForm()
}

function removerAlimento(alimento) {
  if (!confirm(`Remover o alimento "${alimento.nome}"?`)) return
  trackerStore.removerAlimento(alimento.id)
  if (editandoId.value === alimento.id) limparForm()
  uiStore.mostrarToast('Alimento removido.', 'success')
}

function selecionarAlimento(id) {
  uiStore.preselectedFoodId = id
  uiStore.navegarPara('dashboard')
}
</script>
