const Controller = {
  alimentoSelecionadoId: null,
  paginaAtual: "dashboard",
  datasPontuaisRelatorio: [],

  init() {
    Model.init();
    View.atualizarSelectRefeicoes(Model.getTiposRefeicao());
    this.registrarNavegacao();

    const inputData = document.getElementById("dataSelecionada");
    const campoBusca = document.getElementById("buscaAlimento");
    const quantidade = document.getElementById("quantidade");
    const relatorioDataBase = document.getElementById("relatorioDataBase");
    const relatorioDataPontual = document.getElementById("relatorioDataPontual");
    inputData.value = this.obterDataHojeLocal();
    relatorioDataBase.value = inputData.value;
    relatorioDataPontual.value = inputData.value;
    this.datasPontuaisRelatorio = [inputData.value];

    document.getElementById("btnCadastrar").addEventListener("click", () => {
      this.cadastrarAlimento();
    });
    document.getElementById("btnAdicionar").addEventListener("click", () => {
      this.adicionarRefeicao();
    });
    document.getElementById("btnFavoritar").addEventListener("click", () => {
      this.alternarFavorito();
    });
    document.getElementById("btnRepetirRefeicao").addEventListener("click", () => {
      this.repetirRefeicaoAnterior();
    });
    document.getElementById("btnSalvarMetas").addEventListener("click", () => {
      this.salvarMetasDiarias();
    });
    document.getElementById("btnCalcularTmb").addEventListener("click", () => {
      this.calcularTmb();
    });
    document.getElementById("btnUsarTmbMeta").addEventListener("click", () => {
      this.usarTmbComoMetaCalorica();
    });
    document.getElementById("relatorioPeriodo").addEventListener("change", () => {
      this.atualizarRelatorio();
    });
    relatorioDataBase.addEventListener("change", () => {
      this.atualizarRelatorio();
    });
    document.getElementById("btnAdicionarDataRelatorio").addEventListener("click", () => {
      this.adicionarDataPontualRelatorio();
    });
    document.getElementById("btnGerarRelatorio").addEventListener("click", () => {
      this.atualizarRelatorio();
    });
    document.getElementById("btnExportarRelatorioPdf").addEventListener("click", () => {
      this.exportarRelatorioPdf();
    });
    inputData.addEventListener("change", () => {
      relatorioDataBase.value = inputData.value;
      relatorioDataPontual.value = inputData.value;
      this.atualizarView();
    });
    campoBusca.addEventListener("input", () => {
      this.sincronizarAlimentoSelecionado();
    });
    campoBusca.addEventListener("change", () => {
      this.sincronizarAlimentoSelecionado();
    });
    quantidade.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.adicionarRefeicao();
      }
    });

    this.atualizarView();
    this.navegarPara(this.obterPaginaInicial(), false);
  },

  registrarNavegacao() {
    document.querySelectorAll("[data-page-target]").forEach((botao) => {
      botao.addEventListener("click", () => {
        this.navegarPara(botao.dataset.pageTarget);
      });
    });
  },

  obterPaginaInicial() {
    const hash = window.location && window.location.hash
      ? window.location.hash.replace("#", "")
      : "";
    const paginasValidas = ["dashboard", "refeicoes", "alimentos", "metas", "relatorios", "calculadora"];
    return paginasValidas.includes(hash) ? hash : "dashboard";
  },

  navegarPara(pagina, atualizarHash = true) {
    const paginasValidas = ["dashboard", "refeicoes", "alimentos", "metas", "relatorios", "calculadora"];

    if (!paginasValidas.includes(pagina)) {
      return;
    }

    this.paginaAtual = pagina;
    View.mostrarPagina(pagina);

    if (atualizarHash && window.location) {
      window.location.hash = pagina;
    }
  },

  obterDataHojeLocal() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },

  obterDataAnterior(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);
    dataLocal.setDate(dataLocal.getDate() - 1);

    const anoAnterior = dataLocal.getFullYear();
    const mesAnterior = String(dataLocal.getMonth() + 1).padStart(2, "0");
    const diaAnterior = String(dataLocal.getDate()).padStart(2, "0");
    return `${anoAnterior}-${mesAnterior}-${diaAnterior}`;
  },

  formatarDataLocal(dataLocal) {
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, "0");
    const dia = String(dataLocal.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },

  obterIntervaloDatas(dataFinal, quantidadeDias) {
    const dataBase = Model.isDataValida(dataFinal) ? dataFinal : this.obterDataHojeLocal();
    const [ano, mes, dia] = dataBase.split("-").map(Number);
    const fim = new Date(ano, mes - 1, dia);
    const datas = [];

    for (let offset = quantidadeDias - 1; offset >= 0; offset -= 1) {
      const data = new Date(fim);
      data.setDate(fim.getDate() - offset);
      datas.push(this.formatarDataLocal(data));
    }

    return datas;
  },

  getDataAtual() {
    return document.getElementById("dataSelecionada").value || this.obterDataHojeLocal();
  },

  getPeriodoRelatorio() {
    return document.getElementById("relatorioPeriodo").value || "1";
  },

  getDataRelatorioBase() {
    return document.getElementById("relatorioDataBase").value || this.getDataAtual();
  },

  getDatasRelatorioSelecionadas() {
    const periodo = this.getPeriodoRelatorio();

    if (periodo === "custom") {
      return Model.normalizarDatasRelatorio(this.datasPontuaisRelatorio);
    }

    return this.obterIntervaloDatas(this.getDataRelatorioBase(), Number.parseInt(periodo, 10) || 1);
  },

  getRefeicaoSelecionada() {
    return document.getElementById("tipoRefeicao").value || Model.refeicaoPadrao;
  },

  getMetasDigitadas() {
    const lerMeta = (id) => {
      const valor = document.getElementById(id).value.trim();
      return valor ? Number.parseFloat(valor) : 0;
    };

    return {
      carboidratos: lerMeta("metaCarboidratos"),
      proteinas: lerMeta("metaProteinas"),
      gorduras: lerMeta("metaGorduras"),
      calorias: lerMeta("metaCalorias")
    };
  },

  getTmbDigitada() {
    const lerValor = (id) => {
      const valor = document.getElementById(id).value.trim();
      return valor ? Number.parseFloat(valor) : 0;
    };

    return {
      sexo: document.getElementById("tmbSexo").value,
      peso: lerValor("tmbPeso"),
      altura: lerValor("tmbAltura"),
      idade: lerValor("tmbIdade")
    };
  },

  formatarDataExibicao(data) {
    if (!data) {
      return "Sem data definida";
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);

    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(dataLocal);
  },

  cadastrarAlimento() {
    const nome = document.getElementById("nome").value.trim();
    const carboidratos = Number.parseFloat(document.getElementById("carboidratos").value);
    const proteinas = Number.parseFloat(document.getElementById("proteinas").value);
    const gorduras = Number.parseFloat(document.getElementById("gorduras").value);
    const calorias = Number.parseFloat(document.getElementById("calorias").value);
    const valores = [carboidratos, proteinas, gorduras, calorias];

    if (!nome || valores.some(Number.isNaN) || valores.some((valor) => valor < 0)) {
      alert("Preencha corretamente o alimento e informe valores num\u00e9ricos v\u00e1lidos.");
      return;
    }

    if (Model.getAlimentoPorNome(nome)) {
      alert("J\u00e1 existe um alimento cadastrado com esse nome.");
      return;
    }

    const alimento = Model.adicionarAlimento({
      nome,
      carboidratos,
      proteinas,
      gorduras,
      calorias,
      personalizado: true
    });

    this.limparCamposCadastro();
    this.atualizarView();

    if (this.paginaAtual === "dashboard") {
      this.selecionarAlimento(alimento.id);
    }
  },

  limparCamposCadastro() {
    ["nome", "carboidratos", "proteinas", "gorduras", "calorias"].forEach((id) => {
      document.getElementById(id).value = "";
    });
  },

  selecionarAlimento(alimentoId) {
    const alimento = Model.getAlimentoPorId(alimentoId);

    if (!alimento) {
      return;
    }

    if (this.paginaAtual !== "dashboard") {
      this.navegarPara("dashboard");
    }

    this.alimentoSelecionadoId = alimento.id;
    document.getElementById("buscaAlimento").value = alimento.nome;
    View.atualizarEstadoAlimentoSelecionado(alimento, Model.isFavorito(alimento.id));
    document.getElementById("quantidade").focus();
  },

  sincronizarAlimentoSelecionado() {
    const nomeDigitado = document.getElementById("buscaAlimento").value;
    const alimento = Model.getAlimentoPorNome(nomeDigitado);
    this.alimentoSelecionadoId = alimento ? alimento.id : null;
    View.atualizarEstadoAlimentoSelecionado(alimento, alimento ? Model.isFavorito(alimento.id) : false);
  },

  getAlimentoSelecionado() {
    if (this.alimentoSelecionadoId) {
      const alimentoPorId = Model.getAlimentoPorId(this.alimentoSelecionadoId);

      if (alimentoPorId) {
        return alimentoPorId;
      }
    }

    return Model.getAlimentoPorNome(document.getElementById("buscaAlimento").value);
  },

  adicionarRefeicao() {
    const quantidade = Number.parseFloat(document.getElementById("quantidade").value);
    const alimentoBase = this.getAlimentoSelecionado();

    if (!alimentoBase || Number.isNaN(quantidade) || quantidade <= 0) {
      alert("Selecione um alimento cadastrado e informe uma quantidade maior que zero.");
      return;
    }

    const fator = quantidade / 100;
    Model.adicionarRefeicao(this.getDataAtual(), this.getRefeicaoSelecionada(), {
      alimentoId: alimentoBase.id,
      nome: alimentoBase.nome,
      quantidade,
      carboidratos: alimentoBase.carboidratos * fator,
      proteinas: alimentoBase.proteinas * fator,
      gorduras: alimentoBase.gorduras * fator,
      calorias: alimentoBase.calorias * fator
    });
    Model.registrarHistoricoAlimento(alimentoBase.id);

    document.getElementById("quantidade").value = "";
    document.getElementById("buscaAlimento").value = "";
    this.alimentoSelecionadoId = null;
    this.atualizarView();
  },

  alternarFavorito() {
    const alimento = this.getAlimentoSelecionado();

    if (!alimento) {
      return;
    }

    Model.alternarFavorito(alimento.id);
    this.atualizarView();
  },

  salvarMetasDiarias() {
    const metas = this.getMetasDigitadas();
    const valores = Object.values(metas);

    if (valores.some((valor) => Number.isNaN(valor) || valor < 0)) {
      alert("Informe metas maiores ou iguais a zero.");
      return;
    }

    Model.atualizarMetasDiarias(metas);
    this.atualizarView();
  },

  calcularTmb() {
    const perfil = this.getTmbDigitada();

    if (!perfil.sexo || perfil.peso <= 0 || perfil.altura <= 0 || perfil.idade <= 0) {
      alert("Informe sexo, peso, altura e idade para calcular a TMB.");
      return;
    }

    if ([perfil.peso, perfil.altura, perfil.idade].some(Number.isNaN)) {
      alert("Informe valores numericos validos para peso, altura e idade.");
      return;
    }

    Model.atualizarTmbPerfil(perfil);
    this.atualizarView();
  },

  usarTmbComoMetaCalorica() {
    const perfil = Model.getTmbPerfil();

    if (perfil.resultado <= 0) {
      alert("Calcule a TMB antes de aplicar como meta.");
      return;
    }

    Model.atualizarMetasDiarias({
      ...Model.getMetasDiarias(),
      calorias: perfil.resultado
    });
    this.atualizarView();
  },

  adicionarDataPontualRelatorio() {
    const input = document.getElementById("relatorioDataPontual");
    const data = input.value;

    if (!Model.isDataValida(data)) {
      alert("Selecione uma data v\u00e1lida para o relat\u00f3rio.");
      return;
    }

    this.datasPontuaisRelatorio = Model.normalizarDatasRelatorio([
      ...this.datasPontuaisRelatorio,
      data
    ]);
    document.getElementById("relatorioPeriodo").value = "custom";
    this.atualizarRelatorio();
  },

  removerDataPontualRelatorio(data) {
    this.datasPontuaisRelatorio = this.datasPontuaisRelatorio.filter((dataRelatorio) => dataRelatorio !== data);
    this.atualizarRelatorio();
  },

  gerarRelatorioAtual() {
    return Model.gerarRelatorio(this.getDatasRelatorioSelecionadas());
  },

  atualizarRelatorio() {
    const periodo = this.getPeriodoRelatorio();
    const relatorio = this.gerarRelatorioAtual();
    View.atualizarRelatorioControles(periodo, this.datasPontuaisRelatorio);
    View.renderizarRelatorio(relatorio);
  },

  exportarRelatorioPdf() {
    const relatorio = this.gerarRelatorioAtual();

    if (!relatorio.totalDias) {
      alert("Selecione ao menos um dia para exportar o relat\u00f3rio.");
      return;
    }

    View.renderizarRelatorio(relatorio);
    this.navegarPara("relatorios");
    window.print();
  },

  repetirRefeicaoAnterior() {
    const dataAtual = this.getDataAtual();
    const dataAnterior = this.obterDataAnterior(dataAtual);
    const quantidadeItensAnterior = Model.getQuantidadeItensDia(dataAnterior);

    if (!quantidadeItensAnterior) {
      alert("N\u00e3o h\u00e1 refei\u00e7\u00e3o anterior para repetir.");
      return;
    }

    const quantidadeItensAtual = Model.getQuantidadeItensDia(dataAtual);
    const deveContinuar = !quantidadeItensAtual || confirm(
      "O dia atual j\u00e1 possui itens. Deseja adicionar as refei\u00e7\u00f5es do dia anterior mesmo assim?"
    );

    if (!deveContinuar) {
      return;
    }

    Model.repetirRefeicao(dataAnterior, dataAtual);
    this.atualizarView();
  },

  moverItem(refeicaoOrigemId, index, refeicaoDestinoId) {
    Model.moverItem(this.getDataAtual(), refeicaoOrigemId, index, refeicaoDestinoId);
    this.atualizarView();
  },

  removerItem(refeicaoId, index) {
    Model.removerItem(this.getDataAtual(), refeicaoId, index);
    this.atualizarView();
  },

  atualizarView() {
    const dataAtual = this.getDataAtual();
    const dataAnterior = this.obterDataAnterior(dataAtual);
    document.getElementById("dataSelecionada").value = dataAtual;

    View.atualizarCabecalhos(this.formatarDataExibicao(dataAtual));
    View.atualizarAutocompleteAlimentos(Model.getAlimentos());
    View.atualizarAtalhosAlimentos(Model.getFavoritos(), Model.getHistoricoAlimentos());
    View.atualizarAlimentosPersonalizados(Model.getAlimentosPersonalizados(), Model.getAlimentosTaco().length);
    View.atualizarBotaoRepetir(Model.getQuantidadeItensDia(dataAnterior));
    View.atualizarCalculadoraTmb(Model.getTmbPerfil());
    View.atualizarMetasDiarias(Model.getMetasDiarias());
    View.atualizarResumoPorRefeicao(Model.getRefeicoesDoDia(dataAtual), Model.getTiposRefeicao());
    const totaisDoDia = View.atualizarTabelaRefeicao(Model.getRefeicoesDoDia(dataAtual), Model.getTiposRefeicao());
    View.atualizarDashboard(totaisDoDia, Model.getMetasDiarias());
    View.atualizarProgressoMetas(totaisDoDia, Model.getMetasDiarias());
    this.atualizarRelatorio();
    this.sincronizarAlimentoSelecionado();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  Controller.init();
});
