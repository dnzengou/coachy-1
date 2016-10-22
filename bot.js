var restify = require('restify');
var builder = require('botbuilder');
var config = require('./modules/config.js');
var logger = require('./modules/logger.js');
var util = require('./modules/utils.js');
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=5906d0b8-deae-4a09-93cc-7e2dd928d641&subscription-key=de81f2eebace4e2ab0bc50081a7a2360');
var intents = new builder.IntentDialog({recognizers:[recognizer]});
var outfitJson = require('./outfits.json');

 /*window.fbAsyncInit = function() {
    FB.init({
      appId      : 'your-app-id',
      xfbml      : true,
      version    : 'v2.8'
    });
    FB.AppEvents.logPageView();
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
*/



//=========================================================
// Load configuration and Bots Dialogs
//=========================================================

config.load(
    function(err){
        if(err)
        logger.info(err);

//=========================================================
        // Server et Bot configuration and create.
        //=========================================================


        var server = restify.createServer();
        server.listen(3978, function () {
        console.log('%s listening to %s', server.name, server.url);
        });

        var connector = new builder.ChatConnector({
            appId: '6c863556-22a2-4fa4-98b0-c73965f73196',
            appPassword: 'ttS9AigynnPkNyJgkVcBK8p'
        });
        var bot = new builder.UniversalBot(connector);

        server.post('/api/messages', connector.listen());
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
                session.send('What can I do for you ?');
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

        bot.dialog('/help', intents);
        /*bot.dialog('/help', intents[
            function (session) {
                builder.Prompts.text(session, 'how can i help you');
            },
            function (session, results) {
                session.userData.objectif = results.response;
                session.send('your objectif %s',session.userData.objectif);
                session.beginDialog('/imc');
            }
        ]);*/

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

intents.matches('LooseWeight', '/imc');
intents.matches('FindEquipement', [
  function(session, args, next){
    var productToBuy = builder.EntityRecognizer.findEntity(args.entities,'product');
    if(!productToBuy){
      builder.Prompts.text(session, "What would you like to buy ?");
    }else{
      next({response: productToBuy.entity});
    }
  },
  function(session, results){
    if(results.response){
      session.send('Ok, i\'ll guide you through your journey for %s', results.response);
      console.log(results.response)
      for(var article in outfitJson){
        if(results.response.toUpperCase() === outfitJson[article].categorie){
          console.log(outfitJson[article]);
        }

      }
    }else{
      session.send("ok thanks");
    }
  }
]);
