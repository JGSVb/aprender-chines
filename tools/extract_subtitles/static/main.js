function format_time(seconds){
	const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");

    return `${hh}:${mm}:${ss}`;
}

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function hashObj(obj){
	return hashCode(JSON.stringify(obj))
}

class Box {
	constructor(t_start, t_end, x1, y1, x2, y2){
		this.t_start = t_start
		this.t_end = t_end
		this.x1 = x1
		this.y1 = y1
		this.x2 = x2
		this.y2 = y2
	}

	get_width(){
		return this.x2 - this.x1
	}

	get_height(){
		return this.y2 - this.y1
	}

	contains_time(time){
		return time >= this.t_start && time < this.t_end
	}

}

function new_box_from_display(t_start, t_end, mapping, x1, y1, x2, y2){
	return new Box(t_start, t_end, x1 * mapping, y1 * mapping, x2 * mapping, y2 * mapping)
}

class BCCanvas {

	constructor(id){
		this.element = document.getElementById(id)

		this.real_width = null
		this.real_height = null
		this.mapping = null
		this.app = null

		this.display_width = null
		this.display_height = null

		this.curr_box = null
		this.draw_interval = null
	}

	set_pointer_events(v){
		this.element.style.pointerEvents = v
	}

	enable(){
		this.set_pointer_events("all")
		this.element.classList.add("enabled")
	}

	disable(){
		this.set_pointer_events("none")
		this.element.classList.remove("enabled")
	}

	bind_app(app){
		this.app = app

		this.mousemove = null
		this.mouseup = null

		this.app.video.addEventListener("loadedmetadata", this.loaded_metadata.bind(this))

		this.element.addEventListener("mousedown", (e)=>{
			this.mousedown(e)
			this.draw()
		})
		this.element.addEventListener("mousemove", (e)=>{
			if(this.mousemove){
				this.mousemove(e)
				this.draw()
			}
		})
		this.element.addEventListener("mouseup", (e)=>{
			if(this.mouseup){
				this.mouseup(e)
				this.draw()
			}
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

	loaded_metadata(e){
		const elem = e.target
		this.real_width = elem.videoWidth
		this.real_height = elem.videoHeight

		this.element.width = this.element.parentElement.offsetWidth
		this.element.height = this.element.parentElement.offsetHeight

		this.display_width = this.element.width
		this.display_height = this.element.height

		this.mapping = this.real_width / this.display_width
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

	draw_box(box, style){
		const ctx = this.get_context()
		
		ctx.globalAlpha = 0.2 
		ctx.fillStyle = style
		ctx.fillRect(this.map_to_display(box.x1),
			this.map_to_display(box.y1),
			this.map_to_display(box.get_width()),
			this.map_to_display(box.get_height()))
		ctx.globalAlpha = 1.0

		ctx.strokeStyle = style
		ctx.beginPath();
		ctx.rect(this.map_to_display(box.x1),
			this.map_to_display(box.y1),
			this.map_to_display(box.get_width()),
			this.map_to_display(box.get_height()))
		ctx.lineWidth = 3
		ctx.stroke()
	}

	draw(){
		this.clear()

		for(const b of this.app.boxes){
			if(!b.contains_time(this.app.video.currentTime)){
				continue
			}
			this.draw_box(b, "blue")
		}

		if(this.curr_box){
			this.draw_box(this.curr_box, "green")
		}
	}

	map_to_real(c){
		return c * this.mapping
	}

	map_to_display(c){
		return c / this.mapping
	}

	mousedown(e){
		this.curr_box = new Box(this.app.video.currentTime, this.app.video.duration,
			this.map_to_real(e.layerX),
			this.map_to_real(e.layerY),
			this.map_to_real(e.layerX),
			this.map_to_real(e.layerY))

		function mousemove(e){
			this.curr_box.x2 = this.map_to_real(e.layerX)
			this.curr_box.y2 = this.map_to_real(e.layerY)
		}

		function mouseup(e){
			this.app.add_box(this.curr_box)
			this.curr_box = null

			this.mouseup = null
			this.mousemove = null
		}

		this.mousemove = mousemove.bind(this)
		this.mouseup = mouseup.bind(this)
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
		elem.id = hashObj(box)

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
			seek_btn.onclick = () => {
				this.app.video.currentTime = value
			}
			
			elem.appendChild(cell)
		}

		time_cell(box.t_start, (e)=>{
			const i = this.app.boxes.indexOf(box)
			const n = this.app.video.currentTime
			this.app.boxes[i].t_start = n 
			e.target.parentElement.getElementsByTagName("div")[0].innerHTML = format_time(n)
			this.app.post_boxes()
		})
		time_cell(box.t_end, (e)=>{
			const i = this.app.boxes.indexOf(box)
			const n = this.app.video.currentTime
			this.app.boxes[i].t_end = n 
			e.target.parentElement.getElementsByTagName("div")[0].innerHTML = format_time(n)
			this.app.post_boxes()
		})

		let del_cell = document.createElement("td")
		let del_btn = document.createElement("button")
		del_btn.onclick = () => {
			this.app.remove_box(box)
		}
		del_btn.innerHTML = "Remover"
		del_cell.appendChild(del_btn)
		elem.appendChild(del_cell)

		return elem
	}

	add_box(box){
		const elem = this.get_element(box)
		this.element.appendChild(elem)
	}

	remove_box(box){
		for(const c of this.element.children){
			if(c.id == hashObj(box)){
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

class App {
	constructor(video, bc_canvas, bc_switch, box_list){
		this.video = video

		this.bc_switch = bc_switch
		
		this.bc_canvas = bc_canvas
		this.box_list = box_list

		this.bc_canvas.bind_app(this)
		this.box_list.bind_app(this)

		this.boxes = []
	}

	box_exists(box){
		for(const b of this.boxes){
			if(_.isEqual(b, box)){
				return true;
			}
		}
		return false;
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
		const boxes = await fetch("boxes").then(x => {return x.json()})
		for(const b of boxes){
			let n = new Box(
				b.t_start,
				b.t_end,
				b.x1,
				b.y1,
				b.x2,
				b.y2)
			this.boxes.push(n)
		}
	}

	async add_box(box){
		if(this.box_exists(box)){
			throw Error("Já existe");
		}

		this.box_list.add_box(box)
		this.boxes.push(box)

		await this.post_boxes()

		this.bc_canvas.draw()
	}

	remove_box(box){
		if(!this.box_exists(box)){
			throw Error("Não existe")
		}

		this.box_list.remove_box(box)

		const i = this.boxes.indexOf(box)
		this.boxes.splice(i, 1)

		this.post_boxes()

		this.bc_canvas.draw()
	}

	async setup(){
		await this.get_boxes()
		this.bc_switch.onclick()
		this.box_list.show()
		this.bc_canvas.draw()
	}
}

function main(){
	const bc_canvas = new BCCanvas("boxControls")
	let bc_switch = document.getElementById("boxControlsSwitch")
	bc_switch.onclick = () => {
		if(bc_switch.checked){
			bc_canvas.enable()
		} else {
			bc_canvas.disable()
		}
	}

	const box_list = new BoxList()

	const video = document.getElementsByTagName("video")[0]

	const app = new App(video, bc_canvas, bc_switch, box_list)
	app.setup()


	return app
}

const app = main()
