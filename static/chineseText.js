const chineseText = {
	chineseWordsBox: document.getElementById("chineseTextWords"),
	pinyinWordsBox: document.getElementById("pinyinTextWords"),
	prevTextIndex: 0,
	currTextIndex: 0,
	prevString: null,
	currString: null,
	timedText: null,
	events: null,
	necessaryFetching: true,

	fetchTimedText: function(){
		protocol.getTimedText().then(x => {
			this.timedText = x;
			this.events = x.events;
		});
	},

	enable: function(){
		cronosStatus.intervalFunction = this.show.bind(this);
	},

	internalUpdate: function(index){
		this.prevTextIndex = this.currTextIndex;
		this.currTextIndex = index;
		this.prevString = this.currString;
		this.currString = this.getTextByIndex(this.currTextIndex);
	},

	selectTimedText: function(){
		const self = chineseText;

		let index = -1;

		let currTime = cronosStatus.currTimeMS;
		for(let i = 0; i < self.events.length; i++){
			const event = self.events[i];
			const nextEvent = self.events[i+1];

			if(currTime >= event.tStartMs &&
				currTime <= (event.tStartMs + event.dDurationMs)){

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

	showText: function(){
		if(this.currString == this.prevString){
			return;
		}

		this.chineseWordsBox.innerHTML = "";
		this.pinyinWordsBox.innerHTML = "";

		protocol.cutChineseString(this.currString).then(x => {
			for(let word of x){
				const elem = document.createElement("div");
				elem.innerHTML = word;
				this.chineseWordsBox.appendChild(elem);

				protocol.pinyin(word).then(x => {
					const elem = document.createElement("div");
					elem.innerHTML = x;
					this.pinyinWordsBox.appendChild(elem);
				});
			}
		})
	},

	copyText: function(){
		navigator.clipboard.writeText(this.currString);
	},

	show: function(){
		if(this.necessaryFetching){
			this.fetchTimedText();
			this.necessaryFetching = false;
		}

		this.selectTimedText();
		this.showText();
	}
}

chineseText.enable();
playerStateChangeFunction = function(){
	chineseText.necessaryFetching = true;
};
