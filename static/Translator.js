const TranslatorContent = {
	PHRASE: "phrase",
	SELECTION: "selection",
};

const translatorVectors = [
	{
		text: TranslatorContent.PHRASE,
		elementId: "translatorEnglishPhrase",
		source: "zh-CN",
		target: "en",
	},
	{
		text: TranslatorContent.PHRASE,
		elementId: "translatorPortuguesePhrase",
		source: "zh-CN",
		target: "pt",
	},
	{
		text: TranslatorContent.SELECTION,
		elementId: "translatorEnglishSelection",
		source: "zh-CN",
		target: "en",
	},
	{
		text: TranslatorContent.SELECTION,
		elementId: "translatorPortugueseSelection",
		source: "zh-CN",
		target: "pt",
	},
];

class Translator {
	currentValues = [];
	oldValues = [];

	constructor(){
		for(let i = 0; i < translatorVectors.length; i++){
			this.currentValues.push("");
			this.oldValues.push("");
		}
	}

	async translate(){
		for(let i = 0; i < translatorVectors.length; i++){
			const vec = translatorVectors[i];
			let text;
			let result;

			if(vec.text == TranslatorContent.PHRASE){
				text = chineseText.selection;
			} else if (vec.text == TranslatorContent.SELECTION){
				text = chineseText.currString;
			}

			result = await protocol.translate(text, vec.source, vec.target);
			result = await result.getData();

			if(!result){
				return;
			}

			this.oldValues[i] = this.currentValues[i];
			this.currentValues[i] = result;
		}

	}

	async show(){
		await this.translate();

		for(let i = 0; i < translatorVectors.length; i++){
			const vec = translatorVectors[i];
			const elem = document.getElementById(vec.elementId);

			if(this.currentValues[i] == this.oldValues[i]){
				continue;
			}

			elem.innerHTML = this.currentValues[i];

		}
	}
};

const translator = new Translator();
