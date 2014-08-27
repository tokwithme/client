
// main
(function(){

	var
		ev = app.ev,
		events = app.eventsCreate(),
		ws = app.wsCreate(events),
		view = app.viewCreate(events, ev),
		serverApi = app.serverApiCreate(events, ev, ws),
		clientApi = app.clientApiCreate(),
		webrtc = app.webrtcCreate(events),
		service = app.serviceCreate(events, ev, serverApi, webrtc)
	;



})();

