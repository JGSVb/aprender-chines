let passRightAway = false;
let timedtext = null;

async function logURL(requestDetails) {
	if(passRightAway){
		return;
	}

	if(!requestDetails.url.includes("timedtext")){
		return;
	}

	passRightAway = true;

	const data = await fetch(requestDetails.url)
		.then(resp => {
			return resp.json();
		})
		.then(json => {
			return json;
		});

	timedtext = data;

	serverProtocol.post("http://127.0.0.1:5000/timedtext", timedtext);

	passRightAway = false;
}

browser.webRequest.onBeforeRequest.addListener(logURL, {
	urls: ["https://*.youtube.com/api/*"],
});

