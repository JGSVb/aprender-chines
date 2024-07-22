class Debounce {

	constructor(func, delay){
		this.timer = null
		this.delay = delay
		this.func = func
	}

	clear(){
		clearTimeout(this.timer)
	}

	debounce(...args){
		this.clear()

		this.timer = setTimeout(() => {
			this.func.apply(this, args)
		}, this.delay)
	}
}

export default Debounce
