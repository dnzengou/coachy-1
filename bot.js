var restify = require('restify');
var builder = require('botbuilder');
var config = require('./modules/config.js');
var logger = require('./modules/logger.js');
var exos = require('./json/exos.json');
var jsonProgram = require('./json/programs.json');
var tips = require('./json/tips.json');
var outfits = require('./json/outfits.json');
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=5906d0b8-deae-4a09-93cc-7e2dd928d641&subscription-key=de81f2eebace4e2ab0bc50081a7a2360');
var intents = new builder.IntentDialog({recognizers:[recognizer]});

//=========================================================
// Load configuration and Bots Dialogs
//=========================================================

config.load(
    function(err) {
        if (err)
            logger.info(err);

        //=========================================================
        // Server et Bot configuration and create.
        //=========================================================


        var server = restify.createServer();
        server.listen(3978, function() {
            console.log('%s listening to %s', server.name, server.url);
        });

        var connector = new builder.ChatConnector({
            appId: '6c863556-22a2-4fa4-98b0-c73965f73196' || process.env.MICROSOFT_APP_ID,
            appPassword: 'ttS9AigynnPkNyJgkVcBK8p' || process.env.MICROSOFT_APP_PASSWORD
        });
        var bot = new builder.UniversalBot(connector);
        server.post('/api/messages', connector.listen());


        //=========================================================
        // Dialogs.
        //=========================================================



        bot.dialog('/', [
            function(session, args, next) {
                if (!session.userData.name) {
                    session.beginDialog('/profile');
                } else {
                    next();
                }
            },
            function(session, results) {
                    session.send('Hello %s !', session.userData.name);
                    session.send(config.presentation);
                    session.beginDialog('/help');
            }
        ]);

        bot.dialog('/profile', [
            function(session) {
                builder.Prompts.text(session, 'Hi ! What is your name ?');
            },
            function(session, results) {
                if (results.response) {
                    session.userData.name = results.response;
                    session.endDialog();
                }
            }
        ]);

        bot.dialog('/help', intents);

       /* bot.dialog('/help', [
            function(session) {
                builder.Prompts.text(session, config.presentation);
            },
            function(session, results) {
                session.userData.objectif = results.response;
                session.beginDialog('/imc');
            }
        ]);*/

        bot.dialog('/imc', [
            function(session, args) {
                builder.Prompts.number(session, config.weightt);
            },
            function(session, results) {
                session.userData.weightt = results.response;
                builder.Prompts.number(session, config.height);
            },
            function(session, results) {
                session.userData.height = results.response;
                session.userData.imc = imc(session.userData.weightt, session.userData.height);
                session.send('Your IMC is %s %s', session.userData.imc, config.overweight);
                session.beginDialog('/programs');
            }
        ]);

        bot.dialog('/programs', [
            function(session, args) {
                builder.Prompts.choice(session, config.askfrequency, ["1 a week", "2 a week", "3 a week"]);
            },
            function(session, results) {
                session.userData.frequency = results.response.entity;
                builder.Prompts.choice(session, config.askfrequency, ["20 min", "30 min", "More than 1 hour"]);
            },
            function(session, results) {
                session.userData.time = results.response.entity;
                session.send('%s', config.programs);
                session.send(createCarrousselProgram(jsonProgram[0],jsonProgram[1],jsonProgram[2],session));
                session.send('%s', config.thanks);
                builder.Prompts.text(session, config.anythingelse);
            },
            function(session, results) {
                session.userData.stuff = results.response;
                session.beginDialog('/store');
            }
        ]);


        bot.dialog('/store', [
            function(session, args) {
                session.send('%s', config.outfit);
                session.beginDialog('/end');
            },function(session, results) {
                 session.send(createCarrousselOutfit(outfits[1],outfits[3],outfits[5],session));
                 session.beginDialog('/end');
            }
        ]);

        bot.dialog('/end', [
            function(session, args, next) {
                var k = 1;
                if(session.userData.imc){
                    session.send("I remember you your IMC %s.\n You have to train %s %s , don't forget !", session.userData.imc, session.userData.frequency, session.userData.time);
                    k = 2;
                }
                session.send("Here is a tips : %s", tips[k].content);
                session.send("%s See you later %s !", config.end, session.userData.name);
                session.endDialog();
            }
        ]);


        bot.dialog('/exercices', [
            function(session, args, next) {
              session.send("Here is some exercices %s", session.userData.name);         
              session.send(createCarrousselExos(exos[3],exos[5],exos[7],session));  
              session.send("I have an idea will you do your exercices in a nearby sport center ?");  
              session.beginDialog('/nearby'); 
            }
        ]);

        bot.dialog('/search', [
            function(session, args, next) {
              //afficher
              session.beginDialog('/end'); 
            }
        ]);
        bot.dialog('/nearby', intents);
        
        intents.matches('LooseWeight','/imc');
        intents.matches('Tone','/exercices');
        intents.matches('Muscle','/exercices');
        intents.matches('FIndBuddy','/exercices');
        intents.matches('Exercice','/exercices');
        intents.matches('Gym',function(session, args, next){
            session.beginDialog('/search');  
        });

    });



        


