function getClickDict(elem) {
	function onClickDict() {
		open("https://www.yellowbridge.com/chinese/dictionary.php?word=" + elem.textContent);
	}

	return onClickDict;
}

function dictHTML() {
	var coll = document.getElementsByClassName("collapsible");
	var i;

	for (i = 0; i < coll.length; i++) {
		coll[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;

			if (content.style.maxHeight){
				content.style.maxHeight = null;
			} else {
				content.style.maxHeight = content.scrollHeight + "px";
			}
		});
	}

	var simplified = document.getElementsByName("simplified");
	var traditional = document.getElementsByName("traditional");

	for(var i = 0; i < simplified.length; i++){
		var s = simplified[i];
		var t = traditional[i];
		s.addEventListener("click", getClickDict(s));
		t.addEventListener("click", getClickDict(t));
	}
}
