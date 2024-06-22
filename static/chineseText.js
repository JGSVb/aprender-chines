const chineseText = {
	subtitlesBox: document.querySelector("#subtitlesBox"),
	nextTextBoxChinese: document.querySelector("#subtitlesBox > .next > .text > .chinese"),
	previousTextBoxChinese: document.querySelector("#subtitlesBox > .previous > .text > .chinese"),
	currentTextBoxChinese: document.querySelector("#subtitlesBox > .current > .text > .chinese"),
	nextTextBoxPinyin: document.querySelector("#subtitlesBox > .next > .text > .pinyin"),
	previousTextBoxPinyin: document.querySelector("#subtitlesBox > .previous > .text > .pinyin"),
	currentTextBoxPinyin: document.querySelector("#subtitlesBox > .current > .text > .pinyin"),
	secondaryTextBox: document.querySelector("#subtitlesBox > .current > .secondary"),
	nextBox: document.querySelector("#subtitlesBox > .next"),
	previousBox: document.querySelector("#subtitlesBox > .previous"),
	currentBox: document.querySelector("#subtitlesBox > .current"),
	nextTextBox: document.querySelector("#subtitlesBox > .next > .text"),
	previousTextBox: document.querySelector("#subtitlesBox > .previous > .text"),
	currentTextBox: document.querySelector("#subtitlesBox > .current > .text"),
	update: true,
	secondaryUpdate: true,
	prevTextIndex: 0,
	currTextIndex: -1,
	nextTextIndex: 0,
	prevString: null,
	currString: null,
	nextString: null,
	secondaryString: null,
	secondaryIndex: null,
	leftoverString: null,
	timedText: null,
	secondaryTimedtext: null,
	events: null,
	secondaryEvents: null,
	selection: null,
	necessaryFetching: true,
	freeze: false,

	fetchTimedText: async function(){
		const language_list = await protocol.listTimedtext().then(x => {
			return x.getData();
		});

		let l_p = null;
		let l_s = null;

		for(const l of language_list){
			if(l.includes("zh")){
				l_p = l;
				continue;
			}
			if(l.includes("pt")){
				l_s = l;
				continue;
			}
			if(!l_s && l.includes("en")){
				l_s = l;
			}

		}

		if(!l_p){
			return;
		}

		await protocol.getTimedtext(lang=l_p).then(x => {
			const data = x.getData();
			this.timedText = data;
			this.events = data.events;
		});

		if(!l_s){
			return;
		}

		await protocol.getTimedtext(lang=l_s).then(x => {
			const data = x.getData();
			this.secondaryTimedtext = data;
			this.secondaryEvents = data.events;
		});
	},

	enable: function(){
		cronosStatus.intervalFunction = this.show.bind(this);
		this.currentTextBox.onanimationend = () => {this.currentTextBox.classList.remove("animateSubtitles")};
		this.previousTextBox.onanimationend = () => {this.previousTextBox.classList.remove("animateSubtitles")};
		this.nextTextBox.onanimationend = () => {this.nextTextBox.classList.remove("animateSubtitles")};
		this.secondaryTextBox.onanimationend = () => {this.secondaryTextBox.classList.remove("animateSubtitles")};
	},

	internalUpdate: function(index){
		if(index == this.currTextIndex){
			this.update = false;
			return;
		}

		this.update = true;

		this.prevTextIndex = index - 1;
		this.currTextIndex = index;
		this.nextTextIndex = index + 1;

		this.prevString = this.getTextByIndex(this.prevTextIndex, this.events);
		this.currString = this.getTextByIndex(this.currTextIndex, this.events);
		this.nextString = this.getTextByIndex(this.nextTextIndex, this.events);
	},

	getEventIndex: function(events, time){
		if(!events){
			return -1;
		}

		let index = -1;

		let currTime = time;
		for(let i = 0; i < events.length; i++){
			const event = events[i];
			const nextEvent = events[i+1];

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

		return index;

	},

	selectEvent: function(){

		let index = this.getEventIndex(this.events, cronosStatus.currTimeMS);
		let sec_index = this.getEventIndex(this.secondaryEvents, cronosStatus.currTimeMS);
		
		if(index != -1){
			this.internalUpdate(index);
		}

		if(sec_index != -1){
			if(this.secondaryIndex != sec_index){
				this.secondaryUpdate = true;
			} else {
				this.secondaryUpdate = false;
			}
			this.secondaryIndex = sec_index;
			this.secondaryString = this.getTextByIndex(sec_index, this.secondaryEvents);
		}

	},

	getTextByIndex: function(index, events){
		if(index >= events.length ||
			index < 0){
			return null;
		}

		const segs = events[index].segs;
		const utf8 = segs.map(x => { return x.utf8 });
		const inOne = utf8.join(" ");
		return inOne;
	},

	getInnerHTML: async function(string){
		if(!string){
			return null;
		}

		const seg = await protocol.cutChineseString(string).then(x => {
			return x.getData();
		})

		let ret = "";
		let pinyin = "";

		for(const x of seg){
			ret += "<div>" + x + "</div>";
			pinyin += "<div>" + await protocol.pinyin(x).then(x => { return x.getData(); }) + "</div>";
		}

		return {
			chinese: ret,
			pinyin: pinyin };
	},

	showText: async function(){
		let prev = this.previousTextBoxChinese.innerHTML;

		if(this.prevString != null){
			prev = await this.getInnerHTML(this.prevString);
			this.previousBox.classList.remove("hidden");
		} else {
			this.previousBox.classList.add("hidden");
		}
		
		let next = this.nextTextBoxChinese.innerHTML;

		if(this.nextString != null){
			next = await this.getInnerHTML(this.nextString);
			this.nextBox.classList.remove("hidden");
		} else {
			this.nextBox.classList.add("hidden");
		}

		let curr = await this.getInnerHTML(this.currString);

		this.currentTextBox.classList.add("animateSubtitles");
		this.currentTextBoxChinese.innerHTML = curr.chinese;
		this.currentTextBoxPinyin.innerHTML = curr.pinyin;

		this.previousTextBox.classList.add("animateSubtitles");
		this.previousTextBoxChinese.innerHTML = prev.chinese;
		this.previousTextBoxPinyin.innerHTML = prev.pinyin;

		this.nextTextBox.classList.add("animateSubtitles");
		this.nextTextBoxChinese.innerHTML = next.chinese;
		this.nextTextBoxPinyin.innerHTML = next.pinyin;
	},

	showSecondary: function(){
			this.secondaryTextBox.classList.add("animateSubtitles");
			this.secondaryTextBox.innerHTML = this.secondaryString;
	},

	show: async function(){
		if(this.necessaryFetching){
			await this.fetchTimedText();
			this.necessaryFetching = false;
		}

		if(this.freeze){
			return;
		}

		this.selectEvent();

		if(this.secondaryUpdate){
			this.showSecondary();
		}

		if(this.update){
			await this.showText();
		}
	}
}

chineseText.enable();

playerStateChangeFunction = function(){
	chineseText.necessaryFetching = true;
};
