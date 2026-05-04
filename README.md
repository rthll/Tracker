# Tracker de Macronutrientes

Aplicação web estática para cadastro de alimentos e montagem de refeições diárias com acompanhamento de carboidratos, proteínas, gorduras e calorias.

## Visão geral

O projeto foi estruturado com uma abordagem simples em MVC, mantendo responsabilidades separadas entre interface, controle de eventos e dados em memória. A proposta é oferecer um fluxo direto para registrar alimentos, adicionar quantidades consumidas e visualizar os totais nutricionais por data.

## Funcionalidades

- Cadastro de alimentos com macros e calorias por 100g.
- Seleção de uma data para organizar as refeições do dia.
- Cálculo proporcional dos nutrientes conforme a quantidade informada.
- Tabela consolidada com totais de carboidratos, proteínas, gorduras e calorias.
- Remoção de itens da refeição atual.
- Interface responsiva com foco em legibilidade e uso rápido.

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

Responsável por armazenar:

- A lista de alimentos cadastrados.
- As refeições agrupadas por data.
- As operações de adição, consulta e remoção dos dados.

### View

Arquivo: `view/view.js`

Responsável por:

- Atualizar a lista de alimentos disponíveis.
- Renderizar a tabela da refeição diária.
- Exibir os totais nutricionais da interface.
- Refletir estados de vazio e feedback visual da página.

### Controller

Arquivo: `controller/controller.js`

Responsável por:

- Inicializar a aplicação.
- Capturar eventos da interface.
- Validar os dados informados pelo usuário.
- Calcular os valores proporcionais da refeição.
- Orquestrar a comunicação entre `Model` e `View`.

## Como executar

Como se trata de um projeto estático, basta abrir o arquivo `index.html` em um navegador moderno.

## Fluxo de uso

1. Selecione a data desejada.
2. Cadastre um alimento informando os nutrientes por 100g.
3. Escolha um alimento cadastrado.
4. Informe a quantidade consumida em gramas.
5. Adicione o item à refeição e acompanhe os totais do dia.

## Melhorias aplicadas nesta versão

- Atualização visual da página com layout mais moderno e responsivo.
- Correção da inicialização da data para respeitar o horário local.
- Ajuste da organização do MVC, removendo duplicação indevida da camada de visualização.
- Correção de problemas estruturais no HTML.
- Renderização mais segura da tabela, evitando inserção direta de HTML com dados do usuário.
- Estados vazios e desabilitação de ações quando não há alimentos cadastrados.

## Limitações atuais

- Os dados são mantidos apenas em memória enquanto a página estiver aberta.
- Não há integração com backend, autenticação ou persistência local.

## Próximos passos sugeridos

- Persistir os dados com `localStorage`.
- Adicionar edição de alimentos já cadastrados.
- Incluir metas diárias de macronutrientes para comparação visual.
