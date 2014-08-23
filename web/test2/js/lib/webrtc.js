

app.webrtcCreate = function(events){

	var
		ev = {
			rtcConnected: 'rtcConnected',
			rtcGotLocalStream: 'rtcGotLocalStream',
			rtcGotRemoteStream: 'rtcGotRemoteStream',
			rtcError: 'rtcError',
			rtcSendMsg: 'rtcSendMsg',
			rtcReceiveMsg: 'rtcReceiveMsg'
		},
		cmsg = {
			descr1: 'descr1',
			descr2: 'descr2',
			candidate: 'candidate'
		},
		pcConfig = {
			"iceServers": [
				{"url": "stun:stun.l.google.com:19302"}
			]
		},
		pc,
		stream,
		isCaller,
		remoteDescr
	;


	//navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	//console.log('getUserMedia: ', navigator.getUserMedia);

	//RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	//console.log('peerConnection: ', RTCPeerConnection);

	//RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
	//console.log('sessionDescription: ', RTCSessionDescription);

	//RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
	//console.log('iceCandidate', RTCIceCandidate);

	function error(e) {
		console.log('error', e);
	}

	function getLocalStream() {
		navigator.getUserMedia({
			video: true
		}, function(stream1){

			//if(!isCaller) alert('gotLocalStream');

			stream = stream1;
			pc.addStream(stream);

			events.pub(ev.rtcGotLocalStream, stream);

			connect2();


		}, function(err){
			console.log('getUserMedia error', err);
		});
	}

	function connect(isCaller1) {
		isCaller = isCaller1;

		pc = new RTCPeerConnection(pcConfig);

		// send any ice candidates to the other peer
		pc.onicecandidate = function (event) {
			if(!event.candidate) return;
			rtcChannelSend(cmsg.candidate, event.candidate);
		};

		//if(!isCaller) alert('connect');






		getLocalStream();

	}

	function connect2() {

		pc.onaddstream = function(event) {
			console.log("Got remote stream!!");

			events.pub(ev.rtcGotRemoteStream, event.stream);
			//events.pub(ev.rtcConnected);
		}

		if(isCaller) {
			pc.createOffer(gotDescription, error);
		} else {
			pc.setRemoteDescription(new RTCSessionDescription(remoteDescr));
			pc.createAnswer(gotDescription, error);			

		}

	}

	function gotDescription(descr){
		pc.setLocalDescription(descr);
		//console.log(descr);
		console.log("gotDescription");

		// send description.sdp string to your peer via server (by id)

		var msg = isCaller ? cmsg.descr1 : cmsg.descr2;
		rtcChannelSend(msg, descr);

		// on remote side:
		//remotePc.setRemoteDescription(descr);
		//remotePc.createAnswer(gotRemoteDescription, error);
	}


	function rtcChannelSend(cmd, data) {
		var msg = {
			cmd: cmd,
			data: data
		};
		events.pub(ev.rtcSendMsg, msg);
	}

	events.sub(ev.rtcReceiveMsg, function(msg) {

		try {
			var
				cmd = msg.cmd,
				data = msg.data
			;

			//app.log('cmd: '+cmd);
			//app.log(data);

			if(cmd == cmsg.descr1) {

				remoteDescr = data;

				connect(false);



			} else if(cmd == cmsg.descr2) {
				app.log('got descr2 msg');
				//alert('got descr2 msg');

				pc.setRemoteDescription(new RTCSessionDescription(data));



			} else if(cmd == cmsg.candidate) {
				app.log('received Candidate!');

				if(!pc) {
					alert('pc not defined yet');
					connect(false);
				}
				pc.addIceCandidate(new RTCIceCandidate(data));
			}

		} catch(ex) {
			console.log('rtcReceiveMsg exception: ', ex);
		}
	});


	return {
		connect: connect,
		getUserMedia: getUserMedia
	};
};

