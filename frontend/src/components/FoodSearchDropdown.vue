<template>
  <div class="food-search-wrapper">
    <div class="food-search-row">
      <input
        ref="referenceRef"
        type="text"
        :id="inputId"
        class="form-control"
        autocomplete="off"
        :placeholder="placeholder || 'Digite para buscar um alimento'"
        :value="foodSearch.termo.value"
        @input="e => foodSearch.buscar(e.target.value)"
        @focus="foodSearch.buscar(foodSearch.termo.value, true)"
        @keydown="onKeydown"
      >
      <slot name="after-input" />
    </div>

    <Teleport to="body">
      <div
        v-show="foodSearch.painelAberto.value"
        ref="floatingRef"
        class="food-search-panel food-search-panel--floating"
        :style="floatingStyles"
      >
        <div
          v-for="(alimento, i) in foodSearch.resultados.value"
          :key="alimento.id"
          class="food-search-option"
          :class="{ 'is-focused': i === foodSearch.focusedIndex.value }"
          @mousedown.prevent="emit('selecionar', alimento)"
        >
          <div class="food-search-option-top">
            <span class="food-search-option-name" v-html="highlightText(alimento.nome, foodSearch.termo.value)"></span>
            <span :class="alimento.personalizado ? 'food-origin-badge personal' : 'food-origin-badge taco'">
              {{ alimento.personalizado ? 'Personal' : 'TACO' }}
            </span>
          </div>
          <span class="food-search-option-macros">
            C {{ fmt(alimento.carboidratos) }}g · P {{ fmt(alimento.proteinas) }}g · G {{ fmt(alimento.gorduras) }}g · {{ fmt(alimento.calorias) }} kcal/100g
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useFloating, offset, flip, size, autoUpdate } from '@floating-ui/vue'
import { animate } from 'motion'

const props = defineProps({
  foodSearch:  { type: Object, required: true },
  inputId:     { type: String, default: '' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['selecionar'])

const referenceRef = ref(null)
const floatingRef  = ref(null)

const { floatingStyles } = useFloating(referenceRef, floatingRef, {
  placement: 'bottom-start',
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(4),
    flip({ fallbackPlacements: ['top-start'] }),
    size({
      apply({ rects, elements }) {
        elements.floating.style.width = rects.reference.width + 'px'
      }
    })
  ]
})

watch(() => props.foodSearch.painelAberto.value, async (aberto) => {
  const el = floatingRef.value
  if (!el) return
  if (aberto) {
    animate(el, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.18 })
  } else {
    await animate(el, { opacity: [1, 0], y: [0, -4] }, { duration: 0.12 }).finished
  }
})

function onKeydown(e) {
  const fs = props.foodSearch
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    fs.moverFoco(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    fs.moverFoco(-1)
  } else if (e.key === 'Enter') {
    if (fs.selecionarFocado()) {
      e.preventDefault()
      emit('selecionar', fs.alimentoSelecionado.value)
    }
  } else if (e.key === 'Escape') {
    fs.fecharPainel()
  }
}

function fmt(v) { return String(Math.round(Number(v) || 0)) }

function highlightText(text, termo) {
  if (!termo) return text
  const idx = text.toLowerCase().indexOf(termo.toLowerCase())
  if (idx === -1) return text
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + termo.length) + '</mark>' + text.slice(idx + termo.length)
}
</script>
