var imc = function imc(poids,taille){
    return (parseInt(poids)/(Math.pow((parseInt(taille)/100),2)));
};
exports.imc = imc;