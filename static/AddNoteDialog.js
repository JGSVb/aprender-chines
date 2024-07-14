const MAIN_MODEL = {
	name: "Chinês com Imagem",
	fields: {
		Hanzi: {
			type: "text",
			hidden: false,
			writable: true,
			auto_fill_function: null
		},
		Pinyin: {
			type: "text",
			hidden: false,
			writable: true,
			auto_fill_function: null
		},
		Exemplo: {
			type: "text",
			hidden: false,
			writable: true,
			auto_fill_function: null
		},
		Tradução: {
			type: "text",
			hidden: false,
			writable: true,
			auto_fill_function: null
		},
		Significado: {
			type: "text",
			hidden: false,
			writable: true,
			auto_fill_function: null
		},
		Imagem: {
			type: "image",
			hidden: false,
			writable: true,
			auto_fill_function: null,
		},
		"Pronúncia TTS": {
			type: "text",
			hidden: true,
			writable: false,
			auto_fill_function: function(name, value){
				if(name == "Hanzi"){
					return value
				}
			},
		},
	}
}

const DEFAULT_FIELD_MODEL = {
	type: "text",
	hidden: false,
	writable: true,
	auto_fill_function: null
}

class AddNoteDialog {
	constructor(model=MAIN_MODEL, default_field_model=DEFAULT_FIELD_MODEL){
		this.template = document.getElementById("addNoteDialogTemplate")
		this.element = document.importNode(this.template.content, true)
		this.field_templates = {
			text: this.element.getElementById("textFieldTemplate"),
			image: this.element.getElementById("imageFieldTemplate")
		}
		this.fields_container = this.element.getElementById("fieldsContainer")

		// ver this.bind_app()
		this.app = null
		this.anki_connect = null 

		this.model = model
		this.default_field_model = default_field_model

		// ver this.show()
		this.field_names = null
		this.note = null
	}

	// TODO: adicionar aplicação
	bind_app(app){
		this.app = app
		this.anki_connect = this.app.anki_connect
	}

	get_field_elem(field){
		let elem = document.importNode(this.field_templates[field.type].content, true)

		return elem
	}

	set_field(name, field){
		if(field.hidden){
			return
		}

		const elem = this.get_field_elem(field)

		if(field.type == "text"){
			let input = elem.querySelector("input");
			input.placeholder = name
			input.oninput = () => {this.oninput(name, input.value)}
		} else if(field.type == "image"){

			let image = elem.querySelector("img")

			const img_search = new ImageSearch(function(url){
				this.set_field_value(name, url)
				image.src = url
			}.bind(this))

			let search_button = elem.getElementById("searchImageButton")
			search_button.onclick = () => {img_search.show()}
		}

		this.fields_container.appendChild(elem)
	}

	call_auto_fill(changed_name, changed_value){
		for(const [name, field_template] of Object.entries(this.model.fields)){

			if(field_template.auto_fill_function){

				const fill = field_template.auto_fill_function.bind(this)(changed_name, changed_value)

				// XXX: atenção: isto provávelmente será fonte de problemas no futuro por causa de
				// ser recursiva. Eu antes tinha um parametro `exclude`: call_auto_fill(changed_name, changed_value, exclude)
				// mas tirei porque a função apenas é chamada recursivamente se o fill existir
				if(fill && this.note[name] != fill){
					this.#set_field_value(name, fill)
					this.call_auto_fill(name, fill)
				}
			}
		}
	}

	oninput(name, value){
		this.set_field_value(name, value)
	}

	#set_field_value(name, value){
		this.note[name] = value
	}

	set_field_value(name, value){
		this.#set_field_value(name, value)
		this.call_auto_fill(name, value)
	}

	set_multiple_fields_value(...pairs){
		for(const p of pairs){
			this.set_field_value(p.name, p.value)
		}
	}

	async get_model_field_names(){
		return await this.anki_connect.invoke("modelFieldNames", {
			modelName: this.model.name
			// TODO: Tenho que pensar o que fazer quando isto der erro
		}).catch((x)=> {throw Error(x)})
	}

	async get_empty_note(){
		let note = new Object()

		for(const name of this.field_names){
			note[name] = ""
		}

		return note
	}

	populate(){

		this.fields_container.innerHTML = ""

		for(const name of this.field_names){

			const model_field = this.model.fields[name]

			if(model_field){
				this.set_field(name, model_field)
			} else {
				this.set_field(name, this.default_field_model)
			}
		}
	}

	async show(){
		this.field_names = await this.get_model_field_names()
		this.note = await this.get_empty_note()
		this.populate()

		overlay.setContent(this.element)
		overlay.setButtons({
			label: "Enviar",
			onclick: this.add_note
		})
		overlay.show()
	}
}
