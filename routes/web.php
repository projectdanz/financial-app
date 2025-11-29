<?php

use Illuminate\Support\Facades\Route;

// Catch all routes and return the main view for React Router
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
