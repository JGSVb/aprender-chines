const translationSrc = ["", "", ""];
const translationDst = ["", "", ""];

const translationPairs = [
	["zh-CN", "en"],
	["zh-CN", "en"],
	["en", "pt"],
	["en", "pt"],
];

var chineseText = "";
var pinyinText = "";
var chineseSegment = "";

var chineseDictionary = [];

var dictDiv = document.getElementById("dict")


async function retrieveText(url) {
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
	var result = await retrieveText("fetch_translation?way=" + pair.join(",") + "&text=" + text);

	translationDst[id] = result;
	return translationDst[id];

}

function myFunction() {
  // Get the text field
  var copyText = document.getElementById("chinese_text");
  navigator.clipboard.writeText(copyText.textContent);

  // Alert the copied text
} 


function setText(elem, text){
	var e = document.getElementById(elem)
	if(e.textContent != text){
		e.textContent = text;
	}

}

var _fetchTexts = setInterval(async function() {

	chineseText = await retrieveText("fetch_text?type=chinese");
	setText("chinese_text", chineseText);
	pinyinText = await retrieveText("fetch_text?type=pinyin");
	setText("pinyin_text", pinyinText);

}, 700);

async function fetchTranslation() {
	var t = await translate(0, chineseText.replace(/\s/g, ''));
	setText("translate-zh-en", t);

	t = await translate(1, chineseSegment.replace(/\s/g, ''));
	setText("translate-zh-en2", t);

	t = await translate(2, t);
	setText("translate-en-pt", t);
}

async function updateDictionary() {
	var resp = await retrieveText("dicthtml?query=" + chineseSegment);
	if(resp==""){ return; }

	dictDiv.innerHTML = resp;

	dictHTML();
}

document.onselectionchange = () => {
	var selection = document.getSelection().toString().trim();
	if(selection == "" || selection.match("\n") || !selection.match(/[\u3400-\u9FBF]/)) { return }

	chineseSegment = selection;
	document.getElementById("preview").textContent = chineseSegment;

	updateDictionary();
};

function createAnkiCard(){
	let card = prompt("a", "b", "c", "d");
}


