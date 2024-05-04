// Load the IFrame Player API code asynchronously.
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";

var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Instantiate the Player.
var player = null;

function onYouTubeIframeAPIReady() {
	player = new YT.Player("youtubePlayer", {
		videoId: GLOBAL_VIDEO_ID,
		events: {
			"onStateChange": onPlayerStateChange
		},
		width: "100%",
		height: "100%"
	});
}

const cronosStatus = {
	currTimeMS: 0,
	interval: 0,
	intervalFunction: null,
};

function cronosFunction(event){
	cronosStatus.currTimeMS = Math.floor(player.getCurrentTime() * 1000);

	if(cronosStatus.intervalFunction != null){
		cronosStatus.intervalFunction();
	}
}

var playerStateChangeFunction = null;

function onPlayerStateChange(event){
	if(playerStateChangeFunction){
		playerStateChangeFunction();
	}
	if(event.data == YT.PlayerState.PLAYING){
		cronosStatus.interval = setInterval(cronosFunction, 100);
	} else {
		clearInterval(cronosStatus.interval);
	}

}
