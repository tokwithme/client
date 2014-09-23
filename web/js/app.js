
app = {};


//FastClick.attach(document.body);

$('html').addClass(('ontouchstart' in document.documentElement) ? 'touch' : 'no-touch').addClass('js').removeClass('no-js');


$(document).ready(function(){


	var
		//storage = app.storage,
		aspect = app.aspect
	;


	aspect.run();

	$(window).resize(app.common.throttle(aspect.run, 200));



});

