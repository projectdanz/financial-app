<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wishes extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'deskripsi',
        'price',
        'diff_to_reach',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'diff_to_reach' => 'decimal:2',
        ];
    }

    /**
     * Get the user that owns the wish.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
