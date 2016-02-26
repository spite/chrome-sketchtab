var htmlSrc = document.getElementById( 'html-src' );
var cssSrc  = document.getElementById( 'css-src' );
var jsSrc   = document.getElementById( 'js-src' );

htmlSrc.value = localStorage[ 'htmlSrc' ] || '';
cssSrc.value  = localStorage[ 'cssSrc' ] || '';
jsSrc.value   = localStorage[ 'jsSrc' ] || '';

// Set up Code Mirror editors
var htmlCM = CodeMirror.fromTextArea(htmlSrc, {
	value: htmlSrc.value,
	mode: 'htmlmixed'
});
var cssCM = CodeMirror.fromTextArea(cssSrc, {
	value: cssSrc.value,
	mode: 'css'
});
var jsCM = CodeMirror.fromTextArea(jsSrc, {
	value: jsSrc.value,
	mode: 'javascript'
});

var htmlOutput    = document.getElementById( 'html-output' );
var consoleOutput = document.getElementById( 'console-output' );

// Not needed now the function runs on change of the CodeMirror Editor
//
// [ htmlSrc, cssSrc, jsSrc ].forEach( function( src ) {
	
// 	src.addEventListener( 'keyup', onUpdate );

// 	src.addEventListener( 'keydown', function(e){
// 		if(e.keyCode==9 || e.which==9){
// 			e.preventDefault();
// 			var s = this.selectionStart;
// 			this.value = this.value.substring(0,this.selectionStart) + "  " + this.value.substring(this.selectionEnd);
// 			this.selectionEnd = s + 2; 
// 		}
// 	} );

// 	src.setAttribute( 'spellcheck', false );

// } );

cssCM.on('change', onUpdate);
htmlCM.on('change', onUpdate);
jsCM.on('change', onUpdate);

updateSources();

autoClearConsole = document.getElementById( 'autoClearConsole' );
autoClearConsole.checked = localStorage[ 'autoClearConsole' ] === 'true';

var updateTimeout = null;

function onUpdate() {

	// Save Code Mirror editor to textarea
	cssCM.save();
	htmlCM.save();
	jsCM.save();
	
	localStorage[ 'htmlSrc' ] = htmlSrc.value;
	localStorage[ 'cssSrc' ]  = cssSrc.value;
	localStorage[ 'jsSrc' ]   = jsSrc.value;
	
	if( updateTimeout ) clearTimeout( updateTimeout );

	updateTimeout = setTimeout( updateSources, 500 );

}

var sandbox = null;

function updateSources() {

	if( autoClearConsole.checked ) {
		clearConsole();
	}

	if( sandbox ) {
		var evalData = {
			message: 'eval',
			source: jsSrc.value
		}
		sandbox.postMessage( JSON.stringify( evalData ), '*' );
	}

	var res = htmlSrc.value;
	res += '<style>' + cssSrc.value + '<\/style>';
	res += '<script>' + inject.toString() + ';inject();<\/script>';
	res += '<script>' + jsSrc.value + '<\/script>';

	htmlOutput.src = "data:text/html;charset=utf-8," + encodeURIComponent( res );

}

window.addEventListener( 'message', onMessage );

function onMessage( msg ) {

	var d = JSON.parse( msg.data );

	if( d.message === 'sandbox' ) {
		sandbox = msg.source;
		updateSources();
		return;
	}

	if( d.message === 'sandbox-eval' ) {
		log( d.result );
		return;
	}

	switch( d.message ) {
		case 'console.log':
		log( d.arguments );
		break;
		case 'console.error':
		log( d.arguments, 'error' );
		break;
		case 'console.warn':
		log( d.arguments, 'warning' );
		break;
	}

}

function log( args, style ) {

	args = [].concat( args );

	console.log.apply( console, args );
	var li = document.createElement( 'li' );
	if( style ) li.classList.add( style );

	args.forEach( function( a ) {
		var span = document.createElement( 'span' );
		if( typeof a === 'string' || typeof a === 'number' ) span.textContent = a;
		else {
			span.textContent = JSON.stringify( a );	
		}
		li.appendChild( span );
	})
	consoleOutput.appendChild( li );

}

function inject() {

	function wrapConsole( method ) {

		return function() { 

			var args = Array.prototype.slice.call(arguments);

			var data = {
				message: method,
				arguments: args
			}

			parent.postMessage( JSON.stringify( data ), '*' ) 

		};
	}

	console.warn = wrapConsole( 'console.warn' );
	console.error = wrapConsole( 'console.error' );
	console.log = wrapConsole( 'console.log' );

}

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
	htmlOutput.style.height = htmlOutput.parentElement.clientHeight - 30 + 'px';
}

onWindowResize();

document.getElementById( 'newButton' ).addEventListener( 'click', onNewSketch );

function onNewSketch() {

	htmlSrc.value = '';
	cssSrc.value  = '';
	jsSrc.value   = '';
	updateSources();

}

document.getElementById( 'clearConsoleButton' ).addEventListener( 'click', function() {
	clearConsole();
} );

function clearConsole() {
	while( consoleOutput.firstChild ) consoleOutput.removeChild( consoleOutput.firstChild );
}

document.getElementById( 'reloadButton' ).addEventListener( 'click', function() {
	updateSources();
} );

autoClearConsole.addEventListener( 'click', function() {
	localStorage[ 'autoClearConsole' ] = this.checked;
} );