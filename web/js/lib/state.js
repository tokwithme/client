
app.stateCreate = function(name, cfg) {

	var
		events = app.events,
		sm
	;

	if(!cfg.error) cfg.error = error;

	if(!cfg.callbacks) cfg.callbacks = {};

	if(!cfg.callbacks.onbeforeevent) cfg.callbacks.onbeforeevent = onbeforeevent;
	if(!cfg.callbacks.onenterstate) cfg.callbacks.onenterstate = onenterstate;

	function error(en, from, to, args, errorCode, errorMessage) {
		return 'event ' + en + ' error: ' + errorMessage;
	};

	function onbeforeevent(en,from,to){
		//if(en != 'startup') console.log('--- '+name+' --- '+from+' > '+to+' ('+en+')');
		if(app.debug && (from != to)) {
			var kv = {};
			kv[name.toUpperCase()] = from+' > '+to+' ('+en+')';
			app.debug(kv);
		}
	}

	function onenterstate(en,from,to){
		console.log('--- '+name+' --- '+to);
		if(app.debug) {
			var kv = {};
			kv[name.toUpperCase()] = to;
			app.debug(kv);
		}
		if(name) events.pub('state_'+name+'_'+to);
		events.pub('state_'+name, this); // this refers to the StateMachine instance
	}

	sm = StateMachine.create(cfg);

	/*
	sm.async = function(timeout) {
		if(sm.to) clearTimeout(sm.to);
		sm.to = setTimeout(function(){
			if(sm.transition) {
				sm.transition.cancel();
				sm.onenterstate(sm.name, sm.current, sm.current);
			}
		}, timeout);
		return StateMachine.ASYNC;
	};*/

	sm.checkWrongState = function(targetState, errorTransition, name) {
		if(sm.is(targetState)) return false;

		console.error('Wrong state ('+sm.current+'), expected ('+targetState+') at: '+name);
		sm[errorTransition]();
		return true;
	};

	return sm;

};
