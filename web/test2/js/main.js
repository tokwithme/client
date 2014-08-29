
// main
(function(){

	var
		events = app.events,

		ng = app.ngCreate(),

		ws = app.wsCreate(events),
		//view = app.viewCreate(events),
		serverApi = app.serverApiCreate(events, ws),
		//clientApi = app.clientApiCreate(),
		webrtc = app.webrtcCreate(events),

		service = app.serviceCreate(events, ws, serverApi, webrtc)
	;



})();

