const serverProtocol = {
	SUCCESS: "success",
	ERROR: "error",

	defaultReturn: function(json){
		json.getData = function(){
			return json.data;
		};
		json.getStatus = function(){
			return json.status;
		};

		return json;
	},

	post: async function(url, data){
		const resp = await fetch(url, {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json"
					}});

		const json = await resp.json();

		return this.defaultReturn(json);
	},

	get: async function(url){
		const resp = await fetch(url);
		const json = await resp.json();

		return this.defaultReturn(json);
	},

	delete: async function(url){
		const resp = await fetch(url, {
				method: "DELETE"});
		const json = await resp.json();

		return this.defaultReturn(json);
	},
}
