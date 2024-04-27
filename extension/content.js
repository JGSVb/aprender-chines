const ytPlayer = document.getElementById("movie_player");
let isPlaying = false;

function onStateChanged(state){
	if(state == 1){
		isPlaying = true;
	} else {
		isPlaying = false;
	}
}

setTimeout(function(){
	if(isPlaying){
		console.log("banana");
	}
}, 100);

ytPlayer.addEventListener("onStateChanged", onStateChanged);
