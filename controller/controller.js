const Controller = {
  init() {
    const inputData = document.getElementById("dataSelecionada");
    inputData.value = this.obterDataHojeLocal();

    document.getElementById("btnCadastrar").addEventListener("click", () => {
      this.cadastrarAlimento();
    });
    document.getElementById("btnAdicionar").addEventListener("click", () => {
      this.adicionarRefeicao();
    });
    inputData.addEventListener("change", () => {
      this.atualizarView();
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

  getDataAtual() {
    return document.getElementById("dataSelecionada").value || this.obterDataHojeLocal();
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
      alert("Preencha corretamente o alimento e informe valores numéricos válidos.");
      return;
    }

    Model.adicionarAlimento({
      nome,
      carboidratos,
      proteinas,
      gorduras,
      calorias
    });

    this.limparCamposCadastro();
    this.atualizarView();
  },

  limparCamposCadastro() {
    ["nome", "carboidratos", "proteinas", "gorduras", "calorias"].forEach((id) => {
      document.getElementById(id).value = "";
    });
  },

  adicionarRefeicao() {
    const valorSelecionado = document.getElementById("listaAlimentos").value;
    const indice = Number.parseInt(valorSelecionado, 10);
    const quantidade = Number.parseFloat(document.getElementById("quantidade").value);

    if (Number.isNaN(indice) || Number.isNaN(quantidade) || quantidade <= 0) {
      alert("Selecione um alimento e informe uma quantidade maior que zero.");
      return;
    }

    const alimentoBase = Model.getAlimentos()[indice];

    if (!alimentoBase) {
      alert("O alimento selecionado não está disponível.");
      return;
    }

    const fator = quantidade / 100;
    Model.adicionarRefeicao(this.getDataAtual(), {
      nome: alimentoBase.nome,
      quantidade,
      carboidratos: alimentoBase.carboidratos * fator,
      proteinas: alimentoBase.proteinas * fator,
      gorduras: alimentoBase.gorduras * fator,
      calorias: alimentoBase.calorias * fator
    });

    document.getElementById("quantidade").value = "";
    document.getElementById("listaAlimentos").value = "";
    this.atualizarView();
  },

  removerItem(index) {
    Model.removerItem(this.getDataAtual(), index);
    this.atualizarView();
  },

  atualizarView() {
    const dataAtual = this.getDataAtual();
    document.getElementById("dataSelecionada").value = dataAtual;

    View.atualizarCabecalhos(this.formatarDataExibicao(dataAtual));
    View.atualizarListaAlimentos(Model.getAlimentos());
    View.atualizarTabelaRefeicao(Model.getRefeicao(dataAtual));
  }
};

window.addEventListener("DOMContentLoaded", () => {
  Controller.init();
});
