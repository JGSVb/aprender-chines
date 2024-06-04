const chineseText = {
	chineseWordsBox: document.getElementById("chineseTextWords"),
	pinyinWordsBox: document.getElementById("pinyinTextWords"),
	leftoverBox: document.getElementById("leftoverTextWords"),
	prevTextIndex: 0,
	currTextIndex: 0,
	prevString: null,
	currString: null,
	leftoverString: null,
	timedText: null,
	events: null,
	selection: null,
	necessaryFetching: true,

	fetchTimedText: async function(){
		await protocol.getTimedText().then(x => {
			const data = x.getData();
			this.timedText = data;
			this.events = data.events;
		});
	},

	enable: function(){
		cronosStatus.intervalFunction = this.show.bind(this);
	},

	internalUpdate: function(index){
		this.prevTextIndex = this.currTextIndex;
		this.currTextIndex = index;
		this.prevString = this.currString;

		const string = this.getTextByIndex(this.currTextIndex);
		const lines = string.split(/\r?\n/);
		this.currString = string;
		this.leftoverString = "";
		// this.leftoverString = lines[0] + "\n" + lines[2];
	},

	selectTimedText: function(){
		const self = chineseText;

		let index = -1;

		let currTime = cronosStatus.currTimeMS;
		for(let i = 0; i < self.events.length; i++){
			const event = self.events[i];
			const nextEvent = self.events[i+1];

			if(nextEvent &&
				currTime >= event.tStartMs &&
				currTime < nextEvent.tStartMs){

				index = i;
				break;

			} else if(!nextEvent &&
				currTime >= event.tStartMs){

				index = i;
				break;

			}
		}

		if(index == -1){
			return;
		}

		self.internalUpdate(index);

	},

	getTextByIndex: function(index){
		const segs = this.events[index].segs;
		const utf8 = segs.map(x => { return x.utf8 });
		const inOne = utf8.join(" ");
		return inOne;
	},

	showText: async function(){
		if(this.currString == this.prevString){
			return;
		}

		this.chineseWordsBox.innerHTML = "";
		this.pinyinWordsBox.innerHTML = "";

		await protocol.cutChineseString(this.currString).then(async function(x){
			x = x.getData();
			for(let word of x){
				const elem = document.createElement("div");
				elem.innerHTML = word;
				this.chineseWordsBox.appendChild(elem);

				let pinyin = await protocol.pinyin(word);
				pinyin = pinyin.getData();
				const pinyinElem = document.createElement("div");
				pinyinElem.innerHTML = pinyin;
				this.pinyinWordsBox.appendChild(pinyinElem);
			}
		}.bind(this));

		this.leftoverBox.innerHTML = this.leftoverString;
	},

	copyText: function(){
		navigator.clipboard.writeText(this.currString);
		notification.sendGood("Copiado com sucesso!");
	},

	show: async function(){
		if(this.necessaryFetching){
			await this.fetchTimedText();
			this.necessaryFetching = false;
		}

		this.selectTimedText();
		await this.showText();
	}
}

chineseText.enable();

playerStateChangeFunction = function(){
	chineseText.necessaryFetching = true;
};

function getSelectedTextWithinDiv(parentDivId) {
        let selectedText = "";
        const parentDiv = document.getElementById(parentDivId);
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = document.createElement("div");

                // Check if the selection is within the parentDiv
                if (parentDiv.contains(range.commonAncestorContainer)) {
                        container.appendChild(range.cloneContents());
                        selectedText = container.innerText; // Use innerText to get plain text
                }
        }

        return selectedText;
}

document.onselectionchange = () => {

	selectionId++;

	var selection = getSelectedTextWithinDiv("chineseTextWords");

	if(selection.length == 0) {
		return;
	}

	// TODO: remover esta linha abaixo
	chineseSegment = selection;

	chineseText.selection = selection;
	document.getElementById("preview").textContent = chineseSegment;

	updateDictionary(selectionId);
	translator.show();

	document.getElementById("createAnkiCardButtonChinese").innerHTML = chineseText.selection;
};
