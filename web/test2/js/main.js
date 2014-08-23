
// main
(function(){

	var
		ev = app.ev,
		events = app.eventsCreate(),
		ws = app.wsCreate(events),
		view = app.viewCreate(events, ev),
		serverApi = app.serverApiCreate(events, ev, ws),
		clientApi = app.clientApiCreate(),
		//rtcChannel = app.rtcChannelCreate(serverApi),
		webrtc = app.webrtcCreate(events),
		service = app.serviceCreate(events, ev, serverApi, webrtc)

	;


	return;

	var stream = webrtc.getUserMedia({
		video: true
	}, gotStream);



	function gotStream(stream1){
		console.log("Received local stream");
		//console.log(stream1);
		stream = stream1;
		video1.src = URL.createObjectURL(stream);


		if(stream.getVideoTracks().length > 0) {
			console.log('Using video device: ' + stream.getVideoTracks()[0].id);
		}
		if(stream.getAudioTracks().length > 0) {
			console.log('Using audio device: ' + stream.getAudioTracks()[0].id);
		}

		var pc_config = {
			"iceServers": [
				{"url": "stun:stun.l.google.com:19302"}
			]
		};

		localPeerConnection = new RTCPeerConnection(pc_config);
		console.log("Created local peer connection object localPeerConnection");
		//localPeerConnection.onicecandidate = gotLocalIceCandidate;

		remotePeerConnection = new RTCPeerConnection(pc_config);
		console.log("Created remote peer connection object remotePeerConnection");
		//remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
		remotePeerConnection.onaddstream = gotRemoteStream;

		localPeerConnection.addStream(stream);
		console.log("Added localStream to localPeerConnection");
		localPeerConnection.createOffer(gotLocalDescription, error);
	}


	function gotLocalIceCandidate(event){
		if(event.candidate) {
			//remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
			console.log("Local ICE candidate: \n|" + event.candidate.candidate+"|");
			//alert('local candidate');
		}
	}

	function gotRemoteIceCandidate(event){
		if (event.candidate) {
			//localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
			console.log("Remote ICE candidate: \n|" + event.candidate.candidate+"|");
			//alert('remote candidate');
		}
	}

	function gotRemoteStream(event){
		video2.src = URL.createObjectURL(event.stream);
		console.log("Received remote stream");
		alert('got stream!');
	}

	function gotLocalDescription(description){
		localPeerConnection.setLocalDescription(description);
		console.log(description);
		console.log("Offer from localPeerConnection: \n" + description.sdp);

		// send description.sdp string to your peer via server (by id)
		// on remote side:
		remotePeerConnection.setRemoteDescription(description);
		remotePeerConnection.createAnswer(gotRemoteDescription, error);
	}

	function gotRemoteDescription(description){
		remotePeerConnection.setLocalDescription(description);
		console.log("Answer from remotePeerConnection: \n" + description.sdp);
		localPeerConnection.setRemoteDescription(description);
	}




})();

