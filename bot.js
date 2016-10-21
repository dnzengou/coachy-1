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
        if(err)logger.info(err);           

        //=========================================================
        // Dialog Profile
        //=========================================================

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
                session.beginDialog('/menu');
            }
        ]);

        bot.dialog('/profile', [
            function (session) {
                builder.Prompts.text(session, 'Hi ! What is your name ?');
            },
            function (session, results) {
                session.userData.name = results.response;
                session.endDialog();
            }
        ]);

        //=========================================================
        // Dialog Menu
        //=========================================================

        bot.dialog('/menu', [
            function (session) {
                builder.Prompts.choice(session, "What demo would you like to run?", "imc|picture|cards|list|carousel|receipt|actions|(quit)");
            },
            function (session, results) {
                if (results.response && results.response.entity != '(quit)') {
                    session.beginDialog('/' + results.response.entity);
                } else {
                    session.endDialog();
                }
            },
            function (session, results) {
                session.replaceDialog('/menu');
            }
        ]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

        //=========================================================
        // Dialog Profile 
        //=========================================================



         bot.dialog('/imc', [
            function (session, args) {
                if (args && args.reprompt) {
                    builder.Prompts.text(session, "Entre ton poids(kg) suivi de ta taille(cm) ex : 72 - 178")
                } else {
                    builder.Prompts.text(session, "Entre ton poids(kg) suivi de ta taille(cm) ex : 72 - 178");
                }
            },
            function (session, results) {
                logger.info(results.response);
                var res = results.response.split("-");
                res = util.imc(res[0],res[1]);
                builder.Prompts.text(session, "Ton IMC est de "+res);
                session.endDialog();
            }
        ]);
});