// utils

function imc(poids, taille) {
    return (parseInt(poids) / (Math.pow((parseInt(taille) / 100), 2))).toFixed(2);
};


function createCarrousselProgram(json1, json2, json3, session) {
    var msg = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments([
            new builder.HeroCard(session)
            .title(json1.titre)
            .subtitle("Category : " + json1.categorie + " difficulty : " + json1.difficulte)
            .images([
                builder.CardImage.create(session, json1.url)
                .tap(builder.CardAction.showImage(session, json1.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json1.urlDef,"I want this")
            ]),
            new builder.HeroCard(session)
            .title(json2.titre)
            .subtitle("Category : " + json2.categorie + " difficulty : " + json2.difficulte)
            .images([
                builder.CardImage.create(session, json2.url)
                .tap(builder.CardAction.showImage(session, json2.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json2.urlDef,"I want this")
            ]),
            new builder.HeroCard(session)
            .title(json2.titre)
            .subtitle("Category : " + json3.categorie + " difficulty : " + json3.difficulte)
            .images([
                builder.CardImage.create(session, json3.url)
                .tap(builder.CardAction.showImage(session, json3.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json3.urlDef,"I want this")
                            ])
        ]);
    return msg;
}

function createCarrousselOutfit(json1, json2, json3, session) {
    var msg = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments([
            new builder.HeroCard(session)
            .title(json1.titre)
            .subtitle("Category : " + json1.categorie)
            .images([
                builder.CardImage.create(session, json1.url)
                .tap(builder.CardAction.showImage(session, json1.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json1.urlDef,"I want this")
            ]),
            new builder.HeroCard(session)
            .title(json2.titre)
            .subtitle("Category : " + json2.categorie )
            .images([
                builder.CardImage.create(session, json2.url)
                .tap(builder.CardAction.showImage(session, json2.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json2.urlDef,"I want this")
            ]),
            new builder.HeroCard(session)
            .title(json2.titre)
            .subtitle("Category : " + json3.categorie)
            .images([
                builder.CardImage.create(session, json3.url)
                .tap(builder.CardAction.showImage(session, json3.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json3.urlDef,"I want this")
                            ])
        ]);
    return msg;
}

function createCarrousselExos(json1, json2, json3, session) {
    var msg = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments([
            new builder.HeroCard(session)
            .title(json1.titre)
            .subtitle("Category : " + json1.categorie)
            .text("Reps : "+json1.repetition +  " Temps : "+json1.temps)
            .images([
                builder.CardImage.create(session, json1.url)
                .tap(builder.CardAction.showImage(session, json1.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json1.urlDef,"I want this")
            ]),
            new builder.HeroCard(session)
            .title(json2.titre)
            .subtitle("Category : " + json2.categorie )
            .text("Reps : "+json2.repetition +  " Temps : "+json2.temps)
            .images([
                builder.CardImage.create(session, json2.url)
                .tap(builder.CardAction.showImage(session, json2.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json2.urlDef,"I want this")
            ]),
            new builder.HeroCard(session)
            .title(json3.titre)
            .subtitle("Category : " + json3.categorie)
            .text("Reps : "+json3.repetition +  " Temps : "+json3.temps)
            .images([
                builder.CardImage.create(session, json3.url)
                .tap(builder.CardAction.showImage(session, json3.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, json3.urlDef,"I want this")
             ])
        ]);
    return msg;
}