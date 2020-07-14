# lab-aws-dockermachine
> Laboratório com deploy de container em instância AWS EC2 utilizando docker-machine.


## Objetivo

Objetivo: Rodar uma aplicação node.js em duas instâncias EC2 configuradas para alta disponibilidade, utilizando um Load Balance para expor para internet.

Requisitos:
1. Deve ser gerada imagem docker com a aplicação rodando na porta 3000.
2. As instâncias EC2 serão geradas e configuradas pelo docker-machine.
3. O Load Balance será do tipo Application Load Balance direcionando o tráfego da porta 80 para as instâncias na porta 3000.
4. As instâncias não podem expor os serviços direto para a internet.
5. Ambas as instâncias irão rodar na região “us-east-1”
6. Deverá rodar uma instância na availability zones us-east-1a e outra na us-east-1b. Garantindo a alta disponibilidade.

## Design final da solução

![](./img/AWS.png)


## Configurações

Ferramentas necessárias para o laboratório:
- [node.js 10+](https://nodejs.org/en/download/)
- [yarn](https://classic.yarnpkg.com/en/docs/install/) para gerenciar as dependências (também pode ser utilizado o npm).
- [docker](https://docs.docker.com/engine/install/)
- [docker-machine](https://docs.docker.com/machine/install-machine/)
- [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)

## Criar a aplicação node.js
Para este laboratório será criado uma aplicação simples, desenvolvida em node.js, que irá conter dois endpoints um para health check e o outra será funcionalidade propriamente dita. A funcionalidade será um relógio que ao chamar o endpoint retorno a data e hora atual.

Primeiro passo é criar o diretório do projeto e depois acessá-lo:
```sh
mkdir lab-aws-dockermachine
cd lab-aws-dockermachine
```  

Agora precisamos criar o arquivo package.json, para início digite: 

```sh
yarn init
```

Aproveite e instale o express, com  o comando:

```sh
yarn add express
```


Abra seu editor/IDE favorita.

Criei um arquivo chamado index.js e adicionei o código da aplicação:

```javascript
const express = require('express')

const app = express();

app.get('/health', (req, res) => res.send("ok"));
app.get('/', (req, res) => res.send("Now: "+ new Date()));

app.listen(3000);
```

Uma rápida explicação do código:

....

Também alterei o package.json, adicionando um scritp para start da aplicação:

```json
…
 "license": "MIT",
  "scripts": {
    "start": "node index.js"
  },
...
```
Assim para rodar a aplicação é só digitar ``` yarn start ```.

Abaixo como ficou a estrutura do meu projeto:

![](./img/project.png) 



## Criar o Dockerfile.

O Dockerfile é um arquivo texto que contém os comandos utilizados pelo Docker para gerar a imagem, isso inclui instalação de pacotes, criação de diretórios e definição de variáveis de ambiente entre outras coisas. 

Conteúdo do Dockerfile:

```Dockerfile
FROM node:10-alpine

WORKDIR /usr/app
COPY package.json yarn.lock ./

RUN yarn

COPY . .

EXPOSE 3000
CMD ["yarn", "start"]
```

Explicando o arquivo:….

Para aumentar o desempenho da compilação, exclua arquivos e diretórios adicionando um .dockerignore no diretório raiz. 
Criei um .dockerignore com o diretório node_modules.


## Build da aplicação e gerando a imagem docker

Para gerar a imagem, basta digitar:


```sh
docker build -t myapp .
docker run -d -p 3000:3000 myapp
```


## Testando local.

Para testar abra o browser e digite: http://localhost:3000/ se tudo estiver correto deve retornar a data e hora:

![](./img/app-datahora.png) 

Para testar o health, no browser, digite ``` http://localhost:3000/health``` Deve retornar “ok”:

![](./img/app-health.png) 

