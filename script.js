var htmlSrc = document.getElementById( 'html-src' );
var cssSrc  = document.getElementById( 'css-src' );
var jsSrc   = document.getElementById( 'js-src' );

var htmlOutput    = document.getElementById( 'html-output' );
var consoleOutput = document.getElementById( 'console-output' );

[ htmlSrc, cssSrc, jsSrc ].forEach( function( src ) {

	src.addEventListener( 'keyup', onUpdate );

	src.addEventListener( 'keydown', function(e){
		if(e.keyCode==9 || e.which==9){
			e.preventDefault();
			var s = this.selectionStart;
			this.value = this.value.substring(0,this.selectionStart) + "  " + this.value.substring(this.selectionEnd);
			this.selectionEnd = s + 2; 
		}
	} );

	src.setAttribute( 'spellcheck', false );

} );

htmlSrc.value = localStorage[ 'htmlSrc' ] || '';
cssSrc.value  = localStorage[ 'cssSrc' ] || '';
jsSrc.value   = localStorage[ 'jsSrc' ] || '';
updateSources();

autoClearConsole = document.getElementById( 'autoClearConsole' );
autoClearConsole.checked = localStorage[ 'autoClearConsole' ] === 'true';

var updateTimeout = null;

function onUpdate() {

	localStorage[ 'htmlSrc' ] = htmlSrc.value;
	localStorage[ 'cssSrc' ]  = cssSrc.value;
	localStorage[ 'jsSrc' ]   = jsSrc.value;
	
	if( updateTimeout ) clearTimeout( updateTimeout );

	updateTimeout = setTimeout( updateSources, 500 );

}

function updateSources() {

	if( autoClearConsole.checked ) {
		clearConsole();
	}

	var res = htmlSrc.value;
	res += '<style>' + cssSrc.value + '<\/style>';
	res += '<script>' + inject.toString() + ';inject();<\/script>';
	res += '<script>' + jsSrc.value + '<\/script>';

	htmlOutput.src = "data:text/html;charset=utf-8," + escape( res );

}

window.addEventListener( 'message', onMessage );

function onMessage( msg ) {

	var d = JSON.parse( msg.data );

	switch( d.message ) {
		case 'console.log':
		console.log.apply( console, d.arguments );
		var li = document.createElement( 'li' );
		
		d.arguments.forEach( function( a ) {
			var span = document.createElement( 'span' );
			if( typeof a === 'string' || typeof a === 'number' ) span.textContent = a;
			else {
				span.textContent = JSON.stringify( a );	
			}
			li.appendChild( span );
		})
		consoleOutput.appendChild( li );
		break;
	}

}

function inject() {

	console.warn = console.error = console.log = function() { 

		var args = Array.prototype.slice.call(arguments);

		var data = {
			message: 'console.log',
			arguments: args
		}

		parent.postMessage( JSON.stringify( data ), '*' ) 

	};

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