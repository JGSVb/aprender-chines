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

	post: async function(url, data, notificationOptions){
		const resp = await fetch(url, {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json"
					}});

		const json = await resp.json();
		const respData = json.data;

		this.notifier(json, notificationOptions);
		return respData;
	},

	get: async function(url, notificationOptions){
		const resp = await fetch(url);
		const json = await resp.json();
		const respData = json.data;

		this.notifier(json, notificationOptions);
		return respData;
	},

	delete: async function(url, notificationOptions){
		const resp = await fetch(url, {
				method: "DELETE"});
		const json = await resp.json();
		const respData = json.data;

		this.notifier(json, notificationOptions);
		return respData;
	},

	getJsonCards: function(notificationOptions={}){
		return this.get("json_cards", notificationOptions);
	},

	addCard: function(card, notificationOptions={successMessage: "Sucesso ao adicionar carta", errorMessage: "Impossível adicionar carta"}){
		return this.post("addcard", card.values, notificationOptions);
	},

	replaceCard: function(olderCard, card, notificationOptions={successMessage: "Carta substituída com sucesso", errorMessage: "Impossível substituir carta"}){
		return this.post("card/" + olderCard.id, card.getValues(), notificationOptions);
	},

	deleteCard: function(card, notificationOptions={successMessage: "Sucesso ao deletar carta", errorMessage: "Impossível deletar carta"}){
		return this.delete("card/" + card.id, notificationOptions);
	},

	cutChineseString: function(text, notificationOptions=notificationOptionsNoNotify){
		return this.post("cut_chinese_string", text, notificationOptions);
	},

	getTimedText: function(notificationOptions=notificationOptionsNoNotify){
		return this.get("timedtext", notificationOptions);
	},

	pinyin: function(chineseText, notificationOptions=notificationOptionsNoNotify){
		return this.post("pinyin", chineseText, notificationOptions);
	},

	translate: function(text, source, target, notificationOptions=notificationOptionsNoNotify){
		return this.post("translate",
			{
				text: text,
				sourceLanguage: source,
				targetLanguage: target
			}, notificationOptions);
	}

}
