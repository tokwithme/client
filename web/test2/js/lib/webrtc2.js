
// based on:
// http://www.w3.org/TR/webrtc/#simple-peer-to-peer-example

app.webrtcCreate = function(cfg, events){

	var
		sm = app.stateCreate('rtc', {
			initial: 'idle',
			events: [
				{name: 'start', 	from: 'idle', 		to: 'call'},
				{name: 'connect', 	from: 'call', 		to: 'connected'},
				{name: 'stop', 		from: '*', 			to: 'idle'}
			]
		}),

		cnst = {
			CMD_SDP: 'sdp',
			CMD_CANDIDATE: 'candidate',
			CMD_BUSY: 'busy',
			CMD_BYE: 'bye',
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
			}, 0);
		}
		isCaller = false;
		peerId = null;
		gotUserMediaPromise = null;
		gotRemoteSDPPromise = null;
		sentMySDPPromise = null;
		//app.debug({ICE: null});
	};

	sm.onbeforestop = function(a,from,c, noBye) {
		// send 'bye' before closing
		if(from == 'connected' && !noBye) {
			rtcChannelSend(cnst.CMD_BYE);
		}
	};


	sm.onstart = function(a,b,c, _peerId) {

		gotUserMediaPromise = new $.Deferred();
		gotRemoteSDPPromise = new $.Deferred();
		sentMySDPPromise = new $.Deferred();
		isCaller = false;

		if(_peerId) {
			peerId = _peerId;
			isCaller = true;
		}

		pc = new RTCPeerConnection(cfg.pcConfig, cfg.pcConfigOptional);

		pc.onconnecting = function(){
			app.log('!!! connecting');
		};

		pc.onopen = function(){
			app.log('!!! open');
		};

		pc.oniceconnectionstatechange = function(ev) {
			//if(!pc) return;
			//var state = pc.iceConnectionState;
			var state = ev.target.iceConnectionState;
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
			//if(pc) app.log(pc.getStats());

		};

		pc.onsignalingstatechange = function() {
			if(!pc) return;
			app.log('Signaling state: '+pc.signalingState);
		};

		// send any ice candidates to the other peer
		pc.onicecandidate = function(event) {
			if(!event.candidate) return;

			$.when(gotRemoteSDPPromise, sentMySDPPromise).done(function(){
				rtcChannelSend(cnst.CMD_CANDIDATE, event.candidate);
			});
		};

		// let the "negotiationneeded" event trigger offer generation
		/*
		pc.onnegotiationneeded = function() {
			// create offer only after UserMedia is received
			gotUserMediaPromise.done(function(){
				pc.createOffer(localDescCreated, logError);
			});
		};*/
		if(isCaller) {
			gotUserMediaPromise.done(function(){
				//alert('creating OFFER');
				pc.createOffer(localDescCreated, logError);
			});
		}

		// once remote stream arrives, show it in the remote video element
		pc.onaddstream = function(event) {
			if(!event) {
				console.error('onAddStream with empty event');
				return;
			}
			console.log("--- Got remote stream! ---");
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

			} else {

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
				} else if(cmd == cnst.CMD_BYE) {
					app.log('received BYE from remote peer, disconnecting');
					sm.stop(true); return;
				}
			}

			// process msg

			if(cmd == cnst.CMD_SDP) {

				gotUserMediaPromise.done(function(){

					pc.setRemoteDescription(new RTCSessionDescription(data), function() {
						//alert('rrr');
						gotRemoteSDPPromise.resolve();
						// if we received an offer, we need to answer
						if(pc.remoteDescription.type == "offer" && !isCaller) {
							pc.createAnswer(localDescCreated, logError);
						}
					}, function(ex){
						console.error('Failed to set remote description: ', ex);
					});
				});


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
		//alert('localDescCreated');

		//console.log('ld before: ',pc.localDescription);

		pc.setLocalDescription(desc, function () {

			rtcChannelSend(cnst.CMD_SDP, desc);
			sentMySDPPromise.resolve();

		}, function(ex){
			console.error('Failed to set local description: ', ex);
			console.log(desc);
		});
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
		console.error('error: ', e);
	}




	return {
		sm: sm,
		cnst: cnst,
		peerId: peerId
	};
};

