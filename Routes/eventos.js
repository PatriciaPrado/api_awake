const express = require('express');
const app = express();
const MongoConnection = require('../config/MongoConnection');
var moment = require('moment');
var objectId = require('mongodb').ObjectID;
const multer = require('../config/multer');
const fs = require('fs');

// Upload de imagem
app.post('/upload', multer, (requisicao, resposta) =>{

    let dados = requisicao.body;
  
    if(!requisicao.file){
        resposta.status(500).json('Informe a imagem para fazer upload!');
        return;
    }else if(!dados.idevento){
        resposta.status(500).json('O idEvento é obrigatório');
        return;
    }

        // REGISTRA A IMAGEM DO EVENTO NO MONGO
        var imagem = requisicao.file.filename; 

        // Registra a imagem do evento n Mongo
        var mongoConnection = new MongoConnection().open(function(err, banco){
            banco.collection('eventos').update({'_id': objectId(dados.idevento)},{$set: {'imagem': imagem}},
                function(erro, resultado){
                    if(erro){
                        resposta.status(500).json(erro);
                    }else{
                        resposta.status(200).json(resultado);
                    }
                });
        });        
});

// Exclui um evento pelo ID do evento
app.delete('/:id', function(requisicao, resposta){
    // recupera o parâmentro do filtro pelo tipo
let idevento = requisicao.params.id;
const path = './public/uploads/';

//Abre conexão com o MongoDB
let mongoConnection = new MongoConnection().open(async function(erro, banco){
    await banco.collection('eventos').find({_id: objectId(idevento)}).toArray(function(erro,resultado){
    fs.unlinkSync(path + resultado[0].imagem);
    });
   
    let evento = await banco.collection('eventos').remove({_id: objectId(idevento)});
    resposta.status(200).json(evento);
        });
});



// CADASTRO DE EVENTO
app.post('/', function(requisicao, resposta){
    let dados = requisicao.body;

    if(!dados.idusuario){
        resposta.status(500).json('O ID do usuário é obrigatório');
        return;
    }else if(!dados.titulo){
        resposta.status(500).json('O tipo do evento é obrigatório');
        return;
    }else if(!dados.detalhes){
        resposta.status(500).json('Os detalhes são obrigatórios');
        return;
    }else if(!dados.data){
        resposta.status(500).json('A data é obrigatória');
        return;
    }else if(!dados.hora){
        resposta.status(500).json('A hora é obrigatória');
        return;
    }else if(!dados.local){
        resposta.status(500).json('O local é obrigatório');
        return;
    }else if(!dados.publicado){
        resposta.status(500).json('A privacidade é obrigatória');
        return;
    }else if(dados.publicado != 0 && dados.publicado != 1){
        resposta.status(500).json('1 para PUBLICADO / 0 para PRIVADO');
        return;
    } else if(!dados.tipo){
        resposta.status(500).json('O tipo é obrigatório');
        return;
    }

    // formatando a data para o padrão do MongoDB
    dados.data = moment(dados.data, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre a conexão com o mongo
    var mongoConnection = new MongoConnection().open(function(err, banco){
        banco.collection('eventos').insertOne({...dados, visualizacoes: 0},
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});

// Exibir todos os eventos públicos
app.get('/', function(requisicao, resposta){
    var hoje = new Date();
    // formatando a data para o padrão do MongoDB
    let dataFormatada = moment().subtract(1, 'days').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){
        await banco.collection('eventos').find({$and: [{publicado:'1'},{data:{$gte: dataFormatada}}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                } else {
                    resposta.status(200).json(resultado);
                }
            });
    });
});


// Exibir todos os eventos do usuário logado
app.get('/usuario/:id', function(requisicao, resposta){
    var id_Usuario = requisicao.params.id;
    
    //Abre conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){
        await banco.collection('eventos').find({'idUsuario': id_Usuario}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                } else {
                    resposta.status(200).json(resultado);
                }
            });
    });
});


