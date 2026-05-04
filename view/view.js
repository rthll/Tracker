const View = {
  atualizarCabecalhos(dataFormatada) {
    document.getElementById("resumoData").textContent = dataFormatada;
    document.getElementById("tituloRefeicao").textContent = `Refeição de ${dataFormatada}`;
  },

  atualizarListaAlimentos(alimentos) {
    const lista = document.getElementById("listaAlimentos");
    const botaoAdicionar = document.getElementById("btnAdicionar");

    lista.innerHTML = "";

    if (!alimentos.length) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Cadastre um alimento primeiro";
      placeholder.selected = true;
      placeholder.disabled = true;
      lista.appendChild(placeholder);
      lista.disabled = true;
      botaoAdicionar.disabled = true;
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione um alimento";
    placeholder.selected = true;
    placeholder.disabled = true;
    lista.appendChild(placeholder);

    alimentos.forEach((alimento, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = alimento.nome;
      lista.appendChild(option);
    });

    lista.disabled = false;
    botaoAdicionar.disabled = false;
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
      button.textContent = "×";
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
