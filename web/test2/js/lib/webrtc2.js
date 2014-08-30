
// based on:
// http://www.w3.org/TR/webrtc/#simple-peer-to-peer-example

app.webrtcCreate = function(events){

	var
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
		localStream,
		isCaller,
		remoteDescrAdded,

		sm = app.stateCreate('rtc', {
			initial: 'idle',
			events: [
				{name: 'start', 	from: 'idle', 	to: 'call'},
				{name: 'connect', 	from: 'call', 	to: 'connected'},
				{name: 'stop', 		from: '*', 		to: 'idle'}
			]
		})
	;


	sm.onidle = function() {
		if(pc) {
			try {
				pc.close();
			} catch(ign) {}

			//setTimeout(function(){
				pc = null;
			//}, 0);
		}
		remoteDescrAdded = false;
	};


	function logError(e) {
		console.log('error', e);
	}

	// call start() to initiate
	sm.onstart = function(a,b,c,_isCaller) {

		isCaller = _isCaller;

		pc = new RTCPeerConnection(pcConfig);

		pc.oniceconnectionstatechange = function() {
			if(!pc) return;
			var state = pc.iceConnectionState;
			app.log('--- ICE state: '+state);
			app.debug({ICE: state});
			if(state == 'disconnected') {
				//events.pub(en.rtcDisconnect);
				sm.stop();
				//reset();
			} else if(state == 'connected') {
				sm.connect();
			}
			//events.pub('rtcIceStateChanged', state);

		};

		/*pc.onsignalingstatechange = function() {
			if(!pc) return;
			app.log('Signaling state: '+pc.signalingState);
		}*/

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
			//console.log("--- Got remote stream! ---");
			//alert('got remote stream');

			events.pub('rtcGotRemoteStream', event.stream);
		};

		// get a local stream, show it in a self-view and add it to be sent


		getUserMedia({ "video": true }, function(stream) {
			if(!localStream) localStream = stream;
			pc.addStream(stream);
			events.pub('rtcGotLocalStream', stream);

		}, function(e) {
			var msg = (e && e.name) ? e.name : 'getUserMedia error';
			alert(msg);
			sm.stop();
		});


	};

	function getUserMedia(constraints, cb, cbErr) {
		if(localStream) {cb(localStream); return;}
		navigator.getUserMedia(constraints, cb, cbErr);
	}


	function localDescCreated(desc) {
		//console.log("localDescCreated");

		pc.setLocalDescription(desc, function () {

			rtcChannelSend(cmsg.sdp, desc);

		}, logError);
	}





	function rtcChannelSend(cmd, data) {
		var msg = {
			cmd: cmd,
			data: data
		};
		events.pub('rtcSendMsg', msg);
	}


	events.sub('rtcReceiveMsg', function(msg) {

		try {
			var
				cmd = msg.cmd,
				data = msg.data
			;

			if(sm.can('start')) {
				// receive incoming call
				// send event, start incoming connection on external event
				//start();
				sm.start();
			}

			if(sm.is('connected')) {
				app.log('rtc msg in connected state, skipping: '+cmd); return;
			}

			if(cmd == cmsg.sdp) {
				pc.setRemoteDescription(new RTCSessionDescription(data), function() {
					remoteDescrAdded = true;
					// if we received an offer, we need to answer
					if(pc.remoteDescription.type == "offer") {
						pc.createAnswer(localDescCreated, logError);
					}
				}, logError);

			} else if(cmd == cmsg.candidate) {
				if(!remoteDescrAdded) {
					console.error('received Candidate, but remote descr wasn\'t added yet!'); return;
				}
				pc.addIceCandidate(new RTCIceCandidate(data));

			} else {
				console.error('unknown message: ', msg);
			}

		} catch(ex) {
			console.error('rtcReceiveMsg exception: ', ex);
		}
	});




	return {
		sm: sm
		/*
		start: function() {sm.start();},
		stop: function() {sm.stop();}
		*/
	};
};

