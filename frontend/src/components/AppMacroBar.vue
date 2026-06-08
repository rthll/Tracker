<template>
  <div class="macro-bar-row">
    <div class="macro-bar-label-row">
      <span class="macro-bar-name">{{ label }}</span>
      <span class="macro-bar-values">
        <strong>{{ fmtNum(value) }}</strong>
        <span v-if="target > 0"> / {{ fmtNum(target) }} {{ unit }}</span>
        <span v-else> {{ unit }}</span>
      </span>
      <span class="macro-bar-pct" :class="pctClass">{{ target > 0 ? fmtNum(pct) + '%' : '—' }}</span>
    </div>
    <svg class="macro-bar-svg" viewBox="0 0 300 10" width="100%" preserveAspectRatio="none">
      <rect class="macro-bar-track" x="0" y="0" width="300" height="10" rx="5"/>
      <rect ref="fillRef" class="macro-bar-fill" x="0" y="0" :width="0" height="10" rx="5"
        :style="{ fill: fillColor }"/>
      <rect v-if="target > 0" class="macro-bar-target-mark"
        :x="Math.min(BAR_W - 2, Math.round(BAR_W * Math.min(target / Math.max(value, target, 1), 1)))"
        y="0" width="2" height="10" fill="var(--line)"/>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { animate } from 'motion'

const props = defineProps({
  value:  { type: Number, default: 0 },
  target: { type: Number, default: 0 },
  color:  { type: String, default: 'var(--primary)' },
  label:  { type: String, required: true },
  unit:   { type: String, default: 'g' },
  pct:    { type: Number, default: 0 },
})

const BAR_W   = 300
const fillRef = ref(null)

const fillColor = computed(() => {
  if (!props.target) return 'var(--primary)'
  if (props.value > props.target * 1.1) return 'var(--danger)'
  if (props.value >= props.target * 0.95) return 'var(--success)'
  return props.color
})

const pctClass = computed(() => {
  if (!props.target) return ''
  if (props.pct >= 110) return 'is-over'
  if (props.pct >= 95) return 'is-done'
  return ''
})

function fmtNum(v) { return String(Math.round(Number(v) || 0)) }

function targetBarWidth() {
  if (!props.target) return BAR_W
  const pct = Math.min(props.value / props.target, 1.15)
  return Math.round(pct * BAR_W)
}

function animateFill(width) {
  if (!fillRef.value) return
  animate(fillRef.value, { width: [0, width] }, { duration: 0.7, easing: [0.25, 0, 0, 1] })
}

onMounted(() => animateFill(targetBarWidth()))
watch(() => props.value, () => animateFill(targetBarWidth()))
</script>
