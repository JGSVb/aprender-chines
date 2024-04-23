const createAnkiCardDialog = {

	dialogTemplate: document.getElementById("createAnkiCardDialogTemplate"),
	dialog: null,
	selector: null,
	hanzi: null,
	pinyin: null,
	example: null,
	meaning: null,

	dictionaryEntrySelectorChanged: function(){
		var index = this.selector.value;

		if(dictionary.length == 0){
			return;
		}

		if(index == -1){
			this.hanzi.value = chineseSegment;

			this.pinyin.placeholder = "Atualizando pinyin...";
			this.pinyin.value = "";
			fetch("/pinyin?chinese="+chineseSegment)
				.then(response => { return response.text();})
				.then(t => {
					this.pinyin.value = t;
					this.pinyin.placeholder = "Pergunta B";
				});

			this.meaning.placeholder = "Traduzindo...";
			this.meaning.value = "";
			fetch("/translate?way=zh-CN,pt&text="+chineseSegment)
				.then(response => { return response.text();})
				.then(t => {
					this.meaning.value = t;
					this.meaning.placeholder = "Significado";
				});
		} else {
			this.hanzi.value = dictionary[index].simplified;
			this.pinyin.value = dictionary[index].pinyin;
			this.meaning.value = dictionary[index].portuguese;
		}
	},

	submitAnkiCardButton: function(){
		fetch("anki_routine?question_a=" 	+ this.hanzi.value +
					"&question_b=" 	+ this.pinyin.value +
					"&awnser=" 	+ this.example.value +
					"&meaning=" 	+ this.meaning.value)
			.then(response => {return response.text()})
			.then(text => {
				if(!text){
					sendNotification("Carta adicionada com sucesso", TYPE_GOOD);
				} else {
					sendNotification(text, TYPE_BAD);
				}
			});

		Overlay.setVisible(false);
	},


	populate: function(){
		this.selector.innerHTML = "";

		const optionTemplate = document.getElementById("optionTemplate");

		var i = 0;
		dictionary.forEach(entry => {
			const clone = document.importNode(optionTemplate.content, true);
			const real = clone.getElementById("realOption");
			real.value = i++;

			if(entry.simplified == entry.traditional){
				real.innerHTML = entry.simplified;
			} else {
				real.innerHTML = entry.simplified + " (" + entry.traditional + ")";
			}
			real.innerHTML += ", " + entry.pinyin;

			const fake = clone.getElementById("fakeOption");
			fake.innerHTML = entry.portuguese;

			this.selector.appendChild(clone);
		});

		var shouldAddSegment = true;

		for(const e of dictionary){
			if(e.simplified == chineseSegment || e.traditional == chineseSegment){
				shouldAddSegment = false;
			}
		}

		if(shouldAddSegment){
			const clone = document.importNode(optionTemplate.content, true);
			const real = clone.getElementById("realOption");
			fetch("/pinyin?chinese=" + chineseSegment)
				.then(response => { return response.text() })
				.then(text => {
					real.innerHTML = chineseSegment + ", " + text;
				})
			real.value = -1;
			this.selector.appendChild(real);
		}


		this.example.value = chineseText;

		this.selector.value = 0;
		this.dictionaryEntrySelectorChanged();
	},

	show: function(){
		this.dialog = document.importNode(this.dialogTemplate.content, true);
		this.selector = this.dialog.getElementById("dictionaryEntrySelector");

		this.hanzi = this.dialog.getElementById("hanziInput");
		this.pinyin = this.dialog.getElementById("pinyinInput");
		this.example = this.dialog.getElementById("exampleInput");
		this.meaning = this.dialog.getElementById("meaningInput");

		this.populate();

		Overlay.setContent(this.dialog);
		Overlay.show();
	}

};


