<?php

namespace App\Http\Controllers;

use App\Models\Savings;
use Illuminate\Http\Request;

class SavingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $savings = Savings::where('user_id', $request->user()->id)->get();
        
        return response()->json([
            'message' => 'Savings retrieved successfully',
            'data' => $savings,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_bank' => 'required|string|max:255',
            'pemasukan' => 'required|numeric|min:0',
            'pengeluaran' => 'nullable|numeric|min:0',
        ]);

        $pemasukan = $validated['pemasukan'];
        $pengeluaran = $validated['pengeluaran'] ?? 0;
        $total = $pemasukan - $pengeluaran;

        $saving = Savings::create([
            'user_id' => $request->user()->id,
            'name_bank' => $validated['name_bank'],
            'pemasukan' => $pemasukan,
            'pengeluaran' => $pengeluaran,
            'total' => $total,
        ]);

        // Log the activity
        \App\Models\Logs::create([
            'user_id' => $request->user()->id,
            'activity' => 'Created new saving',
            'data' => [
                'saving_id' => $saving->id,
                'bank' => $saving->name_bank,
                'pemasukan' => $pemasukan,
                'pengeluaran' => $pengeluaran,
                'total' => $total,
            ],
        ]);

        return response()->json([
            'message' => 'Saving created successfully',
            'data' => $saving,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $id)
    {
        $saving = Savings::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();
        
        return response()->json([
            'message' => 'Saving retrieved successfully',
            'data' => $saving,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $saving = Savings::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'name_bank' => 'sometimes|string|max:255',
            'pemasukan' => 'sometimes|numeric|min:0',
            'pengeluaran' => 'sometimes|numeric|min:0',
        ]);

        $oldData = $saving->toArray();

        if (isset($validated['name_bank'])) {
            $saving->name_bank = $validated['name_bank'];
        }
        if (isset($validated['pemasukan'])) {
            $saving->pemasukan = $validated['pemasukan'];
        }
        if (isset($validated['pengeluaran'])) {
            $saving->pengeluaran = $validated['pengeluaran'];
        }

        // Recalculate total
        $saving->total = $saving->pemasukan - $saving->pengeluaran;
        $saving->save();

        // Log the activity
        \App\Models\Logs::create([
            'user_id' => $request->user()->id,
            'activity' => 'Updated saving',
            'data' => [
                'saving_id' => $saving->id,
                'bank' => $saving->name_bank,
                'old_data' => $oldData,
                'new_data' => $saving->toArray(),
            ],
        ]);

        return response()->json([
            'message' => 'Saving updated successfully',
            'data' => $saving,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $saving = Savings::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $savingData = $saving->toArray();
        $saving->delete();

        // Log the activity
        \App\Models\Logs::create([
            'user_id' => $request->user()->id,
            'activity' => 'Deleted saving',
            'data' => [
                'saving_id' => $savingData['id'],
                'bank' => $savingData['name_bank'],
                'deleted_data' => $savingData,
            ],
        ]);

        return response()->json([
            'message' => 'Saving deleted successfully',
        ]);
    }
}
