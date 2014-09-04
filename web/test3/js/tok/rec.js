
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
			p.worker.terminate();
		}

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
			//console.log('gotStream', stream);

			p.input = p.audioContext.createMediaStreamSource(stream);

			//p.input.connect(p.audioContext.destination); // comment this to remove echo?



			// start of recorder.js init
			var ctx = p.input.context;
			p.node = (ctx.createScriptProcessor || ctx.createJavaScriptNode).call(ctx, cfg.bufferLen, 2, 2);

			// we will reuse this worker
			// OR should we destroy it immediately after complete?
			p.worker = new Worker('js/tok/recWorker.js');

			p.worker.postMessage({
				command: 'init',
				config: {
					sampleRate: ctx.sampleRate
				}
			});


			p.node.onaudioprocess = function(e){
				//if (!recording) return;
				p.worker.postMessage({
					command: 'record',
					buffer: [
						e.inputBuffer.getChannelData(0),
						e.inputBuffer.getChannelData(1)
					]
				});
			};


			/*

			this.getBuffer = function(cb) {
				currCallback = cb || config.callback;
				worker.postMessage({ command: 'getBuffer' })
			}
			*/



			p.input.connect(p.node);
			//this.node.connect(this.context.destination);    //this should not be necessary


		}

	};

	sm.onstop = function(){

		//p.worker.postMessage({ command: 'clear' });


		p.worker.onmessage = function(e){
			var blob = e.data;
			console.log('worker onmessage ', e);
			console.log('GOT BLOB');
			createDownloadLink(blob);
			sm.done();
		};

		var type = 'audio/wav';

		p.worker.postMessage({
			command: 'exportWAV',
			type: type
		});

		function createDownloadLink(blob) {
			var url = URL.createObjectURL(blob);
			var li = document.createElement('li');
			var au = document.createElement('audio');
			var hf = document.createElement('a');

			au.controls = true;
			au.src = url;
			hf.href = url;
			hf.download = new Date().toISOString() + '.wav';
			hf.innerHTML = hf.download;
			li.appendChild(au);
			li.appendChild(hf);
			$('#dlink').get(0).appendChild(li);
		}



	};


	//




	return {
		sm: sm,
		p: p
	};
};