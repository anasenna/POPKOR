# POPKOR | Sistema editável

Projeto frontend organizado em HTML, CSS e JavaScript, com páginas navegáveis para painel inicial, vendas, estoque e financeiro.

## Estrutura dos arquivos

```text
popkor_editavel/
├── login.html              # Login e criação do primeiro acesso
├── index.html              # Painel inicial
├── vendas.html             # Cadastro e gerenciamento de vendas
├── estoque.html            # Cadastro e gerenciamento de produtos/insumos
├── financeiro.html         # Lançamentos financeiros e backups
├── css/
│   └── style.css           # Estilos e responsividade
├── js/
│   ├── app.js              # Interações, validações e armazenamento local
│   └── auth.js             # Tela de login, sessão e botão Sair
└── README.md               # Estas instruções
```

## Como executar no VS Code

1. Extraia o ZIP e abra a pasta `popkor_editavel` no VS Code.
2. Instale a extensão **Live Server**, se ainda não estiver instalada.
3. Clique com o botão direito em `login.html` e escolha **Open with Live Server**.
4. No primeiro acesso, crie um usuário e uma senha com pelo menos 8 caracteres. Depois, use esses dados para entrar.
5. Navegue pelo menu inferior para abrir Início, Vendas, Estoque e Financeiro. Use **Sair** para encerrar a sessão.

## Funcionalidades

- **Estoque:** adicionar, editar, ajustar quantidade, buscar, filtrar e excluir produtos e insumos.
- **Vendas:** cadastrar, editar e excluir vendas; pesquisar e filtrar pedidos.
- **Integração vendas/estoque:** uma venda vinculada a um item desconta a quantidade em estoque; editar/excluir a venda reverte o movimento anterior.
- **Financeiro:** lançar entradas e saídas, editar e excluir lançamentos; vendas são mostradas como movimentações vinculadas.
- **Painel inicial:** calcula vendas de hoje, valores recebidos e pendentes, saldo, entregas, estoque crítico e canais.
- **Personalização:** nome, nome da marca e meta diária.
- **Backup:** exportação e importação de dados em JSON.
- **Login:** criação de credenciais no primeiro acesso, tela de login, sessão de navegador e botão para sair.
- **Acessibilidade:** rótulos de formulário, foco de teclado, atalho para pular ao conteúdo principal, avisos acessíveis e respeito à preferência por movimento reduzido.

## Armazenamento e limitações

Os dados são salvos no `localStorage` do navegador e do dispositivo em uso. Não há sincronização entre dispositivos nem banco de dados remoto. Limpar os dados do navegador pode apagar registros, então exporte backups periodicamente pela página Financeiro.

**Limitação importante do login:** como este é um projeto apenas de HTML, CSS e JavaScript, a tela de login é uma barreira de protótipo, não um mecanismo de segurança real. As credenciais ficam neste navegador e alguém com conhecimento técnico pode contornar a verificação. Não use para proteger informações sensíveis; para autenticação real, será necessário um backend (por exemplo, Flask) e banco de dados.

Os registros iniciais são demonstrativos. Para um sistema multiusuário ou acesso por diferentes dispositivos, será necessário um backend e um banco de dados, por exemplo Flask + SQLite, além de autenticação.
