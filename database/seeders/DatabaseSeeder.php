<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create 3 users with complete data
        $users = [
            [
                'name' => 'Ahmad Rizki',
                'email' => 'ahmad@example.com',
                'password' => 'password123',
                'avatar' => 'avatars/ahmad.jpg',
                'phone_number' => '081234567890',
            ],
            [
                'name' => 'Siti Nurhaliza',
                'email' => 'siti@example.com',
                'password' => 'password123',
                'avatar' => 'avatars/siti.jpg',
                'phone_number' => '081234567891',
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => 'password123',
                'avatar' => 'avatars/budi.jpg',
                'phone_number' => '081234567892',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::create($userData);

            // Create savings for each user
            $savings = [
                [
                    'user_id' => $user->id,
                    'name_bank' => 'bca.png',
                    'pemasukan' => 5000000.00,
                    'pengeluaran' => 2000000.00,
                    'total' => 3000000.00,
                ],
                [
                    'user_id' => $user->id,
                    'name_bank' => 'mandiri.png',
                    'pemasukan' => 3000000.00,
                    'pengeluaran' => 1500000.00,
                    'total' => 1500000.00,
                ],
            ];

            foreach ($savings as $saving) {
                \App\Models\Savings::create($saving);
            }

            // Create wishes for each user
            $wishes = [
                [
                    'user_id' => $user->id,
                    'name' => 'iPhone 15 Pro',
                    'deskripsi' => 'Smartphone terbaru dengan kamera yang sangat bagus',
                    'price' => 15000000.00,
                    'diff_to_reach' => 5000000.00,
                    'status' => 'dana_belum_terkumpul',
                ],
                [
                    'user_id' => $user->id,
                    'name' => 'MacBook Air M2',
                    'deskripsi' => 'Laptop untuk bekerja dan kuliah',
                    'price' => 18000000.00,
                    'diff_to_reach' => 0.00,
                    'status' => 'sudah_tercapai',
                ],
                [
                    'user_id' => $user->id,
                    'name' => 'Umroh',
                    'deskripsi' => 'Pergi umroh bersama keluarga',
                    'price' => 25000000.00,
                    'diff_to_reach' => 2000000.00,
                    'status' => 'dana_belum_terkumpul',
                ],
            ];

            foreach ($wishes as $wish) {
                \App\Models\Wishes::create($wish);
            }

            // Create activity logs for each user
            $logs = [
                [
                    'user_id' => $user->id,
                    'activity' => 'Menambahkan tabungan BCA',
                    'data' => [
                        'saving_id' => 1,
                        'bank' => 'BCA',
                        'amount' => 5000000.00,
                        'type' => 'pemasukan',
                    ],
                ],
                [
                    'user_id' => $user->id,
                    'activity' => 'Melakukan pengeluaran dari BCA',
                    'data' => [
                        'saving_id' => 1,
                        'bank' => 'BCA',
                        'amount' => 2000000.00,
                        'type' => 'pengeluaran',
                    ],
                ],
                [
                    'user_id' => $user->id,
                    'activity' => 'Menambahkan wish iPhone 15 Pro',
                    'data' => [
                        'wish_id' => 1,
                        'wish_name' => 'iPhone 15 Pro',
                        'price' => 15000000.00,
                    ],
                ],
                [
                    'user_id' => $user->id,
                    'activity' => 'Wish MacBook Air M2 tercapai',
                    'data' => [
                        'wish_id' => 2,
                        'wish_name' => 'MacBook Air M2',
                        'status' => 'sudah_tercapai',
                    ],
                ],
            ];

            foreach ($logs as $log) {
                \App\Models\Logs::create($log);
            }
        }
    }
}
