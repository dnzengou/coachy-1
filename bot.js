var restify = require('restify');
var builder = require('botbuilder');
var config = require('./modules/config.js');
var logger = require('./modules/logger.js');
var util = require('./modules/utils.js');



//=========================================================
// Server et Bot configuration and create.
//=========================================================


var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
}); 
  
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());



//=========================================================
// Load configuration and Bots Dialogs
//=========================================================

config.load(
    function(err){
        if(err)
        logger.info(err);           

        bot.dialog('/', [
            function (session, args, next) {
                if (!session.userData.name) {
                    session.beginDialog('/profile');
                } else {
                    next();
                }
            },
            function (session, results) {
                session.send('Hello %s !', session.userData.name);
                session.send('Presentation !');
                session.beginDialog('/help');
            }, 
            function (session, results) {
                session.send("Ok... See you later %s!",session.userData.name);
            }
        ]);

        bot.dialog('/profile', [
            function (session) {
                builder.Prompts.text(session, 'Hi ! What is your name ?');
            },
            function (session, results) {
                if(results.response){
                    session.userData.name = results.response;
                    session.endDialog();
                }
            }
        ]);

        bot.dialog('/help', [
            function (session) {
                builder.Prompts.text(session, 'how can i help you');
            },
            function (session, results) {
                session.userData.objectif = results.response;
                session.send('your objectif %s',session.userData.objectif); 
                session.beginDialog('/imc');
            }
        ]);

         bot.dialog('/imc', [
            function (session, args) {
                session.send('presentation pour calcul imc'); 
                builder.Prompts.number(session, 'demande weight');
            },
            function (session, results) {
                session.userData.weight = results.response;
                builder.Prompts.number(session, 'demande heigth');
            },
            function (session, results) {
                session.userData.heigth = results.response;
                session.send('resultat imc %s %s',session.userData.heigth,session.userData.weight);
                session.beginDialog('/programs');
            }
        ]);

        bot.dialog('/programs', [
            function (session, args) {
                session.send('presentation programs'); 
                var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Fitness")
                    .subtitle("Adbominal beginners program")
                    .text("The abdominal programme.")
                    .images([
                        builder.CardImage.create(session, "http://www.musculaction.com/images/intro-exercices-abdominaux.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "http://entrainement-sportif.fr/programme-musculation-abdominaux-debutant.pdf"))
            ]);
        session.send(msg);
                builder.Prompts.text(session, 'is good ?');
            },
            function (session, results) {
                session.beginDialog('/help');
            }
        ]);


});



