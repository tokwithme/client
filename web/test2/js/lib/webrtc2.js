
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


	// State reset

	reset();

	function reset() {
		if(p.pc) {
			try {
				p.pc.close();
			} catch(ign) {}

			p.pc = null;
		}

		// localStream = null; // uncomment to free the cached UserMedia object ("using media" icon will be removed from the browser)
		clearTimeout(p.toConnect);
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
		if(from != 'idle' && !noBye) {
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
			console.log('--- ICE state: '+state);
			app.debug({ICE: state});
			if(state == 'disconnected' || state == 'closed') {
				//events.pub(en.rtcDisconnect);
				sm.stop();
				//reset();
			} else if(state == 'connected') {
				clearTimeout(p.toConnect);
				promise.connected.resolve();
				sm.connect();
			}
			//events.pub('rtcIceStateChanged', state);
			//if(pc) console.log(pc.getStats());

		};

		p.pc.onsignalingstatechange = function() {
			if(!p.pc) return;
			console.log('Signaling state: '+p.pc.signalingState);
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
				p.pc.createOffer(localDescCreated, fatalError);
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

		getUserMedia(cfg.constraints).then(
			function(stream) {
				p.pc.addStream(stream);
				//promise.gotRemoteSDP.done(function(){
				events.pub('rtcGotLocalStream', stream);
				//});

				console.log('--- got UserMedia');
				promise.gotUserMedia.resolve();

				if(cfg.connectTimeoutSec)
					p.toConnect = setTimeout(function(){
						console.log('Connection timeout reached, closing.');
						sm.stop();
					}, cfg.connectTimeoutSec*1000);

			},

			function(ex) {
				console.error('getUserMedia error: ', ex);
				var msg = (ex && ex.name) ? ex.name : 'getUserMedia error';
				alert(msg);
				sm.stop(true);
			}
		);
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

				//return; // pro tip: uncomment to test connection timeout
				sm.start();

			} else {
				// not idle

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
					sm.stop(true); return;
				} else if(cmd == cnst.CMD_BYE) {
					console.log('received BYE from remote peer, disconnecting');
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
							p.pc.createAnswer(localDescCreated, fatalError);
						}
					}, fatalError);
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


	function getUserMedia(constraints) {
		var def = new $.Deferred();

		if(localStream) {
			def.resolve(localStream);
		} else {
			navigator.getUserMedia(constraints, function(stream){
				localStream = stream;
				def.resolve(stream);
			}, function(ex){
				def.reject(ex);
			});
		}

		return def.promise();
	}


	function localDescCreated(desc) {
		//console.log("localDescCreated");
		//alert('localDescCreated');

		//console.log('ld before: ',pc.localDescription);

		p.pc.setLocalDescription(desc, function () {

			rtcChannelSend(cnst.CMD_SDP, desc);
			promise.sentMySDP.resolve();

		}, fatalError);
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

	function fatalError(ex) {
		console.error('fatal error: ', ex);
		sm.stop(); // will send 'bye' command
	}


	return {
		sm: sm,
		cnst: cnst,
		p: p
	};
};

