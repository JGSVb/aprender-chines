const serverProtocol = {
	SUCCESS: "success",
	ERROR: "error",

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

	post: async function(url, data){
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

		return this.default_return(resp);
	},

	get: async function(url){
		const resp = await fetch(url)
			.then(response => {return response.json()})
			.then(json => {
				return json;
			});

		return this.default_return(resp);
	},

	delete: async function(url){
		const resp = await fetch(url, {
				method: "DELETE",
			}).then(response => {
				return response.json()
			}).then(json => {
				return json;
			});

		return this.default_return(resp);
	},
}
