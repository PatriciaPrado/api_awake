// Injetando o Express para atender as requisições HTTP.
const express = require('express');
const app = express();

// Body Parser para interpretar os valores passados pelo corpo (body) das requisições HTTP p/ JSON
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// Carregando o arquivo da rota
const evento = require('./Routes/eventos');
const usuarios = require('./Routes/usuarios');

// quando alguém digitar /evento leva ele para a variável evento
app.use('/eventos', evento);
app.use('/usuarios', usuarios);

// Rota de boas vindas
app.get('/', function(requisição, resposta){
    resposta.status(200).send('<h1>Bem vindo a API AWAKE!</h1>');
});

// Definição da porta em que a API irá atender as requisições
const porta = process.env.PORT || 8080;

// arrow function 
app.listen(porta, () =>{
    console.log('SERVIDOR ONLINE RODANDO NA PORTA '+ porta);
})