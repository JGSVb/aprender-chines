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

	default_return: function(resp){
		const retObj = {
			data: resp.data,
			then: function(f){
				return f(resp.data);
			}.bind(resp),
		}

		if(resp.status == this.SUCCESS){
			return retObj;
		} else {
			return null;
		}
	},

	post: async function(url, data, notificationOptions){
		const resp = await fetch(url, {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json"
				}
			}).then(response => {
				return response.json()
			}).then(json => {
				return json;
			});

		this.notifier(resp, notificationOptions);
		return this.default_return(resp);
	},

	get: async function(url, notificationOptions){
		const resp = await fetch(url)
			.then(response => {return response.json()})
			.then(json => {
				return json;
			});

		this.notifier(resp, notificationOptions);
		return this.default_return(resp);
	},

	delete: async function(url, notificationOptions){
		const resp = await fetch(url, {
				method: "DELETE",
			}).then(response => {
				return response.json()
			}).then(json => {
				return json;
			});

		this.notifier(resp, notificationOptions);
		return this.default_return(resp);
	},

	getJsonCards: function(notificationOptions={}){
		return this.get("json_cards", notificationOptions);
	},

	addCard: function(card, notificationOptions={successMessage: "Sucesso ao adicionar carta", errorMessage: "Impossível adicionar carta"}){
		return this.post("addcard", card.values, notificationOptions);
	},

	replaceCard: function(olderCard, card, notificationOptions={successMessage: "Carta substituída com sucesso", errorMessage: "Impossível substituir carta"}){
		return this.post("card/" + olderCard.id, card.value,  notificationOptions);
	},

	deleteCard: function(card, notificationOptions={successMessage: "Sucesso ao deletar carta", errorMessage: "Impossível deletar carta"}){
		return this.delete("card/" + card.id, notificationOptions);
	},

	cutChineseString: function(text, notificationOptions={notifyError: false, notifySuccess: false}){
		return this.post("cut_chinese_string", text);
	}

}
