function format_time(seconds){
	const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    const hh = h.toString().padStart(2, "0")
    const mm = m.toString().padStart(2, "0")
    const ss = s.toString().padStart(2, "0")

    return `${hh}:${mm}:${ss}`
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled) // The maximum is exclusive and the minimum is inclusive
}

function debounce(f, delay){
	let tid
	return function(...args){
		clearTimeout(tid)
		tid = setTimeout(() => {
			f.apply(this, args)
		}, delay)
	}

}

class Box {
	constructor(t_start, t_end, x1, y1, x2, y2){
		this.t_start = t_start
		this.t_end = t_end
		this.x1 = x1
		this.y1 = y1
		this.x2 = x2
		this.y2 = y2
		this.id = 0
	}

	get_width(){
		return this.x2 - this.x1
	}

	get_height(){
		return this.y2 - this.y1
	}

	contains_time(time){
		return time >= this.t_start && time <= this.t_end
	}

	get_area(){
		return this.get_width() * this.get_height()
	}

}

function new_box_from_display(t_start, t_end, mapping, x1, y1, x2, y2){
	return new Box(t_start, t_end, x1 * mapping, y1 * mapping, x2 * mapping, y2 * mapping)
}

class BCCanvas {

	constructor(){
		this.element = document.getElementById("boxControls")

		this.real_width = null
		this.real_height = null
		this.mapping = null
		this.app = null

		this.display_width = null
		this.display_height = null

		this.curr_box = null
		this.draw_interval = null

		this.edit_mode = false
		this.highlight_mode = false
		this.add_mode = false

		this.mouse_is_down = false

		this.metadata_loaded = false

		this.enabled = false
	}

	set_pointer_events(v){
		this.element.style.pointerEvents = v
	}

	get_enabled(){
		return this.enabled
	}

	enable(){
		this.enabled = true
		this.set_pointer_events("all")
		this.element.classList.add("enabled")
	}

	disable(){
		this.enabled = false
		this.set_pointer_events("none")
		this.element.classList.remove("enabled")
		this.curr_box = null
		this.draw()
	}

	bind_app(app){
		this.app = app

		this.app.video.addEventListener("loadedmetadata", this.loaded_metadata.bind(this))

		this.element.addEventListener("mousedown", (e)=>{
			if(e.button != 0){
				return
			}
			this.mouse_is_down = true
			this.mousedown(e)
			this.draw()
		})
		this.element.addEventListener("mousemove", (e)=>{
			if(!this.mouse_is_down){
				return
			}
			this.mousemove(e)
			this.draw()
		})
		this.element.addEventListener("mouseup", (e)=>{
			if(e.button != 0 || !this.mouse_is_down){
				return
			}

			this.mouse_is_down = false 
			this.mouseup(e)
			this.disable()
			this.draw()
		})
		this.element.addEventListener("mouseleave", () => {
			this.add_mode = false
			this.mouse_is_down = false
			this.curr_box = null
			this.draw()
		})

		this.app.video.addEventListener("play", (e)=>{
			this.draw_interval = setInterval(this.draw.bind(this), 10)
		})

		this.app.video.addEventListener("seeking", this.draw.bind(this))
		this.app.video.addEventListener("seekcomplete", this.draw.bind(this))

		this.app.video.addEventListener("pause", (e)=>{
			clearInterval(this.draw_interval)
		})

	}

	async loaded_metadata(e){
		const elem = e.target
		this.real_width = elem.videoWidth
		this.real_height = elem.videoHeight

		this.element.width = this.element.parentElement.offsetWidth
		this.element.height = this.element.parentElement.offsetHeight

		this.display_width = this.element.width
		this.display_height = this.element.height

		this.mapping = this.real_width / this.display_width

		this.metadata_loaded = true
	}

	get_real_coordinates(x, y){
		return [this.mapping * x, this.mapping * y]
	}

	get_context(){
		return this.element.getContext("2d")
	}

	clear(){
		const ctx = this.get_context()
		ctx.clearRect(0, 0, this.element.width, this.element.height)
	}

	draw_box_border(box, style, opacity){
		const ctx = this.get_context()

		ctx.globalAlpha = opacity
		ctx.strokeStyle = style
		ctx.beginPath()
		ctx.rect(this.map_to_display(box.x1),
			this.map_to_display(box.y1),
			this.map_to_display(box.get_width()),
			this.map_to_display(box.get_height()))
		ctx.lineWidth = 3
		ctx.stroke()
	}

