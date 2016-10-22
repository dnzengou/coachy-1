var imc = function imc(poids,taille){
    return (parseInt(poids)/(Math.pow((parseInt(taille)/100),2)));
};
exports.imc = imc;


function createCardExo(titre,urlImage,urlDestination,repetition,temps,category,difficulty,session)
{
var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title(titre)
                    .subtitle("Category :"+category+" difficulty : "+ difficulty)
                    .text(repetition+ " pendant " +temps )
                    .images([
                        builder.CardImage.create(session, urlImage)
                    ])
                    .tap(builder.CardAction.openUrl(session, urlDestination))
            ]);
        session.send(msg);
}	

function createCardProgram(titre,urlImage,urlDestination,category,difficulty,session)
{
var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title(titre)
                    .subtitle("Category :"+category+" difficulty : "+ difficulty)
                    .images([
                        builder.CardImage.create(session, urlImage)
                    ])
                    .tap(builder.CardAction.openUrl(session, urlDestination))
            ]);
        session.send(msg);
}

var giveAProgram = function giveAProgram(imc,jsonProgram,session){

	if(imc<29){

		var programs = [];
		var j = 0;
		for(let i=0;i<jsonProgram.length;i++){
			if(jsonProgram[i].difficulte == "easy"){
				programs[j] = jsonProgram[i];
				j++;
				if(j == 2)
					break;
			}
		}
		createCardProgram(programs[0].titre,programs[0].url,programs[0].urlDef,programs[0].category,programs[0].difficulte);
		createCardProgram(programs[1].titre,programs[1].url,programs[1].urlDef,programs[1].category,programs[1].difficulte);

	}else{

		var programs = [];
		var j = 0;
		for(let i=0;i<jsonProgram.length;i++){
			if(jsonProgram[i].difficulte == "hard"){
				programs[j] = jsonProgram[i];
				j++;
				if(j == 2)
					break;
			}
		}
		createCardProgram(programs[0].titre,programs[0].url,programs[0].urlDef,programs[0].category,programs[0].difficulte);
		createCardProgram(programs[1].titre,programs[1].url,programs[1].urlDef,programs[1].category,programs[1].difficulte)
	}

};
exports.giveAProgram = giveAProgram;

var giveAnExo =function giveAnExo(cat,jsonExo,session){

for(let i=0;i<jsonExo.length;i++){

if(jsonExo[i].category== cat){
	createCardExo(jsonExo[i].titre,jsonExo[i].url,jsonExo[i].urlDef,jsonExo[i].repetition,jsonExo[i].temps,jsonExo[i].category,jsonExo[i].difficule,session);
}

}


};
exports.giveAnExo=giveAnExo;