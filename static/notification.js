const notification = {
	pushNotification: function(text, type){
		const nBox = document.getElementById("notificationBox");
		const nElem = document.createElement("div");
		nElem.className = "notification" + type;
		nElem.innerHTML = text;

		nBox.appendChild(nElem);
		nElem.style.opacity = "0.9";

		nElem.onclick = () => {
			nElem.style.display = "none";
		};

		return nElem
	},

	popNotification: function(elem){
		elem.style.opacity = "0";

		setTimeout(function(){
			elem.remove();
		}, 1000);
	},

	sendNotification: function(text, type){
		const nElem = this.pushNotification(text, type);
		setTimeout(function(){
			notification.popNotification(nElem);
		}, 5000);
	},

	sendGood: function(text){
		return this.sendNotification(text, "Good");
	},

	sendBad: function(text){
		return this.sendNotification(text, "Bad");
	}
}
