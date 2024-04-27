const overlay = new class {
	#element = document.getElementById("overlay");
	#content = document.getElementById("overlayContent");

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
};
