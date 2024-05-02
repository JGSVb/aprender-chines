const ankiCardDialog = {

	dialogTemplate: document.getElementById("ankiCardDialogTemplate"),
	dialog: null,
	selector: null,
	inputBox: null,
	inputArray: null,
	returnButton: null,
	title: null,
	card: null,
	showSelector: true,
	returnAction: null,
	submitAction: null,

	setCard: function(card){
		this.card = card;
	},

	addSelectorOption: function(entry){
		const template = document.getElementById("optionTemplate");
		const clone = document.importNode(template.content, true);
		const real = clone.getElementById("realOption");
		const fake = clone.getElementById("fakeOption");
		real.value = entry;
		real.innerHTML = entry.simplified + " " + entry.pinyin;
		fake.innerHTML = entry.portuguese;

		real.onclick = () => {
			this.inputArray[0].value = entry.simplified;
			this.inputArray[1].value = entry.pinyin;
			this.inputArray[4].value = entry.portuguese;
		};

		this.selector.appendChild(clone);
	},

	updateSelector: async function(){
		this.selector.innerHTML = "<option>Usufrua do dicionário</option>";

		dictionary.forEach(entry => {
			this.addSelectorOption(entry);
		})

		let portuguese = await protocol.translate(chineseSegment, "zh-CN", "pt");
		portuguese = portuguese.getData();
		let pinyin = await protocol.pinyin(chineseSegment);
		pinyin = pinyin.getData();

		this.addSelectorOption({
		       simplified : chineseSegment,
		       pinyin: pinyin,
		       portuguese: portuguese
		});
	},

	populate: function(){
		this.inputArray = [];

		const cardFieldTemplateList = this.card.getFieldsTemplate();
		const cardValueList = this.card.getValues();

		for(let i = 0; i < this.card.getFormat(); i++){
			cardFieldTemplate = cardFieldTemplateList[i];
			cardValue = cardValueList[i];
			const fieldTemplate = this.dialog.getElementById("fieldTemplate");
			const fieldClone = document.importNode(fieldTemplate.content, true);

			const fieldInput = fieldClone.getElementById("fieldInput");
			fieldInput.name = cardFieldTemplate[0];
			fieldInput.placeholder = cardFieldTemplate[1];
			fieldInput.value = cardValue;

			this.inputBox.insertBefore(fieldClone, this.inputBox.lastChild);
			this.inputArray.push(fieldInput);
		}

		if(this.showSelector){
			this.updateSelector();
		}
	},

	addAnkiCard: function(){
		const values = this.inputArray.map(x => x.value);
		const card = new AnkiCard(values);
		protocol.addCard(card).then(resp => {
			if(resp.getStatus() == protocol.SUCCESS){
				overlay.hide();
			}
		})
	},

	modifyAnkiCard: function(){
		const values = this.inputArray.map(x => x.value);
		const card = new AnkiCard(values);
		protocol.replaceCard(this.card, card);
	},

	show: function(showSelector = true, returnAction = null, submitAction = ankiCardDialog.addAnkiCard, title = "Criar cartão Anki"){
		this.dialog = document.importNode(this.dialogTemplate.content, true);
		this.selector = this.dialog.getElementById("dictionaryEntrySelector");
		this.inputBox = this.dialog.getElementById("inputBox");
		this.submitButton = this.dialog.getElementById("submitButton");

		this.showSelector = showSelector;
		this.returnAction = returnAction;

		if(this.showSelector == false){
			this.selector.style.display = "none";
		}

		this.returnButton = this.dialog.getElementById("returnButton");

		if(this.returnAction == null){
			this.returnButton.style.display = "none";
		} else {
			this.returnButton.onclick = returnAction;
		}

		this.submitButton.onclick = submitAction.bind(this);

		this.title = title;

		this.dialog.getElementById("title").innerHTML = title;

		this.populate();

		overlay.setContent(this.dialog);
		overlay.show();
	}

};

async function addAnkiCardButton(){
	const translation = await protocol.translate(chineseText.currString, "zh-CN", "pt").then(resp => {
		return resp.getData();
	});
	const n = new AnkiCard(["", "", chineseText.currString, translation, ""]);
	ankiCardDialog.setCard(n);
	ankiCardDialog.show();
}
