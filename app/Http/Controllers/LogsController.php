<?php

namespace App\Http\Controllers;

use App\Models\Logs;
use Illuminate\Http\Request;

class LogsController extends Controller
{
    /**
     * Display a listing of all logs (ordered by latest).
     */
    public function index(Request $request)
    {
        $query = Logs::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        // Optional filter by activity type
        if ($request->has('activity')) {
            $query->where('activity', 'like', '%' . $request->activity . '%');
        }

        // Optional filter by user_id
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->paginate($request->get('per_page', 20));
        
        return response()->json([
            'message' => 'Logs retrieved successfully',
            'data' => $logs,
        ]);
    }

    /**
     * Get logs for authenticated user.
     */
    public function myLogs(Request $request)
    {
        $logs = Logs::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));
        
        return response()->json([
            'message' => 'User logs retrieved successfully',
            'data' => $logs,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'activity' => 'required|string',
            'data' => 'nullable|array',
        ]);

        $log = Logs::create([
            'user_id' => $request->user()->id,
            'activity' => $validated['activity'],
            'data' => $validated['data'] ?? null,
        ]);

        return response()->json([
            'message' => 'Log created successfully',
            'data' => $log,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $id)
    {
        $log = Logs::with('user:id,name,email')
            ->findOrFail($id);
        
        return response()->json([
            'message' => 'Log retrieved successfully',
            'data' => $log,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $log = Logs::findOrFail($id);

        $validated = $request->validate([
            'activity' => 'sometimes|string',
            'data' => 'nullable|array',
        ]);

        $log->update($validated);

        return response()->json([
            'message' => 'Log updated successfully',
            'data' => $log,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $log = Logs::findOrFail($id);
        $log->delete();

        return response()->json([
            'message' => 'Log deleted successfully',
        ]);
    }
}
