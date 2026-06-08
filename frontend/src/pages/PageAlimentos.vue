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
          <span class="panel-kicker">Cadastro</span>
          <h2>Cadastrar alimento</h2>
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
        <div class="field-group span-12">
          <button class="btn btn-primary w-100" @click="cadastrar" type="button">Cadastrar alimento</button>
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
          <button
            v-for="alimento in alimentosPersonalizados"
            :key="alimento.id"
            type="button"
            class="food-chip"
            @click="selecionarAlimento(alimento.id)">
            <span class="food-chip-name">{{ alimento.nome }}</span>
            <span class="food-chip-macros">Personalizado | {{ fmt(alimento.calorias) }} kcal/100g</span>
          </button>
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

const form = ref({ nome: '', carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })

function fmt(v) { return String(Math.round(Number(v) || 0)) }

function cadastrar() {
  const { nome, carboidratos, proteinas, gorduras, calorias } = form.value
  if (!nome.trim()) {
    uiStore.mostrarToast('Informe o nome do alimento.', 'error')
    return
  }
  trackerStore.adicionarAlimento({ nome: nome.trim(), carboidratos, proteinas, gorduras, calorias })
  form.value = { nome: '', carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 }
  uiStore.mostrarToast('Alimento cadastrado com sucesso.', 'success')
}

function selecionarAlimento(id) {
  uiStore.preselectedFoodId = id
  uiStore.navegarPara('dashboard')
}
</script>
