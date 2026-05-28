# Sistema de Mineração de Dados para Detecção de Redes Mitigadas via BGP

## Objetivo

Desenvolver um sistema capaz de monitorar anúncios BGP, identificar possíveis redes passando por mitigação DDoS através da análise de AS-PATH e gerar indicadores analíticos a partir dos dados coletados.

---

# Funcionamento Geral

O sistema irá:

1. Monitorar ASN previamente cadastrados;
2. Buscar prefixos anunciados por esses ASN;
3. Filtrar apenas prefixos `/24`;
4. Consultar o estado BGP (`bgp-state`) de cada prefixo;
5. Verificar se o AS-PATH passa por algum ASN mitigador;
6. Armazenar os resultados no banco de dados;
7. Gerar indicadores, gráficos e análises temporais.

---

# Estrutura do Projeto

## 1. Tabela de ASN Mitigadores

Tabela contendo ASN de empresas conhecidas de mitigação DDoS.

### Exemplos

| Empresa    | ASN     |
| ---------- | ------- |
| Cloudflare | AS13335 |
| Akamai     | AS20940 |
| Imperva    | AS19551 |
| Voxility   | AS3223  |

---

## 2. Tabela de ASN Monitorados

Tabela contendo ASN que serão monitorados pelo sistema.

### Exemplos

| Empresa | ASN     |
| ------- | ------- |
| Google  | AS15169 |
| AWS     | AS16509 |
| Meta    | AS32934 |

---

# Fluxo de Coleta

## Etapa 1 — Buscar Prefixos Anunciados

Consulta realizada para descobrir os prefixos anunciados por um ASN monitorado.

### Exemplo

```txt
https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS15169
```

---

## Etapa 2 — Filtrar Prefixos `/24`

Após obter os prefixos anunciados, o sistema deverá manter apenas prefixos no formato:

```txt
x.x.x.x/24
```

### Exemplo válido

```txt
8.8.8.0/24
```

---

## Etapa 3 — Consultar BGP State

Para cada prefixo `/24`, será realizada uma nova consulta:

### Exemplo

```txt
https://stat.ripe.net/data/bgp-state/data.json?resource=8.8.8.0/24
```

Essa consulta retorna:

* AS-PATH;
* ASN de origem;
* communities;
* peers;
* timestamp;
* informações de propagação BGP.

---

## Etapa 4 — Identificar ASN Mitigadores

O sistema deverá analisar o array `path` retornado pelo `bgp-state`.

### Exemplo

```json
"path": [6453, 3356, 13335, 15169]
```

Se algum ASN do path existir na tabela de mitigadores:

```txt
13335 = Cloudflare
```

Então:

```txt
is_mitigated = true
asn_mitigador = 13335
```

---

## Etapa 5 — Persistência

Os dados deverão ser armazenados para análise histórica e mineração de dados.

---

# Informações que Devem Ser Armazenadas

## Prefixo

```txt
8.8.8.0/24
```

---

## ASN de Origem

Último ASN do AS-PATH.

### Exemplo

```txt
15169
```

---

## AS-PATH Completo

### Exemplo

```txt
6453,3356,13335,15169
```

---

## ASN Mitigador Detectado

### Exemplo

```txt
13335
```

---

## Indicador de Mitigação

```txt
true / false
```

---

## Communities

Communities BGP retornadas pela API.

---

## Timestamp

Data e horário da coleta.

---

## Source ID

Identificador do peer que retornou a rota.

---

# Estrutura de Banco Sugerida

## Tabela: mitigadores

```sql
CREATE TABLE mitigadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    asn INTEGER UNIQUE
);
```

---

## Tabela: monitorados

```sql
CREATE TABLE monitorados (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    asn INTEGER UNIQUE
);
```

---

## Tabela: bgp_routes

```sql
CREATE TABLE bgp_routes (
    id SERIAL PRIMARY KEY,
    prefixo VARCHAR(50),
    asn_origem INTEGER,
    as_path TEXT,
    asn_mitigador INTEGER NULL,
    is_mitigated BOOLEAN DEFAULT FALSE,
    community TEXT,
    source_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# Indicadores Analíticos

O sistema deverá gerar indicadores como:

* Quantidade de prefixos mitigados;
* ASN mitigador mais recorrente;
* Horários com maior incidência;
* Dias da semana com maior ocorrência;
* Prefixos que aparecem repetidamente;
* ASN que mais cresceram no período;
* Frequência temporal de mitigação;
* Recorrência de AS-PATH;
* Volume de mitigação por ASN.

---

# Visualizações

## Dashboard Analítico

O frontend deverá conter:

* gráficos de ocorrência;
* ASN mais frequentes;
* recorrência temporal;
* top prefixos;
* indicadores;
* heatmaps;
* filtros por ASN;
* filtros por período.

---

# Mineração de Dados

O projeto deverá aplicar conceitos de mineração de dados.

---

## Análise Exploratória de Dados (EDA)

Identificação de:

* padrões;
* recorrência;
* crescimento temporal;
* sazonalidade.

---

## Clustering

Agrupar:

* ASN mitigadores recorrentes;
* horários de maior incidência;
* padrões semelhantes de AS-PATH.

---

# Automação

O sistema deverá executar automaticamente a coleta.

## Frequência

```txt
1 vez por hora
```

---

## Cron Job

Exemplo:

```bash
0 * * * * python3 collect_bgp.py
```

---

## GitHub Actions

O repositÃ³rio agora possui um workflow em `.github/workflows/hourly-collector.yml` com:

* execuÃ§Ã£o automÃ¡tica `0 * * * *` (uma vez por hora);
* disparo manual via `workflow_dispatch`.

Para a coleta horÃ¡ria funcionar com persistÃªncia, configure o secret do repositÃ³rio:

```txt
DATABASE_URL
```

Exemplo:

```txt
postgresql+psycopg2://usuario:senha@host:5432/banco
```

Sem esse secret, o workflow falharÃ¡ de forma explÃ­cita porque o GitHub Actions nÃ£o compartilha o PostgreSQL local da sua mÃ¡quina.

---

# Stack Recomendada

## Backend

* Python
* FastAPI

## Banco

* PostgreSQL

## Frontend

* Next.js
* Tailwind CSS

## Gráficos

* Recharts
* Plotly

## Automação

* Cron
* GitHub Actions
* Railway Cron

---

# Fluxo Completo do Sistema

```txt
ASN Monitorado
        ↓
Buscar Prefixos
        ↓
Filtrar /24
        ↓
Consultar bgp-state
        ↓
Ler AS-PATH
        ↓
Detectar ASN Mitigador
        ↓
Salvar no Banco
        ↓
Gerar Indicadores
        ↓
Dashboard Analítico
```