	draw_box_background(box, style, opacity){
		const ctx = this.get_context()
		
		ctx.globalAlpha = opacity 
		ctx.fillStyle = style
		ctx.fillRect(this.map_to_display(box.x1),
			this.map_to_display(box.y1),
			this.map_to_display(box.get_width()),
			this.map_to_display(box.get_height()))
	}

	draw_box(box, bg_style, border_style, bg_opacity, border_opacity){
	// draw_box(box, style){
		if(border_style){
			this.draw_box_background(box, bg_style, bg_opacity)
			this.draw_box_border(box, border_style, border_opacity)
			return
		}

		const style = bg_style
		this.draw_box_background(box, style, 0.4)
		this.draw_box_border(box, style, 1.0)
	}

	draw(){
		this.clear()

		if(this.curr_box){
			if(this.edit_mode){
				this.draw_box(this.curr_box, "red")
			} else if(this.highlight_mode){
				this.draw_box(this.curr_box, "purple")
			} else if(this.add_mode){
				this.draw_box(this.curr_box, "green")
			}

			return
		}

		for(const b of this.app.boxes){
			if(!b.contains_time(this.app.video.currentTime)){
				this.draw_box(b, "black", "black", 0.2, 0.4)
				continue
			}
			this.draw_box(b, "blue")
		}
	}

	highlight_box(box){
		this.curr_box = box
		this.highlight_mode = true
		this.draw()
	}

	remove_highlight(){
		this.highlight_mode = false
		this.curr_box = null
		this.draw()
	}

	map_to_real(c){
		return c * this.mapping
	}

	map_to_display(c){
		return c / this.mapping
	}

	edit_box(box){
		this.edit_mode = true
		this.curr_box = box
		this.draw()
	}

	mousedown(e){
		const x = this.map_to_real(e.layerX)
		const y = this.map_to_real(e.layerY)

		if(this.edit_mode){
			this.curr_box = new Box(this.curr_box.t_start, this.curr_box.t_end,
				x,y,x,y)
		} else {
			this.add_mode = true
			this.curr_box = new Box(this.app.video.currentTime, this.app.video.duration,
				x,y,x,y)
		}
	}

	mousemove(e){
		if(!this.add_mode){
			return
		}

		this.curr_box.x2 = this.map_to_real(e.layerX)
		this.curr_box.y2 = this.map_to_real(e.layerY)
	}

	mouseup(){
		if(this.curr_box.get_area() > 10){
			if(this.edit_mode){
				this.app.replace_box(this.curr_box)
			} else if(this.add_mode){
				this.app.add_box(this.curr_box)
			}
		}

		this.curr_box = null
		this.edit_mode = false
		this.add_mode = false
	}

}

class BoxList {
	constructor(){
		this.app = null
		this.element = document.getElementById("boxList")
	}

	bind_app(app){
		this.app = app
	}

	get_element(box){
		let elem = document.createElement("tr")
		elem.id = box.id

		function time_cell(value, f){
			let cell = document.createElement("td")
			
			let label = document.createElement("div")
			label.innerHTML = format_time(value)
			cell.appendChild(label)

			let button = document.createElement("button")
			button.innerHTML = "Agora"
			cell.appendChild(button)

			button.onclick = f

			let seek_btn = document.createElement("button")
			seek_btn.innerHTML = "Ir"
			seek_btn.onclick = () => {
				this.app.video.currentTime = value
			}
			cell.appendChild(seek_btn)
			
			elem.appendChild(cell)
		}

		time_cell.bind(this)(box.t_start, ()=>{
			const i = this.app.boxes.indexOf(box)
			const n = this.app.video.currentTime
			this.app.boxes[i].t_start = n
			this.app.replace_box(this.app.boxes[i])
		})
		time_cell.bind(this)(box.t_end, ()=>{
			const i = this.app.boxes.indexOf(box)
			const n = this.app.video.currentTime
			this.app.boxes[i].t_end = n 
			this.app.replace_box(this.app.boxes[i])
		})

		let del_cell = document.createElement("td")
		let del_btn = document.createElement("button")
		del_btn.onclick = () => {
			this.app.bc_canvas.remove_highlight()
			this.app.remove_box(box)
		}
		del_btn.innerHTML = "Remover"
		del_cell.appendChild(del_btn)
		elem.appendChild(del_cell)

		let edit_cell = document.createElement("td")
		let edit_btn = document.createElement("button")
		edit_btn.onclick = () => {
			this.app.bc_canvas.edit_box(box)
		}
		edit_btn.innerHTML = "Editar"
		edit_cell.appendChild(edit_btn)
		elem.appendChild(edit_cell)

		const t = debounce(this.app.bc_canvas.remove_highlight.bind(this.app.bc_canvas), 500)

		elem.onmouseenter = () => {
			this.app.bc_canvas.highlight_box(box)
			t()
		}

		elem.onmouseleave = () => {
			t()
		}

		return elem
	}

