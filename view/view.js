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
