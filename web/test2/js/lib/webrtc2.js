
// based on:
// http://www.w3.org/TR/webrtc/#simple-peer-to-peer-example

app.webrtcCreate = function(events){

	var
		ev = {
			rtcConnected: 'rtcConnected',
			rtcGotLocalStream: 'rtcGotLocalStream',
			rtcGotRemoteStream: 'rtcGotRemoteStream',
			rtcError: 'rtcError',
			rtcSendMsg: 'rtcSendMsg',
			rtcReceiveMsg: 'rtcReceiveMsg',
			rtcDisconnect: 'rtcDisconnect'

		},
		cmsg = {
			sdp: 'sdp',
			candidate: 'candidate'
		},
		pcConfig = {
			"iceServers": [
				{"url": "stun:stun.l.google.com:19302"},
				// ff .urls workaround
				/*
				{'url': "turn:23.251.129.26:3478?transport=udp", "credential":"/D+eNYu7YDEKk6cLCeAx0pxZj7o=", "username":"1409228251:72418302"},
				{'url': "turn:23.251.129.26:3478?transport=tcp", "credential":"/D+eNYu7YDEKk6cLCeAx0pxZj7o=", "username":"1409228251:72418302"},
				{'url': "turn:23.251.129.26:3479?transport=udp", "credential":"/D+eNYu7YDEKk6cLCeAx0pxZj7o=", "username":"1409228251:72418302"},
				{'url': "turn:23.251.129.26:3479?transport=tcp", "credential":"/D+eNYu7YDEKk6cLCeAx0pxZj7o=", "username":"1409228251:72418302"}
				*/

				{
					"urls":[
						"turn:23.251.129.26:3478?transport=udp",
						"turn:23.251.129.26:3478?transport=tcp",
						"turn:23.251.129.26:3479?transport=udp",
						"turn:23.251.129.26:3479?transport=tcp"
					],
					"credential":"/D+eNYu7YDEKk6cLCeAx0pxZj7o=",
					"username":"1409228251:72418302"
				}
			]
		},
		pc,
		started = false
	;


	function logError(e) {
		console.log('error', e);
	}

	// call start() to initiate
	function start() {
		if(started) {
			app.log('already started'); return false;
		}
		started = true;

		pc = new RTCPeerConnection(pcConfig);

		pc.oniceconnectionstatechange = function() {
			if(!pc) return;
			app.log('--- ICE state: '+pc.iceConnectionState);
			if(pc.iceConnectionState == 'disconnected') {
				events.pub(ev.rtcDisconnect);
				stop();
			}
		};

		pc.onsignalingstatechange = function() {
			if(!pc) return;
			app.log('Signaling state: '+pc.signalingState);
		}

		// send any ice candidates to the other peer
		pc.onicecandidate = function(event) {
			if(!event.candidate) return;
			rtcChannelSend(cmsg.candidate, event.candidate);
		};

		// let the "negotiationneeded" event trigger offer generation
		pc.onnegotiationneeded = function() {
			pc.createOffer(localDescCreated, logError);
		}

		// once remote stream arrives, show it in the remote video element
		pc.onaddstream = function(event) {
			console.log("--- Got remote stream! ---");
			//alert('got remote stream');

			events.pub(ev.rtcGotRemoteStream, event.stream);
		};

		// get a local stream, show it in a self-view and add it to be sent
		navigator.getUserMedia({ "video": true }, function (stream) {
			pc.addStream(stream);
			events.pub(ev.rtcGotLocalStream, stream);

		}, logError);

	}

	function localDescCreated(desc) {
		//console.log("localDescCreated");

		pc.setLocalDescription(desc, function () {

			rtcChannelSend(cmsg.sdp, desc);

		}, logError);
	}

	function stop() {
		if(pc) {
			pc.close();
			setTimeout(function(){
				pc = null;
			}, 100);

		}

		started = false;
	}


	events.sub(ev.rtcReceiveMsg, function(msg) {

		try {
			var
				cmd = msg.cmd,
				data = msg.data
			;

			if(!pc) start();

			if(cmd == cmsg.sdp) {
				pc.setRemoteDescription(new RTCSessionDescription(data), function() {
					// if we received an offer, we need to answer
					if(pc.remoteDescription.type == "offer")
						pc.createAnswer(localDescCreated, logError);
				}, logError);

			} else if(cmd == cmsg.candidate) {
				pc.addIceCandidate(new RTCIceCandidate(data));

			} else {
				console.error('unknown message: ', msg);
			}

		} catch(ex) {
			console.error('rtcReceiveMsg exception: ', ex);
		}
	});

	function rtcChannelSend(cmd, data) {
		var msg = {
			cmd: cmd,
			data: data
		};
		events.pub(ev.rtcSendMsg, msg);
	}


	return {
		start: start,
		stop: stop
	};
};

