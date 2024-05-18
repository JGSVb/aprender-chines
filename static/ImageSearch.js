class ImageSearch {
	query;
	element;
	result;
	itemTemplate;
	imageBox;
	template = document.getElementById("imageSearchTemplate");

	constructor(query){
		this.query = query;
	}

	async doSearch(){
		let result = await protocol.searchImage(this.query);
		this.result = result.getData();

	}

	getElement(){
		this.element = document.importNode(this.template.content, true);
		this.itemTemplate = this.element.getElementById("imageItem");
		this.imageBox = this.element.getElementById("imageResultBox");
		return this.element;
	}

	async update(){
		await this.doSearch();

		for(const x of this.result){
			const item = document.importNode(this.itemTemplate.content, true);
			const img = item.querySelector("img");
			img.src = x;
			this.imageBox.appendChild(item);
		}

	}
}
