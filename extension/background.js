let passRightAway = false;
let timedText = null;

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

	timedText = data;

	passRightAway = false;
}

browser.webRequest.onBeforeRequest.addListener(logURL, {
	urls: ["https://*.youtube.com/api/*"],
});
