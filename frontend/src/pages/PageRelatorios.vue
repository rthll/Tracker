<template>
  <div class="page-heading">
    <div>
      <span class="panel-kicker">Relatórios</span>
      <h2>Exportação</h2>
    </div>
    <div class="report-export-actions">
      <button class="btn btn-primary btn-compact" @click="exportarPdf" type="button" :disabled="!relatorio">Exportar PDF</button>
      <button class="btn btn-outline-secondary btn-compact" @click="exportarCsv" type="button" :disabled="!relatorio">Exportar CSV</button>
      <button class="btn btn-accent btn-compact" @click="exportarExcel" type="button" :disabled="!relatorio || exportandoExcel">
        {{ exportandoExcel ? 'Gerando…' : 'Exportar Excel' }}
      </button>
    </div>
  </div>

  <section class="report-layout">
    <!-- Controls -->
    <article class="panel report-controls">
      <div class="panel-heading">
        <div>
          <span class="panel-kicker">Período</span>
          <h2>Configuração</h2>
        </div>
      </div>
      <div class="report-controls-grid">
        <div class="field-group">
          <label for="relatorioPeriodo" class="form-label">Tipo de relatório</label>
          <AppSelect
            v-model="periodo"
            :options="[
              { value: '1', label: '1 dia' },
              { value: '7', label: '7 dias' },
              { value: '30', label: '30 dias' },
              { value: 'custom', label: 'Dias específicos' },
            ]"
          />
        </div>
        <div class="field-group" v-if="periodo !== 'custom'">
          <label for="relatorioDataBase" class="form-label">Data final</label>
          <input type="date" id="relatorioDataBase" v-model="dataBase" class="form-control">
        </div>
        <div class="report-custom-fields" v-if="periodo === 'custom'">
          <div class="field-group">
            <label for="relatorioDataPontual" class="form-label">Adicionar dia</label>
            <div class="report-date-add">
              <input type="date" id="relatorioDataPontual" v-model="datasPontuaisInput" class="form-control">
              <button class="btn btn-outline-secondary btn-compact" type="button" @click="adicionarDataPontual">Adicionar</button>
            </div>
          </div>
          <div class="selected-date-list">
            <span v-if="!datasPontuais.length" style="font-size:0.85rem;color:var(--text-secondary)">Nenhuma data selecionada.</span>
            <span
              v-for="d in datasPontuais"
              :key="d"
              class="date-chip"
            >{{ d }} <button type="button" style="background:none;border:none;cursor:pointer;padding:0 0.2rem;" @click="removerDataPontual(d)">&times;</button></span>
          </div>
        </div>
        <button class="btn btn-accent w-100" type="button" @click="gerarRelatorio">Gerar relatório</button>
      </div>
    </article>

    <!-- Report preview -->
    <article class="panel report-print-area" id="relatorioPreview" aria-live="polite">
      <!-- Empty state -->
      <div v-if="!relatorio" class="report-empty">
        <p>Configure o período e clique em "Gerar relatório" para visualizar.</p>
      </div>

      <div v-else class="report-document">
        <!-- Header -->
        <div class="report-header">
          <div class="report-title-block">
            <h2>Relatório de Macronutrientes</h2>
            <p>{{ relatorio.datas.length > 0 ? `${relatorio.datas[0]} até ${relatorio.datas[relatorio.datas.length - 1]}` : '' }} — {{ relatorio.totalDias }} dia(s)</p>
          </div>
          <p class="report-generated">Gerado em {{ new Date(relatorio.geradoEm).toLocaleString('pt-BR') }}</p>
        </div>

        <!-- Consistency metrics -->
        <div class="report-section">
          <h3 class="report-section-heading">Consistência</h3>
          <div class="report-metric-grid">
            <div class="report-metric-card">
              <span class="report-metric-label">Dias com registro</span>
              <strong class="report-metric-value">{{ relatorio.metricasConsistencia.diasComRegistro }} / {{ relatorio.totalDias }}</strong>
              <span class="report-metric-pct">{{ fmt(relatorio.metricasConsistencia.percentualDiasComRegistro) }}%</span>
            </div>
            <div class="report-metric-card">
              <span class="report-metric-label">Refeições registradas</span>
              <strong class="report-metric-value">{{ relatorio.metricasConsistencia.refeicoesRegistradas }}</strong>
              <span class="report-metric-pct">Média: {{ fmtD(relatorio.metricasConsistencia.mediaRefeicoesPorDia) }}/dia</span>
            </div>
            <div class="report-metric-card">
              <span class="report-metric-label">Dias com 3+ refeições</span>
              <strong class="report-metric-value">{{ relatorio.metricasConsistencia.diasComTresOuMaisRefeicoes }}</strong>
              <span class="report-metric-pct">{{ fmt(relatorio.metricasConsistencia.percentualDiasComTresOuMaisRefeicoes) }}%</span>
            </div>
            <div class="report-metric-card">
              <span class="report-metric-label">Dias na meta calórica</span>
              <strong class="report-metric-value">{{ relatorio.metricasConsistencia.diasDentroMetaCalorica }}</strong>
              <span class="report-metric-pct">{{ fmt(relatorio.metricasConsistencia.percentualDiasDentroMetaCalorica) }}%</span>
            </div>
            <div class="report-metric-card">
              <span class="report-metric-label">Aderência média aos macros</span>
              <strong class="report-metric-value">{{ fmt(relatorio.metricasConsistencia.aderenciaMediaMacros) }}%</strong>
            </div>
            <div class="report-metric-card">
              <span class="report-metric-label">Total de itens registrados</span>
              <strong class="report-metric-value">{{ relatorio.totalItens }}</strong>
            </div>
          </div>

          <!-- Extremes -->
          <div class="report-extremes" v-if="relatorio.diaMaiorCalorias || relatorio.diaMenorCalorias">
            <div v-if="relatorio.diaMaiorCalorias">
              <span>Maior consumo: </span>
              <strong>{{ relatorio.diaMaiorCalorias.data }}</strong>
              — {{ fmt(relatorio.diaMaiorCalorias.totais.calorias) }} kcal
            </div>
            <div v-if="relatorio.diaMenorCalorias && relatorio.diaMenorCalorias.data !== relatorio.diaMaiorCalorias?.data">
              <span>Menor consumo: </span>
              <strong>{{ relatorio.diaMenorCalorias.data }}</strong>
              — {{ fmt(relatorio.diaMenorCalorias.totais.calorias) }} kcal
            </div>
          </div>
        </div>

        <!-- Macros section -->
        <div class="report-section">
          <h3 class="report-section-heading">Macronutrientes</h3>

          <!-- Distribution bar -->
          <div class="report-macro-stack" v-if="relatorio.distribuicaoMacros">
            <span
              class="report-macro-segment macro-carbs"
              :style="{ width: relatorio.distribuicaoMacros.carboidratos + '%' }"
              :title="`Carboidratos: ${fmt(relatorio.distribuicaoMacros.carboidratos)}%`"
            ></span>
            <span
              class="report-macro-segment macro-protein"
              :style="{ width: relatorio.distribuicaoMacros.proteinas + '%' }"
              :title="`Proteínas: ${fmt(relatorio.distribuicaoMacros.proteinas)}%`"
            ></span>
            <span
              class="report-macro-segment macro-fat"
              :style="{ width: relatorio.distribuicaoMacros.gorduras + '%' }"
              :title="`Gorduras: ${fmt(relatorio.distribuicaoMacros.gorduras)}%`"
            ></span>
          </div>

          <!-- Macros table -->
          <div class="report-table-wrapper">
            <table class="report-table table">
              <thead>
                <tr>
                  <th>Macro</th>
                  <th>Total</th>
                  <th>Média/dia</th>
                  <th>Meta/dia</th>
                  <th>Diferença/dia</th>
                  <th>Aderência</th>
                  <th>Dias na meta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in relatorio.metricasMacros" :key="m.chave">
                  <td>{{ m.nome }}</td>
                  <td>{{ fmt(m.consumidoTotal) }} {{ m.unidade }}</td>
                  <td>{{ fmtD(m.mediaConsumida) }} {{ m.unidade }}</td>
                  <td>{{ m.metaDiaria > 0 ? fmt(m.metaDiaria) + ' ' + m.unidade : '—' }}</td>
                  <td>{{ m.metaDiaria > 0 ? (m.diferencaMedia >= 0 ? '+' : '') + fmtD(m.diferencaMedia) + ' ' + m.unidade : '—' }}</td>
                  <td>{{ m.metaDiaria > 0 ? fmt(m.percentualMeta) + '%' : '—' }}</td>
                  <td>{{ m.metaDiaria > 0 ? m.diasDentroMeta + ' de ' + relatorio.totalDias : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Meals section -->
        <div class="report-section">
          <h3 class="report-section-heading">Refeições</h3>
          <div class="report-table-wrapper">
            <table class="report-table table">
              <thead>
                <tr>
                  <th>Refeição</th>
                  <th>Dias com registro</th>
                  <th>Itens</th>
                  <th>Calorias</th>
                  <th>Carbs</th>
                  <th>Proteínas</th>
                  <th>Gorduras</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in relatorio.refeicoesResumo" :key="r.id">
                  <td>{{ r.nome }}</td>
                  <td>{{ r.diasComRegistro }}</td>
                  <td>{{ r.totalItens }}</td>
                  <td>{{ fmt(r.totais.calorias) }} kcal</td>
                  <td>{{ fmt(r.totais.carboidratos) }}g</td>
                  <td>{{ fmt(r.totais.proteinas) }}g</td>
                  <td>{{ fmt(r.totais.gorduras) }}g</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Daily detail -->
        <div class="report-section report-days-section">
          <h3 class="report-section-heading">Detalhe por dia</h3>
          <div class="report-day-list">
            <div v-for="dia in relatorio.dias" :key="dia.data" class="report-day-card">
              <div class="report-day-header">
                <strong>{{ dia.data }}</strong>
                <span>{{ fmt(dia.totais.calorias) }} kcal · C {{ fmt(dia.totais.carboidratos) }}g · P {{ fmt(dia.totais.proteinas) }}g · G {{ fmt(dia.totais.gorduras) }}g</span>
              </div>
              <div v-if="dia.totalItens === 0" class="report-empty-day">Sem registros neste dia.</div>
              <div v-else class="report-meal-detail">
                <div v-for="ref in dia.refeicoes.filter(r => r.totalItens > 0)" :key="ref.id">
                  <strong style="font-size:0.85rem;">{{ ref.nome }}</strong>
                  <div class="report-table-wrapper">
                    <table class="report-table table" style="font-size:0.8rem;">
                      <thead>
                        <tr><th>Alimento</th><th>Qtd (g)</th><th>Carbs</th><th>Prot</th><th>Gord</th><th>kcal</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, i) in ref.itens" :key="i">
                          <td>{{ item.nome }}</td>
                          <td>{{ fmt(item.quantidade) }}</td>
                          <td>{{ fmt(item.carboidratos) }}g</td>
                          <td>{{ fmt(item.proteinas) }}g</td>
                          <td>{{ fmt(item.gorduras) }}g</td>
                          <td>{{ fmt(item.calorias) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTrackerStore } from '../stores/tracker.js'
import { useUIStore } from '../stores/ui.js'
import { exportarRelatorioCsv, exportarRelatorioXlsx } from '../composables/useRelatorioExport.js'
import { dataLocalISO, somarDias } from '../composables/datas.js'
import AppSelect from '../components/AppSelect.vue'

const trackerStore = useTrackerStore()
const uiStore      = useUIStore()
const exportandoExcel = ref(false)

// ── State ─────────────────────────────────────────────────────────────────────
const periodo           = ref('7')
const dataBase          = ref(dataLocalISO())
const datasPontuais     = ref([])
const datasPontuaisInput = ref(dataLocalISO())
const relatorio         = ref(null)

function fmt(v)  { return String(Math.round(Number(v) || 0)) }
function fmtD(v) { return (Number(v) || 0).toFixed(1) }

// ── Date helpers ──────────────────────────────────────────────────────────────

const datasRelatorio = computed(() => {
  if (periodo.value === 'custom') {
    return [...datasPontuais.value]
  }
  const dias = Number(periodo.value) || 1
  const datas = []
  const base = dataBase.value || dataLocalISO()
  for (let i = dias - 1; i >= 0; i--) {
    datas.push(somarDias(base, -i))
  }
  return datas
})

function adicionarDataPontual() {
  const d = datasPontuaisInput.value
  if (d && !datasPontuais.value.includes(d)) {
    datasPontuais.value = [...datasPontuais.value, d].sort()
  }
}

function removerDataPontual(d) {
  datasPontuais.value = datasPontuais.value.filter(x => x !== d)
}

function gerarRelatorio() {
  relatorio.value = trackerStore.gerarRelatorio(datasRelatorio.value)
}

function exportarPdf() {
  window.print()
}

function exportarCsv() {
  if (!relatorio.value) return
  try {
    exportarRelatorioCsv(relatorio.value)
    uiStore.mostrarToast('CSV exportado.', 'success')
  } catch (e) {
    console.warn('Falha ao exportar CSV', e)
    uiStore.mostrarToast('Não foi possível exportar o CSV.', 'error')
  }
}

async function exportarExcel() {
  if (!relatorio.value || exportandoExcel.value) return
  exportandoExcel.value = true
  try {
    await exportarRelatorioXlsx(relatorio.value)
    uiStore.mostrarToast('Excel exportado.', 'success')
  } catch (e) {
    console.warn('Falha ao exportar Excel', e)
    uiStore.mostrarToast('Não foi possível exportar o Excel.', 'error')
  } finally {
    exportandoExcel.value = false
  }
}
</script>
