const express = require('express');
const app = express();
const MongoConnection = require('../config/MongoConnection');
var objectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
var moment = require('moment');


app.get('/', function (requisicao, resposta) {
    resposta.send('Rota de Usuário!');
});

// ADiciona usuário
app.post('/', function (requisicao, resposta) {
    var dados = requisicao.body;

    if (!dados.nome) {
        resposta.status(500).json('Campo nome é obrigatório!');
        return;
    } else if (!dados.email) {
        resposta.status(500).json('Campo e-mail é obrigatório!');
        return;
    } else if (!dados.senha) {
        resposta.status(500).json('Campo senha é obrigatório!');
        return;
    } else if (dados.senha.length < 8 || dados.senha.length > 16) {
        resposta.status(500).json('A senha deve ter de 8 a 16 caracteres!');
        return;
    }

    // valida e-mail
    if (!validaEmail(dados.email)) {
        resposta.status(500).json('E-mail inválido');
        return;
    }

    // Confere se já tem no banco
    var mongoConnection = new MongoConnection().open(async function (erro, banco) {
        await banco.collection('usuarios').findOne({ email: dados.email }, async function (erro, res) {
            if (res) {
                resposta.status(500).json('Este e-mail já está cadastrado!')
            } else {
                await banco.collection('usuarios').insert({
                    nome: dados.nome,
                    email: dados.email,
                    senha: bcrypt.hashSync(dados.senha, 10)
                }, function (erro, resultado) {
                    if (erro)
                        resposta.status(500).json(erro);
                    else
                        resposta.status(200).json(resultado);
                });
            }
        });
    });
});

// LOGIN USUÁRIO
app.post('/login', function (requisicao, resposta) {
    const email = requisicao.body.email;
    const senha = requisicao.body.senha;

    if (!email || !senha) {
        resposta.status(500).send('Informe e-mail e senha!');
        return;
    }

    var mongoConnection = new MongoConnection().open(async function (erro, banco) {
        banco.collection('usuarios').findOne({ email, status:{$ne: false} }, async function (erro, dados) {
            if (!dados) {
                resposta.status(500).send('Usuário não encontrado!');
                return;
            } else {
                let pass_ok = await bcrypt.compare(senha, dados.senha);
                if (!pass_ok) {
                    resposta.status(404).json('Senha inválida!');
                    return;
                } else {
                    resposta.status(200).json('Logado com sucesso!');
                }
            }
        });
    });
});

// VALIDAÇÃO DE EMAIL
function validaEmail(email) {
    const er = /^[a-zA-Z0-9][a-zA-Z0-9\._-]+@([a-zA-Z0-9\._-]+\.)[a-zA-Z-0-9]{2,3}$/;

    if (!er.exec(email))
        return false;
    else
        return true;
}

// Atualiza dados do usuário
app.put('/:id', function (requisicao, resposta) {

    var idUsuario = requisicao.params.id;
    var dados = requisicao.body;

    // if(!dados.nome){
    //     resposta.status(500).json('Campo nome é obrigatório!');
    //     return;
    // }else if(!dados.email){
    //     resposta.status(500).json('Campo e-mail é obrigatório!');
    //     return;
    // }else if(!dados.senha){
    //     resposta.status(500).json('Campo senha é obrigatório!');
    //     return;
    // }else if(dados.senha.length < 8 || dados.senha.length > 16){
    //     resposta.status(500).json('A senha deve ter de 8 a 16 caracteres!');
    //     return;
    // }else if(!idUsuario){
    //     resposta.status(500).json('O ID do usuário obrigatório');
    //     return;
    // }

    // valida e-mail
    if (dados.email) {
        if (!validaEmail(dados.email)) {
            resposta.status(500).json('E-mail inválido');
            return;
        }
    }

    // Confere se já tem no banco
    var mongoConnection = new MongoConnection().open(async function (erro, banco) {
        await banco.collection('usuarios').findOne({ email: dados.email }, async function (erro, res) {

            // SE CASO PASSA O EMAIL PARA ATUALIZAR, ENTÃO VERIFICA SE O EMAIL ESTÁ DISPONIVEL
            if (dados.email) {
                if (res) {
                    if (dados.email == res.email && idUsuario != res._id) {
                        resposta.status(500).json('Este e-mail já está cadastrado!')
                        return;
                    }
                }

            }
            if (dados.senha) {
                dados.senha = bcrypt.hashSync(dados.senha, 10)
            }
            await banco.collection('usuarios').update(
                { _id: objectId(idUsuario) },
                {
                    $set: {
                        ...dados
                    }
                }, function (erro, resultado) {
                    if (erro)
                        resposta.status(500).json(erro);
                    else
                        resposta.status(200).json(resultado);
                });
        });
    });
});


// Desativar o usuário - "Excluir"
app.put('/excluir/:id', function (requisicao, resposta) {
    var idUsuario = requisicao.params.id;
    var email = requisicao.body.email;

    var hoje = new Date();
    let dataFormatada = moment(hoje).format('DD/MM/YYYY HH:mm:ss');

    var mongoConnection = new MongoConnection().open(async function (erro, banco) {

        await banco.collection('usuarios').update(
            { _id: objectId(idUsuario) },
            {
                $set: {
                    status: false,
                    email: `removido em ${dataFormatada} - email: [${email}]`
                }
            }, function (erro, resultado) {
                if (erro)
                    resposta.status(500).json(erro);
                else
                    resposta.status(200).json(resultado);
            });
    });
});

// Exporta o módulo
module.exports = app;