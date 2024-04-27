const DEFAULT_ANKI_FORMAT = 5;
const DEFAULT_ANKI_FIELDS_TEMPLATE = [
	["hanzi", "汉字"],
	["pinyin", "pīnyīn"],
	["example", "exemplo"],
	["translation", "tradução"],
	["meaning", "significado"]
];

class AnkiCard {
	fieldsTemplate;
	values;
	format;
	id;

	constructor(values, id=-1, format=DEFAULT_ANKI_FORMAT, fieldsTemplate=DEFAULT_ANKI_FIELDS_TEMPLATE){
		this.format = format;
		this.fieldsTemplate = fieldsTemplate;
		this.values = values;
		this.id = id;

		if(values.length != format){
			throw new Error(`Impossível inicializar objeto porque os valores têm um formato (tamanho) diferente do tamanho passado na construção do objeto: ${values.length} != ${format}`);
		}

		if(fieldsTemplate.length != format){
			throw new Error(`A template dos campos da carta é inválida porque tem um tamanho diferente do formato: ${fieldsTemplate.length}!=${format}`);
		}
	}

	getFieldsTemplate(){
		return this.fieldsTemplate;
	}

	getValues(){
		return this.values;
	}

	getFormat(){
		return this.format;
	}
}

async function addAnkiCardToDatabase(card){
	return protocol.addAnkiCard(card);
}
