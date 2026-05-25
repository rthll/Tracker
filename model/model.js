const Model = {
  storageKey: "trackerMacronutrientes:v1",
  alimentos: [],
  refeicoesPorData: {},
  favoritos: [],
  historicoAlimentos: [],
  limiteHistorico: 8,

  init() {
    this.carregar();
  },

  carregar() {
    try {
      const dadosSalvos = window.localStorage.getItem(this.storageKey);

      if (!dadosSalvos) {
        return;
      }

      const dados = JSON.parse(dadosSalvos);
      this.alimentos = Array.isArray(dados.alimentos)
        ? dados.alimentos.map((alimento) => this.normalizarAlimento(alimento))
        : [];
      this.refeicoesPorData = this.normalizarRefeicoes(dados.refeicoesPorData);
      this.favoritos = Array.isArray(dados.favoritos) ? dados.favoritos : [];
      this.historicoAlimentos = Array.isArray(dados.historicoAlimentos)
        ? dados.historicoAlimentos
        : [];
    } catch (error) {
      console.warn("Nao foi possivel carregar os dados locais.", error);
    }
  },

  salvar() {
    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          alimentos: this.alimentos,
          refeicoesPorData: this.refeicoesPorData,
          favoritos: this.favoritos,
          historicoAlimentos: this.historicoAlimentos
        })
      );
    } catch (error) {
      console.warn("Nao foi possivel salvar os dados locais.", error);
    }
  },

  normalizarAlimento(alimento) {
    return {
      id: alimento.id || this.criarId(),
      nome: String(alimento.nome || "").trim(),
      carboidratos: this.valorNumerico(alimento.carboidratos),
      proteinas: this.valorNumerico(alimento.proteinas),
      gorduras: this.valorNumerico(alimento.gorduras),
      calorias: this.valorNumerico(alimento.calorias),
      personalizado: alimento.personalizado !== false,
      criadoEm: alimento.criadoEm || new Date().toISOString()
    };
  },

  normalizarRefeicoes(refeicoesPorData) {
    if (!refeicoesPorData || typeof refeicoesPorData !== "object") {
      return {};
    }

    return Object.entries(refeicoesPorData).reduce((resultado, [data, refeicao]) => {
      if (!Array.isArray(refeicao)) {
        return resultado;
      }

      resultado[data] = refeicao.map((item) => ({
        alimentoId: item.alimentoId || null,
        nome: String(item.nome || "").trim(),
        quantidade: this.valorNumerico(item.quantidade),
        carboidratos: this.valorNumerico(item.carboidratos),
        proteinas: this.valorNumerico(item.proteinas),
        gorduras: this.valorNumerico(item.gorduras),
        calorias: this.valorNumerico(item.calorias)
      }));

      return resultado;
    }, {});
  },

  valorNumerico(valor) {
    const numero = Number.parseFloat(valor);
    return Number.isFinite(numero) ? numero : 0;
  },

  criarId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },

  normalizarTexto(texto) {
    return String(texto || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  },

  adicionarAlimento(alimento) {
    const alimentoNormalizado = this.normalizarAlimento(alimento);
    this.alimentos.push(alimentoNormalizado);
    this.salvar();
    return alimentoNormalizado;
  },

  getAlimentos() {
    return [...this.alimentos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  },

  getAlimentoPorId(id) {
    return this.alimentos.find((alimento) => alimento.id === id) || null;
  },

  getAlimentoPorNome(nome) {
    const nomeNormalizado = this.normalizarTexto(nome);
    return this.alimentos.find((alimento) => this.normalizarTexto(alimento.nome) === nomeNormalizado) || null;
  },

  alternarFavorito(alimentoId) {
    const alimento = this.getAlimentoPorId(alimentoId);

    if (!alimento) {
      return false;
    }

    if (this.isFavorito(alimentoId)) {
      this.favoritos = this.favoritos.filter((id) => id !== alimentoId);
    } else {
      this.favoritos = [alimentoId, ...this.favoritos];
    }

    this.salvar();
    return this.isFavorito(alimentoId);
  },

  isFavorito(alimentoId) {
    return this.favoritos.includes(alimentoId);
  },

  getFavoritos() {
    return this.favoritos
      .map((id) => this.getAlimentoPorId(id))
      .filter(Boolean);
  },

  registrarHistoricoAlimento(alimentoId) {
    const alimento = this.getAlimentoPorId(alimentoId);

    if (!alimento) {
      return;
    }

    this.historicoAlimentos = [
      alimentoId,
      ...this.historicoAlimentos.filter((id) => id !== alimentoId)
    ].slice(0, this.limiteHistorico);
    this.salvar();
  },

  getHistoricoAlimentos() {
    return this.historicoAlimentos
      .map((id) => this.getAlimentoPorId(id))
      .filter(Boolean);
  },

  adicionarRefeicao(data, item) {
    if (!data) {
      return;
    }

    if (!this.refeicoesPorData[data]) {
      this.refeicoesPorData[data] = [];
    }

    this.refeicoesPorData[data].push(item);
    this.salvar();
  },

  getRefeicao(data) {
    if (!data) {
      return [];
    }

    return this.refeicoesPorData[data] || [];
  },

  repetirRefeicao(dataOrigem, dataDestino) {
    const refeicaoOrigem = this.getRefeicao(dataOrigem);

    if (!refeicaoOrigem.length || !dataDestino) {
      return 0;
    }

    if (!this.refeicoesPorData[dataDestino]) {
      this.refeicoesPorData[dataDestino] = [];
    }

    const itensCopiados = refeicaoOrigem.map((item) => ({ ...item }));
    this.refeicoesPorData[dataDestino].push(...itensCopiados);

    itensCopiados.forEach((item) => {
      if (item.alimentoId) {
        this.registrarHistoricoAlimento(item.alimentoId);
      }
    });

    this.salvar();
    return itensCopiados.length;
  },

  removerItem(data, index) {
    const refeicao = this.refeicoesPorData[data];

    if (!Array.isArray(refeicao) || index < 0 || index >= refeicao.length) {
      return;
    }

    refeicao.splice(index, 1);
    this.salvar();
  }
};
