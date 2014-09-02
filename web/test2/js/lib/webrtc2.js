
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

		localStream,
		p = {},
		promise = {}
	;

	// TODO: validate cfg against schema

	reset();

	function reset() {
		if(p.pc) {
			try {
				p.pc.close();
			} catch(ign) {}

			p.pc = null;
		}
		p = {};
		promise = {
			gotUserMedia: new $.Deferred(),
			gotRemoteSDP: new $.Deferred(),
			sentMySDP: new $.Deferred(),
			connected: new $.Deferred()
		};
		//app.debug({ICE: null});
	}


	// State management


	sm.onidle = reset;

	sm.onbeforestop = function(a,from,c, noBye) {
		// send 'bye' before closing
		if(from == 'connected' && !noBye) {
			rtcChannelSend(cnst.CMD_BYE);
		}
	};


	sm.onstart = function(a,b,c, _peerId) {

		if(_peerId) {
			p.peerId = _peerId;
			p.isCaller = true;
		}


		p.pc = new RTCPeerConnection(cfg.pcConfig, cfg.pcConfigOptional);


		p.pc.oniceconnectionstatechange = function(ev) {
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
				promise.connected.resolve();
				sm.connect();
			}
			//events.pub('rtcIceStateChanged', state);
			//if(pc) app.log(pc.getStats());

		};

		p.pc.onsignalingstatechange = function() {
			if(!p.pc) return;
			app.log('Signaling state: '+p.pc.signalingState);
		};


		// send any ice candidates to the other peer
		p.pc.onicecandidate = function(event) {
			if(!event.candidate) return;

			$.when(promise.gotRemoteSDP, promise.sentMySDP).done(function(){
				rtcChannelSend(cnst.CMD_CANDIDATE, event.candidate);
			});
		};


		if(p.isCaller) {
			promise.gotUserMedia.done(function(){
				//alert('creating OFFER');
				p.pc.createOffer(localDescCreated, logError);
			});
		}



		// once remote stream arrives, show it in the remote video element
		p.pc.onaddstream = function(event) {
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
			p.pc.addStream(stream);
			//promise.gotRemoteSDP.done(function(){
				events.pub('rtcGotLocalStream', stream);
			//});

			app.log('--- got UserMedia');
			promise.gotUserMedia.resolve();

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
				p.peerId = id;
				events.pub(cnst.RTC_INCOMING_CALL, p.peerId);

				sm.start();

			} else {

				if(id != p.peerId) {

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

				promise.gotUserMedia.done(function(){

					p.pc.setRemoteDescription(new RTCSessionDescription(data), function() {
						//alert('rrr');
						promise.gotRemoteSDP.resolve();
						// if we received an offer, we need to answer
						if(p.pc.remoteDescription.type == "offer" && !p.isCaller) {
							p.pc.createAnswer(localDescCreated, logError);
						}
					}, function(ex){
						console.error('Failed to set remote description: ', ex);
					});
				});


			} else if(cmd == cnst.CMD_CANDIDATE) {

				$.when(promise.gotRemoteSDP, promise.sentMySDP).done(function(){
					p.pc.addIceCandidate(new RTCIceCandidate(data));
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

		p.pc.setLocalDescription(desc, function () {

			rtcChannelSend(cnst.CMD_SDP, desc);
			promise.sentMySDP.resolve();

		}, function(ex){
			console.error('Failed to set local description: ', ex);
			console.log(desc);
		});
	}



	function rtcChannelSend(cmd, data) {
		promise.gotUserMedia.done(function(){
			events.pub(cnst.RTC_SEND_MSG, {
				peerId: p.peerId,
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
		peerId: p.peerId
	};
};

