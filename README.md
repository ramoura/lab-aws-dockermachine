# lab-aws-dockermachine
> Este laboratório demonstrar como fazer deploy de container, em instância AWS EC2, com o utilitário docker-machine e como preparar o ambiente para alta disponibilidade utilizando um Load Balance. 

Tabela de conteúdos
=================
<!--ts-->
   * [Requisitos](#requisitos)
   * [Design final da solução](#design-final-da-solução)
   * [Configurações](#configurações)
   * [Criando a aplicação](#criar-a-aplicação)
   * [Criando o Dockerfile](#criar-o-dockerfile)
   * [Build da aplicação e gerando a imagem docker](#build-da-aplicação-e-gerando-a-imagem-docker)
   * [Testando local](#testando-local)
   * [Criando as instâncias com docker-machine](#criando-as-instâncias-com-docker-machine)
   * [Configurando e subindo a aplicação](#configurando-e-subindo-a-aplicação)
   * [Configurando Load Balance](#configurando-load-balance)
   * [Ajustando o Security Group das instâncias.](#ajustando-o-security-group-das-instâncias)
<!--te-->


## Requisitos
1. Deve ser gerada imagem docker com a aplicação rodando na porta 3000.
2. As instâncias EC2 serão criadas e configuradas pelo docker-machine.
3. O Load Balance será do tipo Application Load Balance direcionando todo o tráfego da porta 80 para as instâncias na porta 3000.
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

## Criando a aplicação
Para este laboratório será criado uma aplicação simples escutando a porta 3000. O aplicativo irá responder a duas URLs: 
1. GET /health:  respondendo “ok” utilizada para _health check_ da aplicação
2. GET /: que responde com a data e hora atual do servidor.

Para iniciar o projeto, o primeiro passo é criar o diretório e depois acessá-lo:
```sh
mkdir lab-aws-dockermachine
cd lab-aws-dockermachine
```  

Agora precisamos criar o arquivo package.json, fazemos isso com o comando: 
```sh
yarn init
```
Após responder as questões o arquivo será criado.

Utilizarei a lib *express* para criar as rotas:
```sh
yarn add express
```

Para essa aplicação, irei criar um único arquivo chamado index.js. Abaixo como ficou o código:

```javascript
const express = require('express')

const app = express();

app.get('/health', (req, res) => res.send("ok"));
app.get('/', (req, res) => res.send("Now: "+ new Date()));

app.listen(3000);
```


Vou aproveitar e alterar o package.json, adicionando um scritp para start da aplicação:

```json
  "scripts": {
    "start": "node index.js"
  },
```
Assim, facilita iniciar a aplicação basta digitar ``` yarn start ```.

Abaixo como ficou a estrutura do meu projeto:

![](./img/project.png) 



## Criando o Dockerfile

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


## Testando local

Para testar abra o browser e digite: http://localhost:3000/ se tudo estiver correto deve retornar a data e hora:

![](./img/app-datahora.png) 

Para testar o health, no browser, digite ``` http://localhost:3000/health``` Deve retornar “ok”:

![](./img/app-health.png) 

## Criando as instâncias com docker-machine

Como o docker-machine utiliza o cli da aws, para executar os comandos, antes de iniciar certifique que a aws-cli esteja instalado e configurado. Para configurar acesso o link(https://docs.aws.amazon.com/pt_br/cli/latest/userguide/cli-configure-quickstart.html).

Após configurações feitas, é hora de criar as instâncias EC2.

```sh
docker-machine create --driver amazonec2 --amazonec2-open-port 3000 --amazonec2-region us-east-1 --amazonec2-zone a aws-myapp-a
docker-machine create --driver amazonec2 --amazonec2-open-port 3000 --amazonec2-region us-east-1 --amazonec2-zone b aws-myapp-b
``` 

Abaixo uma breve descrição para cada parametro:
-   **--driver**: É o drive para as configurações da Cloud. 
-   **--amazonec2-open-port**: Essa porta será liberada no Security Group para as instâncias.
-   **--amazonec2-region**: Região onde será criada as instâncias.
-   **--amazonec2-zone**: É a zona de disponibilidade onde será criada as instâncias.

Serão criadas duas instâncias na AWS:
![](./img/instances_aws.png) 

Támbem será criado um Security Group com o nome docker-machine:
![](./img/security_group.png) 

## Configurando e subindo a aplicação

Agora precisamos o docker local apontando para a instância EC2, para isso digite:
```sh
docker-machine env aws-myapp-a
```

Será apresentada as variáveis de ambiente que devem ser configuradas. Para poupar esforço é possível fazer essa configuração apenas com o comando:
```sh
eval $(docker-machine env aws-myapp-a)
```

A partir de agora, todos os comandos docker serão executados na instância EC2. Então, bora subir nosso conteirer, para isso é so fazer o build da imagem e rodar a aplicação, com os comandos abaixo:

```sh
docker build -t myapp .
docker run -d -p 3000:3000 myapp
```
Pronto, o contêiner já está rodando e para provar isso vamos fazer um teste. Primeiro vamos descobrir qual o ip público da instância com o comando:

```sh
docker-machine ip aws-myapp-a
```

No meu caso foi “3.87.154.248”. Abra o navegador e digite http://3.87.154.248:3000/
![](./img/myapp-prd.png)

Agora é preciso fazer o mesmo com a outra instância, com os comandos:
```sh
eval $(docker-machine env aws-myapp-b)
docker build -t myapp .
docker run -d -p 3000:3000 myapp
docker-machine ip aws-myapp-b
```
Agora, com o ip público, podemos testa a aplicação nessa instância.

Resumos até aqui:
Foram criadas duas instâncias, cada uma em uma AZ, rodando um contêiner com a aplicação.

Os próximos passos são:

1. Configurar um Load Balance;
2. Alterar o Security Group das instâncias para permitir conexões na porta 3000 apenas originadas do Load Balance.

## Configurando Load Balance

Para criar o Load Balance, acesso o painel da AWS, depois entre no dashboard de EC2. Na barra lateral esquerda localize a opção Load Balance. 

Abaixo um video que eu fiz configurando o meu LB.

[](./img/ConfigurandoLB.gif)

O mais importante é na parte do Target Group, não esqueça de colocar o tipo Instance e a porta é a 3000. 
Depois em Register precisa selecionar as duas instâncias e clicar no botão "Add to register".  


## Ajustando o Security Group das instâncias.

Para atender o requisito 4 devemos ajustar o Security Group, das instâncias, permitindo que apenas o Load Balance acesse a porta 3000.  

[](./img/Ajuste_Teste_Final.gif)

Com isso só será possível chegar ao serviço utilizando o Load Balance.

## Conclusão

