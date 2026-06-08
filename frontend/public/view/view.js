const View = {
  mostrarPagina(paginaAtiva) {
    if (window._stores?.ui) {
      window._stores.ui.paginaAtual = paginaAtiva;
      return;
    }
    // Fallback DOM approach
    document.querySelectorAll(".page-view").forEach((pagina) => {
      const ativa = pagina.dataset.page === paginaAtiva;
      pagina.hidden = !ativa;
      pagina.classList.toggle("is-active", ativa);
    });
    document.querySelectorAll("[data-page-target]").forEach((botao) => {
      const ativo = botao.dataset.pageTarget === paginaAtiva;
      botao.classList.toggle("is-active", ativo);
      botao.setAttribute("aria-current", ativo ? "page" : "false");
    });
  },

  atualizarCabecalhos(dataFormatada) {
    // Managed by AppHeader.vue (reactive from trackerStore.dataAtual)
    const tituloRefeicao = document.getElementById("tituloRefeicao");
    if (tituloRefeicao) tituloRefeicao.textContent = `Refei\u00e7\u00f5es de ${dataFormatada}`;
  },

  atualizarSelectRefeicoes(tiposRefeicao) {
    // tipoRefeicao is in PageDashboard v-once block — View.js can update it
    // editarTipoRefeicao is in PageRefeicoes v-once block — View.js can update it
    const fallback = tiposRefeicao[0]?.id || "almoco";
    this.preencherSelectRefeicoes("tipoRefeicao", tiposRefeicao, fallback);
    this.preencherSelectRefeicoes("editarTipoRefeicao", tiposRefeicao, fallback);
  },

  preencherSelectRefeicoes(selectId, tiposRefeicao, valorFallback) {
    const select = document.getElementById(selectId);

    if (!select) {
      return;
    }

    const valorAtual = select.value;
    select.innerHTML = "";

    tiposRefeicao.forEach((refeicao) => {
      const option = document.createElement("option");
      option.value = refeicao.id;
      option.textContent = refeicao.nome;
      select.appendChild(option);
    });

    select.value = tiposRefeicao.some((refeicao) => refeicao.id === valorAtual)
      ? valorAtual
      : valorFallback;
  },

  atualizarAutocompleteAlimentos(alimentos) {
    const campoBusca = document.getElementById("buscaAlimento");
    const quantidade = document.getElementById("quantidade");
    const tipoRefeicao = document.getElementById("tipoRefeicao");

    if (!campoBusca) return; // Managed by PageDashboard Vue component (v-once)
    campoBusca.disabled = !alimentos.length;
    if (quantidade) quantidade.disabled = !alimentos.length;
    if (tipoRefeicao) tipoRefeicao.disabled = !alimentos.length;
    campoBusca.placeholder = alimentos.length
      ? "Digite para buscar um alimento"
      : "Cadastre um alimento primeiro";
  },

  renderizarAtalhosBuscaAlimentos(categorias) {
    this.renderizarAtalhosCategoriaBusca("atalhosCategoriaAlimentos", categorias, "registro");
    this.renderizarAtalhosCategoriaBusca("atalhosCategoriaEdicaoAlimentos", categorias, "edicao");
  },

  renderizarAtalhosCategoriaBusca(containerId, categorias, contexto) {
    const container = document.getElementById(containerId);

    if (!container) {
      return;
    }

    container.innerHTML = "";
    categorias.forEach((categoria) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "food-category-chip";
      button.textContent = categoria.label;
      button.addEventListener("click", () => {
        Controller.aplicarCategoriaBusca(categoria.id, contexto);
      });
      container.appendChild(button);
    });
  },

  renderizarPainelBuscaAlimentos(contexto, secoes) {
    const painelId = contexto === "edicao"
      ? "painelBuscaEdicaoAlimentos"
      : contexto === "template"
        ? "painelBuscaNovaRefeicaoAlimentos"
        : "painelBuscaAlimentos";
    const painel = document.getElementById(painelId);

    if (!painel) {
      return;
    }

    painel.innerHTML = "";

    const secoesVisiveis = secoes.filter((secao) => secao.alimentos.length || secao.mensagemVazia);
    if (!secoesVisiveis.length) {
      painel.hidden = true;
      return;
    }

    secoesVisiveis.forEach((secao) => {
      const grupo = document.createElement("div");
      grupo.className = "food-search-section";

      const titulo = document.createElement("div");
      titulo.className = "food-search-section-title";
      titulo.textContent = secao.titulo;
      grupo.appendChild(titulo);

      if (!secao.alimentos.length) {
        const vazio = document.createElement("div");
        vazio.className = "food-search-empty";
        vazio.textContent = secao.mensagemVazia;
        grupo.appendChild(vazio);
      } else {
        secao.alimentos.forEach((alimento) => {
          grupo.appendChild(this.criarOpcaoBuscaAlimento(alimento, contexto));
        });
      }

      painel.appendChild(grupo);
    });

    painel.hidden = false;
  },

  criarOpcaoBuscaAlimento(alimento, contexto) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "food-search-option";
    button.addEventListener("click", () => {
      Controller.selecionarAlimentoBusca(alimento.id, contexto);
    });

    const topo = document.createElement("span");
    topo.className = "food-search-option-top";

    const nome = document.createElement("span");
    nome.className = "food-search-option-name";
    nome.textContent = alimento.nome;

    const origem = document.createElement("span");
    origem.className = alimento.personalizado ? "food-origin-badge personal" : "food-origin-badge taco";
    origem.textContent = alimento.personalizado ? "Personalizado" : (alimento.origem || "TACO");

    const macros = document.createElement("span");
    macros.className = "food-search-option-macros";
    macros.textContent = `${this.formatarNumero(alimento.calorias)} kcal/100g | C ${this.formatarNumero(alimento.carboidratos)}g, P ${this.formatarNumero(alimento.proteinas)}g, G ${this.formatarNumero(alimento.gorduras)}g`;

    topo.appendChild(nome);
    topo.appendChild(origem);
    button.appendChild(topo);
    button.appendChild(macros);
    return button;
  },

  ocultarPaineisBuscaAlimentos() {
    ["painelBuscaAlimentos", "painelBuscaEdicaoAlimentos", "painelBuscaNovaRefeicaoAlimentos"].forEach((id) => {
      const painel = document.getElementById(id);
      if (painel) {
        painel.hidden = true;
      }
    });
  },

  atualizarEstadoAlimentoSelecionado(alimento, favorito) {
    const detalhe = document.getElementById("detalheAlimentoSelecionado");
    const botaoFavoritar = document.getElementById("btnFavoritar");
    const botaoAdicionar = document.getElementById("btnAdicionar");

    if (!alimento) {
      detalhe.textContent = "Selecione um alimento cadastrado para adicionar a refei\u00e7\u00e3o.";
      botaoFavoritar.disabled = true;
      botaoFavoritar.textContent = "\u2606";
      botaoFavoritar.setAttribute("aria-label", "Favoritar alimento selecionado");
      botaoAdicionar.disabled = true;
      return;
    }

    detalhe.textContent = `${this.formatarNumero(alimento.calorias)} kcal por 100g | ${this.formatarNumero(alimento.carboidratos)}g carbs, ${this.formatarNumero(alimento.proteinas)}g prot, ${this.formatarNumero(alimento.gorduras)}g gord`;
    botaoFavoritar.disabled = false;
    botaoFavoritar.textContent = favorito ? "\u2605" : "\u2606";
    botaoFavoritar.setAttribute(
      "aria-label",
      favorito ? `Remover ${alimento.nome} dos favoritos` : `Adicionar ${alimento.nome} aos favoritos`
    );
    botaoAdicionar.disabled = false;
  },

  atualizarAtalhosAlimentos(favoritos, historico) {
    this.renderizarListaChips("listaFavoritos", favoritos, "Nenhum favorito ainda.", 5);
    this.renderizarListaChips("listaHistorico", historico, "Sem historico de uso.", 5);
  },

  atualizarAlimentosPersonalizados(alimentosPersonalizados, totalTaco = 0) {
    const el = document.getElementById("contadorAlimentos");
    if (!el) return; // Managed by PageAlimentos Vue component
    el.textContent = String(alimentosPersonalizados.length);
    const contadorTaco = document.getElementById("contadorTaco");
    if (contadorTaco) contadorTaco.textContent = String(totalTaco);
    this.renderizarListaChips("listaPersonalizados", alimentosPersonalizados, "Nenhum alimento personalizado cadastrado.");
  },

  renderizarListaChips(containerId, alimentos, mensagemVazia, limite = Infinity) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!alimentos.length) {
      const vazio = document.createElement("span");
      vazio.className = "chip-empty";
      vazio.textContent = mensagemVazia;
      container.appendChild(vazio);
      return;
    }

    const criarChip = (alimento) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "food-chip";
      button.addEventListener("click", () => Controller.selecionarAlimento(alimento.id));

      const nome = document.createElement("span");
      nome.className = "food-chip-name";
      nome.textContent = alimento.nome;

      const macros = document.createElement("span");
      macros.className = "food-chip-macros";
      macros.textContent = `${alimento.origem || "Base"} | ${this.formatarNumero(alimento.calorias)} kcal/100g`;

      button.appendChild(nome);
      button.appendChild(macros);
      return button;
    };

    const temMais = alimentos.length > limite;
    const extras = temMais ? alimentos.length - limite : 0;

    alimentos.forEach((alimento, index) => {
      const chip = criarChip(alimento);
      if (index >= limite) chip.classList.add("chip-hidden");
      container.appendChild(chip);
    });

    if (temMais) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "chip-list-toggle";
      toggle.textContent = `+ ${extras} mais`;
      toggle.addEventListener("click", () => {
        const expandido = container.classList.toggle("chip-list--expanded");
        toggle.textContent = expandido ? "Ver menos" : `+ ${extras} mais`;
      });
      container.appendChild(toggle);
    }
  },

  atualizarBotaoRepetir(quantidadeItensOntem) {
    const botao = document.getElementById("btnRepetirRefeicao");
    if (!botao) return; // Managed by PageRefeicoes Vue component
    botao.disabled = quantidadeItensOntem <= 0;
    botao.textContent = quantidadeItensOntem > 0
      ? `Repetir refei\u00e7\u00f5es anteriores (${quantidadeItensOntem})`
      : "Repetir refei\u00e7\u00f5es anteriores";
  },

  atualizarMetasDiarias(metas) {
    const input = document.getElementById("metaCarboidratos");
    if (!input) return; // Managed by PageMetas Vue component
    const campos = [
      ["metaCarboidratos", metas.carboidratos],
      ["metaProteinas", metas.proteinas],
      ["metaGorduras", metas.gorduras],
      ["metaCalorias", metas.calorias]
    ];

    campos.forEach(([id, valor]) => {
      const el = document.getElementById(id);

      if (el && document.activeElement !== el) {
        el.value = valor > 0 ? String(valor) : "";
      }
    });
  },

  atualizarCalculadoraTmb(perfil) {
    const sexo = document.getElementById("tmbSexo");
    if (!sexo) return; // Managed by PageCalculadora Vue component
    const campos = [
      ["tmbPeso", perfil.peso],
      ["tmbAltura", perfil.altura],
      ["tmbIdade", perfil.idade]
    ];
    const objetivo = document.getElementById("tmbObjetivo");
    const resultado = document.getElementById("tmbResultado");
    const detalhe = document.getElementById("tmbDetalhe");
    const botaoUsarMeta = document.getElementById("btnUsarTmbMeta");
    const macrosPanel = document.getElementById("tmbMacrosPanel");

    if (document.activeElement !== sexo) {
      sexo.value = perfil.sexo || "";
    }

    if (objetivo && document.activeElement !== objetivo) {
      objetivo.value = perfil.objetivo || "manter";
    }

    campos.forEach(([id, valor]) => {
      const input = document.getElementById(id);

      if (document.activeElement !== input) {
        input.value = valor > 0 ? String(valor) : "";
      }
    });

    resultado.textContent = this.formatarNumero(perfil.resultado);
    botaoUsarMeta.disabled = perfil.resultado <= 0;

    if (perfil.resultado <= 0) {
      detalhe.textContent = "Informe os dados para calcular.";
      if (macrosPanel) macrosPanel.hidden = true;
      return;
    }

    detalhe.textContent = `Estimativa de repouso: ${this.formatarNumero(perfil.resultado)} kcal por dia.`;

    if (macrosPanel && perfil.macros) {
      const pcts = { manter: [20, 30, 50], perder: [30, 25, 45], ganhar: [25, 20, 55] };
      const [pProt, pGord, pCarbs] = pcts[perfil.objetivo] || pcts.manter;

      document.getElementById("tmbMacroProteinas").textContent = perfil.macros.proteinas;
      document.getElementById("tmbMacroGorduras").textContent = perfil.macros.gorduras;
      document.getElementById("tmbMacroCarbs").textContent = perfil.macros.carboidratos;
      document.getElementById("tmbMacroProteinasPct").textContent = `${pProt}% das calorias`;
      document.getElementById("tmbMacroGordurasPct").textContent = `${pGord}% das calorias`;
      document.getElementById("tmbMacroCarbsPct").textContent = `${pCarbs}% das calorias`;

      macrosPanel.hidden = false;
    }
  },

  atualizarProgressoMetas(totais, metas) {
    const el = document.getElementById("progressoCarboidratosTexto");
    if (!el) return; // Managed by PageMetas Vue component
    const configuracoes = [
      {
        chave: "carboidratos",
        textoId: "progressoCarboidratosTexto",
        barraId: "progressoCarboidratosBarra",
        detalheId: "progressoCarboidratosDetalhe",
        unidade: "g"
      },
      {
        chave: "proteinas",
        textoId: "progressoProteinasTexto",
        barraId: "progressoProteinasBarra",
        detalheId: "progressoProteinasDetalhe",
        unidade: "g"
      },
      {
        chave: "gorduras",
        textoId: "progressoGordurasTexto",
        barraId: "progressoGordurasBarra",
        detalheId: "progressoGordurasDetalhe",
        unidade: "g"
      },
      {
        chave: "calorias",
        textoId: "progressoCaloriasTexto",
        barraId: "progressoCaloriasBarra",
        detalheId: "progressoCaloriasDetalhe",
        unidade: "kcal"
      }
    ];

    configuracoes.forEach((configuracao) => {
      const consumido = totais[configuracao.chave] || 0;
      const meta = metas[configuracao.chave] || 0;
      const percentual = meta > 0 ? (consumido / meta) * 100 : 0;
      const percentualLimitado = Math.min(percentual, 100);
      const restante = meta - consumido;
      const texto = document.getElementById(configuracao.textoId);
      const barra = document.getElementById(configuracao.barraId);
      const detalhe = document.getElementById(configuracao.detalheId);

      texto.textContent = `${this.formatarNumero(consumido)} / ${this.formatarNumero(meta)} ${configuracao.unidade}`;
      barra.style.width = `${percentualLimitado}%`;
      barra.classList.toggle("progress-over", percentual > 110);

      if (meta <= 0) {
        detalhe.textContent = "Meta n\u00e3o definida";
      } else if (restante >= 0) {
        detalhe.textContent = `Faltam ${this.formatarNumero(restante)} ${configuracao.unidade}`;
      } else {
        detalhe.textContent = `Excedeu ${this.formatarNumero(Math.abs(restante))} ${configuracao.unidade}`;
      }
    });
  },

  atualizarDashboard(totais, metas) {
    const el = document.getElementById("dashboardCaloriasConsumidas");
    if (!el) return; // Managed by PageDashboard Vue component
    this.atualizarDashboardCalorias(totais, metas);
    this.atualizarDistribuicaoMacros(totais);
    this.atualizarGraficoMetaConsumido(totais, metas);
    this.atualizarMacroRings(totais, metas);
  },

  atualizarMacroRings(totais, metas) {
    const el = document.getElementById("ringCarboidratos");
    if (!el) return; // Managed by PageDashboard Vue component
    const CIRCUNF = 175.93;
    const aneis = [
      { chave: "carboidratos", ringId: "ringCarboidratos", centroId: "totalCarboResumo",    metaId: "metaCarboRing",    unidade: "g"    },
      { chave: "proteinas",    ringId: "ringProteinas",    centroId: "totalProteinaResumo", metaId: "metaProteinaRing", unidade: "g"    },
      { chave: "gorduras",     ringId: "ringGorduras",     centroId: "totalGorduraResumo",  metaId: "metaGorduraRing",  unidade: "g"    },
      { chave: "calorias",     ringId: "ringCalorias",     centroId: "totalCaloriasResumo", metaId: "metaCaloriasRing", unidade: "kcal" }
    ];

    aneis.forEach(({ chave, ringId, centroId, metaId, unidade }) => {
      const consumido = totais[chave] || 0;
      const meta = metas[chave] || 0;
      const pct = meta > 0 ? Math.min(consumido / meta, 1) : 0;
      const ring = document.getElementById(ringId);
      const centroEl = document.getElementById(centroId);
      const metaEl = document.getElementById(metaId);

      if (ring) {
        ring.style.strokeDashoffset = CIRCUNF * (1 - pct);
        ring.classList.toggle("ring-over", meta > 0 && consumido > meta * 1.1);
      }
      if (centroEl) centroEl.textContent = this.formatarNumero(consumido);
      if (metaEl) {
        metaEl.textContent = meta > 0 ? `meta: ${this.formatarNumero(meta)} ${unidade}` : "sem meta";
        metaEl.classList.toggle("ring-meta--over", meta > 0 && consumido > meta * 1.1);
        metaEl.classList.toggle("ring-meta--done", meta > 0 && consumido >= meta);
      }
    });
  },

  atualizarDashboardCalorias(totais, metas) {
    const consumido = totais.calorias || 0;
    const meta = metas.calorias || 0;
    const restante = meta - consumido;
    const status = document.getElementById("dashboardStatus");

    document.getElementById("dashboardCaloriasConsumidas").textContent = this.formatarNumero(consumido);
    document.getElementById("dashboardCaloriasMeta").textContent = `Meta: ${this.formatarNumero(meta)} kcal`;

    if (meta <= 0) {
      document.getElementById("dashboardCaloriasRestantes").textContent = "Meta n\u00e3o definida";
      status.textContent = consumido > 0
        ? "Consumo registrado. Defina metas para comparar o desempenho do dia."
        : "Defina metas e registre alimentos para acompanhar o progresso.";
      return;
    }

    if (restante >= 0) {
      document.getElementById("dashboardCaloriasRestantes").textContent = `${this.formatarNumero(restante)} kcal restantes`;
      status.textContent = `Dia dentro da meta cal\u00f3rica: ${this.formatarNumero((consumido / meta) * 100)}% consumido.`;
      return;
    }

    document.getElementById("dashboardCaloriasRestantes").textContent = `${this.formatarNumero(Math.abs(restante))} kcal acima`;
    status.textContent = `Meta cal\u00f3rica excedida em ${this.formatarNumero(Math.abs(restante))} kcal.`;
  },

  atualizarDistribuicaoMacros(totais) {
    const caloriasMacros = {
      carboidratos: (totais.carboidratos || 0) * 4,
      proteinas: (totais.proteinas || 0) * 4,
      gorduras: (totais.gorduras || 0) * 9
    };
    const totalMacros = caloriasMacros.carboidratos + caloriasMacros.proteinas + caloriasMacros.gorduras;
    const percentuais = {
      carboidratos: totalMacros > 0 ? (caloriasMacros.carboidratos / totalMacros) * 100 : 0,
      proteinas: totalMacros > 0 ? (caloriasMacros.proteinas / totalMacros) * 100 : 0,
      gorduras: totalMacros > 0 ? (caloriasMacros.gorduras / totalMacros) * 100 : 0
    };

    document.getElementById("dashboardDistribuicaoCarbs").style.width = `${percentuais.carboidratos}%`;
    document.getElementById("dashboardDistribuicaoProteinas").style.width = `${percentuais.proteinas}%`;
    document.getElementById("dashboardDistribuicaoGorduras").style.width = `${percentuais.gorduras}%`;
    document.getElementById("dashboardPercentualCarbs").textContent = `${this.formatarNumero(percentuais.carboidratos)}%`;
    document.getElementById("dashboardPercentualProteinas").textContent = `${this.formatarNumero(percentuais.proteinas)}%`;
    document.getElementById("dashboardPercentualGorduras").textContent = `${this.formatarNumero(percentuais.gorduras)}%`;
  },

  atualizarGraficoMetaConsumido(totais, metas) {
    const container = document.getElementById("dashboardMacroTargetChart");
    const itens = [
      { chave: "carboidratos", nome: "Carboidratos", unidade: "g", classe: "macro-carbs" },
      { chave: "proteinas", nome: "Prote\u00ednas", unidade: "g", classe: "macro-protein" },
      { chave: "gorduras", nome: "Gorduras", unidade: "g", classe: "macro-fat" },
      { chave: "calorias", nome: "Calorias", unidade: "kcal", classe: "macro-calories" }
    ];
    const percentuaisComMeta = [];

    container.innerHTML = "";

    itens.forEach((item) => {
      const consumido = totais[item.chave] || 0;
      const meta = metas[item.chave] || 0;
      const maiorValor = Math.max(consumido, meta, 1);
      const percentualMeta = meta > 0 ? (meta / maiorValor) * 100 : 0;
      const percentualConsumido = consumido > 0 ? (consumido / maiorValor) * 100 : 0;
      const percentualAtingido = meta > 0 ? (consumido / meta) * 100 : 0;

      if (meta > 0) {
        percentuaisComMeta.push(Math.min(percentualAtingido, 100));
      }

      const row = document.createElement("div");
      row.className = "macro-chart-row";

      const label = document.createElement("div");
      label.className = "macro-chart-label";

      const nome = document.createElement("span");
      nome.textContent = item.nome;

      const valores = document.createElement("strong");
      valores.textContent = `${this.formatarNumero(consumido)} / ${this.formatarNumero(meta)} ${item.unidade}`;

      label.appendChild(nome);
      label.appendChild(valores);

      const bars = document.createElement("div");
      bars.className = "macro-chart-bars";

      const targetBar = document.createElement("span");
      targetBar.className = "macro-chart-target";
      targetBar.style.width = `${percentualMeta}%`;

      const consumedBar = document.createElement("span");
      consumedBar.className = `macro-chart-consumed ${item.classe}`;
      consumedBar.style.width = `${percentualConsumido}%`;
      consumedBar.classList.toggle("macro-chart-over", meta > 0 && consumido > meta * 1.1);

      bars.appendChild(targetBar);
      bars.appendChild(consumedBar);

      const percent = document.createElement("span");
      percent.className = "macro-chart-percent";
      percent.textContent = meta > 0 ? `${this.formatarNumero(percentualAtingido)}%` : "Sem meta";

      row.appendChild(label);
      row.appendChild(bars);
      row.appendChild(percent);
      container.appendChild(row);
    });

    const aderenciaMedia = percentuaisComMeta.length
      ? percentuaisComMeta.reduce((total, percentual) => total + percentual, 0) / percentuaisComMeta.length
      : 0;

    document.getElementById("dashboardAderenciaMedia").textContent = percentuaisComMeta.length
      ? `${this.formatarNumero(aderenciaMedia)}% de ader\u00eancia m\u00e9dia`
      : "Metas n\u00e3o definidas";

    // Marcar linhas conclu\u00eddas e adicionar toggle
    const panel = container.closest(".dashboard-chart-panel");
    const linhas = container.querySelectorAll(".macro-chart-row");
    let concluidas = 0;

    linhas.forEach((row) => {
      const pctEl = row.querySelector(".macro-chart-percent");
      const pctTexto = pctEl ? parseFloat(pctEl.textContent) : 0;
      const concluida = pctTexto >= 100;
      row.classList.toggle("macro-chart-row--done", concluida);
      if (concluida) concluidas++;
    });

    const toggleExistente = panel?.querySelector(".chart-done-toggle");
    if (toggleExistente) toggleExistente.remove();

    if (panel && concluidas > 0) {
      const toggle = document.createElement("button");
      toggle.className = "chart-done-toggle";
      toggle.type = "button";
      toggle.textContent = `Ver conclu\u00edas (${concluidas})`;
      panel.classList.remove("show-done");
      toggle.addEventListener("click", () => {
        const aberto = panel.classList.toggle("show-done");
        toggle.textContent = aberto
          ? `Ocultar conclu\u00edas (${concluidas})`
          : `Ver conclu\u00edas (${concluidas})`;
      });
      container.after(toggle);
    }
  },

  atualizarResumoPorRefeicao(refeicoesPorDia, tiposRefeicao) {
    const container = document.getElementById("resumoRefeicoes");
    if (!container) return; // Managed by PageRefeicoes Vue component
    container.innerHTML = "";

    tiposRefeicao.forEach((refeicao) => {
      const itens = refeicoesPorDia[refeicao.id] || [];
      const totais = this.calcularTotais(itens);
      const card = document.createElement("article");
      card.className = "meal-summary-card";

      const nome = document.createElement("span");
      nome.className = "meal-summary-name";
      nome.textContent = refeicao.nome;

      const calorias = document.createElement("strong");
      calorias.className = "meal-summary-calories";
      calorias.textContent = `${this.formatarNumero(totais.calorias)} kcal`;

      const macros = document.createElement("span");
      macros.className = "meal-summary-macros";
      macros.textContent = `C ${this.formatarNumero(totais.carboidratos)}g | P ${this.formatarNumero(totais.proteinas)}g | G ${this.formatarNumero(totais.gorduras)}g`;

      const quantidade = document.createElement("span");
      quantidade.className = "meal-summary-count";
      quantidade.textContent = `${itens.length} ${itens.length === 1 ? "item" : "itens"}`;

      card.appendChild(nome);
      card.appendChild(calorias);
      card.appendChild(macros);
      card.appendChild(quantidade);
      container.appendChild(card);
    });
  },

  atualizarTabelaRefeicao(refeicoesPorDia, tiposRefeicao) {
    const container = document.getElementById("refeicoesPorTipoContainer");
    if (!container) return { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 }; // Managed by PageRefeicoes Vue
    const totais = { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 };
    const totalItens = tiposRefeicao.reduce((acc, r) => acc + (refeicoesPorDia[r.id] || []).length, 0);

    // Preserve open/closed state across re-renders
    const abertas = new Set();
    container.querySelectorAll("details.refeicao-card[data-id]").forEach((el) => {
      if (el.open) abertas.add(el.dataset.id);
    });
    const primeiraRenderizacao = abertas.size === 0 && container.querySelectorAll("details.refeicao-card").length === 0;

    container.innerHTML = "";

    if (!tiposRefeicao.length) {
      const vazio = document.createElement("div");
      vazio.className = "refeicao-empty";
      vazio.textContent = "Nenhuma refeição cadastrada. Clique em \"+ Nova refeição\" para começar.";
      container.appendChild(vazio);
      this.atualizarBtnAdicionarRefeicao(container);
      this.atualizarTotais(totais);
      return totais;
    }

    tiposRefeicao.forEach((refeicao) => {
      const itens = refeicoesPorDia[refeicao.id] || [];

      const totalRefeicao = { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 };
      itens.forEach((item) => {
        totalRefeicao.carboidratos += Number(item.carboidratos) || 0;
        totalRefeicao.proteinas += Number(item.proteinas) || 0;
        totalRefeicao.gorduras += Number(item.gorduras) || 0;
        totalRefeicao.calorias += Number(item.calorias) || 0;
        totais.carboidratos += Number(item.carboidratos) || 0;
        totais.proteinas += Number(item.proteinas) || 0;
        totais.gorduras += Number(item.gorduras) || 0;
        totais.calorias += Number(item.calorias) || 0;
      });

      const details = document.createElement("details");
      details.className = "refeicao-card";
      details.dataset.id = refeicao.id;
      details.open = primeiraRenderizacao || abertas.has(refeicao.id);

      const summary = document.createElement("summary");
      summary.className = "refeicao-card-header";

      const cardTitle = document.createElement("div");
      cardTitle.className = "refeicao-card-title";
      cardTitle.innerHTML = `
        <span class="refeicao-card-name">${refeicao.nome}</span>
        <span class="refeicao-card-count">${itens.length} ${itens.length === 1 ? "item" : "itens"}</span>
      `;

      const cardMeta = document.createElement("div");
      cardMeta.className = "refeicao-card-meta";
      cardMeta.innerHTML = `
        <span class="refeicao-card-kcal">${this.formatarNumero(totalRefeicao.calorias)} kcal</span>
        <svg class="refeicao-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      `;

      const btnDeletar = document.createElement("button");
      btnDeletar.type = "button";
      btnDeletar.className = "refeicao-card-delete";
      btnDeletar.setAttribute("aria-label", `Excluir refeição ${refeicao.nome}`);
      btnDeletar.innerHTML = "&times;";
      btnDeletar.addEventListener("click", (e) => {
        e.stopPropagation();
        Controller.removerTipoRefeicao(refeicao.id);
      });
      cardMeta.appendChild(btnDeletar);

      summary.appendChild(cardTitle);
      summary.appendChild(cardMeta);

      const body = document.createElement("div");
      body.className = "refeicao-card-body";

      if (!itens.length) {
        const vazio = document.createElement("p");
        vazio.className = "refeicao-item-vazio";
        vazio.textContent = "Nenhum alimento adicionado.";
        body.appendChild(vazio);
      } else {
        itens.forEach((item, index) => {
          const row = document.createElement("div");
          row.className = "refeicao-item";

          const info = document.createElement("div");
          info.className = "refeicao-item-info";
          info.innerHTML = `<span class="refeicao-item-name">${item.nome}</span><span class="refeicao-item-qty">${this.formatarNumero(item.quantidade)}g</span>`;

          const macros = document.createElement("div");
          macros.className = "refeicao-item-macros";
          macros.innerHTML = `
            <span class="rmacro rmacro-c">C ${this.formatarNumero(item.carboidratos)}g</span>
            <span class="rmacro rmacro-p">P ${this.formatarNumero(item.proteinas)}g</span>
            <span class="rmacro rmacro-g">G ${this.formatarNumero(item.gorduras)}g</span>
            <span class="rmacro rmacro-cal">${this.formatarNumero(item.calorias)} kcal</span>
          `;

          const actions = document.createElement("div");
          actions.className = "refeicao-item-actions";
          actions.appendChild(this.criarBotaoEditar(refeicao.id, index, item.nome));
          actions.appendChild(this.criarSelectMover(refeicao.id, index, tiposRefeicao));
          actions.appendChild(this.criarBotaoRemover(refeicao.id, index, item.nome));

          row.appendChild(info);
          row.appendChild(macros);
          row.appendChild(actions);
          body.appendChild(row);
        });

        const footer = document.createElement("div");
        footer.className = "refeicao-card-footer";
        const btnTemplate = document.createElement("button");
        btnTemplate.type = "button";
        btnTemplate.className = "btn-salvar-template";
        btnTemplate.textContent = "Salvar como refeição completa";
        btnTemplate.addEventListener("click", () => Controller.iniciarSalvarTemplate(refeicao.id));
        footer.appendChild(btnTemplate);
        body.appendChild(footer);
      }

      details.appendChild(summary);
      details.appendChild(body);
      container.appendChild(details);
    });

    this.atualizarBtnAdicionarRefeicao(container);
    this.atualizarTotais(totais);
    return totais;
  },

  atualizarBtnAdicionarRefeicao(container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-add-refeicao";
    btn.textContent = "+ Nova refeição";
    btn.addEventListener("click", () => Controller.adicionarTipoRefeicao());
    container.appendChild(btn);
  },

  criarSelectMover(refeicaoOrigemId, index, tiposRefeicao) {
    const select = document.createElement("select");
    select.className = "form-select move-select";
    select.setAttribute("aria-label", "Mover item para outra refeicao");

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Mover";
    placeholder.selected = true;
    select.appendChild(placeholder);

    tiposRefeicao
      .filter((refeicao) => refeicao.id !== refeicaoOrigemId)
      .forEach((refeicao) => {
        const option = document.createElement("option");
        option.value = refeicao.id;
        option.textContent = refeicao.nome;
        select.appendChild(option);
      });

    select.addEventListener("change", (event) => {
      if (event.target.value) {
        Controller.moverItem(refeicaoOrigemId, index, event.target.value);
      }
    });

    return select;
  },

  criarBotaoEditar(refeicaoId, index, nomeAlimento) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "editar-registro";
    button.textContent = "Editar";
    button.setAttribute("aria-label", `Editar ${nomeAlimento}`);
    button.addEventListener("click", () => {
      Controller.iniciarEdicaoRegistro(refeicaoId, index);
    });
    return button;
  },

  criarBotaoRemover(refeicaoId, index, nomeAlimento) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "remover";
    button.textContent = "x";
    button.setAttribute("aria-label", `Remover ${nomeAlimento}`);
    button.addEventListener("click", () => {
      Controller.removerItem(refeicaoId, index);
    });
    return button;
  },

  mostrarFormularioEdicaoRegistro(item, refeicaoId, tiposRefeicao, alimento) {
    const painel = document.getElementById("painelEdicaoRegistro");
    const campoBusca = document.getElementById("editarBuscaAlimento");
    const quantidade = document.getElementById("editarQuantidade");
    const selectRefeicao = document.getElementById("editarTipoRefeicao");

    this.preencherSelectRefeicoes("editarTipoRefeicao", tiposRefeicao, refeicaoId);
    painel.hidden = false;
    campoBusca.value = alimento ? alimento.nome : item.nome;
    quantidade.value = item.quantidade > 0 ? String(item.quantidade) : "";
    selectRefeicao.value = refeicaoId;
    this.atualizarEstadoEdicaoRegistro(alimento);
  },

  ocultarFormularioEdicaoRegistro() {
    const painel = document.getElementById("painelEdicaoRegistro");
    painel.hidden = true;
    document.getElementById("editarBuscaAlimento").value = "";
    document.getElementById("editarQuantidade").value = "";
    document.getElementById("detalheEdicaoRegistro").textContent = "Selecione um alimento cadastrado para salvar a edi\u00e7\u00e3o.";
  },

  atualizarEstadoEdicaoRegistro(alimento) {
    const detalhe = document.getElementById("detalheEdicaoRegistro");
    const botaoSalvar = document.getElementById("btnSalvarEdicaoRegistro");

    if (!alimento) {
      detalhe.textContent = "Selecione um alimento cadastrado para salvar a edi\u00e7\u00e3o.";
      botaoSalvar.disabled = true;
      return;
    }

    detalhe.textContent = `${this.formatarNumero(alimento.calorias)} kcal por 100g | ${this.formatarNumero(alimento.carboidratos)}g carbs, ${this.formatarNumero(alimento.proteinas)}g prot, ${this.formatarNumero(alimento.gorduras)}g gord`;
    botaoSalvar.disabled = false;
  },

  atualizarRelatorioControles(periodo, datasPontuais) {
    const selectPeriodo = document.getElementById("relatorioPeriodo");
    const grupoDataBase = document.getElementById("grupoRelatorioDataBase");
    const grupoDiasPontuais = document.getElementById("grupoRelatorioDiasPontuais");
    const modoPontual = periodo === "custom";

    if (document.activeElement !== selectPeriodo) {
      selectPeriodo.value = periodo;
    }

    grupoDataBase.hidden = modoPontual;
    grupoDiasPontuais.hidden = !modoPontual;
    this.renderizarDatasPontuaisRelatorio(datasPontuais);
  },

  renderizarDatasPontuaisRelatorio(datasPontuais) {
    const container = document.getElementById("relatorioDatasPontuais");
    container.innerHTML = "";

    if (!datasPontuais.length) {
      const vazio = document.createElement("span");
      vazio.className = "chip-empty";
      vazio.textContent = "Nenhum dia selecionado.";
      container.appendChild(vazio);
      return;
    }

    datasPontuais.forEach((data) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "date-chip";
      chip.textContent = this.formatarDataCurta(data);
      chip.setAttribute("aria-label", `Remover ${this.formatarDataCurta(data)} do relat\u00f3rio`);
      chip.addEventListener("click", () => {
        Controller.removerDataPontualRelatorio(data);
      });
      container.appendChild(chip);
    });
  },

  renderizarRelatorio(relatorio) {
    const container = document.getElementById("relatorioPreview");
    container.innerHTML = "";

    if (!relatorio || !relatorio.totalDias) {
      const vazio = this.criarElemento("div", "report-empty");
      vazio.appendChild(this.criarElemento("span", "panel-kicker", "Relat\u00f3rio"));
      vazio.appendChild(this.criarElemento("h2", "", "Nenhum per\u00edodo selecionado"));
      vazio.appendChild(this.criarElemento("p", "", "Selecione ao menos um dia para gerar o relat\u00f3rio."));
      container.appendChild(vazio);
      return;
    }

    const documento = this.criarElemento("div", "report-document");
    documento.appendChild(this.criarCabecalhoRelatorio(relatorio));
    documento.appendChild(this.criarResumoExecutivoRelatorio(relatorio));
    documento.appendChild(this.criarSecaoMacrosRelatorio(relatorio));
    documento.appendChild(this.criarSecaoRefeicoesRelatorio(relatorio));
    documento.appendChild(this.criarSecaoDiasRelatorio(relatorio));
    container.appendChild(documento);
  },

  criarCabecalhoRelatorio(relatorio) {
    const header = this.criarElemento("header", "report-header");
    const titulo = this.criarElemento("div", "report-title-block");
    const periodo = relatorio.datas.length === 1
      ? this.formatarDataLonga(relatorio.datas[0])
      : `${this.formatarDataCurta(relatorio.datas[0])} at\u00e9 ${this.formatarDataCurta(relatorio.datas[relatorio.datas.length - 1])}`;

    titulo.appendChild(this.criarElemento("span", "panel-kicker", "Relat\u00f3rio nutricional"));
    titulo.appendChild(this.criarElemento("h2", "", "Macronutrientes e refei\u00e7\u00f5es"));
    titulo.appendChild(this.criarElemento("p", "", `${relatorio.totalDias} ${relatorio.totalDias === 1 ? "dia analisado" : "dias analisados"} | ${periodo}`));

    const meta = this.criarElemento("div", "report-generated");
    meta.appendChild(this.criarElemento("span", "", "Gerado em"));
    meta.appendChild(this.criarElemento("strong", "", this.formatarDataHora(relatorio.geradoEm)));

    header.appendChild(titulo);
    header.appendChild(meta);
    return header;
  },

  criarResumoExecutivoRelatorio(relatorio) {
    const section = this.criarElemento("section", "report-section");
    const metricas = relatorio.metricasConsistencia;
    const cards = this.criarElemento("div", "report-metric-grid");

    section.appendChild(this.criarTituloSecaoRelatorio("Resumo", "Consist\u00eancia alimentar e volume registrado."));
    cards.appendChild(this.criarCardRelatorio("Dias com registro", `${metricas.diasComRegistro}/${relatorio.totalDias}`, `${this.formatarPercentual(metricas.percentualDiasComRegistro)} do per\u00edodo`));
    cards.appendChild(this.criarCardRelatorio("Refei\u00e7\u00f5es registradas", `${metricas.refeicoesRegistradas}/${metricas.refeicoesPossiveis}`, `${this.formatarNumero(metricas.mediaRefeicoesPorDia)} por dia`));
    cards.appendChild(this.criarCardRelatorio("Ader\u00eancia m\u00e9dia", this.formatarPercentual(metricas.aderenciaMediaMacros), "M\u00e9dia das metas definidas"));
    cards.appendChild(this.criarCardRelatorio("Meta cal\u00f3rica", metricas.metaCaloricaDefinida ? `${metricas.diasDentroMetaCalorica}/${relatorio.totalDias}` : "Sem meta", metricas.metaCaloricaDefinida ? `${this.formatarPercentual(metricas.percentualDiasDentroMetaCalorica)} entre 90% e 110%` : "Defina uma meta di\u00e1ria"));
    cards.appendChild(this.criarCardRelatorio("Total consumido", `${this.formatarNumero(relatorio.totais.calorias)} kcal`, `${relatorio.totalItens} itens registrados`));
    cards.appendChild(this.criarCardRelatorio("M\u00e9dia di\u00e1ria", `${this.formatarNumero(relatorio.mediaDiaria.calorias)} kcal`, `C ${this.formatarNumero(relatorio.mediaDiaria.carboidratos)}g | P ${this.formatarNumero(relatorio.mediaDiaria.proteinas)}g | G ${this.formatarNumero(relatorio.mediaDiaria.gorduras)}g`));
    section.appendChild(cards);

    if (relatorio.diaMaiorCalorias && relatorio.diaMenorCalorias) {
      const extremos = this.criarElemento("div", "report-extremes");
      extremos.appendChild(this.criarElemento("span", "", `Maior consumo: ${this.formatarDataCurta(relatorio.diaMaiorCalorias.data)} com ${this.formatarNumero(relatorio.diaMaiorCalorias.totais.calorias)} kcal`));
      extremos.appendChild(this.criarElemento("span", "", `Menor consumo: ${this.formatarDataCurta(relatorio.diaMenorCalorias.data)} com ${this.formatarNumero(relatorio.diaMenorCalorias.totais.calorias)} kcal`));
      section.appendChild(extremos);
    }

    return section;
  },

  criarSecaoMacrosRelatorio(relatorio) {
    const section = this.criarElemento("section", "report-section");
    const distribuicao = this.criarElemento("div", "report-macro-stack");
    const segmentos = [
      ["macro-carbs", relatorio.distribuicaoMacros.carboidratos, "Carboidratos"],
      ["macro-protein", relatorio.distribuicaoMacros.proteinas, "Prote\u00ednas"],
      ["macro-fat", relatorio.distribuicaoMacros.gorduras, "Gorduras"]
    ];

    section.appendChild(this.criarTituloSecaoRelatorio("Macronutrientes", "Totais, m\u00e9dias di\u00e1rias e ader\u00eancia \u00e0s metas."));

    segmentos.forEach(([classe, percentual, nome]) => {
      const segmento = this.criarElemento("span", `report-macro-segment ${classe}`);
      segmento.style.width = `${percentual}%`;
      segmento.title = `${nome}: ${this.formatarPercentual(percentual)}`;
      distribuicao.appendChild(segmento);
    });

    section.appendChild(distribuicao);
    section.appendChild(this.criarTabelaRelatorio(
      ["Macro", "Total", "M\u00e9dia/dia", "Meta/dia", "Diferen\u00e7a/dia", "Ader\u00eancia", "Dias na meta"],
      relatorio.metricasMacros.map((macro) => [
        macro.nome,
        this.formatarComUnidade(macro.consumidoTotal, macro.unidade),
        this.formatarComUnidade(macro.mediaConsumida, macro.unidade),
        macro.metaDiaria > 0 ? this.formatarComUnidade(macro.metaDiaria, macro.unidade) : "Sem meta",
        macro.metaDiaria > 0 ? this.formatarComUnidade(macro.diferencaMedia, macro.unidade) : "Sem meta",
        macro.metaDiaria > 0 ? this.formatarPercentual(macro.percentualMeta) : "Sem meta",
        macro.metaDiaria > 0 ? `${macro.diasDentroMeta}/${relatorio.totalDias}` : "Sem meta"
      ])
    ));

    return section;
  },

  criarSecaoRefeicoesRelatorio(relatorio) {
    const section = this.criarElemento("section", "report-section");
    section.appendChild(this.criarTituloSecaoRelatorio("Refei\u00e7\u00f5es", "Distribui\u00e7\u00e3o dos registros por refei\u00e7\u00e3o."));
    section.appendChild(this.criarTabelaRelatorio(
      ["Refei\u00e7\u00e3o", "Dias com registro", "Itens", "Calorias", "Carbs", "Prote\u00ednas", "Gorduras"],
      relatorio.refeicoesResumo.map((refeicao) => [
        refeicao.nome,
        `${refeicao.diasComRegistro}/${relatorio.totalDias}`,
        String(refeicao.totalItens),
        this.formatarComUnidade(refeicao.totais.calorias, "kcal"),
        this.formatarComUnidade(refeicao.totais.carboidratos, "g"),
        this.formatarComUnidade(refeicao.totais.proteinas, "g"),
        this.formatarComUnidade(refeicao.totais.gorduras, "g")
      ])
    ));
    return section;
  },

  criarSecaoDiasRelatorio(relatorio) {
    const section = this.criarElemento("section", "report-section report-days-section");
    const lista = this.criarElemento("div", "report-day-list");

    section.appendChild(this.criarTituloSecaoRelatorio("Detalhamento di\u00e1rio", "Refei\u00e7\u00f5es e alimentos registrados em cada dia."));

    relatorio.dias.forEach((dia) => {
      const card = this.criarElemento("article", "report-day-card");
      const header = this.criarElemento("div", "report-day-header");
      header.appendChild(this.criarElemento("h3", "", this.formatarDataLonga(dia.data)));
      header.appendChild(this.criarElemento("span", "", `${this.formatarNumero(dia.totais.calorias)} kcal | C ${this.formatarNumero(dia.totais.carboidratos)}g | P ${this.formatarNumero(dia.totais.proteinas)}g | G ${this.formatarNumero(dia.totais.gorduras)}g`));
      card.appendChild(header);

      if (!dia.totalItens) {
        card.appendChild(this.criarElemento("p", "report-empty-day", "Sem refei\u00e7\u00f5es registradas."));
      } else {
        dia.refeicoes
          .filter((refeicao) => refeicao.totalItens > 0)
          .forEach((refeicao) => {
            const grupo = this.criarElemento("div", "report-meal-detail");
            grupo.appendChild(this.criarElemento("h4", "", `${refeicao.nome} | ${this.formatarNumero(refeicao.totais.calorias)} kcal`));
            grupo.appendChild(this.criarTabelaRelatorio(
              ["Alimento", "Qtd", "Carbs", "Prote\u00ednas", "Gorduras", "Calorias"],
              refeicao.itens.map((item) => [
                item.nome,
                this.formatarComUnidade(item.quantidade, "g"),
                this.formatarComUnidade(item.carboidratos, "g"),
                this.formatarComUnidade(item.proteinas, "g"),
                this.formatarComUnidade(item.gorduras, "g"),
                this.formatarComUnidade(item.calorias, "kcal")
              ])
            ));
            card.appendChild(grupo);
          });
      }

      lista.appendChild(card);
    });

    section.appendChild(lista);
    return section;
  },

  criarTituloSecaoRelatorio(titulo, descricao) {
    const header = this.criarElemento("div", "report-section-heading");
    header.appendChild(this.criarElemento("h3", "", titulo));
    header.appendChild(this.criarElemento("p", "", descricao));
    return header;
  },

  criarCardRelatorio(rotulo, valor, detalhe) {
    const card = this.criarElemento("article", "report-metric-card");
    card.appendChild(this.criarElemento("span", "", rotulo));
    card.appendChild(this.criarElemento("strong", "", valor));
    card.appendChild(this.criarElemento("small", "", detalhe));
    return card;
  },

  criarTabelaRelatorio(colunas, linhas) {
    const wrapper = this.criarElemento("div", "report-table-wrapper");
    const table = document.createElement("table");
    table.className = "report-table";
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const headerRow = document.createElement("tr");

    colunas.forEach((coluna) => {
      const th = document.createElement("th");
      th.textContent = coluna;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    linhas.forEach((linha) => {
      const row = document.createElement("tr");
      linha.forEach((valor) => {
        const cell = document.createElement("td");
        cell.textContent = valor;
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  },

  criarElemento(tag, className = "", texto = "") {
    const elemento = document.createElement(tag);

    if (className) {
      elemento.className = className;
    }

    if (texto !== "") {
      elemento.textContent = texto;
    }

    return elemento;
  },

  calcularTotais(itens) {
    return itens.reduce((totais, item) => {
      totais.carboidratos += Number(item.carboidratos) || 0;
      totais.proteinas += Number(item.proteinas) || 0;
      totais.gorduras += Number(item.gorduras) || 0;
      totais.calorias += Number(item.calorias) || 0;
      return totais;
    }, {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0,
      calorias: 0
    });
  },

  atualizarTotais(totais) {
    const el = document.getElementById("totalCarbo");
    if (!el) return; // Managed by PageRefeicoes Vue component
    const mapeamento = [
      ["totalCarbo", totais.carboidratos],
      ["totalProteina", totais.proteinas],
      ["totalGordura", totais.gorduras],
      ["totalCalorias", totais.calorias],
      ["totalCarboResumo", totais.carboidratos],
      ["totalProteinaResumo", totais.proteinas],
      ["totalGorduraResumo", totais.gorduras],
      ["totalCaloriasResumo", totais.calorias]
    ];

    mapeamento.forEach(([id, valor]) => {
      const elId = document.getElementById(id);
      if (elId) elId.textContent = this.formatarNumero(valor);
    });
  },

  formatarNumero(valor) {
    const num = Number(valor);
    return String(Math.round(Number.isFinite(num) ? num : 0));
  },

  formatarPercentual(valor) {
    return `${this.formatarNumero(valor)}%`;
  },

  formatarComUnidade(valor, unidade) {
    return `${this.formatarNumero(valor)} ${unidade}`;
  },

  formatarDataCurta(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR").format(new Date(ano, mes - 1, dia));
  },

  formatarDataLonga(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(ano, mes - 1, dia));
  },

  formatarDataHora(dataIso) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(dataIso));
  },

  mostrarToast(mensagem, tipo = "info") {
    if (window._stores?.ui) {
      window._stores.ui.mostrarToast(mensagem, tipo);
      return;
    }
    // Fallback: DOM approach (used before Vue mounts)
    const container = document.getElementById("appToastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `app-toast app-toast-${tipo}`;
    toast.setAttribute("role", tipo === "error" ? "alert" : "status");
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add("app-toast-hiding"); }, 2800);
    setTimeout(() => { toast.remove(); }, 3500);
  },

  renderizarSelecaoTemplates(templates, tiposRefeicao) {
    const container = document.getElementById("listaRefeicaoCompleta");
    if (!container) return;
    container.innerHTML = "";

    if (!templates.length) {
      const empty = document.createElement("p");
      empty.className = "template-selection-empty";
      empty.textContent = "Nenhuma refeição completa salva ainda. Use o botão abaixo para criar a sua primeira.";
      container.appendChild(empty);
      return;
    }

    templates.forEach((template) => {
      const totalCal = (template.itens || []).reduce((acc, i) => acc + (Number(i.calorias) || 0), 0);
      const qtd = (template.itens || []).length;

      const card = document.createElement("div");
      card.className = "template-card";

      const info = document.createElement("div");
      info.className = "template-card-info";
      info.innerHTML = `
        <span class="template-card-nome">${template.nome}</span>
        <span class="template-card-meta">${qtd} ${qtd === 1 ? "item" : "itens"} &middot; ${this.formatarNumero(totalCal)} kcal</span>
      `;

      const actions = document.createElement("div");
      actions.className = "template-card-actions";

      const select = document.createElement("select");
      select.className = "form-select template-meal-select";
      select.setAttribute("aria-label", `Refeição para ${template.nome}`);
      tiposRefeicao.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.nome;
        if (r.id === template.refeicaoId) opt.selected = true;
        select.appendChild(opt);
      });

      const btnAplicar = document.createElement("button");
      btnAplicar.type = "button";
      btnAplicar.className = "btn-template-aplicar";
      btnAplicar.textContent = "Adicionar";
      btnAplicar.addEventListener("click", () => Controller.aplicarTemplateComTipo(template.id, select.value));

      const btnExcluir = document.createElement("button");
      btnExcluir.type = "button";
      btnExcluir.className = "btn-template-excluir";
      btnExcluir.setAttribute("aria-label", `Excluir ${template.nome}`);
      btnExcluir.innerHTML = "&times;";
      btnExcluir.addEventListener("click", () => Controller.excluirTemplate(template.id));

      actions.appendChild(select);
      actions.appendChild(btnAplicar);
      actions.appendChild(btnExcluir);
      card.appendChild(info);
      card.appendChild(actions);
      container.appendChild(card);
    });
  },

  renderizarItensTemplate(itens) {
    const container = document.getElementById("listaItensNovaRefeicao");
    if (!container) return;
    container.innerHTML = "";

    if (!itens.length) {
      const empty = document.createElement("p");
      empty.className = "nova-refeicao-empty";
      empty.textContent = "Nenhum item adicionado ainda.";
      container.appendChild(empty);
      return;
    }

    itens.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "nova-refeicao-item";

      const nome = document.createElement("span");
      nome.className = "nova-refeicao-item-nome";
      nome.textContent = item.nome;

      const qty = document.createElement("span");
      qty.className = "nova-refeicao-item-qty";
      qty.textContent = `${this.formatarNumero(item.quantidade)}g · ${this.formatarNumero(item.calorias)} kcal`;

      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "nova-refeicao-item-remove";
      btnRemover.innerHTML = "&times;";
      btnRemover.setAttribute("aria-label", `Remover ${item.nome}`);
      btnRemover.addEventListener("click", () => Controller.removerItemDoTemplate(index));

      row.appendChild(nome);
      row.appendChild(qty);
      row.appendChild(btnRemover);
      container.appendChild(row);
    });
  }
};
