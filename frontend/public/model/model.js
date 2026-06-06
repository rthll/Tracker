const Model = {
  storageKey: "trackerMacronutrientes:v1",
  storageKeyBase: "trackerMacronutrientes:v1",
  usuarioStorageId: null,
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
    objetivo: "manter",
    resultado: 0,
    macros: { proteinas: 0, gorduras: 0, carboidratos: 0 }
  },
  limiteHistorico: 8,
  tiposRefeicao: [],
  refeicaoPadrao: "almoco",

  init(dadosRemotos = null, usuarioId = null) {
    this.definirUsuarioStorage(usuarioId);
    this.alimentosTaco = this.carregarAlimentosTaco();
    this.resetarDadosUsuario();

    if (dadosRemotos !== null && dadosRemotos !== undefined) {
      this.carregarDados(dadosRemotos);
      this.salvarLocal();
      return;
    }

    if (!this.usuarioStorageId) {
      this.carregar();
    }
  },

  definirUsuarioStorage(usuarioId) {
    this.usuarioStorageId = usuarioId ? String(usuarioId) : null;
  },

  getStorageKey() {
    if (!this.usuarioStorageId) {
      return this.storageKey;
    }

    return `${this.storageKeyBase}:user:${encodeURIComponent(this.usuarioStorageId)}`;
  },

  tiposRefeicaoPadrao() {
    return [
      { id: "cafe", nome: "Café da manhã" },
      { id: "almoco", nome: "Almoço" },
      { id: "jantar", nome: "Jantar" },
      { id: "lanches", nome: "Lanches" }
    ];
  },

  resetarDadosUsuario() {
    this.tiposRefeicao = this.tiposRefeicaoPadrao();
    this.alimentosPersonalizados = [];
    this.refeicoesPorData = {};
    this.favoritos = [];
    this.historicoAlimentos = [];
    this.templatesRefeicao = [];
    this.metasDiarias = this.normalizarMetas(null);
    this.tmbPerfil = this.normalizarTmbPerfil(null);
  },

  carregarAlimentosTaco() {
    if (!Array.isArray(window.TACO_ALIMENTOS)) {
      return [];
    }

    return window.TACO_ALIMENTOS.map((alimento) => this.normalizarAlimento({
      ...alimento,
      id: alimento.id || (alimento.tacoId ? `taco:${alimento.tacoId}` : this.criarId("taco")),
      personalizado: false,
      origem: "TACO"
    }));
  },

  carregar() {
    try {
      const dadosSalvos = window.localStorage.getItem(this.getStorageKey());

      if (!dadosSalvos) {
        return;
      }

      this.carregarDados(JSON.parse(dadosSalvos));
    } catch (error) {
      console.warn("Nao foi possivel carregar os dados locais.", error);
    }
  },

  carregarDados(dados) {
    // tiposRefeicao deve ser carregado antes de refeicoesPorData pois normalizarRefeicaoDia depende dele
    this.tiposRefeicao = Array.isArray(dados && dados.tiposRefeicao) && dados.tiposRefeicao.length
      ? dados.tiposRefeicao
      : this.tiposRefeicaoPadrao();
    this.alimentosPersonalizados = Array.isArray(dados && dados.alimentosPersonalizados)
      ? dados.alimentosPersonalizados.map((alimento) => this.normalizarAlimentoPersonalizado(alimento))
      : Array.isArray(dados && dados.alimentos)
        ? dados.alimentos.map((alimento) => this.normalizarAlimentoPersonalizado(alimento))
      : [];
    this.refeicoesPorData = this.normalizarRefeicoes(dados && dados.refeicoesPorData);
    this.favoritos = Array.isArray(dados && dados.favoritos) ? dados.favoritos : [];
    this.historicoAlimentos = Array.isArray(dados && dados.historicoAlimentos)
      ? dados.historicoAlimentos
      : [];
    this.templatesRefeicao = Array.isArray(dados && dados.templatesRefeicao) ? dados.templatesRefeicao : [];
    this.metasDiarias = this.normalizarMetas(dados && dados.metasDiarias);
    this.tmbPerfil = this.normalizarTmbPerfil(dados && dados.tmbPerfil);
  },

  getDadosPersistencia() {
    return {
      tiposRefeicao: this.tiposRefeicao,
      alimentosPersonalizados: this.alimentosPersonalizados,
      refeicoesPorData: this.refeicoesPorData,
      favoritos: this.favoritos,
      historicoAlimentos: this.historicoAlimentos,
      templatesRefeicao: this.templatesRefeicao,
      metasDiarias: this.metasDiarias,
      tmbPerfil: this.tmbPerfil
    };
  },

  salvar(alteracao = null) {
    const dados = this.getDadosPersistencia();
    const usuario = window.TrackerAuth && typeof window.TrackerAuth.getCurrentUser === "function"
      ? window.TrackerAuth.getCurrentUser()
      : null;

    this.salvarLocal(dados);

    if (!usuario || !window.TrackerDataService) {
      return;
    }

    const salvarRemoto = alteracao && typeof window.TrackerDataService.applyIncrementalChange === "function"
      ? window.TrackerDataService.applyIncrementalChange(usuario.uid, alteracao, dados)
      : window.TrackerDataService.saveUserData(usuario.uid, dados);

    if (salvarRemoto && typeof salvarRemoto.catch === "function") {
      salvarRemoto.catch((error) => {
        console.warn("Nao foi possivel salvar os dados no Firestore.", error);
      });
    }
  },

  salvarLocal(dados = this.getDadosPersistencia()) {
    try {
      window.localStorage.setItem(
        this.getStorageKey(),
        JSON.stringify(dados)
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
    const objetivosValidos = ["manter", "perder", "ganhar"];
    const sexo = perfil && ["masculino", "feminino"].includes(perfil.sexo) ? perfil.sexo : "";
    const objetivo = perfil && objetivosValidos.includes(perfil.objetivo) ? perfil.objetivo : "manter";
    const perfilNormalizado = {
      sexo,
      peso: this.valorNumerico(perfil && perfil.peso),
      altura: this.valorNumerico(perfil && perfil.altura),
      idade: this.valorNumerico(perfil && perfil.idade),
      objetivo,
      resultado: 0,
      macros: { proteinas: 0, gorduras: 0, carboidratos: 0 }
    };

    perfilNormalizado.resultado = this.calcularTmb(perfilNormalizado);
    if (perfilNormalizado.resultado > 0) {
      perfilNormalizado.macros = this.calcularMacrosTmb(perfilNormalizado.resultado, perfilNormalizado.objetivo);
    }
    return perfilNormalizado;
  },

  calcularTmb(perfil) {
    if (!perfil.sexo || perfil.peso <= 0 || perfil.altura <= 0 || perfil.idade <= 0) {
      return 0;
    }

    const ajusteSexo = perfil.sexo === "masculino" ? 5 : -161;
    return (10 * perfil.peso) + (6.25 * perfil.altura) - (5 * perfil.idade) + ajusteSexo;
  },

  getObjetivosMacros() {
    return {
      manter: { proteinas: 0.20, gorduras: 0.30, carboidratos: 0.50 },
      perder: { proteinas: 0.30, gorduras: 0.25, carboidratos: 0.45 },
      ganhar: { proteinas: 0.25, gorduras: 0.20, carboidratos: 0.55 }
    };
  },

  calcularMacrosTmb(calorias, objetivo = "manter") {
    const config = this.getObjetivosMacros()[objetivo] || this.getObjetivosMacros().manter;
    return {
      proteinas: Math.round((calorias * config.proteinas) / 4),
      gorduras: Math.round((calorias * config.gorduras) / 9),
      carboidratos: Math.round((calorias * config.carboidratos) / 4)
    };
  },

  getTiposRefeicao() {
    return this.tiposRefeicao.map((refeicao) => ({ ...refeicao }));
  },

  getMetasDiarias() {
    return { ...this.metasDiarias };
  },

  atualizarMetasDiarias(metas) {
    this.metasDiarias = this.normalizarMetas(metas);
    this.salvar({ tipo: "goals", metasDiarias: this.metasDiarias });
    return this.getMetasDiarias();
  },

  getTmbPerfil() {
    return { ...this.tmbPerfil };
  },

  atualizarTmbPerfil(perfil) {
    this.tmbPerfil = this.normalizarTmbPerfil(perfil);
    this.salvar({ tipo: "bmr", tmbPerfil: this.tmbPerfil });
    return this.getTmbPerfil();
  },

  isTipoRefeicaoValido(refeicaoId) {
    return this.tiposRefeicao.some((refeicao) => refeicao.id === refeicaoId);
  },

  normalizarRefeicaoId(refeicaoId) {
    if (this.isTipoRefeicaoValido(refeicaoId)) return refeicaoId;
    return this.tiposRefeicao[0]?.id || this.refeicaoPadrao;
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
      id: item.id || this.criarId("entry"),
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
    this.salvar({ tipo: "customFood", alimento: alimentoNormalizado });
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

    this.salvar({
      tipo: "userMeta",
      favoritos: this.favoritos,
      historicoAlimentos: this.historicoAlimentos
    });
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

  registrarHistoricoAlimento(alimentoId, salvar = true) {
    const alimento = this.getAlimentoPorId(alimentoId);

    if (!alimento) {
      return;
    }

    this.historicoAlimentos = [
      alimentoId,
      ...this.historicoAlimentos.filter((id) => id !== alimentoId)
    ].slice(0, this.limiteHistorico);

    if (salvar) {
      this.salvar({
        tipo: "userMeta",
        favoritos: this.favoritos,
        historicoAlimentos: this.historicoAlimentos
      });
    }
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
    this.salvar({ tipo: "day", data, refeicoesDoDia });
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

  getItemRefeicao(data, refeicaoId, index) {
    const refeicao = this.getRefeicao(data, refeicaoId);

    if (!Array.isArray(refeicao) || index < 0 || index >= refeicao.length) {
      return null;
    }

    return { ...refeicao[index] };
  },

  atualizarItemRefeicao(data, refeicaoOrigemId, index, refeicaoDestinoId, itemAtualizado) {
    const origemId = this.normalizarRefeicaoId(refeicaoOrigemId);
    const destinoId = this.normalizarRefeicaoId(refeicaoDestinoId);

    if (!data) {
      return false;
    }

    const refeicoesDoDia = this.garantirRefeicoesDoDia(data);
    const origem = refeicoesDoDia[origemId];
    const destino = refeicoesDoDia[destinoId];

    if (!Array.isArray(origem) || !Array.isArray(destino) || index < 0 || index >= origem.length) {
      return false;
    }

    const itemNormalizado = this.normalizarItemRefeicao(itemAtualizado);

    if (origemId === destinoId) {
      origem[index] = itemNormalizado;
    } else {
      origem.splice(index, 1);
      destino.push(itemNormalizado);
    }

    this.salvar({ tipo: "day", data, refeicoesDoDia });
    return true;
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
      const itensCopiados = (refeicoesOrigem[refeicao.id] || []).map((item) => ({
        ...item,
        id: this.criarId("entry")
      }));
      refeicoesDestino[refeicao.id].push(...itensCopiados);

      itensCopiados.forEach((item) => {
        if (item.alimentoId) {
          this.registrarHistoricoAlimento(item.alimentoId, false);
        }
      });
    });

    this.salvar({
      tipo: "day",
      data: dataDestino,
      refeicoesDoDia: refeicoesDestino
    });
    this.salvar({
      tipo: "userMeta",
      favoritos: this.favoritos,
      historicoAlimentos: this.historicoAlimentos
    });
    return quantidadeItens;
  },

  adicionarTipoRefeicao(nome) {
    const nomeLimpo = String(nome || "").trim();
    if (!nomeLimpo) return null;
    const novoTipo = { id: `refeicao:${Date.now()}`, nome: nomeLimpo };
    this.tiposRefeicao = [...this.tiposRefeicao, novoTipo];
    this.salvar({ tipo: "userMeta", favoritos: this.favoritos, historicoAlimentos: this.historicoAlimentos, tiposRefeicao: this.tiposRefeicao });
    return novoTipo;
  },

  removerTipoRefeicao(id) {
    this.tiposRefeicao = this.tiposRefeicao.filter((r) => r.id !== id);
    this.salvar({ tipo: "userMeta", favoritos: this.favoritos, historicoAlimentos: this.historicoAlimentos, tiposRefeicao: this.tiposRefeicao });
  },

  getTemplatesRefeicao() {
    return [...this.templatesRefeicao];
  },

  adicionarTemplate(template) {
    this.templatesRefeicao = [template, ...this.templatesRefeicao];
    this.salvar({ tipo: "templates", templatesRefeicao: this.templatesRefeicao });
  },

  removerTemplate(id) {
    this.templatesRefeicao = this.templatesRefeicao.filter((t) => t.id !== id);
    this.salvar({ tipo: "templates", templatesRefeicao: this.templatesRefeicao });
  },

  aplicarTemplateNoDia(templateItens, refeicaoId, data) {
    if (!data || !Array.isArray(templateItens) || !templateItens.length) return;
    const refeicoesDoDia = this.garantirRefeicoesDoDia(data);
    const refeicaoNormalizada = this.normalizarRefeicaoId(refeicaoId);
    templateItens.forEach((item) => {
      refeicoesDoDia[refeicaoNormalizada].push({ ...item, id: this.criarId("entry") });
    });
    this.salvar({ tipo: "day", data, refeicoesDoDia });
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
    this.salvar({ tipo: "day", data, refeicoesDoDia });
    return true;
  },

  removerItem(data, refeicaoId, index) {
    const refeicao = this.getRefeicao(data, refeicaoId);

    if (!Array.isArray(refeicao) || index < 0 || index >= refeicao.length) {
      return;
    }

    refeicao.splice(index, 1);
    this.salvar({
      tipo: "day",
      data,
      refeicoesDoDia: this.getRefeicoesDoDia(data)
    });
  }
};
