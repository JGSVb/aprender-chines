class Api {
	constructor(url){
		this.url = url
	}

	invoke(action, params={}){
		const xhr = new XMLHttpRequest()

		return new Promise((resolve, reject) => {

			xhr.onreadystatechange = function() {

				if(xhr.readyState !== 4) return;

				if(xhr.status == 200 && xhr.status < 300){
					resolve(JSON.parse(xhr.response))
				} else {
					reject({
						status: xhr.status,
						statusText: xhr.statusText
					})
				}

			}

			xhr.open("POST", this.url)
			xhr.setRequestHeader("Content-Type", "application/json")
			xhr.send(JSON.stringify({ action, params }))
		})
	}
}

export default new Api("http://localhost:5000")
