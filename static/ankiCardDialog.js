const ankiCardDialog = {

	dialogTemplate: document.getElementById("ankiCardDialogTemplate"),
	dialog: null,
	selector: null,
	inputBox: null,
	inputArray: null,
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

	buildField: function(i){
		const cardFieldTemplateList = this.card.getFieldsTemplate();
		const cardValueList = this.card.getValues();

		cardFieldTemplate = cardFieldTemplateList[i];

		cardValue = cardValueList[i];
		const fieldTemplate = this.dialog.getElementById("fieldTemplate");
		const fieldClone = document.importNode(fieldTemplate.content, true);

		const fieldInput = fieldClone.getElementById("fieldInput");
		fieldInput.name = cardFieldTemplate[0];
		fieldInput.placeholder = cardFieldTemplate[1];
		fieldInput.value = cardValue;

		const fieldRevertButton = fieldClone.getElementById("revertButton");

		if(cardFieldTemplate[3].revertButton == false){
			fieldRevertButton.style.display = "none";
		} else {
			fieldRevertButton.onclick = async function() {
				protocol.getCardJson(-1).then(resp => {
					fieldInput.value = resp.data.values[i];
				})
			}
		}

		const fieldUpdateButton = fieldClone.getElementById("updateButton");

		if(cardFieldTemplate[3].updateButton == false){
			fieldUpdateButton.style.display = "none";
		} else {
			fieldUpdateButton.onclick = cardFieldTemplate[3].updateButtonAction.bind(this);
		}

		if(cardFieldTemplate[2] == "image"){
			const is = new ImageSearch("banana");
			const elem = is.getElement();
			is.update();

			fieldClone.appendChild(elem);
		}

		return [fieldClone, fieldInput, fieldRevertButton];
	},

	populate: function(){
		this.inputArray = [];

		const cardFieldTemplateList = this.card.getFieldsTemplate();
		const cardValueList = this.card.getValues();

		for(let i = 0; i < this.card.getFormat(); i++){
			const [fieldClone, fieldInput, revertButton] = this.buildField(i);
			this.inputBox.insertBefore(fieldClone, this.inputBox.lastElementChild);
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

		this.showSelector = showSelector;
		this.returnAction = returnAction;

		if(this.showSelector == false){
			this.selector.style.display = "none";
		}


		this.title = title;

		this.dialog.getElementById("title").innerHTML = title;

		this.populate();

		let buttons = [{
				label: "enviar",
				onclick: submitAction.bind(this) }]

		if(this.returnAction){
			buttons.push({
				label: "Voltar atrás",
				onclick: returnAction.bind(this)
			})
		}

		overlay.setButtons(...buttons)

		overlay.setContent(this.dialog);
		overlay.show();
	}

};

async function addAnkiCardButton(){
	const translation = await protocol.translate(chineseText.currString, "zh-CN", "pt").then(resp => {
		return resp.getData();
	});
	const n = new AnkiCard(["", "", chineseText.currString, translation, ""]);
	// const n = new AnkiCard(["", "", chineseText.currString, translation, "", ""]);
	ankiCardDialog.setCard(n);
	ankiCardDialog.show();

	ankiCardDialog.selector.children[1].onclick();
}
