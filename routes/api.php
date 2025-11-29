<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SavingsController;
use App\Http\Controllers\WishesController;
use App\Http\Controllers\LogsController;

// Public routes - Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes - Require authentication
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Savings routes
    Route::get('/savings', [SavingsController::class, 'index']);
    Route::post('/savings', [SavingsController::class, 'store']);
    Route::get('/savings/{id}', [SavingsController::class, 'show']);
    Route::put('/savings/{id}', [SavingsController::class, 'update']);
    Route::delete('/savings/{id}', [SavingsController::class, 'destroy']);

    // Wishes routes
    Route::get('/wishes', [WishesController::class, 'index']);
    Route::post('/wishes', [WishesController::class, 'store']);
    Route::get('/wishes/{id}', [WishesController::class, 'show']);
    Route::put('/wishes/{id}', [WishesController::class, 'update']);
    Route::delete('/wishes/{id}', [WishesController::class, 'destroy']);

    // Logs routes
    Route::get('/logs', [LogsController::class, 'index']);
    Route::get('/logs/my', [LogsController::class, 'myLogs']);
    Route::post('/logs', [LogsController::class, 'store']);
    Route::get('/logs/{id}', [LogsController::class, 'show']);
    Route::put('/logs/{id}', [LogsController::class, 'update']);
    Route::delete('/logs/{id}', [LogsController::class, 'destroy']);
});
