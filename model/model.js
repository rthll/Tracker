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
    if (!data) {
      return;
    }

    if (!this.refeicoesPorData[data]) {
      this.refeicoesPorData[data] = [];
    }

    this.refeicoesPorData[data].push(item);
  },

  getRefeicao(data) {
    if (!data) {
      return [];
    }

    return this.refeicoesPorData[data] || [];
  },

  removerItem(data, index) {
    const refeicao = this.refeicoesPorData[data];

    if (!Array.isArray(refeicao) || index < 0 || index >= refeicao.length) {
      return;
    }

    refeicao.splice(index, 1);
  }
};
