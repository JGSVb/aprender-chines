const PURPOSE_CREATECARD = "createAnkiCardDialog";
const PURPOSE_SHOWCARDS = "ankiCardsDialog";

const Overlay = new class {

	#element = document.getElementById("overlay");

	#purpose_create_elem = document.getElementById(PURPOSE_CREATECARD);
	#purpose_show_elem = document.getElementById(PURPOSE_SHOWCARDS);
	#purpose_create_display = this.#purpose_create_elem.style.display;
	#purpose_show_display = this.#purpose_show_elem.style.display;

	#visible = false;
	#purpose = ""

	setPurpose(p){
		this.#purpose_create_elem.style.display = "none";
		this.#purpose_show_elem.style.display = "none";

		this.#purpose = p;

		if(p == this.#purpose_create_elem.id){
			this.#purpose_create_elem.style.display = this.#purpose_create_display;
		} else {
			this.#purpose_show_elem.style.display = this.#purpose_show_display;
		}
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
