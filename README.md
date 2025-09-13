# Meteorology Website

Este projeto é um site de meteorologia desenvolvido em Python, com o objetivo de fornecer visualização e gerenciamento de leituras meteorológicas. Utiliza uma arquitetura modular com rotas, modelos, banco de dados e interface web.

## Estrutura do Projeto
### Visão Geral

Aplicação web para registrar, consultar e gerenciar leituras meteorológicas (temperatura, umidade, pressão, etc.) via interface web e API REST. Foco em modularidade (camadas: rotas, modelos, schemas, persistência).

### Tecnologias Principais

- Python 3.x
- FastAPI (ou Flask + Pydantic, dependendo da implementação real)
- SQLAlchemy (ORM)
- Banco: SQLite (padrão) ou outro configurado
- HTML/CSS/JS (templates + estáticos)

### Estrutura (resumida)

```
.
├── app.py
├── manager.py
├── database
│   ├── configs
│   │   └── database.py
│   ├── models
│   │   ├── entities
│   │   │   └── readings.py
│   │   └── schemas
│   │       └── readings.py
├── routes
│   └── reading.py
├── static
│   ├── css
│   │   └── style.css
│   └── js
│       └── main.js
└── templates
  └── index.html
```

### Conceitos de Domínio

- Reading: registro meteorológico (campos típicos: id, timestamp, temperatura, umidade, pressão, vento).
- Schemas: validação e serialização (entrada/saída).
- Entities: modelos persistidos no banco.

### API REST (exemplo de rotas)

Base: /api/readings

- GET /api/readings  
  Lista paginada de leituras. Suportes: ?limit=&offset=.
- GET /api/readings/{id}  
  Retorna leitura específica.
- POST /api/readings  
  Cria nova leitura (JSON no corpo).
- PUT /api/readings/{id}  
  Atualiza leitura existente.
- DELETE /api/readings/{id}  
  Remove leitura.
- GET /health (opcional)  
  Verificação simples de status.

### Exemplos de Requisição (cURL)

Criar:
```
curl -X POST http://localhost:8000/api/readings \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2024-01-01T12:00:00","temperatura":25.4,"umidade":60}'
```

Listar:
```
curl http://localhost:8000/api/readings?limit=10&offset=0
```

Atualizar:
```
curl -X PUT http://localhost:8000/api/readings/1 \
  -H "Content-Type: application/json" \
  -d '{"temperatura":26.1}'
```

Excluir:
```
curl -X DELETE http://localhost:8000/api/readings/1
```

### Fluxo Interno

1. Requisição chega à rota (reading.py).
2. Validação via schema.
3. Operação ORM (entities).
4. Retorno serializado (schema de saída).
5. Front-end consome via fetch/axios ou carrega página server-side.

### Variáveis de Ambiente (exemplo)

- DATABASE_URL=sqlite:///./data.db
- APP_ENV=development
- LOG_LEVEL=INFO

Criar arquivo .env (se suportado) e carregar na inicialização.

### Execução (exemplo FastAPI)

```
pip install -r requirements.txt
uvicorn app:app --reload
```

Ou (Flask):
```
python app.py
```

### Scripts Úteis (sugestão)

- make run
- make lint
- make test
- make format

### Migrações (se Alembic)

```
alembic init migrations
alembic revision -m "create readings" --autogenerate
alembic upgrade head
```

### Testes (sugestão)

- tests/test_readings_api.py: testes de rotas.
- Usar pytest + httpx (FastAPI) ou flask.testing.

### Boas Práticas

- Separar schema de input e output.
- Tratar exceções centralmente.
- Paginação padrão.
- Logs estruturados (níveis: info, error).
- Validar limites (ex: ranges de temperatura).

### Roadmap (sugestão)

- Autenticação (JWT / API Key).
- Filtros avançados (faixa de datas, agregações).
- Exportação CSV/JSON.
- Dashboard com gráficos (Chart.js).
- Alertas (ex: extremos meteorológicos).

### Status

MVP focado em CRUD de leituras e visualização básica. Expansões planejadas conforme roadmap. 
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
