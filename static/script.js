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
// melhorar a sincronia do dicionário
var selectionId = 0;

var textEdition = false;

const TYPE_GOOD = "Good";
const TYPE_BAD = "Bad";

function pushNotification(text, type){
	const nBox = document.getElementById("notificationBox");
	const nElem = document.createElement("div");
	nElem.className = "notification" + type;
	nElem.innerHTML = text;

	nBox.appendChild(nElem);
	nElem.style.opacity = "0.9";

	return nElem
}

function popNotification(elem){
	elem.style.opacity = "0";

	setTimeout(function(){
		elem.remove();
	}, 1000);
}

function sendNotification(text, type){
	const nElem = pushNotification(text, type);
	setTimeout(function(){
		popNotification(nElem);
	}, 5000);
}


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

	var text = await fetch("fetch_chinese?index=-1").then(response => response.text());

	if(text == chineseText) {
		return;
	}

	var textolder = await fetch("fetch_chinese?index=-2").then(response => response.text());

	chineseText = text;

	chineseWords = await fetch("words?chinese=" + chineseText).then(response => response.json());

	var chineseDiv = document.getElementById("chineseTextWords");
	chineseDiv.innerHTML = "";
	var pinyinDiv = document.getElementById("pinyinTextWords");
	pinyinDiv.innerHTML = "";

	for(const w of chineseWords){
		chineseDiv.innerHTML += "<div>" + w + "</div>";

		var p = await fetch("pinyin?chinese=" + w).then(response => response.text());
		pinyinDiv.innerHTML += "<div>" + p + "</div>";
	}

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

async function updateDictionary(selId) {
	const data = await fetch("dictionary?query=" + chineseSegment).then(response => response.json());
	if(data.length == 0) { return; }

	if(selId != selectionId){
		return;
	}

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


document.onselectionchange = () => {

	selectionId++;

	var selection = getSelectedTextWithinDiv("chineseTextWords");

	if(selection.length == 0) {
		return;
	}

	chineseSegment = selection;
	document.getElementById("preview").textContent = chineseSegment;

	updateDictionary(selectionId);
};

function dictionaryEntrySelectorChanged(){
	const selector = document.getElementById("dictionaryEntrySelector");
	var index = selector.value;

	var questionA = document.getElementById("questionA");
	var questionB = document.getElementById("questionB");
	var meaning = document.getElementById("meaning");

	if(index == -1){
		questionA.value = chineseSegment;

		questionB.placeholder = "Atualizando pinyin...";
		questionB.value = "";
		fetch("/pinyin?chinese="+chineseSegment)
			.then(response => { return response.text();})
			.then(t => {
				questionB.value = t;
				questionB.placeholder = "Pergunta B";
			});

		meaning.placeholder = "Traduzindo...";
		meaning.value = "";
		fetch("/translate?way=zh-CN,pt&text="+chineseSegment)
			.then(response => { return response.text();})
			.then(t => {
				meaning.value = t;
				meaning.placeholder = "Significado";
			});
	} else {
		questionA.value = dictionary[index].simplified;
		questionB.value = dictionary[index].pinyin;
		meaning.value = dictionary[index].portuguese;
	}
}

async function createAnkiCardButton(){
	Overlay.setPurpose(PURPOSE_CREATECARD);
	Overlay.setVisible(true);

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

	var shouldAddSegment = true;

	for(const e of dictionary){
		if(e.simplified == chineseSegment || e.traditional == chineseSegment){
			shouldAddSegment = false;
		}
	}

	if(shouldAddSegment){
		const clone = document.importNode(optionTemplate.content, true);
		const real = clone.getElementById("realOption");
		real.innerHTML = chineseSegment;
		real.innerHTML += ", " + await fetch("/pinyin?chinese=" + chineseSegment).then(response => {return response.text()});
		real.value = -1;
		selector.appendChild(real);
	}

	var awnser = document.getElementById("awnser");
	awnser.value = chineseText;

	selector.value = 0;
	dictionaryEntrySelectorChanged();
}

function submitAnkiCardButton(){
	var questionA = document.getElementById("questionA").value;
	var questionB = document.getElementById("questionB").value;
	var awnser = document.getElementById("awnser").value;
	var meaning = document.getElementById("meaning").value;

	fetch("anki_routine?question_a=" 	+ questionA +
				"&question_b=" 	+ questionB +
				"&awnser=" 	+ awnser +
				"&meaning=" 	+ meaning)
		.then(response => {return response.text()})
		.then(text => {
			if(!text){
				sendNotification("Carta adicionada com sucesso", TYPE_GOOD);
			} else {
				sendNotification(text, TYPE_BAD);
			}
		});

	Overlay.setVisible(false);
}

function cancelAnki() {
	Overlay.setVisible(false);
}

async function populateDropdown() {
	const container = document.getElementById("chineseOlderTexts");
	container.innerHTML = "";

	const textList = await fetch("/fetch_chinese")
		.then(response => {
			return response.json();
		})
		.then(t => {
			return t;
		});

	for(var e of textList){
		const c = document.createElement("div");
		c.innerHTML = e;
		container.appendChild(c);
	}
}

function dropdownButtonOnClick() {
	const elem = document.getElementById("chineseOlderTexts");
	elem.classList.toggle("show");

	if(elem.classList.contains("show")){
		populateDropdown();
	}
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

var textEditionInput = document.getElementById("textEdition");
var chineseTextWords = document.getElementById("chineseTextWords");
var pinyinTextWords = document.getElementById("pinyinTextWords");
var copyButton = document.getElementById("copyText");
var submitButton = document.getElementById("submitText");

function toggleTextEdition(){
	if(textEdition) {
		textEdition = false;
		textEditionInput.style.display = "none";
		chineseTextWords.style.display = "flex";
		pinyinTextWords.style.display = "flex";
		copyButton.style.display = "block";
		submitButton.style.display = "none";
	} else {
		textEdition = true;
		textEditionInput.style.display = "block";
		chineseTextWords.style.display = "none";
		pinyinTextWords.style.display = "none";
		copyButton.style.display = "none";
		submitButton.style.display = "block";

		textEditionInput.value = chineseText;
	}
}

function submitEdition(){
	toggleTextEdition();

	fetch("change_chinese?index=-1&new=" + textEditionInput.value)
		.then(response => {return response.text()})
		.then(text => {
			if(!text){
				sendNotification("Edição enviada com sucesso", TYPE_GOOD);
			} else {
				sendNotification(text, TYPE_BAD);
			}
		});
}
