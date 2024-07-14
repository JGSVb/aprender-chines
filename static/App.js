class App {
	constructor(anki_connect){
		this.anki_connect = anki_connect
		this.add_note_dialog = null
	}

	create_add_note_dialog(){
		this.add_note_dialog = new AddNoteDialog()
		this.add_note_dialog.bind_app(this)
	}

	show_add_note_dialog(){
		this.add_note_dialog.show()
	}

	open_add_note_dialog(){
		this.create_add_note_dialog()
		this.show_add_note_dialog()
	}
}
