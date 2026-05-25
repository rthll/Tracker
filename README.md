# Tracker de Macronutrientes

Aplicacao web estatica para cadastro de alimentos e montagem de refeicoes diarias com acompanhamento de carboidratos, proteinas, gorduras e calorias.

## Visao geral

O projeto foi estruturado com uma abordagem simples em MVC, mantendo responsabilidades separadas entre interface, controle de eventos e dados locais. A proposta e oferecer um fluxo direto para registrar alimentos, adicionar quantidades consumidas e visualizar os totais nutricionais por data.

## Funcionalidades

- Cadastro de alimentos personalizados com macros e calorias por 100g.
- Autocomplete para buscar alimentos ao digitar.
- Favoritos para alimentos usados com frequencia.
- Historico de alimentos adicionados recentemente.
- Botao para repetir a refeicao do dia anterior.
- Persistencia local com `localStorage`.
- Selecao de uma data para organizar as refeicoes do dia.
- Calculo proporcional dos nutrientes conforme a quantidade informada.
- Tabela consolidada com totais de carboidratos, proteinas, gorduras e calorias.
- Remocao de itens da refeicao atual.
- Interface responsiva com foco em legibilidade e uso rapido.

## Estrutura do projeto

```text
Tracker/
|-- controller/
|   `-- controller.js
|-- css/
|   `-- index.css
|-- model/
|   `-- model.js
|-- view/
|   `-- view.js
|-- index.html
`-- README.md
```

## Arquitetura MVC

### Model

Arquivo: `model/model.js`

Responsavel por armazenar:

- A lista de alimentos cadastrados.
- As refeicoes agrupadas por data.
- Favoritos e historico de alimentos.
- As operacoes de adicao, consulta, repeticao e remocao dos dados.
- A sincronizacao dos dados com `localStorage`.

### View

Arquivo: `view/view.js`

Responsavel por:

- Atualizar o autocomplete de alimentos disponiveis.
- Renderizar favoritos, historico e alimentos personalizados.
- Renderizar a tabela da refeicao diaria.
- Exibir os totais nutricionais da interface.
- Refletir estados de vazio e feedback visual da pagina.

### Controller

Arquivo: `controller/controller.js`

Responsavel por:

- Inicializar a aplicacao.
- Capturar eventos da interface.
- Validar os dados informados pelo usuario.
- Calcular os valores proporcionais da refeicao.
- Orquestrar busca, selecao, favoritos, historico e repeticao entre `Model` e `View`.

## Como executar

Como se trata de um projeto estatico, basta abrir o arquivo `index.html` em um navegador moderno.

## Fluxo de uso

1. Selecione a data desejada.
2. Cadastre um alimento informando os nutrientes por 100g.
3. Busque um alimento pelo autocomplete, favoritos ou historico.
4. Informe a quantidade consumida em gramas.
5. Adicione o item a refeicao e acompanhe os totais do dia.
6. Use o botao de repeticao para copiar a refeicao do dia anterior quando fizer sentido.

## Melhorias aplicadas nesta versao

- Autocomplete de alimentos no fluxo de registro.
- Cadastro persistente de alimentos personalizados.
- Favoritos e historico de alimentos recentes.
- Repeticao da refeicao anterior.
- Persistencia local de alimentos, refeicoes, favoritos e historico.
- Atualizacao visual da pagina com layout mais moderno e responsivo.
- Correcao da inicializacao da data para respeitar o horario local.
- Ajuste da organizacao do MVC, removendo duplicacao indevida da camada de visualizacao.
- Correcao de problemas estruturais no HTML.
- Renderizacao mais segura da tabela, evitando insercao direta de HTML com dados do usuario.
- Estados vazios e desabilitacao de acoes quando nao ha alimentos cadastrados.

## Limitacoes atuais

- Os dados ficam salvos no navegador atual via `localStorage`.
- Nao ha integracao com backend, autenticacao ou sincronizacao entre dispositivos.

## Proximos passos sugeridos

- Adicionar edicao de alimentos ja cadastrados.
- Incluir metas diarias de macronutrientes para comparacao visual.
- Criar receitas com porcoes.
