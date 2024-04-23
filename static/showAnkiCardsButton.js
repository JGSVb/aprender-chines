const ShowAnkiCardsDialog = {
	dialogTemplate: document.getElementById("ankiCardsDialogTemplate"),
	ankiCardEntryTemplate: document.getElementById("ankiCardEntryTemplate"),
	deleteAnkiCardConfirmationTemplate: document.getElementById("deleteAnkiCardConfirmationTemplate"),
	dialog: null,
	ankiCardsDialog: null,
	ankiCardsContainer: null,

	showDeleteCardConfirmation: function(entry, index){
		const deleteConfirmation = document.importNode(this.deleteAnkiCardConfirmationTemplate.content, true);

		deleteConfirmation.getElementById("return").onclick = function(){
			this.show();
		}.bind(this);

		Overlay.setContent(deleteConfirmation);
	},

	populate: function(json){
		this.ankiCardsContainer.innerHTML = "";

		json.reverse();

		for(let i = 0; i < json.length; i++){
			const entry = json[i];

			const clone = document.importNode(this.ankiCardEntryTemplate.content, true);
			clone.getElementById("hanzi").innerHTML = entry[0];
			clone.getElementById("pinyin").innerHTML = entry[1];
			clone.getElementById("example").innerHTML = entry[2];
			clone.getElementById("meaning").innerHTML = entry[3];

			clone.getElementById("deleteAnkiCard").onclick = function(){
				this.showDeleteCardConfirmation(entry, i);
			}.bind(this);

			clone.getElementById("modifyAnkiCard").onclick = function(){
				createAnkiCardDialog.show();
			};

			this.ankiCardsContainer.appendChild(clone);
		}
	},

	show: function() {
		this.dialog = document.importNode(this.dialogTemplate.content, true);
		this.ankiCardsDialog = this.dialog.getElementById("ankiCardsDialog");
		this.ankiCardsContainer = this.dialog.getElementById("ankiCardsContainer");

		Overlay.setVisible(true);
		Overlay.setContent(this.dialog);

		fetch("cards")
			.then(response => {return response.json()})
			.then(json=> {
				this.populate(json);
		});
	}
};
