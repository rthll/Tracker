<template>
  <div class="app-select" :class="{ 'is-open': open, 'is-disabled': disabled }" ref="containerRef">
    <button
      ref="triggerRef"
      type="button"
      class="app-select-trigger"
      :disabled="disabled"
      @click="toggleOpen"
      @keydown="onKeydown"
      :aria-expanded="open"
      :aria-haspopup="'listbox'"
    >
      <span class="app-select-value">{{ selectedLabel || placeholder }}</span>
      <svg class="app-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-show="open"
        ref="dropdownRef"
        class="app-select-dropdown"
        role="listbox"
        :style="floatingStyles"
      >
        <div
          v-for="(opt, i) in options"
          :key="opt.value"
          class="app-select-option"
          :class="{ 'is-selected': opt.value === modelValue, 'is-focused': i === focusedIndex }"
          role="option"
          :aria-selected="opt.value === modelValue"
          @mousedown.prevent="select(opt)"
          @mousemove="focusedIndex = i"
        >{{ opt.label }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useFloating, offset, flip, size, autoUpdate } from '@floating-ui/vue'
import { animate } from 'motion'

const props = defineProps({
  modelValue: String,
  options:    { type: Array,   default: () => [] },
  disabled:   { type: Boolean, default: false },
  placeholder:{ type: String,  default: 'Selecione...' },
})

const emit = defineEmits(['update:modelValue'])

const open         = ref(false)
const focusedIndex = ref(-1)
const containerRef = ref(null)
const triggerRef   = ref(null)
const dropdownRef  = ref(null)

const { floatingStyles } = useFloating(triggerRef, dropdownRef, {
  placement: 'bottom-start',
  whileElementsMounted: autoUpdate,
  transform: false, // use top/left instead of CSS transform — avoids conflict with Motion y animation
  middleware: [
    offset(4),
    flip({ fallbackPlacements: ['top-start'] }),
    size({
      apply({ rects, elements }) {
        elements.floating.style.minWidth = rects.reference.width + 'px'
      }
    }),
  ],
})

const selectedLabel = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : ''
})

watch(open, async (val) => {
  await nextTick() // wait for v-show to remove display:none before animating
  const el = dropdownRef.value
  if (!el) return
  if (val) {
    const idx = props.options.findIndex(o => o.value === props.modelValue)
    focusedIndex.value = idx >= 0 ? idx : 0
    animate(el, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.18 })
  }
})

function toggleOpen() {
  if (props.disabled) return
  open.value ? closeDropdown() : (open.value = true)
}

function closeDropdown() {
  const el = dropdownRef.value
  if (!el) { open.value = false; return }
  animate(el, { opacity: [1, 0], y: [0, -4] }, { duration: 0.12 }).then(() => {
    open.value = false
  })
}

function select(opt) {
  emit('update:modelValue', opt.value)
  closeDropdown()
}

function onKeydown(e) {
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault(); open.value = true
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(props.options.length - 1, focusedIndex.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(0, focusedIndex.value - 1)
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (focusedIndex.value >= 0 && props.options[focusedIndex.value]) select(props.options[focusedIndex.value])
  } else if (e.key === 'Escape') {
    e.preventDefault(); closeDropdown()
  }
}

function onDocClick(e) {
  if (!open.value) return
  const inTrigger  = containerRef.value?.contains(e.target)
  const inDropdown = dropdownRef.value?.contains(e.target)
  if (!inTrigger && !inDropdown) closeDropdown()
}

onMounted(()  => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>
