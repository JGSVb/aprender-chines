class ImageSearch {
	constructor(onselect){
		this.root_template = document.getElementById("imageSearchTemplate")
		this.root_element = document.importNode(this.root_template.content, true)
		this.item_template = this.root_element.getElementById("imageItem")
		this.query = null

		this.result_box = this.root_element.getElementById("imageResultBox")

		this.search_input_element = this.root_element.getElementById("searchInput")
		this.search_input_element.oninput = debounce(this.oninput.bind(this), 1000)
		this.search_input_element.value = ""

		this.result = null

		this.onselect = onselect
	}

	async update(){
		this.result = await protocol.searchImage(this.query).then((x)=>{return x.getData()})
	}

	get_image_element(url){
		let element = document.importNode(this.item_template.content, true)
		let img = element.getElementById("img")
		img.src = url

		let info = element.getElementById("info")
		img.onload = (event) => {
			const img = event.target
			info.innerHTML = img.naturalWidth + "x" + img.naturalHeight
		}

		let button = element.getElementById("selectButton")
		button.onclick = () => {
			this.onselect(url)
		}

		return element
	}

	populate(){
		this.result_box.innerHTML = ""

		for(const r of this.result){
			const element = this.get_image_element(r)
			this.result_box.appendChild(element)
		}
	}

	async oninput(){
		this.query = this.search_input_element.value
		await this.update()
		this.populate()
	}

	show(){
		overlay.setContent(this.root_element)
		overlay.show()
	}
}
