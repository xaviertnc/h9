<?php // Controller

function array_get(array $array, $key, $default = null) {
  return isset($array[$key]) ? $array[$key] : $default;
}


session_start();


$app = new stdClass();
$app->state = array_get($_SESSION, 'HAPPYJS', [ 'flash' => [] ]);


/// POST REQUEST //
if ($_POST) {

  $app->state['flash'] = $_POST;
  header('Location:/');

}


/// GET REQUEST ///
else {

  include 'happy.html';
  $app->state['flash'] = [];

}


$_SESSION['HAPPYJS'] = $app->state;
