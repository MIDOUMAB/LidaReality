import {
	BufferGeometry,
	Color,
	FileLoader,
	Float16BufferAttribute,
	Float32BufferAttribute,
	Loader
} from '../../static/dist/three.js';

class XYZLoader extends Loader {

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		const loader = new FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );
		loader.load( url, function ( text ) {

			try {

				onLoad( scope.parse( text ) );

			} catch ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		}, onProgress, onError );

	}

	parse( text ) {

		const lines = text.split( '\n' );

		const vertices = [];
		const colors = [];
		const color = new Color();

		for ( let line of lines ) {

			line = line.trim();

			if ( line.charAt( 0 ) === '#' ) continue; // skip comments

			const lineValues = line.split( /\s+/ );

			if ( lineValues.length === 3 ) {

				// XYZ

				vertices.push( parseFloat( lineValues[ 2 ] ) );
				vertices.push( parseFloat( lineValues[ 3 ] ) );
				vertices.push( parseFloat( lineValues[ 4 ] ) );

			}

			if ( lineValues.length == 9 ) {

				// XYZRGB

				vertices.push( parseFloat( lineValues[ 2 ] ) );
				vertices.push( parseFloat( lineValues[ 3 ] ) );
				vertices.push( parseFloat( lineValues[ 4 ] ) );

				const r = parseInt( lineValues[ 5 ] ) ;
				const g = parseInt( lineValues[ 6 ] ) ;
				const b = parseInt( lineValues[ 7 ] ) ;
				color.setRGB( r / 255, g /  255, b / 255 );
				colors.push(  color.r, color.g, color.b );

			}

		}

		const geometry = new BufferGeometry();
		geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

		if ( colors.length > 0 ) {

			geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		}

		return geometry;

	}

}

export { XYZLoader };
