<?php

namespace App\Http\Controllers;

use App\Models\Wishes;
use Illuminate\Http\Request;

class WishesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $wishes = Wishes::where('user_id', $request->user()->id)->get();
        
        return response()->json([
            'message' => 'Wishes retrieved successfully',
            'data' => $wishes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'diff_to_reach' => 'nullable|numeric|min:0',
        ]);

        $diffToReach = $validated['diff_to_reach'] ?? $validated['price'];
        
        // Determine status based on diff_to_reach
        $status = 'dana_belum_terkumpul';
        if ($diffToReach == 0) {
            $status = 'sudah_tercapai';
        } elseif ($diffToReach > 0 && $diffToReach < $validated['price']) {
            $status = 'dana_terpenuhi';
        }

        $wish = Wishes::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'price' => $validated['price'],
            'diff_to_reach' => $diffToReach,
            'status' => $status,
        ]);

        // Log the activity
        \App\Models\Logs::create([
            'user_id' => $request->user()->id,
            'activity' => 'Created new wish',
            'data' => [
                'wish_id' => $wish->id,
                'wish_name' => $wish->name,
                'price' => $wish->price,
                'status' => $status,
            ],
        ]);

        return response()->json([
            'message' => 'Wish created successfully',
            'data' => $wish,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $id)
    {
        $wish = Wishes::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();
        
        return response()->json([
            'message' => 'Wish retrieved successfully',
            'data' => $wish,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $wish = Wishes::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'deskripsi' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'diff_to_reach' => 'sometimes|numeric|min:0',
        ]);

        $oldData = $wish->toArray();

        if (isset($validated['name'])) {
            $wish->name = $validated['name'];
        }
        if (isset($validated['deskripsi'])) {
            $wish->deskripsi = $validated['deskripsi'];
        }
        if (isset($validated['price'])) {
            $wish->price = $validated['price'];
        }
        if (isset($validated['diff_to_reach'])) {
            $wish->diff_to_reach = $validated['diff_to_reach'];
        }

        // Auto-update status based on diff_to_reach
        if ($wish->diff_to_reach == 0) {
            $wish->status = 'sudah_tercapai';
        } elseif ($wish->diff_to_reach > 0 && $wish->diff_to_reach < $wish->price) {
            $wish->status = 'dana_terpenuhi';
        } else {
            $wish->status = 'dana_belum_terkumpul';
        }

        $wish->save();

        // Log the activity
        \App\Models\Logs::create([
            'user_id' => $request->user()->id,
            'activity' => 'Updated wish',
            'data' => [
                'wish_id' => $wish->id,
                'wish_name' => $wish->name,
                'old_data' => $oldData,
                'new_data' => $wish->toArray(),
            ],
        ]);

        return response()->json([
            'message' => 'Wish updated successfully',
            'data' => $wish,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $wish = Wishes::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $wishData = $wish->toArray();
        $wish->delete();

        // Log the activity
        \App\Models\Logs::create([
            'user_id' => $request->user()->id,
            'activity' => 'Deleted wish',
            'data' => [
                'wish_id' => $wishData['id'],
                'wish_name' => $wishData['name'],
                'deleted_data' => $wishData,
            ],
        ]);

        return response()->json([
            'message' => 'Wish deleted successfully',
        ]);
    }
}