// Filtra todos os eventos por tipo
app.get('/pesquisa/tipo/:valor', function(requisicao, resposta){
        // recupera o parâmentro do filtro pelo tipo
    let tipo = requisicao.params.valor;

    var hoje = new Date();
    // formatando a data para o padrão do MongoDB
    let dataFormatada = moment().subtract(1, 'days').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){
        await banco.collection('eventos').find({$and: [{publicado: '1'}, {tipo: tipo}, {data: {'$gte': dataFormatada}}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                } else {
                    resposta.status(200).json(resultado);
                }
            });
    });
});

// Carregar os detalhes de um evento pelo ID do evento
app.get('/:id', function(requisicao, resposta){
    // recupera o parâmentro do filtro pelo tipo
let idusuario = requisicao.params.id;

//Abre conexão com o MongoDB
let mongoConnection = new MongoConnection().open(async function(erro, banco){
    let evento = await banco.collection('eventos').findOneAndUpdate({'_id': objectId(idusuario)}, {$inc:{'visualizacoes': 1}});
        resposta.status(200).json(evento);
        });
});


// ATUALIZAÇÃO DE EVENTO
app.put('/:id', function(requisicao, resposta){
    // recupera o id do evento
    let idEvento = requisicao.params.id;
    // recupera o id do evento
    let dados = requisicao.body;
    //Abre a conexão com o mongo
    var mongoConnection = new MongoConnection().open(function(err, banco){
        banco.collection('eventos').update({'_id': objectId(idEvento)},{$set: {...dados}},
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});

// Publicado ou privado?
    app.put('/:id/:publicar', function(requisicao, resposta){
    // recupera o id do evento
    let idEvento = requisicao.params.id;
    let publicar = requisicao.params.publicar;

    if(publicar == 0 || publicar == 1)
    {
        //Abre a conexão com o mongo
        var mongoConnection = new MongoConnection().open(function(err, banco){
            banco.collection('eventos').update({'_id': objectId(idEvento)},{$set: {publicado: publicar}},
                function(erro, resultado){
                    if(erro){
                        resposta.status(500).json(erro);
                    }else{
                        resposta.status(200).json(resultado);
                    }
                });
        });
    }else{
        resposta.status(500).json('Informe 0 para privar, ou 1 para publicar o evento!')
    }
});


// Pesquisar os eventos pelo título
app.get('/pesquisa/titulo/:valor', function(requisicao, resposta){
    let pesquisa = requisicao.params.valor;

    var hoje = new Date();
    // formatando a data para o padrão do MongoDB
    let dataFormatada = moment().subtract(1, 'days').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){
        await banco.collection('eventos').find({$and: [{publicado:'1'},{data:{$gte: dataFormatada}}, {titulo: {$regex: pesquisa, $options: 'i'}}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                } else {
                    resposta.status(200).json(resultado);
                }
            });
    });
});


// Exibir todos os eventos públicos do dia
app.get('/filtrar/hoje', function(requisicao, resposta){
    var hoje = moment().startOf('day').toDate();
    hoje = moment(hoje, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();
    
    //Abre conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){
        await banco.collection('eventos').find({$and: [{publicado:'1'},{data:{'$gte': hoje, '$lte': hoje}}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                } else {
                    resposta.status(200).json(resultado);
                }
            });
    });
});

// Exibir todos os eventos públicos do mês
app.get('/filtrar/mes', function(requisicao, resposta){
    var hoje = moment().startOf('month').toDate();
    hoje = moment(hoje, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();

    var datafim = moment().endOf('month').toDate();
    datafim = moment(datafim, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){
        await banco.collection('eventos').find({$and: [{publicado:'1'},{data:{'$gte': hoje, '$lte': datafim}}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                } else {
                    resposta.status(200).json(resultado);
                }
            });
    });
});

// Upload de imagem




// Exporta o módulo
module.exports = app;