import clamp from "./clamp"

function draggable(
	node,
	{
		buttons = 1,
		applyStyles = false
	} = { }){

	let moving = false

	function setNodePosition(e){
		const parent = node.parentNode
		const parentRect = parent.getBoundingClientRect()

		const movX = e.movementX / parentRect.width * 100
		const movY = e.movementY / parentRect.height * 100

		const nodeRect = node.getBoundingClientRect()
		const prevLeft = (nodeRect.left - parentRect.left) / parentRect.width * 100
		const prevTop = (nodeRect.top - parentRect.top) / parentRect.height * 100

		const maxLeft = 100 - nodeRect.width / parentRect.width * 100
		const maxTop = 100 - nodeRect.height / parentRect.height * 100
		const destLeft = clamp(0, maxLeft, prevLeft + movX)
		const destTop = clamp(0, maxTop, prevTop + movY)

		node.style.left = `${destLeft}%`
		node.style.top = `${destTop}%`
	}

	function checkButtons(e){
		return e.buttons == buttons
	}

	function handleMouseDown(e){
		if(!checkButtons(e)){
			moving = false
			return
		}

		moving = true
	}

	function handleMouseUp(e){
		if(!moving){
			return
		}

		moving = false
	}

	function handleMouseMove(e){
		if(!checkButtons(e) || !moving){
			return
		}

		node.dispatchEvent(
			new CustomEvent("dragged", {
				detail: {
					movementX: e.movementX,
					movementY: e.movementY,
					clientX: e.clientX,
					clientY: e.clientY
				}
			})
		)

		if(!applyStyles){
			return
		}

		setNodePosition(e)
	}

	function handleSelection(e){
		if(moving){
			e.preventDefault()
		}
	}

	if(applyStyles){
		node.style.position = "relative"
		node.style.cursor = "move"
		node.style.userSelect = "none"
	}

	node.addEventListener("mousedown", handleMouseDown)
	window.addEventListener("mouseup", handleMouseUp)
	window.addEventListener("mousemove", handleMouseMove)
	window.addEventListener("selectstart", handleSelection)

	return {
		destroy: function() {
			node.removeEventListener("mousedown", handleMouseDown)
			window.removeEventListener("mouseup", handleMouseUp)
			window.removeEventListener("mousemove", handleMouseMove)
			window.removeEventListener("selectstart", handleSelection)
		}
	}

}

export default draggable
