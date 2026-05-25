# Tracker de Macronutrientes

Aplicacao web estatica para cadastro de alimentos e montagem de refeicoes diarias com acompanhamento de carboidratos, proteinas, gorduras e calorias.

## Visao geral

O projeto foi estruturado com uma abordagem simples em MVC, mantendo responsabilidades separadas entre interface, controle de eventos e dados locais. A proposta e oferecer um fluxo direto para registrar alimentos, adicionar quantidades consumidas e visualizar os totais nutricionais por data.

## Funcionalidades

- Cadastro de alimentos personalizados com macros e calorias por 100g.
- Autocomplete para buscar alimentos ao digitar.
- Favoritos para alimentos usados com frequencia.
- Historico de alimentos adicionados recentemente.
- Registro separado por refeicao: cafe da manha, almoco, jantar e lanches.
- Totais por refeicao e totais consolidados do dia.
- Metas diarias de carboidratos, proteinas, gorduras e calorias.
- Barras de progresso visual para comparar consumo e meta.
- Dashboard do dia com calorias consumidas, calorias restantes e status da meta.
- Distribuicao percentual entre carboidratos, proteinas e gorduras.
- Grafico comparativo de meta x consumido para macros e calorias.
- Movimentacao de alimentos entre refeicoes.
- Botao para repetir as refeicoes do dia anterior.
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
- As refeicoes agrupadas por data e tipo de refeicao.
- As metas diarias de macronutrientes e calorias.
- Favoritos e historico de alimentos.
- As operacoes de adicao, consulta, repeticao, movimentacao e remocao dos dados.
- A sincronizacao dos dados com `localStorage`.

### View

Arquivo: `view/view.js`

Responsavel por:

- Atualizar o autocomplete de alimentos disponiveis.
- Renderizar favoritos, historico e alimentos personalizados.
- Renderizar os totais por refeicao.
- Renderizar as barras de progresso das metas diarias.
- Renderizar a dashboard do dia, distribuicao percentual e grafico de meta x consumido.
- Renderizar a tabela das refeicoes diarias.
- Exibir os totais nutricionais da interface.
- Refletir estados de vazio e feedback visual da pagina.

### Controller

Arquivo: `controller/controller.js`

Responsavel por:

- Inicializar a aplicacao.
- Capturar eventos da interface.
- Validar os dados informados pelo usuario.
- Calcular os valores proporcionais da refeicao.
- Salvar e aplicar as metas diarias.
- Orquestrar busca, selecao, favoritos, historico, movimentacao e repeticao entre `Model` e `View`.

## Como executar

Como se trata de um projeto estatico, basta abrir o arquivo `index.html` em um navegador moderno.

## Fluxo de uso

1. Selecione a data desejada.
2. Cadastre um alimento informando os nutrientes por 100g.
3. Busque um alimento pelo autocomplete, favoritos ou historico.
4. Escolha a refeicao: cafe da manha, almoco, jantar ou lanches.
5. Informe a quantidade consumida em gramas.
6. Adicione o item a refeicao e acompanhe os totais por refeicao e do dia.
7. Configure as metas diarias para comparar consumo e objetivo.
8. Acompanhe a dashboard para ver distribuicao percentual e meta x consumido.
9. Use o controle de mover na tabela para reorganizar itens entre refeicoes.
10. Use o botao de repeticao para copiar as refeicoes do dia anterior quando fizer sentido.

## Melhorias aplicadas nesta versao

- Autocomplete de alimentos no fluxo de registro.
- Cadastro persistente de alimentos personalizados.
- Favoritos e historico de alimentos recentes.
- Registro separado por refeicoes.
- Totais por refeicao.
- Metas diarias de calorias e macronutrientes.
- Barras de progresso visual para cada macro e calorias.
- Dashboard organizada com resumo calorico, distribuicao percentual dos macros e grafico de meta x consumido.
- Movimentacao de itens entre refeicoes.
- Repeticao das refeicoes anteriores.
- Persistencia local de alimentos, refeicoes, metas, favoritos e historico.
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
- Criar receitas com porcoes.
- Criar relatorios semanais de aderencia as metas.
