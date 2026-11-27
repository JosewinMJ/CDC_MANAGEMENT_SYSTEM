<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

// Single-Domain SPA Fallback: serves the built React 3-Portal UI (Student, Guide, Admin)
Route::get('/{any?}', function () {
    $spa = public_path('spa.html');
    if (File::exists($spa)) {
        return response()->file($spa);
    }
    return view('welcome');
})->where('any', '^(?!api|up).*$');
