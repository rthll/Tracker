const Controller = {
  alimentoSelecionadoId: null,

  init() {
    Model.init();
    View.atualizarSelectRefeicoes(Model.getTiposRefeicao());

    const inputData = document.getElementById("dataSelecionada");
    const campoBusca = document.getElementById("buscaAlimento");
    const quantidade = document.getElementById("quantidade");
    inputData.value = this.obterDataHojeLocal();

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
    inputData.addEventListener("change", () => {
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

  getDataAtual() {
    return document.getElementById("dataSelecionada").value || this.obterDataHojeLocal();
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
    this.selecionarAlimento(alimento.id);
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
    View.atualizarAlimentosPersonalizados(Model.getAlimentos());
    View.atualizarBotaoRepetir(Model.getQuantidadeItensDia(dataAnterior));
    View.atualizarMetasDiarias(Model.getMetasDiarias());
    View.atualizarResumoPorRefeicao(Model.getRefeicoesDoDia(dataAtual), Model.getTiposRefeicao());
    const totaisDoDia = View.atualizarTabelaRefeicao(Model.getRefeicoesDoDia(dataAtual), Model.getTiposRefeicao());
    View.atualizarDashboard(totaisDoDia, Model.getMetasDiarias());
    View.atualizarProgressoMetas(totaisDoDia, Model.getMetasDiarias());
    this.sincronizarAlimentoSelecionado();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  Controller.init();
});
