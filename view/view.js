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
    const select = document.getElementById("tipoRefeicao");
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
      : "almoco";
  },

  atualizarAutocompleteAlimentos(alimentos) {
    const campoBusca = document.getElementById("buscaAlimento");
    const quantidade = document.getElementById("quantidade");
    const tipoRefeicao = document.getElementById("tipoRefeicao");
    const sugestoes = document.getElementById("sugestoesAlimentos");

    sugestoes.innerHTML = "";

    alimentos.forEach((alimento) => {
      const option = document.createElement("option");
      option.value = alimento.nome;
      option.label = `${alimento.origem || "Base"} | ${this.formatarNumero(alimento.calorias)} kcal | C ${this.formatarNumero(alimento.carboidratos)}g, P ${this.formatarNumero(alimento.proteinas)}g, G ${this.formatarNumero(alimento.gorduras)}g`;
      sugestoes.appendChild(option);
    });

    campoBusca.disabled = !alimentos.length;
    quantidade.disabled = !alimentos.length;
    tipoRefeicao.disabled = !alimentos.length;
    campoBusca.placeholder = alimentos.length
      ? "Digite para buscar um alimento"
      : "Cadastre um alimento primeiro";
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
  }
};
