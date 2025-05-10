const View = {
    atualizarListaAlimentos(alimentos) {
      const lista = document.getElementById('listaAlimentos');
      lista.innerHTML = '';
      alimentos.forEach((a, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = a.nome;
        lista.appendChild(opt);
      });
    },

    atualizarTabelaRefeicao(refeicao) {
      const tbody = document.getElementById('tabelaRefeicao');
      tbody.innerHTML = '';
      let totalCarbo = 0, totalProteina = 0, totalGordura = 0, totalCal = 0;

      refeicao.forEach((item, index) => {
        totalCarbo += item.carboidratos;
        totalProteina += item.proteinas;
        totalGordura += item.gorduras;
        totalCal += item.calorias;

        const row = `<tr>
          <td>${item.nome}</td><td>${item.quantidade}</td>
          <td>${item.carboidratos.toFixed(2)}</td>
          <td>${item.proteinas.toFixed(2)}</td>
          <td>${item.gorduras.toFixed(2)}</td>
          <td>${item.calorias.toFixed(2)}</td>
          <td><button class="remover" onclick="Controller.removerItem(${index})">X</button></td>
        </tr>`;
        tbody.innerHTML += row;
      });

      document.getElementById('totalCarbo').textContent = totalCarbo.toFixed(2);
      document.getElementById('totalProteina').textContent = totalProteina.toFixed(2);
      document.getElementById('totalGordura').textContent = totalGordura.toFixed(2);
      document.getElementById('totalCalorias').textContent = totalCal.toFixed(2);
    }
  };

  const Controller = {
    init() {
      const hoje = new Date().toISOString().split('T')[0];
      document.getElementById('dataSelecionada').value = hoje;
      this.atualizarView();

      document.getElementById('btnCadastrar').onclick = this.cadastrarAlimento.bind(this);
      document.getElementById('btnAdicionar').onclick = this.adicionarRefeicao.bind(this);
      document.getElementById('dataSelecionada').onchange = this.atualizarView.bind(this);
    },

    getDataAtual() {
      return document.getElementById('dataSelecionada').value;
    },

    cadastrarAlimento() {
      const nome = document.getElementById('nome').value;
      const c = parseFloat(document.getElementById('carboidratos').value);
      const p = parseFloat(document.getElementById('proteinas').value);
      const g = parseFloat(document.getElementById('gorduras').value);
      const cal = parseFloat(document.getElementById('calorias').value);
      if (!nome || isNaN(c) || isNaN(p) || isNaN(g) || isNaN(cal)) return alert('Preencha corretamente.');

      Model.adicionarAlimento({ nome, carboidratos: c, proteinas: p, gorduras: g, calorias: cal });
      View.atualizarListaAlimentos(Model.getAlimentos());

      ['nome', 'carboidratos', 'proteinas', 'gorduras', 'calorias'].forEach(id => document.getElementById(id).value = '');
    },

    adicionarRefeicao() {
      const index = document.getElementById('listaAlimentos').value;
      const qtd = parseFloat(document.getElementById('quantidade').value);
      if (index === '' || isNaN(qtd) || qtd <= 0) return alert('Selecione alimento e quantidade.');

      const base = Model.getAlimentos()[index];
      const fator = qtd / 100;
      const item = {
        nome: base.nome,
        quantidade: qtd,
        carboidratos: base.carboidratos * fator,
        proteinas: base.proteinas * fator,
        gorduras: base.gorduras * fator,
        calorias: base.calorias * fator
      };
      Model.adicionarRefeicao(this.getDataAtual(), item);
      this.atualizarView();
      document.getElementById('quantidade').value = '';
    },

    removerItem(index) {
      Model.removerItem(this.getDataAtual(), index);
      this.atualizarView();
    },

    atualizarView() {
      View.atualizarListaAlimentos(Model.getAlimentos());
      View.atualizarTabelaRefeicao(Model.getRefeicao(this.getDataAtual()));
    }
  };

  window.onload = () => Controller.init();