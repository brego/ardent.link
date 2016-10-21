<?php

$rev  = file_get_contents('./rev-manifest.json');
$rev  = json_decode($rev, true);
$icon = $rev['favicon.ico'];

if (is_file($icon)) {
    header('Location: '.$icon, true, 302);
    exit;
}
header("HTTP/1.0 404 Not Found", true, 404);
