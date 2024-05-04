let passRightAway = false;
let timedtext = null;
let onRightTab = false;

async function logURL(requestDetails) {
	if(passRightAway || !onRightTab || !requestDetails.url.includes("timedtext")){
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

	const postData = {
		timedtext: data,
		url: requestDetails.url,
	};

	serverProtocol.post("http://127.0.0.1:5000/timedtext", postData);

	passRightAway = false;
}

browser.webRequest.onBeforeRequest.addListener(logURL, {
	urls: ["https://*.youtube.com/api/*"],
});


async function onActivated(activeInfo){
	const tab = await browser.tabs.get(activeInfo.tabId);
	let url = String(tab.url);

	onRightTab = url.includes("localhost") || url.includes("127.0.0.1");
	console.log(onRightTab);
}

browser.tabs.onActivated.addListener(onActivated);
