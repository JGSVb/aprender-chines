function main(){
	let anki_connect = new AnkiConnect()
	let app = new App(anki_connect)

	return app
}

const APP = main()
