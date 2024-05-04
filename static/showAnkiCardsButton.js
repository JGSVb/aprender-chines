const showAnkiCardsDialog = {
	dialogTemplate: document.getElementById("showAnkiCardsDialogTemplate"),
	entryTemplate: null,
	deleteAnkiCardConfirmationTemplate: document.getElementById("deleteAnkiCardConfirmationTemplate"),
	dialog: null,
	ankiCardsDialog: null,
	ankiCardsContainer: null,
	counterElement: null,

	showDeleteCardConfirmation: function(card, index){
		const deleteConfirmation = document.importNode(showAnkiCardsDialog.deleteAnkiCardConfirmationTemplate.content, true);

		deleteConfirmation.getElementById("return").onclick = function(){
			showAnkiCardsDialog.show();
		};

		deleteConfirmation.getElementById("confirm").onclick = function(){
			protocol.deleteCard(card);
			showAnkiCardsDialog.show();
		};

		const fieldContainer = deleteConfirmation.getElementById("ankiCard");
		const cardFieldsTemplate = card.getFieldsTemplate();
		const cardValues = card.getValues();

		for(let i = 0; i < card.getFormat(); i++){
			const cardField = cardFieldsTemplate[i];
			const cardValue = cardValues[i];

			const fieldTemplate = deleteConfirmation.getElementById("fieldTemplate");
			const clone = document.importNode(fieldTemplate.content, true);

			const fieldName = clone.getElementById("fieldName");
			fieldName.innerHTML = cardField[0];

			const fieldValue = clone.getElementById("fieldValue");
			fieldValue.innerHTML = cardValue;

			fieldContainer.appendChild(clone);
		}

		overlay.setContent(deleteConfirmation);
	},

	populate: function(json){
		this.ankiCardsContainer.innerHTML = "";

		data = json.getData();
		data.reverse();

		this.counterElement.innerHTML = data.length;

		for(let i = 0; i < data.length; i++){
			const entry = data[i];

			const clone = document.importNode(this.entryTemplate.content, true);
			const card = new AnkiCard(entry.values, entry.id);

			for(let k = 0; k < card.getFormat(); k++){

				const fieldClone = document.importNode(
				    clone.getElementById("fieldTemplate").content,
				    true);

				fieldClone.getElementById("field").innerHTML = entry.values[k];
				clone.insertBefore(fieldClone, clone.children[clone.children.length - 1]);
			}

			clone.getElementById("deleteAnkiCard").onclick = function(){
				showAnkiCardsDialog.showDeleteCardConfirmation(card, i);
			};

			clone.getElementById("modifyAnkiCard").onclick = function(){
				ankiCardDialog.setCard(card);
				ankiCardDialog.show(
					showSelector=false,
					returnAction=function() {
						showAnkiCardsDialog.show();
					},
				    	submitAction=ankiCardDialog.modifyAnkiCard,
				    	title="Modificar cartão Anki");
			};

			this.ankiCardsContainer.appendChild(clone);
		}
	},

	show: function() {
		this.dialog = document.importNode(this.dialogTemplate.content, true);
		this.ankiCardsDialog = this.dialog.getElementById("ankiCardsDialog");
		this.ankiCardsContainer = this.dialog.getElementById("ankiCardsContainer");
		this.entryTemplate = this.dialog.getElementById("entryTemplate");
		this.counterElement = this.dialog.getElementById("counter");

		overlay.setVisible(true);
		overlay.setContent(this.dialog);

		protocol.getJsonCards().then(this.populate.bind(this));
	}
};
