class Dictionary {
	constructor(){
		this.cedict_entry_template = document.getElementById("cedictEntryTemplate")
		this.cedict_box_exact = document.querySelector("#exactMatch .cedict")
		this.cedict_box_partial = document.querySelector("#partialMatch .cedict")

		this.ptdict_entry_template = document.getElementById("ptdictEntryTemplate")
		this.ptdict_box_exact = document.querySelector("#exactMatch .ptdict")
		this.ptdict_box_partial = document.querySelector("#partialMatch .ptdict")

		this.search_input = document.getElementById("searchDict")
		this.search_input.oninput = this.oninput.bind(this)

		this.entries = {}
		this.query = null
	}

	async update(query){
		if(query == this.query || !query){
			return false
		}

		this.entries = await protocol.getDefinition(query).then(x => {return x.getData()})
		this.query = query

		return true
	}

	clean_entries(){
		this.cedict_box_partial.innerHTML = ""
		this.ptdict_box_partial.innerHTML = ""

		let img = this.cedict_box_exact.getElementsByTagName("img")[0]
		this.cedict_box_exact.innerHTML = ""
		this.cedict_box_exact.appendChild(img)

		img = this.ptdict_box_exact.getElementsByTagName("img")[0]
		this.ptdict_box_exact.innerHTML = ""
		this.ptdict_box_exact.appendChild(img)

	}

	get_cedict_element(e){

		const elem = document.importNode(this.cedict_entry_template.content, true)
		elem.getElementById("simplified").innerHTML = e.simplified
		elem.getElementById("traditional").innerHTML = e.traditional
		elem.getElementById("pinyin").innerHTML = e.pinyin
		elem.getElementById("english").innerHTML = e.english

		return elem
	}

	get_ptdict_element(e){

		const elem = document.importNode(this.ptdict_entry_template.content, true)
		elem.getElementById("chinese").innerHTML = e.chinese
		elem.getElementById("pinyin").innerHTML = e.pinyin
		elem.getElementById("portuguese").innerHTML = e.portuguese

		return elem
	}

	populate_cedict(){
		for(const e of this.entries.cedict[0]){
			const elem = this.get_cedict_element(e)
			this.cedict_box_exact.appendChild(elem)
		}

		for(const e of this.entries.cedict[1]){
			const elem = this.get_cedict_element(e)
			this.cedict_box_partial.appendChild(elem)
		}

	}

	populate_ptdict(){
		for(const e of this.entries.ptdict[0]){
			const elem = this.get_ptdict_element(e)
			this.ptdict_box_exact.appendChild(elem)
		}

		for(const e of this.entries.ptdict[1]){
			const elem = this.get_ptdict_element(e)
			this.ptdict_box_partial.appendChild(elem)
		}

	}

	populate(){
		this.clean_entries()
		this.populate_cedict()
		this.populate_ptdict()
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

async function test(){
	await Gdict.update("金")
	Gdict.show()
}

test()
