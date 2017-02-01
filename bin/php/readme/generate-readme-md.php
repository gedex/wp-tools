#!/usr/bin/env php
<?php
/**
 * Look for WordPress readme in current directory or above and convert into markdown readme in same directory
 * @version 1.0.1
 * @author Weston Ruter <weston@xwp.co> (@westonruter)
 * @copyright Copyright (c) 2014, XWP <https://xwp.co/>
 * @license GPLv2+
 */

function get_readme_txt_path() {
	$readme_txt_path = null;
	while ( true ) {
		foreach ( array( 'readme.txt', 'README.txt' ) as $readme_filename ) {
			if ( file_exists( $readme_filename ) ) {
				$readme_txt_path = realpath( $readme_filename );
				break;
			}
		}

		$old_cwd = getcwd();
		if ( ! empty( $readme_txt_path ) || ! chdir( '..' ) || getcwd() === $old_cwd ) {
			break;
		}
	}
	if ( empty( $readme_txt_path ) ) {
		throw new Exception( 'Failed to find a readme.txt or README.txt above the current working directory.' );
	}

	return $readme_txt_path;
}

function get_readme_md_path( $readme_txt_path ) {
	$readme_md_path = preg_replace( '/txt$/', 'md', $readme_txt_path );

	// If md file does not exist, capitalize it. It's just common to have
	// README.md over readme.md.
	if ( ! file_exists( $readme_md_path ) ) {
		$readme_md_path = preg_replace( '/readme\.md$/', 'README.md', $readme_md_path );
	}

	return $readme_md_path;
}

function build_markdown_parser_args( $readme_txt_path, $opts = array() ) {
	$readme_root = dirname( $readme_txt_path );

	$md_args = array(
		'assets_dir' => get_assets_dir(),
	);

	$github_account_repo = get_github_account_repo();
	if ( $github_account_repo ) {
		$md_args = fill_badge_md_args( $md_args, $readme_root, $github_account_repo );
	}

	return $md_args;
}

function get_github_account_repo() {
	$github_account_repo = null;
	$github_url_regex    = '#.+github\.com[:/](?P<account_repo>[^/]+/[^/]+?)(?:\.git)?$#';
	$remote_urls         = array();

	foreach ( explode( "\n", `git remote -v | grep fetch` ) as $remote_line ) {
		$remote_line = trim( $remote_line );
		if ( $remote_line ) {
			list( $name, $url ) = preg_split( '/\s+/', $remote_line );
			$remote_urls[ $name ] = $url;
		}
	}

	if ( ! empty( $remote_urls['origin'] ) && preg_match( $github_url_regex, $remote_urls['origin'], $matches ) ) {
		$github_account_repo = $matches['account_repo'];
	} else {
		foreach ( $remote_urls as $remote_name => $remote_url ) {
			if ( preg_match( $github_url_regex, $remote_url, $matches ) ) {
				$github_account_repo = $matches['account_repo'];
				break;
			}
		}
	}

	return $github_account_repo;
}

function get_assets_dir() {
	$assets_dir = array(
		'assets',
		'wordpress_org_assets',
		'wporg_assets',
	);

	$dir = 'assets';
	foreach ( $assets_dir as $asset_dir ) {
		if ( file_exists( $asset_dir ) && is_dir( $asset_dir ) ) {
			$dir = $asset_dir;
			break;
		}
	}

	return $dir;
}

function fill_badge_md_args( $md_args, $readme_root, $github_account_repo ) {
	if ( file_exists( $readme_root . '/.travis.yml' ) ) {
		$md_args['travis_ci_url'] = "https://travis-ci.org/$github_account_repo";
	}

	if ( file_exists( $readme_root . '/.coveralls.yml' ) ) {
		$md_args['coveralls_url'] = "https://coveralls.io/github/$github_account_repo";
		$md_args['coveralls_badge_src'] = "https://coveralls.io/repos/$github_account_repo/badge.svg?branch=master";
	}

	if ( file_exists( $readme_root . '/.david' ) ) {
		$md_args['david_url'] = "https://david-dm.org/$github_account_repo";
	}

	if ( file_exists( $readme_root . '/.david-dev' ) ) {
		$md_args['david_dev_url'] = "https://david-dm.org/$github_account_repo";
	}

	if ( file_exists( $readme_root . '/.gitter' ) ) {
		$md_args['gitter_url'] = "https://gitter.im/$github_account_repo";
	}

	return $md_args;
}

try {
	$readme_txt_path = get_readme_txt_path();
	$readme_md_path  = get_readme_md_path( $readme_txt_path );

	require_once( __DIR__ . '/class-wordpress-readme-parser.php' );
	$md_args  = build_markdown_parser_args( $readme_txt_path );
	$readme   = new WordPress_Readme_Parser( array( 'path' => $readme_txt_path ) );
	$markdown = $readme->to_markdown( $md_args );

	if ( ! file_put_contents( $readme_md_path, $markdown ) ) {
		throw new Exception( sprintf( 'Failed to write to %s', $readme_md_path ) );
	}
	fwrite( STDOUT, sprintf( 'Successfully converted %1$s to %2$s', basename( $readme_txt_path ), basename( $readme_md_path ) ) );
}
catch( Exception $e ) {
	fwrite( STDERR, $e->getMessage() );
	exit( 1 );
}