	add_box(box){
		const elem = this.get_element(box)
		this.element.appendChild(elem)
	}

	remove_box(box){
		for(let i = 1; i < this.element.children.length; i++){
			const c = this.element.children[i]
			if(c.id == box.id){
				this.element.removeChild(c)
				return
			}
		}
	}

	replace_box(box){
		for(let i = 1; i < this.element.children.length; i++){
			const c = this.element.children[i]
			if(c.id == box.id){
				const elem = this.get_element(box)
				this.element.insertBefore(elem, c)
				this.element.removeChild(c)
				return
			}
		}

	}

	show(){
		for(const b of this.app.boxes){
			const elem = this.get_element(b)
			this.element.appendChild(elem)
		}
	}
}

class BCToolbox {
	constructor(){
		this.element = document.getElementById("toolbox")
		this.add_box_button = document.getElementById("addBoxButton")
	}

	hide(){
		this.element.classList.add("toolbox_hidden")
	}

	show(){
		this.element.classList.remove("toolbox_hidden")
	}

	bind_app(app){
		this.app = app

		this.add_box_button.onclick = () => {
			this.app.bc_canvas.enable()
		}

		let t = debounce(this.hide.bind(this), 2000)
		this.app.video.onmousemove = () => {
			this.show()
			t()
		}
	}
}

class App {
	constructor(video, bc_canvas, bc_toolbox, box_list){
		this.video = video

		this.bc_toolbox = bc_toolbox
		this.bc_canvas = bc_canvas
		this.box_list = box_list

		this.bc_toolbox.bind_app(this)
		this.bc_canvas.bind_app(this)
		this.box_list.bind_app(this)

		this.boxes = []
	}

	async post_boxes(){
		fetch("boxes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(this.boxes)
		})
	}

	async get_boxes(){
		this.boxes = []
		const r = await fetch("boxes")
		const boxes = await r.json()
		for(const b of boxes){
			let n = new Box(
				b.t_start,
				b.t_end,
				b.x1,
				b.y1,
				b.x2,
				b.y2)
			n.id = this.get_id()
			this.boxes.push(n)
		}
	}

	get_id(){
		let id = 0
		w: while(true){
			for(const b of this.boxes){
				if(id == b.id){
					id = getRandomInt(0, 999999)
					continue w
				}
			}

			return id
		}
	}

	async add_box(box){
		box.id = this.get_id() 
		this.boxes.push(box)

		await this.post_boxes()

		this.box_list.add_box(box)
		this.bc_canvas.draw()
	}

	async replace_box(box){

		for(let i = 0; i < this.boxes.length; i++){
			if(this.boxes[i].id == box.id){
				this.boxes[i] = box
				await this.post_boxes()

				this.box_list.replace_box(box)
				this.bc_canvas.draw()

				return
			}
		}
		throw Error("Caixa não encontrada")
	}

	remove_box(box){
		this.box_list.remove_box(box)

		const i = this.boxes.indexOf(box)
		this.boxes.splice(i, 1)

		this.post_boxes()

		this.bc_canvas.draw()
	}

	async setup(){
		await this.get_boxes()

		if(this.bc_canvas.loaded_metadata){
			this.bc_canvas.draw()
		} else {
			this.bc_canvas.video.addEventListener("loadedmetadata", this.bc_canvas.draw.bind(this.bc_canvas))
		}

		document.onkeydown = (e) => {
			if(e.key != "Escape"){
				return
			}
			if(this.bc_canvas.get_enabled()){
				this.bc_canvas.disable()
			}
		}

		this.box_list.show()
	}
}

function main(){
	const bc_canvas = new BCCanvas()
	const bc_toolbox = new BCToolbox()
	const box_list = new BoxList()

	const video = document.getElementsByTagName("video")[0]

	const app = new App(video, bc_canvas, bc_toolbox, box_list)
	app.setup()

	return app
}

const app = main()
