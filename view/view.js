const View = {
  atualizarCabecalhos(dataFormatada) {
    document.getElementById("resumoData").textContent = dataFormatada;
    document.getElementById("tituloRefeicao").textContent = `Refei\u00e7\u00e3o de ${dataFormatada}`;
  },

  atualizarAutocompleteAlimentos(alimentos) {
    const campoBusca = document.getElementById("buscaAlimento");
    const quantidade = document.getElementById("quantidade");
    const sugestoes = document.getElementById("sugestoesAlimentos");

    sugestoes.innerHTML = "";

    alimentos.forEach((alimento) => {
      const option = document.createElement("option");
      option.value = alimento.nome;
      option.label = `${this.formatarNumero(alimento.calorias)} kcal | C ${this.formatarNumero(alimento.carboidratos)}g, P ${this.formatarNumero(alimento.proteinas)}g, G ${this.formatarNumero(alimento.gorduras)}g`;
      sugestoes.appendChild(option);
    });

    campoBusca.disabled = !alimentos.length;
    quantidade.disabled = !alimentos.length;
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

  atualizarAlimentosPersonalizados(alimentos) {
    document.getElementById("contadorAlimentos").textContent = String(alimentos.length);
    this.renderizarListaChips("listaPersonalizados", alimentos, "Nenhum alimento personalizado cadastrado.");
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
      macros.textContent = `${this.formatarNumero(alimento.calorias)} kcal/100g`;

      button.appendChild(nome);
      button.appendChild(macros);
      container.appendChild(button);
    });
  },

  atualizarBotaoRepetir(quantidadeItensOntem) {
    const botao = document.getElementById("btnRepetirRefeicao");
    botao.disabled = quantidadeItensOntem <= 0;
    botao.textContent = quantidadeItensOntem > 0
      ? `Repetir refei\u00e7\u00e3o anterior (${quantidadeItensOntem})`
      : "Repetir refei\u00e7\u00e3o anterior";
  },

  atualizarTabelaRefeicao(refeicao) {
    const tbody = document.getElementById("tabelaRefeicao");
    const totais = {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0,
      calorias: 0
    };

    tbody.innerHTML = "";

    if (!refeicao.length) {
      const row = document.createElement("tr");
      row.className = "empty-state";

      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = "Nenhum alimento adicionado para esta data.";

      row.appendChild(cell);
      tbody.appendChild(row);
      this.atualizarTotais(totais);
      return;
    }

    refeicao.forEach((item, index) => {
      totais.carboidratos += item.carboidratos;
      totais.proteinas += item.proteinas;
      totais.gorduras += item.gorduras;
      totais.calorias += item.calorias;

      const row = document.createElement("tr");
      const valores = [
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
      actionCell.className = "text-center";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "remover";
      button.textContent = "x";
      button.setAttribute("aria-label", `Remover ${item.nome}`);
      button.addEventListener("click", () => {
        Controller.removerItem(index);
      });

      actionCell.appendChild(button);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });

    this.atualizarTotais(totais);
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
