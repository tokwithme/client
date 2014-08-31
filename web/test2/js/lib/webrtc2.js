
// based on:
// http://www.w3.org/TR/webrtc/#simple-peer-to-peer-example

app.webrtcCreate = function(cfg, events){

	var
		sm = app.stateCreate('rtc', {
			initial: 'idle',
			events: [
				{name: 'start', 	from: 'idle', 	to: 'call'},
				{name: 'connect', 	from: 'call', 	to: 'connected'},
				{name: 'stop', 		from: '*', 		to: 'idle'}
			]
		}),

		cnst = {
			CMD_SDP: 'sdp',
			CMD_CANDIDATE: 'candidate',
			CMD_BUSY: 'busy',
			RTC_SEND_MSG: 'rtcSendMsg',
			RTC_RECEIVE_MSG: 'rtcReceiveMsg',
			RTC_INCOMING_CALL: 'rtcIncomingCall'
		},

		pc,
		localStream,
		isCaller,
		peerId,
		gotUserMediaPromise,
		gotRemoteSDPPromise,
		sentMySDPPromise
	;

	// TODO: validate cfg against schema



	// State management


	sm.onidle = function() {
		if(pc) {
			try {
				pc.close();
			} catch(ign) {}

			setTimeout(function(){
				pc = null;
			}, 100);
		}
		peerId = null;
		gotUserMediaPromise = null;
		gotRemoteSDPPromise = null;
		sentMySDPPromise = null;
		//app.debug({ICE: null});
	};


	sm.onstart = function(a,b,c, _peerId) {

		gotUserMediaPromise = new $.Deferred();
		gotRemoteSDPPromise = new $.Deferred();
		sentMySDPPromise = new $.Deferred();

		if(_peerId) {
			peerId = _peerId;
			isCaller = true;
		}

		pc = new RTCPeerConnection(cfg.pcConfig);

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

			$.when(gotRemoteSDPPromise, sentMySDPPromise).done(function(){
				rtcChannelSend(cnst.CMD_CANDIDATE, event.candidate);
			});

		};

		// let the "negotiationneeded" event trigger offer generation
		pc.onnegotiationneeded = function() {
			// create offer only after UserMedia is received
			gotUserMediaPromise.done(function(){
				alert('afterUserMedia');
				pc.createOffer(localDescCreated, logError);
			});
		};

		// once remote stream arrives, show it in the remote video element
		pc.onaddstream = function(event) {
			//console.log("--- Got remote stream! ---");
			//alert('got remote stream');

			events.pub('rtcGotRemoteStream', event.stream);
		};

		// get a local stream, show it in a self-view and add it to be sent


		getUserMedia(cfg.constraints, function(stream) {
			if(!localStream) localStream = stream;
			pc.addStream(stream);
			events.pub('rtcGotLocalStream', stream);
			app.log('--- got UserMedia');
			gotUserMediaPromise.resolve();

		}, function(e) {
			var msg = (e && e.name) ? e.name : 'getUserMedia error';
			alert(msg);
			sm.stop();
		});


	};


	// Events


	events.sub(cnst.RTC_RECEIVE_MSG, function(msg) {

		// TODO: validate msg

		try {
			var
				id = msg.id,
				cmd = msg.data.cmd,
				data = msg.data.data
			;




			if(sm.is('idle')) {
				if(cmd != cnst.CMD_SDP) {console.error('rtc got incoming call starting from wrong cmd, ignoring: '+cmd); return;}

				// receive incoming call
				// send event, start incoming connection on external event
				peerId = id;
				events.pub(cnst.RTC_INCOMING_CALL, peerId);

				sm.start();

			} /*else if(sm.is('connected')) {
				if(cmd == cnst.CMD_CANDIDATE && id == peerId) {
					// ok
				} else {
					app.log('rtc msg in connected state, skipping: '+cmd); return;
				}

			} */else {
				// state == connecting

				if(id != peerId) {

					if(cmd == cnst.CMD_SDP) {
						// incoming call from different partner => reply "busy"
						events.pub(cnst.RTC_SEND_MSG, {
							peerId: id,
							data: {
								cmd: cnst.CMD_BUSY
							}
						});
					} else {
						console.error('Wrong incoming call msg from different partner, ignoring: '+cmd);
					}
					return;
				}

				if(cmd == cnst.CMD_BUSY) {
					// got BUSY reply from the peer
					sm.stop(); return;
				}
			}

			// process msg

			if(cmd == cnst.CMD_SDP) {

				pc.setRemoteDescription(new RTCSessionDescription(data), function() {
					gotRemoteSDPPromise.resolve();
					// if we received an offer, we need to answer
					if(pc.remoteDescription.type == "offer" && !isCaller) {
						pc.createAnswer(localDescCreated, logError);
					}
				}, logError);


			} else if(cmd == cnst.CMD_CANDIDATE) {

				$.when(gotRemoteSDPPromise, sentMySDPPromise).done(function(){
					pc.addIceCandidate(new RTCIceCandidate(data));
				});


			} else {
				console.error('unknown cmd: ', cmd);
			}

		} catch(ex) {
			console.error('rtcReceiveMsg exception: ', ex);
		}
	});


	// API


	function getUserMedia(constraints, cb, cbErr) {
		if(localStream) {cb(localStream); return;}
		navigator.getUserMedia(constraints, cb, cbErr);
	}


	function localDescCreated(desc) {
		//console.log("localDescCreated");
		alert('localDescCreated');

		pc.setLocalDescription(desc, function () {

			rtcChannelSend(cnst.CMD_SDP, desc);
			sentMySDPPromise.resolve();

		}, logError);
	}



	function rtcChannelSend(cmd, data) {
		gotUserMediaPromise.done(function(){
			events.pub(cnst.RTC_SEND_MSG, {
				peerId: peerId,
				data: {
					cmd: cmd,
					data: data
				}
			});
		});
	}


	function logError(e) {
		console.log('error: ', e);
	}




	return {
		sm: sm,
		cnst: cnst,
		peerId: peerId
	};
};

