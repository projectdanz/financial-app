<?php

// Handle SQLite database creation for Vercel ephemeral environment
$dbPath = '/tmp/database.sqlite';
if (!file_exists($dbPath)) {
    touch($dbPath);
}

require __DIR__ . '/../public/index.php';
