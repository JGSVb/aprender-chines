const ShowAnkiCardsDialog = {
	ankiCardsDialog: document.getElementById("ankiCardsDialog"),
	ankiCardEntryTemplate: document.getElementById("ankiCardEntryTemplate"),
	ankiCardsContainer: document.getElementById("ankiCardsContainer"),

	populate: function(json){
		this.ankiCardsContainer.innerHTML = "";

		json.forEach(entry => {
			const clone = document.importNode(this.ankiCardEntryTemplate.content, true);
			clone.getElementById("hanzi").innerHTML = entry[0];
			clone.getElementById("pinyin").innerHTML = entry[1];
			clone.getElementById("example").innerHTML = entry[2];
			clone.getElementById("meaning").innerHTML = entry[3];
			this.ankiCardsContainer.appendChild(clone);

		})
	},

	show: function() {
		Overlay.setVisible(true);
		Overlay.setPurpose(PURPOSE_SHOWCARDS);
		fetch("cards" + textEditionInput.value)
			.then(response => {return response.json()})
			.then(json=> {
				this.populate(json);
		});
	}
};
