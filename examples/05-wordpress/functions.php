<?php
/**
 * nagishon: child-theme snippet. הדביקו בסוף functions.php של ערכת הבת.
 * Paste at the end of your child theme's functions.php.
 */

const NAGISHON_CDN = 'https://cdn.jsdelivr.net/npm/nagishon@1/dist/';

// Pre-paint: סינכרוני ב־<head>, בלי defer/async.
add_action( 'wp_head', function () {
	printf( '<script src="%s"></script>' . "\n", esc_url( NAGISHON_CDN . 'prepaint.js' ) );
}, 1 );

// הסקריפט הראשי בפוטר.
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_script( 'nagishon', NAGISHON_CDN . 'nagishon.iife.js', array(), null, true );
} );

// הוספת data-attributes ו־defer לתג הסקריפט.
add_filter( 'script_loader_tag', function ( $tag, $handle, $src ) {
	if ( 'nagishon' !== $handle ) {
		return $tag;
	}
	return sprintf(
		'<script src="%s" defer data-nagishon data-statement-url="%s"></script>' . "\n",
		esc_url( $src ),
		esc_attr( '/accessibility/' )
	);
}, 10, 3 );
