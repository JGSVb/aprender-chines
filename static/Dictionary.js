class Dictionary {
	constructor(){
		this.cedict_entry_template = document.getElementById("cedictEntryTemplate")
		this.cedict_box_exact = document.querySelector("#exactMatch .cedict")
		this.cedict_box_partial = document.querySelector("#partialMatch .cedict")

		this.ptdict_entry_template = document.getElementById("ptdictEntryTemplate")
		this.ptdict_box_exact = document.querySelector("#exactMatch .ptdict")
		this.ptdict_box_partial = document.querySelector("#partialMatch .ptdict")

		this.glosbe_entry_template = document.getElementById("glosbeEntryTemplate")
		this.glosbe_less_frequent_entry_template = document.getElementById("glosbeLessFrequentEntryTemplate")
		this.glosbe_box_exact = document.querySelector("#exactMatch .glosbe")
		this.glosbe_box_partial = document.querySelector("#partialMatch .glosbe")

		this.not_found_entry_template = document.querySelector("#notFoundEntryTemplate")

		this.search_input = document.getElementById("searchDict")
		this.search_input.oninput = debounce(this.oninput.bind(this), 1000)

		this.entries = {}
		this.query = null
	}

	async update(query){
		if(query == this.query || !query){
			return false
		}

		this.entries = await protocol.getDefinition(query).then((x) => {return x.getData()})
		this.query = query

		return true
	}

	clean_entries(){
		this.cedict_box_partial.innerHTML = ""
		this.ptdict_box_partial.innerHTML = ""
		this.glosbe_box_partial.innerHTML = ""

		let img = this.cedict_box_exact.getElementsByTagName("img")[0]
		this.cedict_box_exact.innerHTML = ""
		this.cedict_box_exact.appendChild(img)

		img = this.ptdict_box_exact.getElementsByTagName("img")[0]
		this.ptdict_box_exact.innerHTML = ""
		this.ptdict_box_exact.appendChild(img)

		img = this.glosbe_box_exact.getElementsByTagName("img")[0]
		this.glosbe_box_exact.innerHTML = ""
		this.glosbe_box_exact.appendChild(img)

	}

	get_cedict_element(e){

		const elem = document.importNode(this.cedict_entry_template.content, true)
		elem.getElementById("simplified").innerHTML = e.simplified
		elem.getElementById("traditional").innerHTML = e.traditional
		elem.getElementById("pinyin").innerHTML = e.pinyin
		elem.getElementById("english").innerHTML = e.english

		elem.getElementById("translateBtn").onclick = (event) => {
			let target = event.target
			let parent = event.target.parentElement

			target.innerHTML = "a traduzir ..."

			protocol.translate(e.english, "en", "pt").then((x) => {
				parent.innerHTML = x.getData()
			})
		}

		return elem
	}

	get_ptdict_element(e){

		const elem = document.importNode(this.ptdict_entry_template.content, true)
		elem.getElementById("chinese").innerHTML = e.chinese
		elem.getElementById("pinyin").innerHTML = e.pinyin
		elem.getElementById("portuguese").innerHTML = e.portuguese

		return elem
	}

	get_glosbe_element(e){

		const elem = document.importNode(this.glosbe_entry_template.content, true)
		elem.getElementById("meaning").innerHTML = e.meaning
		if(e.part_of_speech){
			elem.getElementById("partOfSpeech").innerHTML = e.part_of_speech.join(" ")
		}
		if(e.example){
			elem.getElementById("example").innerHTML = e.example
		}
		if(e.example_translation){
			elem.getElementById("translation").innerHTML = e.example_translation
		}

		return elem
		
	}

	get_glosbe_less_frequent_element(w){

		const elem = document.importNode(this.glosbe_less_frequent_entry_template.content, true)
		elem.getElementById("meaning").innerHTML = w

		return elem
	}

	get_not_found_entry_element(){
		return document.importNode(this.not_found_entry_template.content, true)
	}

	populate_cedict(){
		if(this.entries.cedict[0].length){
			for(const e of this.entries.cedict[0]){
				const elem = this.get_cedict_element(e)
				this.cedict_box_exact.appendChild(elem)
			}
		} else {
			this.cedict_box_exact.appendChild(this.get_not_found_entry_element())
		}

		for(const e of this.entries.cedict[1]){
			const elem = this.get_cedict_element(e)
			this.cedict_box_partial.appendChild(elem)
		}

	}

	populate_ptdict(){
		if(this.entries.ptdict[0].length){
			for(const e of this.entries.ptdict[0]){
				const elem = this.get_ptdict_element(e)
				this.ptdict_box_exact.appendChild(elem)
			}
		} else {
			this.ptdict_box_exact.appendChild(this.get_not_found_entry_element())
		}

		for(const e of this.entries.ptdict[1]){
			const elem = this.get_ptdict_element(e)
			this.ptdict_box_partial.appendChild(elem)
		}

	}

	populate_glosbe(){
		const result = this.entries.glosbe.result
		const less_freq = result.less_frequent

		if(result.entries.length){
			for(const e of result.entries){
				const elem = this.get_glosbe_element(e)
				this.glosbe_box_exact.appendChild(elem)
			}
		} else {
			this.glosbe_box_exact.appendChild(this.get_not_found_entry_element())
		}

		for(const w of less_freq){
			let elem = this.get_glosbe_less_frequent_element(w)
			this.glosbe_box_partial.appendChild(elem)
		}

	}

	populate(){
		this.clean_entries()
		this.populate_cedict()
		this.populate_ptdict()
		this.populate_glosbe()
	}

	show(){

		this.populate()

	}

	async oninput(){
		let value = this.search_input.value

		if(await this.update(value)){
			this.show()
		}
	}
}

let Gdict = new Dictionary()
Gdict.oninput()
