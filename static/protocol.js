const notificationOptionsNoNotify = {
	notifyError: false,
	notifySuccess: false
};

const protocol = {
	SUCCESS: "success",
	ERROR: "error",
	notificationOptions: {
		notifyError: true,
		notifySuccess: true,
		successMessage: "Sucesso",
		errorMessage: "Erro",
	},

	notifier: function(resp, options){
		options = {...this.notificationOptions, ...options};

		if((resp.status == this.SUCCESS) && options.notifySuccess){
			notification.sendGood(options.successMessage);
		}

		if((resp.status == this.ERROR) && options.notifyError){
			notification.sendBad(options.errorMessage + ": " + resp.message);
		}
	},

	defaultReturn: function(json){
		json.getData = function(){
			return json.data;
		};
		json.getStatus = function(){
			return json.status;
		};

		return json;
	},

	post: async function(url, data, notificationOptions){
		const resp = await fetch(url, {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json"
					}});

		const json = await resp.json();

		this.notifier(json, notificationOptions);
		return this.defaultReturn(json);
	},

	get: async function(url, notificationOptions){
		const resp = await fetch(url);
		const json = await resp.json();

		this.notifier(json, notificationOptions);
		return this.defaultReturn(json);
	},

	delete: async function(url, notificationOptions){
		const resp = await fetch(url, {
				method: "DELETE"});
		const json = await resp.json();

		this.notifier(json, notificationOptions);
		return this.defaultReturn(json);
	},

	getJsonCards: async function(notificationOptions={}){
		return await this.get("/json_cards", notificationOptions);
	},

	getCardJson: async function(index, notificationOptions={}){
		return await this.get("/json_card_by_index?index=" + index);
	},

	addCard: async function(card, notificationOptions={successMessage: "Sucesso ao adicionar carta", errorMessage: "Impossível adicionar carta"}){
		return await this.post("/addcard", card.values, notificationOptions);
	},

	replaceCard: async function(olderCard, card, notificationOptions={successMessage: "Carta substituída com sucesso", errorMessage: "Impossível substituir carta"}){
		return await this.post("/card/" + olderCard.id, card.getValues(), notificationOptions);
	},

	deleteCard: async function(card, notificationOptions={successMessage: "Sucesso ao deletar carta", errorMessage: "Impossível deletar carta"}){
		return await this.delete("/card/" + card.id, notificationOptions);
	},

	cutChineseString: async function(text, notificationOptions=notificationOptionsNoNotify){
		return await this.post("/cut_chinese_string", text, notificationOptions);
	},

	getTimedtext: async function(lang, notificationOptions=notificationOptionsNoNotify){
		return await this.get("/timedtext?lang=" + lang, notificationOptions);
	},

	listTimedtext: async function(notificationOptions=notificationOptionsNoNotify){
		return await this.get("/list_timedtext", notificationOptions);
	},

	pinyin: async function(chineseText, notificationOptions=notificationOptionsNoNotify){
		return await this.post("/pinyin", chineseText, notificationOptions);
	},

	translate: async function(text, source, target, notificationOptions=notificationOptionsNoNotify){
		return await this.post("/translate",
			{
				text: text,
				sourceLanguage: source,
				targetLanguage: target
			}, notificationOptions);
	},

	searchImage: async function(query, notificationOptions={
		successMessage: "Sucesso ao fazer busca por imagem",
		errorMessage: "Impossível buscar imagem"
	}){

		return await this.get("/image_search?q="+query,
			notificationOptions);
	}

}
