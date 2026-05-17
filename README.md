<p align="center">
  <img src="web/public/banner.png" alt="DroidMeter" width="100%" />
</p>

<h1 align="center">DroidMeter</h1>

<p align="center">
  Um dashboard local para transformar um Redmi Note 8 em display de mesa para clima, Spotify, métricas do PC e saúde do hub.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111" />
  <img alt="Fastify" src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=fff" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-5-764ABC" />
</p>

## Visão Geral

DroidMeter é uma aplicação full-stack local, feita para rodar em um PC e ser acessada por um celular na rede local. O frontend renderiza uma interface calibrada para o Redmi Note 8 em landscape, enquanto o backend coleta dados do sistema, clima e Spotify e envia atualizações em tempo real por WebSocket.

## Fluxo da Aplicação

<p align="center">
  <img src="web/public/flowchart.png" alt="Fluxo da aplicação DroidMeter" width="100%" />
</p>

O Fastify concentra os workers de dados, atualiza o estado compartilhado no backend e transmite mudanças por WebSocket. O Next.js renderiza o dashboard no celular, consome o estado em tempo real via Zustand e usa API routes próprias para ações interativas do Spotify.

## Funcionalidades

- Dashboard calibrado para viewport `851 x 393` em landscape.
- Widget de clima com modos visuais para dia, noite e chuvoso/nublado.
- Widget Spotify com capa, progresso e controles play/pause/next/previous.
- Widget Sistema com RAM, CPU e GPU em gauges semicirculares.
- Métricas de CPU/GPU com temperatura e RAM usada em GB.
- Hub Health mockado para bateria, temperatura, tela e Wi-Fi.
- WebSocket com hostname dinâmico para acessar pelo IP do PC no celular.
- Fonte SF Pro Text self-hosted e visual inspirado em widgets iOS.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Backend | Fastify 5, `@fastify/websocket` |
| Estado | Zustand 5 |
| Tipos | TypeScript 5 compartilhado em `shared/` |
| Dados | Open-Meteo, Spotify Web API, `systeminformation` |

## Estrutura

```text
.
├── server/                 # Fastify, workers e WebSocket
├── web/                    # Next.js app router e componentes
├── shared/                 # Tipos e configuração de módulos
├── stuff/                  # Notas, referências e status local
├── package.json            # Workspaces e scripts raiz
└── .env.example            # Template de variáveis
```

## Como Rodar

```bash
npm install
cp .env.example .env
npm run droidmeter
```

Abra:

```text
http://localhost:3000
```

No celular, use o IP do PC na rede local:

```text
http://<ip-do-pc>:3000
```

## Variáveis de Ambiente

O backend lê `.env` na raiz. As rotas do Next também podem usar `web/.env.local` para o fluxo do Spotify.

```env
PORT=3333
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3333/ws

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

WEATHER_LAT=-12.2664
WEATHER_LON=-38.9663

GITHUB_TOKEN=
GITHUB_USERNAME=
```

Para gerar um novo refresh token do Spotify, acesse:

```text
http://127.0.0.1:3000/api/spotify/auth
```

Use este callback no Spotify Developer Dashboard:

```text
http://127.0.0.1:3000/api/spotify/callback
```

## Scripts

```bash
npm run droidmeter    # backend + frontend em modo dev
npm run dev:server    # apenas Fastify
npm run dev:web       # apenas Next.js
npm run test          # testes dos workspaces
```

## Notas

- O layout foi ajustado para o Redmi Note 8 deitado.
- `web/.env.local`, `.env`, builds e caches são ignorados pelo Git.
- `stuff/STATUS.md` guarda o estado operacional do projeto durante a evolução da UI.
