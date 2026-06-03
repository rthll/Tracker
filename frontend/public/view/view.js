const View = {
  mostrarPagina(paginaAtiva) {
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
    document.getElementById("resumoData").textContent = dataFormatada;
    document.getElementById("tituloRefeicao").textContent = `Refei\u00e7\u00f5es de ${dataFormatada}`;
  },

  atualizarSelectRefeicoes(tiposRefeicao) {
    this.preencherSelectRefeicoes("tipoRefeicao", tiposRefeicao, "almoco");
    this.preencherSelectRefeicoes("editarTipoRefeicao", tiposRefeicao, "almoco");
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

    campoBusca.disabled = !alimentos.length;
    quantidade.disabled = !alimentos.length;
    tipoRefeicao.disabled = !alimentos.length;
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
    const painelId = contexto === "edicao" ? "painelBuscaEdicaoAlimentos" : "painelBuscaAlimentos";
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
    ["painelBuscaAlimentos", "painelBuscaEdicaoAlimentos"].forEach((id) => {
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
    this.renderizarListaChips("listaFavoritos", favoritos, "Nenhum favorito ainda.");
    this.renderizarListaChips("listaHistorico", historico, "Sem historico de uso.");
  },

  atualizarAlimentosPersonalizados(alimentosPersonalizados, totalTaco = 0) {
    document.getElementById("contadorAlimentos").textContent = String(alimentosPersonalizados.length);
    document.getElementById("contadorTaco").textContent = String(totalTaco);
    this.renderizarListaChips("listaPersonalizados", alimentosPersonalizados, "Nenhum alimento personalizado cadastrado.");
  },

  renderizarListaChips(containerId, alimentos, mensagemVazia) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!alimentos.length) {
      const vazio = document.createElement("span");
      vazio.className = "chip-empty";
      vazio.textContent = mensagemVazia;
      container.appendChild(vazio);
      return;
    }

    alimentos.forEach((alimento) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "food-chip";
      button.addEventListener("click", () => {
        Controller.selecionarAlimento(alimento.id);
      });

      const nome = document.createElement("span");
      nome.className = "food-chip-name";
      nome.textContent = alimento.nome;

      const macros = document.createElement("span");
      macros.className = "food-chip-macros";
      macros.textContent = `${alimento.origem || "Base"} | ${this.formatarNumero(alimento.calorias)} kcal/100g`;

      button.appendChild(nome);
      button.appendChild(macros);
      container.appendChild(button);
    });
  },

  atualizarBotaoRepetir(quantidadeItensOntem) {
    const botao = document.getElementById("btnRepetirRefeicao");
    botao.disabled = quantidadeItensOntem <= 0;
    botao.textContent = quantidadeItensOntem > 0
      ? `Repetir refei\u00e7\u00f5es anteriores (${quantidadeItensOntem})`
      : "Repetir refei\u00e7\u00f5es anteriores";
  },

  atualizarMetasDiarias(metas) {
    const campos = [
      ["metaCarboidratos", metas.carboidratos],
      ["metaProteinas", metas.proteinas],
      ["metaGorduras", metas.gorduras],
      ["metaCalorias", metas.calorias]
    ];

    campos.forEach(([id, valor]) => {
      const input = document.getElementById(id);

      if (document.activeElement !== input) {
        input.value = valor > 0 ? String(valor) : "";
      }
    });
  },

  atualizarCalculadoraTmb(perfil) {
    const campos = [
      ["tmbPeso", perfil.peso],
      ["tmbAltura", perfil.altura],
      ["tmbIdade", perfil.idade]
    ];
    const sexo = document.getElementById("tmbSexo");
    const resultado = document.getElementById("tmbResultado");
    const detalhe = document.getElementById("tmbDetalhe");
    const botaoUsarMeta = document.getElementById("btnUsarTmbMeta");

    if (document.activeElement !== sexo) {
      sexo.value = perfil.sexo || "";
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
      return;
    }

    detalhe.textContent = `Estimativa de repouso: ${this.formatarNumero(perfil.resultado)} kcal por dia.`;
  },

  atualizarProgressoMetas(totais, metas) {
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
      barra.classList.toggle("progress-over", percentual > 100);

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
    this.atualizarDashboardCalorias(totais, metas);
    this.atualizarDistribuicaoMacros(totais);
    this.atualizarGraficoMetaConsumido(totais, metas);
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
      consumedBar.classList.toggle("macro-chart-over", meta > 0 && consumido > meta);

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
  },

  atualizarResumoPorRefeicao(refeicoesPorDia, tiposRefeicao) {
    const container = document.getElementById("resumoRefeicoes");
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
    const tbody = document.getElementById("tabelaRefeicao");
    const totais = {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0,
      calorias: 0
    };
    const totalItens = tiposRefeicao.reduce((total, refeicao) => {
      return total + (refeicoesPorDia[refeicao.id] || []).length;
    }, 0);

    tbody.innerHTML = "";

    if (!totalItens) {
      const row = document.createElement("tr");
      row.className = "empty-state";

      const cell = document.createElement("td");
      cell.colSpan = 8;
      cell.textContent = "Nenhum alimento adicionado para esta data.";

      row.appendChild(cell);
      tbody.appendChild(row);
      this.atualizarTotais(totais);
      return totais;
    }

    tiposRefeicao.forEach((refeicao) => {
      const itens = refeicoesPorDia[refeicao.id] || [];

      itens.forEach((item, index) => {
        totais.carboidratos += item.carboidratos;
        totais.proteinas += item.proteinas;
        totais.gorduras += item.gorduras;
        totais.calorias += item.calorias;

        const row = document.createElement("tr");
        const valores = [
          refeicao.nome,
          item.nome,
          `${this.formatarNumero(item.quantidade)} g`,
          this.formatarNumero(item.carboidratos),
          this.formatarNumero(item.proteinas),
          this.formatarNumero(item.gorduras),
          this.formatarNumero(item.calorias)
        ];

        valores.forEach((valor) => {
          const cell = document.createElement("td");
          cell.textContent = valor;
          row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        actionCell.className = "actions-cell";
        const actionWrapper = document.createElement("div");
        actionWrapper.className = "actions-cell-inner";
        actionWrapper.appendChild(this.criarBotaoEditar(refeicao.id, index, item.nome));
        actionWrapper.appendChild(this.criarSelectMover(refeicao.id, index, tiposRefeicao));
        actionWrapper.appendChild(this.criarBotaoRemover(refeicao.id, index, item.nome));
        actionCell.appendChild(actionWrapper);
        row.appendChild(actionCell);
        tbody.appendChild(row);
      });
    });

    this.atualizarTotais(totais);
    return totais;
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
      totais.carboidratos += item.carboidratos;
      totais.proteinas += item.proteinas;
      totais.gorduras += item.gorduras;
      totais.calorias += item.calorias;
      return totais;
    }, {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0,
      calorias: 0
    });
  },

  atualizarTotais(totais) {
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
      document.getElementById(id).textContent = this.formatarNumero(valor);
    });
  },

  formatarNumero(valor) {
    return Number(valor).toFixed(2);
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
  }
};
