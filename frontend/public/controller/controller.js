const Controller = {
  alimentoSelecionadoId: null,
  alimentoEdicaoSelecionadoId: null,
  registroEdicaoAtual: null,
  paginaAtual: "dashboard",
  datasPontuaisRelatorio: [],
  termoBuscaAlimento: "",
  termoBuscaEdicaoAlimento: "",
  limiteResultadosBusca: 8,
  atrasoBuscaMs: 120,
  indiceBuscaAlimentos: [],
  mapaBuscaPorNome: new Map(),
  mapaBuscaPorId: new Map(),
  assinaturaIndiceBusca: "",
  cacheBuscaTermo: new Map(),
  cacheBuscaCategoria: new Map(),
  timerBuscaRegistro: null,
  timerBuscaEdicao: null,
  usuarioAtual: null,
  eventosIniciados: false,

  init(dadosRemotos = null, usuario = null) {
    this.usuarioAtual = usuario;
    Model.init(dadosRemotos);
    View.atualizarSelectRefeicoes(Model.getTiposRefeicao());

    const inputData = document.getElementById("dataSelecionada");
    const campoBusca = document.getElementById("buscaAlimento");
    const quantidade = document.getElementById("quantidade");
    const campoBuscaEdicao = document.getElementById("editarBuscaAlimento");
    const quantidadeEdicao = document.getElementById("editarQuantidade");
    const relatorioDataBase = document.getElementById("relatorioDataBase");
    const relatorioDataPontual = document.getElementById("relatorioDataPontual");
    inputData.value = this.obterDataHojeLocal();
    relatorioDataBase.value = inputData.value;
    relatorioDataPontual.value = inputData.value;
    this.datasPontuaisRelatorio = [inputData.value];
    this.atualizarUsuarioLogado();

    if (!this.eventosIniciados) {
      this.registrarNavegacao();
      document.getElementById("btnCadastrar").addEventListener("click", () => {
        this.cadastrarAlimento();
      });
      document.getElementById("btnAdicionar").addEventListener("click", () => {
        this.adicionarRefeicao();
      });
      document.getElementById("btnFavoritar").addEventListener("click", () => {
        this.alternarFavorito();
      });
      document.getElementById("btnRepetirRefeicao").addEventListener("click", () => {
        this.repetirRefeicaoAnterior();
      });
      document.getElementById("btnSalvarMetas").addEventListener("click", () => {
        this.salvarMetasDiarias();
      });
      document.getElementById("btnCalcularTmb").addEventListener("click", () => {
        this.calcularTmb();
      });
      document.getElementById("btnUsarTmbMeta").addEventListener("click", () => {
        this.usarTmbComoMetaCalorica();
      });
      document.getElementById("relatorioPeriodo").addEventListener("change", () => {
        this.atualizarRelatorio();
      });
      relatorioDataBase.addEventListener("change", () => {
        this.atualizarRelatorio();
      });
      document.getElementById("btnAdicionarDataRelatorio").addEventListener("click", () => {
        this.adicionarDataPontualRelatorio();
      });
      document.getElementById("btnGerarRelatorio").addEventListener("click", () => {
        this.atualizarRelatorio();
      });
      document.getElementById("btnExportarRelatorioPdf").addEventListener("click", () => {
        this.exportarRelatorioPdf();
      });
      document.getElementById("btnSalvarEdicaoRegistro").addEventListener("click", () => {
        this.salvarEdicaoRegistro();
      });
      document.getElementById("btnCancelarEdicaoRegistro").addEventListener("click", () => {
        this.cancelarEdicaoRegistro();
      });
      document.getElementById("btnLogout").addEventListener("click", () => {
        this.sairUsuario();
      });
      inputData.addEventListener("change", () => {
        relatorioDataBase.value = inputData.value;
        relatorioDataPontual.value = inputData.value;
        this.cancelarEdicaoRegistro();
        this.atualizarView();
      });
      campoBusca.addEventListener("input", () => {
        this.sincronizarAlimentoSelecionado();
      });
      campoBusca.addEventListener("change", () => {
        this.sincronizarAlimentoSelecionado(false);
        this.atualizarBuscaAlimentos("registro");
      });
      campoBusca.addEventListener("focus", () => {
        this.atualizarBuscaAlimentos("registro");
      });
      campoBuscaEdicao.addEventListener("input", () => {
        this.sincronizarAlimentoEdicaoSelecionado();
      });
      campoBuscaEdicao.addEventListener("change", () => {
        this.sincronizarAlimentoEdicaoSelecionado(false);
        this.atualizarBuscaAlimentos("edicao");
      });
      campoBuscaEdicao.addEventListener("focus", () => {
        this.atualizarBuscaAlimentos("edicao");
      });
      if (typeof document.addEventListener === "function") {
        document.addEventListener("click", (event) => {
          if (
            typeof event.target.closest === "function"
            && !event.target.closest(".food-search-wrapper")
            && !event.target.closest(".food-category-shortcuts")
          ) {
            View.ocultarPaineisBuscaAlimentos();
          }
        });
      }
      quantidade.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          this.adicionarRefeicao();
        }
      });
      quantidadeEdicao.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          this.salvarEdicaoRegistro();
        }
      });
      this.eventosIniciados = true;
    }

    this.atualizarView();
    this.verificarApiBackend();
    this.navegarPara(this.obterPaginaInicial(), false);
  },

  async verificarApiBackend() {
    if (!window.Api || typeof window.Api.health !== "function") {
      return;
    }

    try {
      await window.Api.health();
      console.info("Backend Tracker conectado.");
    } catch (error) {
      console.warn("Backend Tracker indisponivel. O app seguira usando dados locais.", error);
    }
  },

  async bootstrap() {
    this.registrarEventosAutenticacao();
    this.mostrarAutenticacao("Verificando sessao...");

    if (window.TrackerFirebaseReady && typeof window.TrackerFirebaseReady.then === "function") {
      await window.TrackerFirebaseReady.catch((error) => {
        console.warn("Firebase nao foi inicializado.", error);
      });
    }

    if (!window.TrackerAuth || typeof window.TrackerAuth.onChange !== "function") {
      this.mostrarAutenticacao("Firebase Auth nao esta disponivel.");
      return;
    }

    window.TrackerAuth.onChange(async (usuario) => {
      if (!usuario) {
        this.usuarioAtual = null;
        this.mostrarAutenticacao("");
        return;
      }

      this.mostrarAutenticacao("Carregando seus dados...");

      try {
        const dadosRemotos = window.TrackerDataService
          ? await window.TrackerDataService.loadUserData(usuario.uid)
          : null;

        this.mostrarAplicacao(usuario);
        this.init(dadosRemotos, usuario);

        if (!dadosRemotos) {
          Model.salvar();
        }
      } catch (error) {
        console.warn("Nao foi possivel carregar os dados do usuario.", error);
        this.mostrarAutenticacao(error.message || "Nao foi possivel carregar seus dados.");
      }
    });
  },

  registrarEventosAutenticacao() {
    document.getElementById("btnLogin").addEventListener("click", () => {
      this.loginUsuario();
    });
    document.getElementById("btnRegister").addEventListener("click", () => {
      this.cadastrarUsuario();
    });
    document.getElementById("authPassword").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.loginUsuario();
      }
    });
  },

  getCredenciaisAutenticacao() {
    return {
      email: document.getElementById("authEmail").value.trim(),
      password: document.getElementById("authPassword").value
    };
  },

  async loginUsuario() {
    const { email, password } = this.getCredenciaisAutenticacao();

    if (!email || !password) {
      this.setAuthStatus("Informe e-mail e senha.");
      return;
    }

    try {
      this.setAuthStatus("Entrando...");
      await window.TrackerAuth.login(email, password);
    } catch (error) {
      this.setAuthStatus(this.formatarErroAutenticacao(error));
    }
  },

  async cadastrarUsuario() {
    const { email, password } = this.getCredenciaisAutenticacao();

    if (!email || password.length < 6) {
      this.setAuthStatus("Informe e-mail e senha com pelo menos 6 caracteres.");
      return;
    }

    try {
      this.setAuthStatus("Criando conta...");
      await window.TrackerAuth.register(email, password);
    } catch (error) {
      this.setAuthStatus(this.formatarErroAutenticacao(error));
    }
  },

  async sairUsuario() {
    try {
      await window.TrackerAuth.logout();
      window.location.hash = "";
    } catch (error) {
      console.warn("Nao foi possivel sair.", error);
    }
  },

  mostrarAutenticacao(mensagem) {
    document.getElementById("authGate").hidden = false;
    document.getElementById("appShell").hidden = true;
    this.setAuthStatus(mensagem);
  },

  mostrarAplicacao(usuario) {
    document.getElementById("authGate").hidden = true;
    document.getElementById("appShell").hidden = false;
    this.usuarioAtual = usuario;
    this.atualizarUsuarioLogado();
  },

  atualizarUsuarioLogado() {
    const elemento = document.getElementById("usuarioLogado");

    if (elemento) {
      elemento.textContent = this.usuarioAtual && this.usuarioAtual.email
        ? this.usuarioAtual.email
        : "Usuario";
    }
  },

  setAuthStatus(mensagem) {
    document.getElementById("authStatus").textContent = mensagem || "";
  },

  formatarErroAutenticacao(error) {
    const codigo = error && error.code ? error.code : "";
    const mensagens = {
      "auth/email-already-in-use": "Este e-mail ja esta cadastrado.",
      "auth/invalid-email": "E-mail invalido.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/user-not-found": "Usuario nao encontrado.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/weak-password": "Senha fraca. Use pelo menos 6 caracteres."
    };

    return mensagens[codigo] || "Nao foi possivel autenticar.";
  },

  registrarNavegacao() {
    document.querySelectorAll("[data-page-target]").forEach((botao) => {
      botao.addEventListener("click", () => {
        this.navegarPara(botao.dataset.pageTarget);
      });
    });
  },

  obterPaginaInicial() {
    const hash = window.location && window.location.hash
      ? window.location.hash.replace("#", "")
      : "";
    const paginasValidas = ["dashboard", "refeicoes", "alimentos", "metas", "relatorios", "calculadora"];
    return paginasValidas.includes(hash) ? hash : "dashboard";
  },

  navegarPara(pagina, atualizarHash = true) {
    const paginasValidas = ["dashboard", "refeicoes", "alimentos", "metas", "relatorios", "calculadora"];

    if (!paginasValidas.includes(pagina)) {
      return;
    }

    this.paginaAtual = pagina;
    View.mostrarPagina(pagina);

    if (atualizarHash && window.location) {
      window.location.hash = pagina;
    }
  },

  obterDataHojeLocal() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },

  obterDataAnterior(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);
    dataLocal.setDate(dataLocal.getDate() - 1);

    const anoAnterior = dataLocal.getFullYear();
    const mesAnterior = String(dataLocal.getMonth() + 1).padStart(2, "0");
    const diaAnterior = String(dataLocal.getDate()).padStart(2, "0");
    return `${anoAnterior}-${mesAnterior}-${diaAnterior}`;
  },

  formatarDataLocal(dataLocal) {
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, "0");
    const dia = String(dataLocal.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },

  obterIntervaloDatas(dataFinal, quantidadeDias) {
    const dataBase = Model.isDataValida(dataFinal) ? dataFinal : this.obterDataHojeLocal();
    const [ano, mes, dia] = dataBase.split("-").map(Number);
    const fim = new Date(ano, mes - 1, dia);
    const datas = [];

    for (let offset = quantidadeDias - 1; offset >= 0; offset -= 1) {
      const data = new Date(fim);
      data.setDate(fim.getDate() - offset);
      datas.push(this.formatarDataLocal(data));
    }

    return datas;
  },

  getDataAtual() {
    return document.getElementById("dataSelecionada").value || this.obterDataHojeLocal();
  },

  getPeriodoRelatorio() {
    return document.getElementById("relatorioPeriodo").value || "1";
  },

  getDataRelatorioBase() {
    return document.getElementById("relatorioDataBase").value || this.getDataAtual();
  },

  getDatasRelatorioSelecionadas() {
    const periodo = this.getPeriodoRelatorio();

    if (periodo === "custom") {
      return Model.normalizarDatasRelatorio(this.datasPontuaisRelatorio);
    }

    return this.obterIntervaloDatas(this.getDataRelatorioBase(), Number.parseInt(periodo, 10) || 1);
  },

  getRefeicaoSelecionada() {
    return document.getElementById("tipoRefeicao").value || Model.refeicaoPadrao;
  },

  getMetasDigitadas() {
    const lerMeta = (id) => {
      const valor = document.getElementById(id).value.trim();
      return valor ? Number.parseFloat(valor) : 0;
    };

    return {
      carboidratos: lerMeta("metaCarboidratos"),
      proteinas: lerMeta("metaProteinas"),
      gorduras: lerMeta("metaGorduras"),
      calorias: lerMeta("metaCalorias")
    };
  },

  getTmbDigitada() {
    const lerValor = (id) => {
      const valor = document.getElementById(id).value.trim();
      return valor ? Number.parseFloat(valor) : 0;
    };

    return {
      sexo: document.getElementById("tmbSexo").value,
      peso: lerValor("tmbPeso"),
      altura: lerValor("tmbAltura"),
      idade: lerValor("tmbIdade")
    };
  },

  formatarDataExibicao(data) {
    if (!data) {
      return "Sem data definida";
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);

    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(dataLocal);
  },

  cadastrarAlimento() {
    const nome = document.getElementById("nome").value.trim();
    const carboidratos = Number.parseFloat(document.getElementById("carboidratos").value);
    const proteinas = Number.parseFloat(document.getElementById("proteinas").value);
    const gorduras = Number.parseFloat(document.getElementById("gorduras").value);
    const calorias = Number.parseFloat(document.getElementById("calorias").value);
    const valores = [carboidratos, proteinas, gorduras, calorias];

    if (!nome || valores.some(Number.isNaN) || valores.some((valor) => valor < 0)) {
      alert("Preencha corretamente o alimento e informe valores num\u00e9ricos v\u00e1lidos.");
      return;
    }

    if (this.getAlimentoPorNomeIndexado(nome)) {
      alert("J\u00e1 existe um alimento cadastrado com esse nome.");
      return;
    }

    const alimento = Model.adicionarAlimento({
      nome,
      carboidratos,
      proteinas,
      gorduras,
      calorias,
      personalizado: true
    });

    this.limparCamposCadastro();
    this.atualizarView();

    if (this.paginaAtual === "dashboard") {
      this.selecionarAlimento(alimento.id);
    }
  },

  limparCamposCadastro() {
    ["nome", "carboidratos", "proteinas", "gorduras", "calorias"].forEach((id) => {
      document.getElementById(id).value = "";
    });
  },

  selecionarAlimento(alimentoId) {
    const alimento = this.getAlimentoPorIdIndexado(alimentoId);

    if (!alimento) {
      return;
    }

    if (this.paginaAtual !== "dashboard") {
      this.navegarPara("dashboard");
    }

    this.alimentoSelecionadoId = alimento.id;
    document.getElementById("buscaAlimento").value = alimento.nome;
    this.termoBuscaAlimento = alimento.nome;
    View.atualizarEstadoAlimentoSelecionado(alimento, Model.isFavorito(alimento.id));
    this.cancelarAtualizacaoBuscaAlimentos("registro");
    View.ocultarPaineisBuscaAlimentos();
    document.getElementById("quantidade").focus();
  },

  selecionarAlimentoBusca(alimentoId, contexto = "registro") {
    const alimento = this.getAlimentoPorIdIndexado(alimentoId);

    if (!alimento) {
      return;
    }

    if (contexto === "edicao") {
      this.alimentoEdicaoSelecionadoId = alimento.id;
      this.termoBuscaEdicaoAlimento = alimento.nome;
      document.getElementById("editarBuscaAlimento").value = alimento.nome;
      View.atualizarEstadoEdicaoRegistro(alimento);
      this.cancelarAtualizacaoBuscaAlimentos("edicao");
      View.ocultarPaineisBuscaAlimentos();
      document.getElementById("editarQuantidade").focus();
      return;
    }

    this.selecionarAlimento(alimento.id);
  },

  sincronizarAlimentoSelecionado(atualizarPainel = true) {
    const nomeDigitado = document.getElementById("buscaAlimento").value;
    const alimento = this.getAlimentoPorNomeIndexado(nomeDigitado);
    this.termoBuscaAlimento = nomeDigitado;
    this.alimentoSelecionadoId = alimento ? alimento.id : null;
    View.atualizarEstadoAlimentoSelecionado(alimento, alimento ? Model.isFavorito(alimento.id) : false);

    if (atualizarPainel) {
      this.agendarAtualizacaoBuscaAlimentos("registro");
    }
  },

  getAlimentoSelecionado() {
    if (this.alimentoSelecionadoId) {
      const alimentoPorId = this.getAlimentoPorIdIndexado(this.alimentoSelecionadoId);

      if (alimentoPorId) {
        return alimentoPorId;
      }
    }

    return this.getAlimentoPorNomeIndexado(document.getElementById("buscaAlimento").value);
  },

  sincronizarAlimentoEdicaoSelecionado(atualizarPainel = true) {
    const nomeDigitado = document.getElementById("editarBuscaAlimento").value;
    const alimento = this.getAlimentoPorNomeIndexado(nomeDigitado);
    this.termoBuscaEdicaoAlimento = nomeDigitado;
    this.alimentoEdicaoSelecionadoId = alimento ? alimento.id : null;
    View.atualizarEstadoEdicaoRegistro(alimento);

    if (atualizarPainel) {
      this.agendarAtualizacaoBuscaAlimentos("edicao");
    }
  },

  prepararIndiceBuscaAlimentos(alimentos = Model.getAlimentos()) {
    const assinatura = alimentos
      .map((alimento) => `${alimento.id}:${alimento.nome}:${alimento.carboidratos}:${alimento.proteinas}:${alimento.gorduras}:${alimento.calorias}`)
      .join("|");

    if (assinatura === this.assinaturaIndiceBusca) {
      return;
    }

    this.assinaturaIndiceBusca = assinatura;
    this.cacheBuscaTermo.clear();
    this.cacheBuscaCategoria.clear();
    this.mapaBuscaPorNome = new Map();
    this.mapaBuscaPorId = new Map();
    this.indiceBuscaAlimentos = alimentos.map((alimento) => {
      const nomeNormalizado = Model.normalizarTexto(alimento.nome);
      const item = {
        alimento,
        nomeNormalizado
      };

      this.mapaBuscaPorId.set(alimento.id, alimento);

      if (!this.mapaBuscaPorNome.has(nomeNormalizado)) {
        this.mapaBuscaPorNome.set(nomeNormalizado, alimento);
      }

      return item;
    });
  },

  getAlimentoPorNomeIndexado(nome) {
    this.prepararIndiceBuscaAlimentos();
    return this.mapaBuscaPorNome.get(Model.normalizarTexto(nome)) || null;
  },

  getAlimentoPorIdIndexado(alimentoId) {
    this.prepararIndiceBuscaAlimentos();
    return this.mapaBuscaPorId.get(alimentoId) || null;
  },

  getCategoriasBuscaAlimentos() {
    return [
      { id: "carboidratos", label: "Ricos em carboidratos" },
      { id: "proteinas", label: "Ricos em proteinas" },
      { id: "gorduras", label: "Ricos em gorduras" },
      { id: "baixasCalorias", label: "Baixas calorias" }
    ];
  },

  atualizarBuscaAlimentos(contexto = "registro", categoriaId = null) {
    this.prepararIndiceBuscaAlimentos();
    const termo = contexto === "edicao"
      ? document.getElementById("editarBuscaAlimento").value
      : document.getElementById("buscaAlimento").value;
    const resultados = categoriaId
      ? this.buscarAlimentosPorCategoria(categoriaId)
      : this.buscarAlimentosPorTermo(termo);
    const recentes = Model.getHistoricoAlimentos()
      .filter((alimento) => !resultados.some((resultado) => resultado.id === alimento.id))
      .slice(0, 5);
    const categoria = this.getCategoriasBuscaAlimentos().find((item) => item.id === categoriaId);
    const termoVazio = !termo.trim();
    const tituloResultados = categoria
      ? categoria.label
      : termoVazio
        ? "Recentes"
        : "Resultados";
    const mensagemResultados = categoria
      ? "Nenhum alimento nessa categoria."
      : termoVazio
        ? "Digite para buscar ou use os atalhos."
        : "Nenhum alimento encontrado.";
    const secoes = [
      {
        titulo: tituloResultados,
        alimentos: resultados,
        mensagemVazia: mensagemResultados
      },
      {
        titulo: "Recentes",
        alimentos: recentes,
        mensagemVazia: termoVazio || categoriaId ? "" : "Nenhum alimento recente."
      }
    ];

    View.renderizarPainelBuscaAlimentos(contexto, secoes);
  },

  agendarAtualizacaoBuscaAlimentos(contexto = "registro") {
    const chaveTimer = contexto === "edicao" ? "timerBuscaEdicao" : "timerBuscaRegistro";

    if (this[chaveTimer]) {
      window.clearTimeout(this[chaveTimer]);
    }

    this[chaveTimer] = window.setTimeout(() => {
      this[chaveTimer] = null;
      this.atualizarBuscaAlimentos(contexto);
    }, this.atrasoBuscaMs);
  },

  cancelarAtualizacaoBuscaAlimentos(contexto = null) {
    const chavesTimer = contexto === "edicao"
      ? ["timerBuscaEdicao"]
      : contexto === "registro"
        ? ["timerBuscaRegistro"]
        : ["timerBuscaRegistro", "timerBuscaEdicao"];

    chavesTimer.forEach((chaveTimer) => {
      if (this[chaveTimer]) {
        window.clearTimeout(this[chaveTimer]);
        this[chaveTimer] = null;
      }
    });
  },

  aplicarCategoriaBusca(categoriaId, contexto = "registro") {
    this.atualizarBuscaAlimentos(contexto, categoriaId);
  },

  buscarAlimentosPorTermo(termo) {
    this.prepararIndiceBuscaAlimentos();
    const termoNormalizado = Model.normalizarTexto(termo || "");

    let resultados;

    if (!termoNormalizado) {
      return Model.getHistoricoAlimentos().slice(0, this.limiteResultadosBusca);
    }

    if (this.cacheBuscaTermo.has(termoNormalizado)) {
      return this.cacheBuscaTermo.get(termoNormalizado);
    }

    resultados = this.indiceBuscaAlimentos
      .filter((item) => item.nomeNormalizado.includes(termoNormalizado))
      .sort((a, b) => {
        const aInicio = a.nomeNormalizado.startsWith(termoNormalizado) ? 0 : 1;
        const bInicio = b.nomeNormalizado.startsWith(termoNormalizado) ? 0 : 1;

        if (aInicio !== bInicio) {
          return aInicio - bInicio;
        }

        return a.alimento.nome.localeCompare(b.alimento.nome, "pt-BR");
      })
      .slice(0, this.limiteResultadosBusca)
      .map((item) => item.alimento);

    this.cacheBuscaTermo.set(termoNormalizado, resultados);
    return resultados;
  },

  buscarAlimentosPorCategoria(categoriaId) {
    this.prepararIndiceBuscaAlimentos();

    if (this.cacheBuscaCategoria.has(categoriaId)) {
      return this.cacheBuscaCategoria.get(categoriaId);
    }

    const filtros = {
      carboidratos: (alimento) => alimento.carboidratos > 0,
      proteinas: (alimento) => alimento.proteinas > 0,
      gorduras: (alimento) => alimento.gorduras > 0,
      baixasCalorias: (alimento) => alimento.calorias > 0
    };
    const ordenadores = {
      carboidratos: (a, b) => b.carboidratos - a.carboidratos,
      proteinas: (a, b) => b.proteinas - a.proteinas,
      gorduras: (a, b) => b.gorduras - a.gorduras,
      baixasCalorias: (a, b) => a.calorias - b.calorias
    };

    const resultados = this.indiceBuscaAlimentos
      .map((item) => item.alimento)
      .filter(filtros[categoriaId] || (() => true))
      .sort(ordenadores[categoriaId] || ((a, b) => a.nome.localeCompare(b.nome, "pt-BR")))
      .slice(0, this.limiteResultadosBusca);

    this.cacheBuscaCategoria.set(categoriaId, resultados);
    return resultados;
  },

  getAlimentoEdicaoSelecionado() {
    if (this.alimentoEdicaoSelecionadoId) {
      const alimentoPorId = this.getAlimentoPorIdIndexado(this.alimentoEdicaoSelecionadoId);

      if (alimentoPorId) {
        return alimentoPorId;
      }
    }

    return this.getAlimentoPorNomeIndexado(document.getElementById("editarBuscaAlimento").value);
  },

  adicionarRefeicao() {
    const quantidade = Number.parseFloat(document.getElementById("quantidade").value);
    const alimentoBase = this.getAlimentoSelecionado();

    if (!alimentoBase || Number.isNaN(quantidade) || quantidade <= 0) {
      alert("Selecione um alimento cadastrado e informe uma quantidade maior que zero.");
      return;
    }

    Model.adicionarRefeicao(this.getDataAtual(), this.getRefeicaoSelecionada(), this.criarItemRefeicao(alimentoBase, quantidade));
    Model.registrarHistoricoAlimento(alimentoBase.id);

    document.getElementById("quantidade").value = "";
    document.getElementById("buscaAlimento").value = "";
    this.alimentoSelecionadoId = null;
    this.atualizarView();
    this.cancelarAtualizacaoBuscaAlimentos("registro");
    View.ocultarPaineisBuscaAlimentos();
  },

  criarItemRefeicao(alimentoBase, quantidade) {
    const fator = quantidade / 100;

    return {
      id: Model.criarId("entry"),
      alimentoId: alimentoBase.id,
      nome: alimentoBase.nome,
      quantidade,
      carboidratos: alimentoBase.carboidratos * fator,
      proteinas: alimentoBase.proteinas * fator,
      gorduras: alimentoBase.gorduras * fator,
      calorias: alimentoBase.calorias * fator
    };
  },

  alternarFavorito() {
    const alimento = this.getAlimentoSelecionado();

    if (!alimento) {
      return;
    }

    Model.alternarFavorito(alimento.id);
    this.atualizarView();
  },

  iniciarEdicaoRegistro(refeicaoId, index) {
    const dataAtual = this.getDataAtual();
    const item = Model.getItemRefeicao(dataAtual, refeicaoId, index);

    if (!item) {
      alert("Registro nao encontrado para edicao.");
      return;
    }

    const alimento = item.alimentoId
      ? this.getAlimentoPorIdIndexado(item.alimentoId)
      : this.getAlimentoPorNomeIndexado(item.nome);

    this.registroEdicaoAtual = {
      data: dataAtual,
      refeicaoId,
      index
    };
    this.alimentoEdicaoSelecionadoId = alimento ? alimento.id : null;

    if (this.paginaAtual !== "refeicoes") {
      this.navegarPara("refeicoes");
    }

    View.mostrarFormularioEdicaoRegistro(item, refeicaoId, Model.getTiposRefeicao(), alimento);

    const painel = document.getElementById("painelEdicaoRegistro");
    if (painel && typeof painel.scrollIntoView === "function") {
      painel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.getElementById("editarBuscaAlimento").focus();
  },

  cancelarEdicaoRegistro() {
    this.registroEdicaoAtual = null;
    this.alimentoEdicaoSelecionadoId = null;
    View.ocultarFormularioEdicaoRegistro();
  },

  salvarEdicaoRegistro() {
    if (!this.registroEdicaoAtual) {
      return;
    }

    const quantidade = Number.parseFloat(document.getElementById("editarQuantidade").value);
    const alimentoBase = this.getAlimentoEdicaoSelecionado();
    const refeicaoDestinoId = document.getElementById("editarTipoRefeicao").value || this.registroEdicaoAtual.refeicaoId;

    if (!alimentoBase || Number.isNaN(quantidade) || quantidade <= 0) {
      alert("Selecione um alimento cadastrado e informe uma quantidade maior que zero.");
      return;
    }

    const itemAtualizado = this.criarItemRefeicao(alimentoBase, quantidade);
    const itemAtual = Model.getItemRefeicao(
      this.registroEdicaoAtual.data,
      this.registroEdicaoAtual.refeicaoId,
      this.registroEdicaoAtual.index
    );

    if (itemAtual && itemAtual.id) {
      itemAtualizado.id = itemAtual.id;
    }

    const sucesso = Model.atualizarItemRefeicao(
      this.registroEdicaoAtual.data,
      this.registroEdicaoAtual.refeicaoId,
      this.registroEdicaoAtual.index,
      refeicaoDestinoId,
      itemAtualizado
    );

    if (!sucesso) {
      alert("Nao foi possivel atualizar esse registro.");
      this.cancelarEdicaoRegistro();
      this.atualizarView();
      return;
    }

    Model.registrarHistoricoAlimento(alimentoBase.id);
    this.cancelarEdicaoRegistro();
    this.atualizarView();
  },

  salvarMetasDiarias() {
    const metas = this.getMetasDigitadas();
    const valores = Object.values(metas);

    if (valores.some((valor) => Number.isNaN(valor) || valor < 0)) {
      alert("Informe metas maiores ou iguais a zero.");
      return;
    }

    Model.atualizarMetasDiarias(metas);
    this.atualizarView();
  },

  calcularTmb() {
    const perfil = this.getTmbDigitada();

    if (!perfil.sexo || perfil.peso <= 0 || perfil.altura <= 0 || perfil.idade <= 0) {
      alert("Informe sexo, peso, altura e idade para calcular a TMB.");
      return;
    }

    if ([perfil.peso, perfil.altura, perfil.idade].some(Number.isNaN)) {
      alert("Informe valores numericos validos para peso, altura e idade.");
      return;
    }

    Model.atualizarTmbPerfil(perfil);
    this.atualizarView();
  },

  usarTmbComoMetaCalorica() {
    const perfil = Model.getTmbPerfil();

    if (perfil.resultado <= 0) {
      alert("Calcule a TMB antes de aplicar como meta.");
      return;
    }

    Model.atualizarMetasDiarias({
      ...Model.getMetasDiarias(),
      calorias: perfil.resultado
    });
    this.atualizarView();
  },

  adicionarDataPontualRelatorio() {
    const input = document.getElementById("relatorioDataPontual");
    const data = input.value;

    if (!Model.isDataValida(data)) {
      alert("Selecione uma data v\u00e1lida para o relat\u00f3rio.");
      return;
    }

    this.datasPontuaisRelatorio = Model.normalizarDatasRelatorio([
      ...this.datasPontuaisRelatorio,
      data
    ]);
    document.getElementById("relatorioPeriodo").value = "custom";
    this.atualizarRelatorio();
  },

  removerDataPontualRelatorio(data) {
    this.datasPontuaisRelatorio = this.datasPontuaisRelatorio.filter((dataRelatorio) => dataRelatorio !== data);
    this.atualizarRelatorio();
  },

  gerarRelatorioAtual() {
    return Model.gerarRelatorio(this.getDatasRelatorioSelecionadas());
  },

  atualizarRelatorio() {
    const periodo = this.getPeriodoRelatorio();
    const relatorio = this.gerarRelatorioAtual();
    View.atualizarRelatorioControles(periodo, this.datasPontuaisRelatorio);
    View.renderizarRelatorio(relatorio);
  },

  exportarRelatorioPdf() {
    const relatorio = this.gerarRelatorioAtual();

    if (!relatorio.totalDias) {
      alert("Selecione ao menos um dia para exportar o relat\u00f3rio.");
      return;
    }

    View.renderizarRelatorio(relatorio);
    this.navegarPara("relatorios");
    window.print();
  },

  repetirRefeicaoAnterior() {
    const dataAtual = this.getDataAtual();
    const dataAnterior = this.obterDataAnterior(dataAtual);
    const quantidadeItensAnterior = Model.getQuantidadeItensDia(dataAnterior);

    if (!quantidadeItensAnterior) {
      alert("N\u00e3o h\u00e1 refei\u00e7\u00e3o anterior para repetir.");
      return;
    }

    const quantidadeItensAtual = Model.getQuantidadeItensDia(dataAtual);
    const deveContinuar = !quantidadeItensAtual || confirm(
      "O dia atual j\u00e1 possui itens. Deseja adicionar as refei\u00e7\u00f5es do dia anterior mesmo assim?"
    );

    if (!deveContinuar) {
      return;
    }

    Model.repetirRefeicao(dataAnterior, dataAtual);
    this.atualizarView();
  },

  moverItem(refeicaoOrigemId, index, refeicaoDestinoId) {
    Model.moverItem(this.getDataAtual(), refeicaoOrigemId, index, refeicaoDestinoId);
    this.atualizarView();
  },

  removerItem(refeicaoId, index) {
    Model.removerItem(this.getDataAtual(), refeicaoId, index);
    this.atualizarView();
  },

  atualizarView() {
    const dataAtual = this.getDataAtual();
    const dataAnterior = this.obterDataAnterior(dataAtual);
    const alimentos = Model.getAlimentos();
    document.getElementById("dataSelecionada").value = dataAtual;

    this.prepararIndiceBuscaAlimentos(alimentos);
    View.atualizarCabecalhos(this.formatarDataExibicao(dataAtual));
    View.atualizarAutocompleteAlimentos(alimentos);
    View.renderizarAtalhosBuscaAlimentos(this.getCategoriasBuscaAlimentos());
    View.atualizarAtalhosAlimentos(Model.getFavoritos(), Model.getHistoricoAlimentos());
    View.atualizarAlimentosPersonalizados(Model.getAlimentosPersonalizados(), Model.getAlimentosTaco().length);
    View.atualizarBotaoRepetir(Model.getQuantidadeItensDia(dataAnterior));
    View.atualizarCalculadoraTmb(Model.getTmbPerfil());
    View.atualizarMetasDiarias(Model.getMetasDiarias());
    View.atualizarResumoPorRefeicao(Model.getRefeicoesDoDia(dataAtual), Model.getTiposRefeicao());
    const totaisDoDia = View.atualizarTabelaRefeicao(Model.getRefeicoesDoDia(dataAtual), Model.getTiposRefeicao());
    View.atualizarDashboard(totaisDoDia, Model.getMetasDiarias());
    View.atualizarProgressoMetas(totaisDoDia, Model.getMetasDiarias());
    this.atualizarRelatorio();
    this.sincronizarAlimentoSelecionado(false);
    this.cancelarAtualizacaoBuscaAlimentos();
    View.ocultarPaineisBuscaAlimentos();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  Controller.bootstrap();
});
