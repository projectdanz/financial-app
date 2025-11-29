<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Savings extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name_bank',
        'pemasukan',
        'pengeluaran',
        'total',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pemasukan' => 'decimal:2',
            'pengeluaran' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    /**
     * Get the user that owns the savings.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
