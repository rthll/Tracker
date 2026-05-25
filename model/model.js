const Model = {
  storageKey: "trackerMacronutrientes:v1",
  alimentos: [],
  refeicoesPorData: {},
  favoritos: [],
  historicoAlimentos: [],
  metasDiarias: {
    carboidratos: 0,
    proteinas: 0,
    gorduras: 0,
    calorias: 0
  },
  tmbPerfil: {
    sexo: "",
    peso: 0,
    altura: 0,
    idade: 0,
    resultado: 0
  },
  limiteHistorico: 8,
  tiposRefeicao: [
    { id: "cafe", nome: "Caf\u00e9 da manh\u00e3" },
    { id: "almoco", nome: "Almo\u00e7o" },
    { id: "jantar", nome: "Jantar" },
    { id: "lanches", nome: "Lanches" }
  ],
  refeicaoPadrao: "almoco",

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
      this.metasDiarias = this.normalizarMetas(dados.metasDiarias);
      this.tmbPerfil = this.normalizarTmbPerfil(dados.tmbPerfil);
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
          historicoAlimentos: this.historicoAlimentos,
          metasDiarias: this.metasDiarias,
          tmbPerfil: this.tmbPerfil
        })
      );
    } catch (error) {
      console.warn("Nao foi possivel salvar os dados locais.", error);
    }
  },

  normalizarMetas(metas) {
    return {
      carboidratos: this.valorNumerico(metas && metas.carboidratos),
      proteinas: this.valorNumerico(metas && metas.proteinas),
      gorduras: this.valorNumerico(metas && metas.gorduras),
      calorias: this.valorNumerico(metas && metas.calorias)
    };
  },

  normalizarTmbPerfil(perfil) {
    const sexo = perfil && ["masculino", "feminino"].includes(perfil.sexo)
      ? perfil.sexo
      : "";
    const perfilNormalizado = {
      sexo,
      peso: this.valorNumerico(perfil && perfil.peso),
      altura: this.valorNumerico(perfil && perfil.altura),
      idade: this.valorNumerico(perfil && perfil.idade),
      resultado: 0
    };

    perfilNormalizado.resultado = this.calcularTmb(perfilNormalizado);
    return perfilNormalizado;
  },

  calcularTmb(perfil) {
    if (!perfil.sexo || perfil.peso <= 0 || perfil.altura <= 0 || perfil.idade <= 0) {
      return 0;
    }

    const ajusteSexo = perfil.sexo === "masculino" ? 5 : -161;
    return (10 * perfil.peso) + (6.25 * perfil.altura) - (5 * perfil.idade) + ajusteSexo;
  },

  getTiposRefeicao() {
    return this.tiposRefeicao.map((refeicao) => ({ ...refeicao }));
  },

  getMetasDiarias() {
    return { ...this.metasDiarias };
  },

  atualizarMetasDiarias(metas) {
    this.metasDiarias = this.normalizarMetas(metas);
    this.salvar();
    return this.getMetasDiarias();
  },

  getTmbPerfil() {
    return { ...this.tmbPerfil };
  },

  atualizarTmbPerfil(perfil) {
    this.tmbPerfil = this.normalizarTmbPerfil(perfil);
    this.salvar();
    return this.getTmbPerfil();
  },

  isTipoRefeicaoValido(refeicaoId) {
    return this.tiposRefeicao.some((refeicao) => refeicao.id === refeicaoId);
  },

  normalizarRefeicaoId(refeicaoId) {
    return this.isTipoRefeicaoValido(refeicaoId) ? refeicaoId : this.refeicaoPadrao;
  },

  criarRefeicoesVazias() {
    return this.tiposRefeicao.reduce((resultado, refeicao) => {
      resultado[refeicao.id] = [];
      return resultado;
    }, {});
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

    return Object.entries(refeicoesPorData).reduce((resultado, [data, refeicaoDia]) => {
      resultado[data] = this.normalizarRefeicaoDia(refeicaoDia);
      return resultado;
    }, {});
  },

  normalizarRefeicaoDia(refeicaoDia) {
    const refeicoes = this.criarRefeicoesVazias();

    if (Array.isArray(refeicaoDia)) {
      refeicoes[this.refeicaoPadrao] = refeicaoDia.map((item) => this.normalizarItemRefeicao(item));
      return refeicoes;
    }

    if (!refeicaoDia || typeof refeicaoDia !== "object") {
      return refeicoes;
    }

    this.tiposRefeicao.forEach((refeicao) => {
      refeicoes[refeicao.id] = Array.isArray(refeicaoDia[refeicao.id])
        ? refeicaoDia[refeicao.id].map((item) => this.normalizarItemRefeicao(item))
        : [];
    });

    return refeicoes;
  },

  normalizarItemRefeicao(item) {
    return {
      alimentoId: item.alimentoId || null,
      nome: String(item.nome || "").trim(),
      quantidade: this.valorNumerico(item.quantidade),
      carboidratos: this.valorNumerico(item.carboidratos),
      proteinas: this.valorNumerico(item.proteinas),
      gorduras: this.valorNumerico(item.gorduras),
      calorias: this.valorNumerico(item.calorias)
    };
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

  garantirRefeicoesDoDia(data) {
    if (!this.refeicoesPorData[data]) {
      this.refeicoesPorData[data] = this.criarRefeicoesVazias();
    }

    return this.refeicoesPorData[data];
  },

  adicionarRefeicao(data, refeicaoId, item) {
    if (!data) {
      return;
    }

    const refeicoesDoDia = this.garantirRefeicoesDoDia(data);
    const refeicaoNormalizada = this.normalizarRefeicaoId(refeicaoId);
    refeicoesDoDia[refeicaoNormalizada].push(item);
    this.salvar();
  },

  getRefeicoesDoDia(data) {
    if (!data) {
      return this.criarRefeicoesVazias();
    }

    return this.refeicoesPorData[data] || this.criarRefeicoesVazias();
  },

  getRefeicao(data, refeicaoId) {
    const refeicoesDoDia = this.getRefeicoesDoDia(data);

    if (refeicaoId) {
      return refeicoesDoDia[this.normalizarRefeicaoId(refeicaoId)] || [];
    }

    return this.getItensDoDia(data);
  },

  getItensDoDia(data) {
    const refeicoesDoDia = this.getRefeicoesDoDia(data);
    return this.tiposRefeicao.flatMap((refeicao) => refeicoesDoDia[refeicao.id] || []);
  },

  getQuantidadeItensDia(data) {
    return this.getItensDoDia(data).length;
  },

  repetirRefeicao(dataOrigem, dataDestino) {
    const refeicoesOrigem = this.getRefeicoesDoDia(dataOrigem);
    const quantidadeItens = this.getQuantidadeItensDia(dataOrigem);

    if (!quantidadeItens || !dataDestino) {
      return 0;
    }

    const refeicoesDestino = this.garantirRefeicoesDoDia(dataDestino);

    this.tiposRefeicao.forEach((refeicao) => {
      const itensCopiados = (refeicoesOrigem[refeicao.id] || []).map((item) => ({ ...item }));
      refeicoesDestino[refeicao.id].push(...itensCopiados);

      itensCopiados.forEach((item) => {
        if (item.alimentoId) {
          this.registrarHistoricoAlimento(item.alimentoId);
        }
      });
    });

    this.salvar();
    return quantidadeItens;
  },

  moverItem(data, refeicaoOrigemId, index, refeicaoDestinoId) {
    const origemId = this.normalizarRefeicaoId(refeicaoOrigemId);
    const destinoId = this.normalizarRefeicaoId(refeicaoDestinoId);

    if (!data || origemId === destinoId) {
      return false;
    }

    const refeicoesDoDia = this.garantirRefeicoesDoDia(data);
    const origem = refeicoesDoDia[origemId];
    const destino = refeicoesDoDia[destinoId];

    if (!Array.isArray(origem) || !Array.isArray(destino) || index < 0 || index >= origem.length) {
      return false;
    }

    const [item] = origem.splice(index, 1);
    destino.push(item);
    this.salvar();
    return true;
  },

  removerItem(data, refeicaoId, index) {
    const refeicao = this.getRefeicao(data, refeicaoId);

    if (!Array.isArray(refeicao) || index < 0 || index >= refeicao.length) {
      return;
    }

    refeicao.splice(index, 1);
    this.salvar();
  }
};
