
app.ev = (function() {

	var ev = {
		connectServerStart: 0,
		joinDone: 0,
		matchingDone: 0,
		connectPartnerStart: 0,
		matchingStart: 0,
		wsMessage: 0,
		wsOpen: 0,
		wsClose: 0,
		rtcConnected: 0,
		rtcGotLocalStream: 0,
		rtcGotRemoteStream: 0,
		rtcError: 0,
		rtcSendMsg: 0,
		rtcReceiveMsg: 0,
		rtcDisconnect: 0
	};

	for(var k in ev) {
		ev[k] = k;
	}

	return ev;
})();