
// Events message bus
// based on:
// http://davidwalsh.name/pubsub-javascript
app.events = (function(){
	var
		topics = {},
		debug = false
	;

	//debug = true;


	function sub(topic, listener) {
		// Create the topic's object if not yet created
		if(!topic) {console.error('events.sub empty topic!'); return;}
		if(!topics[topic]) topics[topic] = { queue: [] };

		// Add the listener to queue
		var index = topics[topic].queue.push(listener) -1;

		// Provide handle back for removal of topic
		return (function(topic, index) {
			return {
				remove: function() {
					delete topics[topic].queue[index];
				}
			};
		})(topic, index);
	};

	function pub(topic, info) {
		if(debug) {console.log('--- EVENT: '+topic);}

		// If the topic doesn't exist, or there's no listeners in queue, just leave
		if(!topic) {console.error('events.pub empty topic!'); return;}
		if(!topics[topic] || !topics[topic].queue.length) return;

		// Cycle through topics queue, fire!
		var items = topics[topic].queue;
		for(var i=0; i<items.length; i++) {
			items[i](info);
		}
	};

	function domBind() {
		var
			attr = 'data-event',
			attrOn = 'data-event-on'
		;
		$('['+attr+']').each(function(){
			var
				t = $(this),
				topic = t.attr(attr),
				eventOn = t.attr(attrOn)
			;

			if(!eventOn) eventOn = 'click';

			t.on(eventOn, function(){
				pub(topic);
			});



		});
	}

	return {
		subAll: function(kv) {
			for(var k in kv) {
				sub(k, kv[k]);
			}
		},
		sub: sub,
		pub: pub,
		domBind: domBind
	};
})();
