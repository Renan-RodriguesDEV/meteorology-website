# Meteorology Website

Este projeto é um site de meteorologia desenvolvido em Python, com o objetivo de fornecer visualização e gerenciamento de leituras meteorológicas. Utiliza uma arquitetura modular com rotas, modelos, banco de dados e interface web.

## Estrutura do Projeto

- `app.py`: Arquivo principal da aplicação.
- `manager.py`: Gerenciamento de operações do sistema.
- `database/`: Configurações e modelos do banco de dados.
  - `configs/database.py`: Configuração de conexão com o banco de dados.
  - `models/entities/readings.py`: Entidade de leituras meteorológicas.
  - `models/schemas/readings.py`: Schemas para validação de dados.
- `routes/reading.py`: Rotas relacionadas às leituras.
- `static/`: Arquivos estáticos (CSS, JS).
  - `css/style.css`: Estilos da interface.
  - `js/main.js`: Scripts da interface.
- `templates/index.html`: Página principal do site.

## Como executar

1. Instale as dependências necessárias (consulte os requisitos no projeto).
2. Execute o arquivo `app.py` para iniciar o servidor web.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob os termos da licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
