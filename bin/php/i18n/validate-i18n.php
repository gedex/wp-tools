<?php
/**
 * Console application, which adds textdomain argument
 * to all i18n function calls
 *
 * @package wordpress-i18n
 */

require_once( dirname( __FILE__ ) . '/makepot.php' );

class ValidateI18N {

	public $funcs;

	private $tokens;
	private $domain;

	public function __construct() {
		$makepot = new MakePOT;
		$this->funcs = $makepot->rules;
	}

	public function usage() {
		$usage = "Usage: php validate-i18n.php <domain> [<file>...]\n\n" .
			"Check missing or incorrect text <domain> in [<file>...]\n";
		fwrite( STDERR, $usage );
		exit( 1 );
	}

	/**
	 * Validate textdomain from a single file.
	 *
	 * @see AddTextdomain::process_string()
	 *
	 * @param string $domain          Text domain.
	 * @param string $source_filename Filename with optional path.
	 *
	 * @return array Errors. Empty array if no errors.
	 */
	public function validate_file( $domain, $source_filename  ) {
		return $this->validate_string( $domain, file_get_contents( $source_filename ) );
	}

	/**
	 * Validate textdomain from a string of PHP code.
	 *
	 * Functions calls should be wrapped in opening and closing PHP delimiters as usual.
	 *
	 * @param string $domain Text domain.
	 * @param string $string PHP code to parse.
	 *
	 * @return array Errors
	 */
	public function validate_string( $domain, $string ) {
		$this->domain = addslashes( $domain );
		$this->tokens = token_get_all( $string );
		return $this->validate_tokens();
	}

	/**
	 * Validate textdomain arg in gettext funcs call from a set of PHP tokens.
	 *
	 * @return array Errors
	 */
	public function validate_tokens() {
		$results        = array();
		$in_func        = false;
		$args_started   = false;
		$parens_balance = 0;
		$found_domain   = false;

		$index = 0;
		while ( $index < sizeof( $this->tokens ) ) {
			$token = $this->tokens[ $index ];
			if ( $this->is_gettext_func( $token ) ) {
				$result = $this->validate_gettext_func( $token, $index + 1 );
				$index  = $result->next_index;
				if ( ! empty( $result->errors ) ) {
					$results = array_merge( $results, $result->errors );
				}
			} else {
				$index++;
			}
		}

		return $results;
	}

	/**
	 * Checks whether a given token is gettext func.
	 *
	 * @param string|array $token Token.
	 *
	 * @return bool Returns true if token is gettext func
	 */
	public function is_gettext_func( $token ) {
		if ( ! is_array( $token ) ) {
			return false;
		}

		list( $id, $text ) = $token;

		return ( T_STRING === $id && array_key_exists( $text, $this->funcs ) );
	}

	/**
	 * Validate gettext func from start_index to end_index.
	 *
	 * @param array $token     Token of gettext func.
	 * @param int $start_index Start position after gettext func name.
	 *
	 * @return object Result contaiing next_index and errors
	 */
	public function validate_gettext_func( $token, $start_index ) {
		$result = new stdClass;
		$result->next_index = $start_index;
		$result->errors = array();

		$index               = $start_index;
		$in_func             = true;
		$parens_balance      = 0;
		$arg_counter         = 0;
		$found_corret_domain = false;

		list( $id, $func, $func_line ) = $token;

		$domain_arg_pos = sizeof( $this->funcs[ $func ] );

		while ( $in_func ) {
			$token = $this->tokens[ $index ];

			if ( is_array( $token ) ) {
				list( $id, $text, $line ) = $token;

				// Anything in func arg that's not whitespace or string literal
				// is an error except for arg number in _n and _nx.
				if ( 1 === $parens_balance && ! in_array( $id, array( T_WHITESPACE, T_CONSTANT_ENCAPSED_STRING ) ) ) {
					$excluded = ( 2 === $arg_counter && in_array( $func, array('_n', '_nx' ) ) );

					if ( ! $excluded ) {
						$result->errors[] = sprintf(
							'%1$s Argument #%2$s in function %3$s() must be in literal string',
							str_pad( 'L' . $line, 10 ),
							$arg_counter + 1,
							$func
						);
					}
				} elseif ( T_CONSTANT_ENCAPSED_STRING === $id && $domain_arg_pos === $arg_counter ) {
					$found_corret_domain = $text === "'{$this->domain}'";
				}
			} else {
				switch ( $token ) {
					case '(':
						$parens_balance++;
						break;
					case ')';
						$parens_balance--;
						$in_func = ( 0 === $parens_balance ) ? false : true;
						break;
					case ',':
						// Only increment if parens balance is 1.
						$arg_counter = ( 1 === $parens_balance ) ? $arg_counter + 1 : $arg_counter;
						break;
				}
			}

			$index++;
		}

		$result->next_index = $index;

		if ( ! $found_corret_domain ) {
			$result->errors[] = sprintf(
				'%1$s Missing textdomain \'%2$s\' as arg #%3$s in function %4$s()',
				str_pad( 'L' . $func_line, 10 ),
				$this->domain,
				$domain_arg_pos + 1,
				$func
			);
		}

		return $result;
	}
}

// Run the CLI only if the file wasn't included.
$included_files = get_included_files();
if ( __FILE__ == $included_files[0] ) {
	$validator = new ValidateI18N();

	$args = array_slice( $argv, 1 );
	if ( sizeof( $args ) < 2 ) {
		$validator->usage();
	}

	$domain = $args[0];
	$files  = array_slice( $args, 1 );

	$results = '';
	foreach ( $files as $file ) {
		$result = $validator->validate_file( $domain, $file );
		if ( sizeof( $result ) > 0 ) {
			array_unshift( $result, $file, str_repeat( '-', strlen( $file ) ) );
			array_push( $result, "\n" );
			$results .= implode( "\n", $result );
		}
	}

	if ( $results ) {
		fwrite( STDERR, $results );
		exit(1);
	}
}
