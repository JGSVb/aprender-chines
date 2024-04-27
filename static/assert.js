function assert(expression, message = "Assertion failed"){
	if(!expression){
		throw message;
	}
}
