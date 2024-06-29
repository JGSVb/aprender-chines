var chineseWords = [];
var pinyinText = "";
var chineseSegment = "";

var dictionary = [];
// melhorar a sincronia do dicionário
var selectionId = 0;

var textEdition = false;

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

async function updateDictionary(selId) {
	const data = await fetch("/dictionary?query=" + chineseSegment).then(response => response.json());
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
		clone.getElementById("dictionaryEnglish").innerHTML = entry.english;
		dictionaryContainer.appendChild(clone);
	});
}

const chineseTextWords = document.querySelector("#subtitlesBox > .current > .text");

function getSelectedTextWithinDiv(parentDivId) {
        let selectedText = "";
        const parentDiv = document.querySelector(parentDivId);
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

	var selection = getSelectedTextWithinDiv("#subtitlesBox > .current > .text");

	if(selection.length == 0) {
		return;
	}

	chineseSegment = selection;

	protocol.getJsonCards(notificationOptions={
		notifySuccess: false,
	}).then(function(data){
		data = data.getData();
		for(const c of data){
			if(c.values[0] == selection){
				chineseTextWords.classList.add("selection-already-exists");
				return;
			}
		}
		chineseTextWords.classList.remove("selection-already-exists");
	}.bind(selection));

	chineseText.selection = selection;
	document.getElementById("preview").textContent = chineseSegment;

	updateDictionary(selectionId);
	translator.show();

	document.getElementById("createAnkiCardButtonChinese").innerHTML = chineseText.selection;

	Gdict.search_input.value = selection
	Gdict.oninput()
};


