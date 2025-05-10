const Model = {
    alimentos: [],
    refeicoesPorData: {},

    adicionarAlimento(alimento) {
      this.alimentos.push(alimento);
    },

    getAlimentos() {
      return this.alimentos;
    },

    adicionarRefeicao(data, item) {
      if (!this.refeicoesPorData[data]) this.refeicoesPorData[data] = [];
      this.refeicoesPorData[data].push(item);
    },

    getRefeicao(data) {
      return this.refeicoesPorData[data] || [];
    },

    removerItem(data, index) {
      this.refeicoesPorData[data].splice(index, 1);
    }
  };
