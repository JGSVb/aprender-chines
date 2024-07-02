const overlay = new class {
	#element = document.getElementById("overlay");
	#content = document.getElementById("overlayContent");
	#buttonBox = document.getElementById("overlayButtonBox");
	#closeButton = document.getElementById("overlayCloseButton");

	#visible = false;

	setContent(c){
		this.#content.innerHTML = "";
		this.#content.appendChild(c);
	}

	setVisible(v) {
		this.#visible = v;
		if(this.#visible){
			this.#element.style.display = "flex";
		} else {
			this.#element.style.display = "none";
		}
	}

	hide(){
		this.setVisible(false);
	}

	show(){
		this.setVisible(true);
	}

	getVisible() {
		return this.#visible;
	}

	_addButton(label, onclick){
		const btn = document.createElement("button")
		btn.innerHTML = label
		btn.onclick = onclick
		this.#buttonBox.appendChild(btn)
	}

	setButtons(...buttons){
		this.#buttonBox.innerHTML = ""
		this.#buttonBox.appendChild(this.#closeButton)

		for(const b of buttons){
			this._addButton(b.label, b.onclick)
		}
	}
};
