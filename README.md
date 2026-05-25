# Tracker de Macronutrientes

Aplicacao web estatica para cadastro de alimentos e montagem de refeicoes diarias com acompanhamento de carboidratos, proteinas, gorduras e calorias.

## Visao geral

O projeto foi estruturado com uma abordagem simples em MVC, mantendo responsabilidades separadas entre interface, controle de eventos e dados locais. A proposta e oferecer um fluxo direto para registrar alimentos, adicionar quantidades consumidas e visualizar os totais nutricionais por data.

A interface usa navegacao interna por paginas para separar o fluxo diario das configuracoes: Dashboard, Refeicoes, Alimentos, Metas e Calculadora.

## Funcionalidades

- Cadastro de alimentos personalizados com macros e calorias por 100g.
- Base TACO importada com alimentos padrao por 100g.
- Navegacao por paginas internas para separar as principais funcoes.
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
- Calculadora de taxa metabolica basal pela equacao de Mifflin-St Jeor.
- Aplicacao da TMB estimada como meta diaria de calorias.
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
|-- data/
|   |-- Taco-4a-Edicao(CMVCol taco3).csv
|   `-- taco-alimentos.js
|-- model/
|   `-- model.js
|-- scripts/
|   `-- converter-taco.js
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
- A base TACO carregada de `data/taco-alimentos.js`.
- As refeicoes agrupadas por data e tipo de refeicao.
- As metas diarias de macronutrientes e calorias.
- O ultimo perfil usado na calculadora de taxa metabolica basal.
- Favoritos e historico de alimentos.
- As operacoes de adicao, consulta, repeticao, movimentacao e remocao dos dados.
- A sincronizacao dos dados com `localStorage`.

### View

Arquivo: `view/view.js`

Responsavel por:

- Atualizar o autocomplete de alimentos disponiveis.
- Alternar as paginas internas da aplicacao.
- Renderizar favoritos, historico e alimentos personalizados.
- Renderizar os totais por refeicao.
- Renderizar as barras de progresso das metas diarias.
- Renderizar a dashboard do dia, distribuicao percentual e grafico de meta x consumido.
- Renderizar a calculadora de taxa metabolica basal.
- Renderizar a tabela das refeicoes diarias.
- Exibir os totais nutricionais da interface.
- Refletir estados de vazio e feedback visual da pagina.

### Controller

Arquivo: `controller/controller.js`

Responsavel por:

- Inicializar a aplicacao.
- Capturar eventos da interface.
- Controlar a navegacao entre Dashboard, Refeicoes, Alimentos, Metas e Calculadora.
- Validar os dados informados pelo usuario.
- Calcular os valores proporcionais da refeicao.
- Salvar e aplicar as metas diarias.
- Calcular TMB e aplicar o resultado como meta calorica quando solicitado.
- Orquestrar busca, selecao, favoritos, historico, movimentacao e repeticao entre `Model` e `View`.

## Base TACO

O arquivo original da TACO fica em `data/Taco-4a-Edicao(CMVCol taco3).csv`.

Para manter o app funcionando ao abrir diretamente o `index.html`, o CSV e convertido para um arquivo JavaScript estatico:

```bash
node scripts/converter-taco.js
```

Esse comando gera `data/taco-alimentos.js` com `window.TACO_ALIMENTOS`.

Regras de IDs:

- Alimentos da TACO usam `taco:<numero>`, exemplo: `taco:1`.
- Alimentos personalizados usam `custom:<uuid>`.
- Alimentos personalizados antigos sao migrados automaticamente para o prefixo `custom:`.

Os valores da TACO sao por 100g. Valores `Tr` e `NA` sao tratados como `0` na conversao.

## Como executar

Como se trata de um projeto estatico, basta abrir o arquivo `index.html` em um navegador moderno.

## Fluxo de uso

1. Use o Dashboard para registrar rapidamente alimentos nas refeicoes do dia.
2. Acompanhe no Dashboard calorias, distribuicao percentual e meta x consumido.
3. Use Refeicoes para revisar, mover ou remover itens.
4. Use Alimentos para cadastrar alimentos personalizados.
5. Use Metas para ajustar calorias e macronutrientes.
6. Use Calculadora para estimar a TMB e aplicar como meta calorica.

## Melhorias aplicadas nesta versao

- Autocomplete de alimentos no fluxo de registro.
- Cadastro persistente de alimentos personalizados.
- Favoritos e historico de alimentos recentes.
- Registro separado por refeicoes.
- Totais por refeicao.
- Metas diarias de calorias e macronutrientes.
- Barras de progresso visual para cada macro e calorias.
- Dashboard organizada com resumo calorico, distribuicao percentual dos macros e grafico de meta x consumido.
- Reorganizacao da interface em paginas especificas por funcao.
- Importacao da base TACO por script de conversao para uso nativo no autocomplete.
- Calculadora de taxa metabolica basal com persistencia local e atalho para meta calorica.
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
