<?php
/**
 * Plugin Name: Example
 * Plugin URI: https://example.com
 * Description: Example plugin for wpt tests.
 * Version: 0.1.0
 * Author: WPT
 * Author URI: https://example.com
 * Requires at least: 4.4
 * Tested up to: 4.7
 * Text Domain: example
 * Domain Path: /languages/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @category Example
 * @package  Example
 * @author   Akeda Bagus <admin@gedex.web.id>
 * @license  GPL v2 or later
 * @link     http://example.org
 */

// Simple calls to available gettext funcs.
__( 'Howdy!', 'example' );
_e( 'Your Ad here', 'example' );
echo '<h2>' . esc_html__( 'Blog Options', 'example' ) . '</h2>';
esc_html_e( 'Using this option you will make a fortune!', 'example' );
printf( esc_html( _n( 'We deleted %d spam message.', 'We deleted %d spam messages.', $count, 'example' ) ), $count );
printf( esc_html( _nx( 'We deleted %d spam message.', 'We deleted %d spam messages.', $count, 'context', 'example' ) ), $count );
echo _x( 'Comment', 'column name', 'example' );
_ex( 'ID', 'column name', 'example' );

