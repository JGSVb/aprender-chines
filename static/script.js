const translationSrc = ["", "", ""];
const translationDst = ["", "", ""];

const translationPairs = [
	["zh-CN", "en"],
	["zh-CN", "en"],
	["en", "pt"],
	["en", "pt"],
];

var chineseText = "";
var chineseWords = [];
var pinyinText = "";
var chineseSegment = "";

var dictionary = [];


async function retrieveData(url) {
	// Fetch the content of the page
	return await fetch(url).then(function(response) {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.text();
	}).then(function(text) {
		return text;
	}).catch(function(error) {
		console.error('There was a problem with the fetch operation:', error);});
}

async function translate(id, text){
	text = text.trim();
	if(translationSrc[id] == text || text == ""){
		return translationDst[id];
	}

	translationSrc[id] = text;

	var pair = translationPairs[id];
	var result = await retrieveData("translate?way=" + pair.join(",") + "&text=" + text);

	translationDst[id] = result;
	return translationDst[id];

}

function copyChineseText() {
  navigator.clipboard.writeText(chineseText);
}


function setText(elem, text){
	var e = document.getElementById(elem)
	if(e.textContent != text){
		e.textContent = text;
	}

}

var _fetchTexts = setInterval(async function() {

	var text = await fetch("fetch_chinese").then(response => response.text());

	if(text == chineseText) {
		return;
	}


	chineseText = text;

	chineseWords = await fetch("words?chinese=" + chineseText).then(response => response.json());

	var chineseDiv = document.getElementById("chineseTextWords");
	chineseDiv.innerHTML = "";
	var pinyinDiv = document.getElementById("pinyinTextWords");
	pinyinDiv.innerHTML = "";

	chineseWords.forEach(async w => {
		chineseDiv.innerHTML += "<div>" + w + "</div>";
		var p = await fetch("pinyin?chinese=" + w).then(response => response.text());
		pinyinDiv.innerHTML += "<div>" + p + "</div>";
	});

}, 700);

async function fetchTranslation() {
	var t = await translate(0, chineseText.replace(/\s/g, ''));
	setText("translate-zh-en", t);

	t = await translate(1, chineseSegment.replace(/\s/g, ''));
	setText("translate-zh-en2", t);

	t = await translate(2, t);
	setText("translate-en-pt", t);
}

function collapsible(coll){
	coll.addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;

		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
}

async function updateDictionary() {
	const data = await fetch("dictionary?query=" + chineseSegment).then(response => response.json());
	if(data.length == 0) { return; }

	dictionary = data;

	const dictionaryContainer = document.getElementById("dictionaryContainer");
	dictionaryContainer.innerHTML = "";

	const dictionaryTemplate = document.getElementById("dictionaryTemplate");

	dictionary.forEach(entry => {
		const clone = document.importNode(dictionaryTemplate.content, true);

		collapsible(clone.getElementById("dictionaryEntryName"));

		if(entry.simplified != entry.traditional){
			clone.getElementById("dictionaryEntryName").innerHTML = entry.simplified + " ( " + entry.traditional + " )";
		} else {
			clone.getElementById("dictionaryEntryName").innerHTML = entry.simplified;
		}

		clone.getElementById("dictionaryPinyin").innerHTML = entry.pinyin;
		clone.getElementById("dictionaryPortuguese").innerHTML = entry.portuguese;
		dictionaryContainer.appendChild(clone);
	});
}

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

	var selection = getSelectedTextWithinDiv("chineseTextWords");

	if(selection.length == 0) {
		return;
	}

	chineseSegment = selection;
	document.getElementById("preview").textContent = chineseSegment;

	updateDictionary();
};

function dictionaryEntrySelectorChanged(){
	const selector = document.getElementById("dictionaryEntrySelector");
	var index = selector.value;

	var questionA = document.getElementById("questionA");
	var questionB = document.getElementById("questionB");
	var meaning = document.getElementById("meaning");

	questionA.value = dictionary[index].simplified;
	questionB.value = dictionary[index].pinyin;
	meaning.value = dictionary[index].portuguese;
}

function createAnkiCardButton(){
	var overlay = document.getElementById("overlay");
	overlay.style.display = "flex";

	var selector = document.getElementById("dictionaryEntrySelector");
	selector.innerHTML = "";

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

		selector.appendChild(clone);
	});

	var awnser = document.getElementById("awnser");
	awnser.value = chineseText;

	selector.value = 0;
	dictionaryEntrySelectorChanged();
}

async function submitAnkiCardButton(){
	var questionA = document.getElementById("questionA").value;
	var questionB = document.getElementById("questionB").value;
	var awnser = document.getElementById("awnser").value;
	var meaning = document.getElementById("meaning").value;

	await fetch("anki_routine?question_a=" 	+ questionA +
				"&question_b=" 	+ questionB +
				"&awnser=" 	+ awnser +
				"&meaning=" 	+ meaning);

	overlay.style.display = "none";
}
