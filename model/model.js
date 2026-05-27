const Model = {
  storageKey: "trackerMacronutrientes:v1",
  alimentosTaco: [],
  alimentosPersonalizados: [],
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
    this.alimentosTaco = this.carregarAlimentosTaco();
    this.carregar();
  },

  carregarAlimentosTaco() {
    if (!Array.isArray(window.TACO_ALIMENTOS)) {
      return [];
    }

    return window.TACO_ALIMENTOS.map((alimento) => this.normalizarAlimento({
      ...alimento,
      id: alimento.id || `taco:${alimento.tacoId}`,
      personalizado: false,
      origem: "TACO"
    }));
  },

  carregar() {
    try {
      const dadosSalvos = window.localStorage.getItem(this.storageKey);

      if (!dadosSalvos) {
        return;
      }

      const dados = JSON.parse(dadosSalvos);
      this.alimentosPersonalizados = Array.isArray(dados.alimentosPersonalizados)
        ? dados.alimentosPersonalizados.map((alimento) => this.normalizarAlimentoPersonalizado(alimento))
        : Array.isArray(dados.alimentos)
          ? dados.alimentos.map((alimento) => this.normalizarAlimentoPersonalizado(alimento))
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
          alimentosPersonalizados: this.alimentosPersonalizados,
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
      id: alimento.id || this.criarId("custom"),
      nome: String(alimento.nome || "").trim(),
      carboidratos: this.valorNumerico(alimento.carboidratos),
      proteinas: this.valorNumerico(alimento.proteinas),
      gorduras: this.valorNumerico(alimento.gorduras),
      calorias: this.valorNumerico(alimento.calorias),
      fibra: this.valorNumerico(alimento.fibra),
      personalizado: alimento.personalizado !== false,
      origem: alimento.origem || (alimento.personalizado === false ? "TACO" : "Personalizado"),
      criadoEm: alimento.criadoEm || new Date().toISOString()
    };
  },

  normalizarAlimentoPersonalizado(alimento) {
    const normalizado = this.normalizarAlimento({
      ...alimento,
      personalizado: true,
      origem: "Personalizado"
    });

    return {
      ...normalizado,
      id: this.normalizarIdPersonalizado(normalizado.id)
    };
  },

  normalizarIdPersonalizado(id) {
    const texto = String(id || "").trim();

    if (texto.startsWith("custom:")) {
      return texto;
    }

    if (texto.startsWith("taco:")) {
      return this.criarId("custom");
    }

    return `custom:${texto || this.criarIdSemPrefixo()}`;
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

  criarId(prefixo = "custom") {
    return `${prefixo}:${this.criarIdSemPrefixo()}`;
  },

  criarIdSemPrefixo() {
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
    const alimentoNormalizado = this.normalizarAlimentoPersonalizado(alimento);
    this.alimentosPersonalizados.push(alimentoNormalizado);
    this.salvar();
    return alimentoNormalizado;
  },

  getAlimentos() {
    return [...this.alimentosTaco, ...this.alimentosPersonalizados]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  },

  getAlimentosPersonalizados() {
    return [...this.alimentosPersonalizados]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  },

  getAlimentosTaco() {
    return [...this.alimentosTaco]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  },

  getAlimentoPorId(id) {
    return this.getAlimentos().find((alimento) => alimento.id === id) || null;
  },

  getAlimentoPorNome(nome) {
    const nomeNormalizado = this.normalizarTexto(nome);
    return this.getAlimentos().find((alimento) => this.normalizarTexto(alimento.nome) === nomeNormalizado) || null;
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

  gerarRelatorio(datas) {
    const datasNormalizadas = this.normalizarDatasRelatorio(datas);
    const metas = this.getMetasDiarias();
    const dias = datasNormalizadas.map((data) => this.criarResumoDia(data));
    const totalDias = dias.length;
    const totais = this.calcularTotaisItens(dias.map((dia) => dia.totais));
    const mediaDiaria = {
      carboidratos: totalDias ? totais.carboidratos / totalDias : 0,
      proteinas: totalDias ? totais.proteinas / totalDias : 0,
      gorduras: totalDias ? totais.gorduras / totalDias : 0,
      calorias: totalDias ? totais.calorias / totalDias : 0
    };
    const refeicoesResumo = this.tiposRefeicao.map((refeicao) => {
      const refeicoesDosDias = dias.map((dia) => dia.refeicoes.find((item) => item.id === refeicao.id));
      const totaisRefeicao = this.calcularTotaisItens(refeicoesDosDias.map((item) => item ? item.totais : {}));
      const totalItens = refeicoesDosDias.reduce((total, item) => total + (item ? item.totalItens : 0), 0);
      const diasComRegistro = refeicoesDosDias.filter((item) => item && item.totalItens > 0).length;

      return {
        id: refeicao.id,
        nome: refeicao.nome,
        totalItens,
        diasComRegistro,
        totais: totaisRefeicao,
        mediaCaloriasPorDia: totalDias ? totaisRefeicao.calorias / totalDias : 0
      };
    });
    const diasOrdenadosPorCalorias = [...dias].sort((a, b) => b.totais.calorias - a.totais.calorias);

    return {
      geradoEm: new Date().toISOString(),
      datas: datasNormalizadas,
      totalDias,
      totalItens: dias.reduce((total, dia) => total + dia.totalItens, 0),
      metas,
      totais,
      mediaDiaria,
      distribuicaoMacros: this.calcularDistribuicaoMacros(totais),
      metricasMacros: this.calcularMetricasMacros(dias, metas, totalDias),
      metricasConsistencia: this.calcularMetricasConsistencia(dias, metas, totalDias),
      refeicoesResumo,
      diaMaiorCalorias: diasOrdenadosPorCalorias[0] || null,
      diaMenorCalorias: diasOrdenadosPorCalorias[diasOrdenadosPorCalorias.length - 1] || null,
      dias
    };
  },

  normalizarDatasRelatorio(datas) {
    const lista = Array.isArray(datas) ? datas : [];
    return [...new Set(lista.map((data) => String(data || "").trim()).filter((data) => this.isDataValida(data)))]
      .sort((a, b) => a.localeCompare(b));
  },

  isDataValida(data) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(data || ""));
  },

  criarResumoDia(data) {
    const refeicoesDoDia = this.getRefeicoesDoDia(data);
    const refeicoes = this.tiposRefeicao.map((refeicao) => {
      const itens = (refeicoesDoDia[refeicao.id] || []).map((item) => ({ ...item }));
      const totais = this.calcularTotaisItens(itens);

      return {
        id: refeicao.id,
        nome: refeicao.nome,
        itens,
        totais,
        totalItens: itens.length
      };
    });
    const totais = this.calcularTotaisItens(refeicoes.map((refeicao) => refeicao.totais));

    return {
      data,
      refeicoes,
      totais,
      totalItens: refeicoes.reduce((total, refeicao) => total + refeicao.totalItens, 0),
      totalRefeicoesRegistradas: refeicoes.filter((refeicao) => refeicao.totalItens > 0).length
    };
  },

  calcularTotaisItens(itens) {
    return itens.reduce((totais, item) => {
      const itemSeguro = item || {};
      totais.carboidratos += this.valorNumerico(itemSeguro.carboidratos);
      totais.proteinas += this.valorNumerico(itemSeguro.proteinas);
      totais.gorduras += this.valorNumerico(itemSeguro.gorduras);
      totais.calorias += this.valorNumerico(itemSeguro.calorias);
      return totais;
    }, {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0,
      calorias: 0
    });
  },

  calcularDistribuicaoMacros(totais) {
    const caloriasMacros = {
      carboidratos: (totais.carboidratos || 0) * 4,
      proteinas: (totais.proteinas || 0) * 4,
      gorduras: (totais.gorduras || 0) * 9
    };
    const totalMacros = caloriasMacros.carboidratos + caloriasMacros.proteinas + caloriasMacros.gorduras;

    return {
      carboidratos: totalMacros > 0 ? (caloriasMacros.carboidratos / totalMacros) * 100 : 0,
      proteinas: totalMacros > 0 ? (caloriasMacros.proteinas / totalMacros) * 100 : 0,
      gorduras: totalMacros > 0 ? (caloriasMacros.gorduras / totalMacros) * 100 : 0
    };
  },

  calcularMetricasMacros(dias, metas, totalDias) {
    const configuracoes = [
      { chave: "carboidratos", nome: "Carboidratos", unidade: "g" },
      { chave: "proteinas", nome: "Prote\u00ednas", unidade: "g" },
      { chave: "gorduras", nome: "Gorduras", unidade: "g" },
      { chave: "calorias", nome: "Calorias", unidade: "kcal" }
    ];

    return configuracoes.map((configuracao) => {
      const consumidoTotal = dias.reduce((total, dia) => total + (dia.totais[configuracao.chave] || 0), 0);
      const metaDiaria = metas[configuracao.chave] || 0;
      const metaTotal = metaDiaria * totalDias;
      const mediaConsumida = totalDias ? consumidoTotal / totalDias : 0;
      const diasDentroMeta = metaDiaria > 0
        ? dias.filter((dia) => {
          const valor = dia.totais[configuracao.chave] || 0;
          return valor >= metaDiaria * 0.9 && valor <= metaDiaria * 1.1;
        }).length
        : 0;

      return {
        ...configuracao,
        consumidoTotal,
        mediaConsumida,
        metaDiaria,
        metaTotal,
        diferencaMedia: mediaConsumida - metaDiaria,
        percentualMeta: metaTotal > 0 ? (consumidoTotal / metaTotal) * 100 : 0,
        diasDentroMeta,
        percentualDiasDentroMeta: metaDiaria > 0 && totalDias > 0 ? (diasDentroMeta / totalDias) * 100 : 0
      };
    });
  },

  calcularMetricasConsistencia(dias, metas, totalDias) {
    const diasComRegistro = dias.filter((dia) => dia.totalItens > 0).length;
    const refeicoesRegistradas = dias.reduce((total, dia) => total + dia.totalRefeicoesRegistradas, 0);
    const refeicoesPossiveis = totalDias * this.tiposRefeicao.length;
    const diasComTresOuMaisRefeicoes = dias.filter((dia) => dia.totalRefeicoesRegistradas >= 3).length;
    const diasDentroMetaCalorica = metas.calorias > 0
      ? dias.filter((dia) => dia.totais.calorias >= metas.calorias * 0.9 && dia.totais.calorias <= metas.calorias * 1.1).length
      : 0;
    const metricasMacros = this.calcularMetricasMacros(dias, metas, totalDias);
    const macrosComMeta = metricasMacros.filter((macro) => macro.metaDiaria > 0);
    const aderenciaMediaMacros = macrosComMeta.length
      ? macrosComMeta.reduce((total, macro) => total + Math.min(macro.percentualMeta, 100), 0) / macrosComMeta.length
      : 0;

    return {
      diasComRegistro,
      percentualDiasComRegistro: totalDias > 0 ? (diasComRegistro / totalDias) * 100 : 0,
      refeicoesRegistradas,
      refeicoesPossiveis,
      percentualRefeicoesRegistradas: refeicoesPossiveis > 0 ? (refeicoesRegistradas / refeicoesPossiveis) * 100 : 0,
      mediaRefeicoesPorDia: totalDias > 0 ? refeicoesRegistradas / totalDias : 0,
      diasComTresOuMaisRefeicoes,
      percentualDiasComTresOuMaisRefeicoes: totalDias > 0 ? (diasComTresOuMaisRefeicoes / totalDias) * 100 : 0,
      diasDentroMetaCalorica,
      percentualDiasDentroMetaCalorica: metas.calorias > 0 && totalDias > 0 ? (diasDentroMetaCalorica / totalDias) * 100 : 0,
      metaCaloricaDefinida: metas.calorias > 0,
      aderenciaMediaMacros
    };
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
