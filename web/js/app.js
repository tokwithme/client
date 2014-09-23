
app = {};


//FastClick.attach(document.body);

$('html').addClass(('ontouchstart' in document.documentElement) ? 'touch' : 'no-touch').addClass('js').removeClass('no-js');


$(document).ready(function(){


	var
		//storage = app.storage,
		//als = app.alsCreate(storage),
		//retina = app.retinaCreate('/img/')
		aspect = app.aspect
	;

	//retina.run();
	aspect.run();

	$(window).resize(app.common.throttle(aspect.run, 200));



});

