
// recorder based on:
// https://github.com/mattdiamond/Recorderjs

app.recCreate = function(events, cfg) {

	var
		sm = app.stateCreate('rec', {
			initial: 'idle',
			events: [
				{name: 'start', 	from: 'idle', 		to: 'recording'},
				{name: 'stop', 		from: 'recording', 	to: 'saving'},
				{name: 'done', 		from: 'saving', 	to: 'idle'},
				{name: 'abort', 	from: '*', 			to: 'idle'}
			]
		}),

		cnst = {

		},


		p = {}

	;

	// Init

	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	if(!window.AudioContext) {
		alert('Browser doesnt support AudioContext');
	}


	// State reset

	reset();

	function reset() {
		if(p.worker) {
			// terminate the worker
			try {
				p.worker.postMessage({ command: 'clear' });
				p.worker.terminate();
			} catch(ign){}
			p.node.disconnect();
			p.input.disconnect();
		}

		p.input = null;
		p.audioContext = null;
		p.node = null;
		p = {}; // this should destroy the AudioContext and everything (check it!)
	}


	// State management

	sm.onidle = reset;

	sm.onstart = function(){

		p.audioContext = new AudioContext();

		app.userMedia.get({audio: true}, true).then(
			gotStream,
			function(ex) {
				app.error(null, ex, true);
				sm.abort();
			}
		);

		function gotStream(stream) {

			//p.input = convertToMono(p.audioContext.createMediaStreamSource(stream));
			p.input = p.audioContext.createMediaStreamSource(stream);

			//p.input.connect(p.audioContext.destination); // comment this to remove echo?

			// start of recorder.js init
			var ctx = p.input.context;
			p.node = (ctx.createScriptProcessor || ctx.createJavaScriptNode).call(ctx, cfg.bufferLen, 2, 2);

			p.worker = new Worker('js/tok/recWorker.js');

			p.worker.postMessage({
				command: 'init',
				config: {
					sampleRate: ctx.sampleRate
				}
			});


			p.node.onaudioprocess = function(e){
				if(!sm.is('recording')) {console.log('onaudioprocess in non-recording state!'); return;}

				p.worker.postMessage({
					command: 'record',
					buffer: [
						e.inputBuffer.getChannelData(0),
						e.inputBuffer.getChannelData(1)
					]
				});
			};

			p.input.connect(p.node);
			p.node.connect(ctx.destination);
		}

	};

	sm.onstop = function(){

		p.node.disconnect();

		p.worker.onmessage = function(e){
			if(typeof e.data == 'string') {
				console.log(e.data); return;
			}
			var blob = e.data;
			events.pub('recBlobSave', blob);

			sm.done();
		};

		var type = 'audio/wav';

		p.worker.postMessage({
			command: 'exportWAV',
			type: type
		});

	};


	//

	function convertToMono(input) {
		var splitter = p.audioContext.createChannelSplitter(2);
		var merger = p.audioContext.createChannelMerger(2);

		input.connect( splitter );
		splitter.connect( merger, 0, 0 );
		splitter.connect( merger, 0, 1 );
		return merger;
	}




	return {
		sm: sm,
		p: p
	};
};