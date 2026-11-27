<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\StudentDocument;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class StudentDocumentController extends Controller
{
    public const FILE_RULES = ['file', 'mimes:pdf,doc,docx', 'max:5120'];

    public function index(Request $request)
    {
        return $request->user()->studentProfile()->firstOrFail()->documents()->latest()->get();
    }

    public static function saveUpload(StudentProfile $profile, UploadedFile $file, string $category, array &$paths, ?Internship $internship = null): StudentDocument
    {
        $path = $file->store('student-documents', 'local');
        abort_unless($path, 500, 'Unable to store the uploaded file.');
        $paths[] = $path;
        $doc = $profile->documents()->create([
            'name' => mb_substr(basename($file->getClientOriginalName()), 0, 200),
            'category' => $category,
            'internship_id' => $internship?->id,
            'file_url' => '',
            'storage_path' => $path,
            'file_size' => ceil($file->getSize() / 1024).' KB',
        ]);
        $doc->update(['file_url' => "/documents/{$doc->id}/file"]);
        return $doc->refresh();
    }

    public function store(Request $request)
    {
        $data = $request->validate(['file' => ['required', ...self::FILE_RULES], 'category' => 'required|string|max:60']);
        $profile = $request->user()->studentProfile()->firstOrFail();
        $paths = [];
        try {
            $doc = DB::transaction(function () use ($profile, $data, &$paths) {
                return self::saveUpload($profile, $data['file'], $data['category'], $paths);
            });
        } catch (Throwable $error) {
            Storage::disk('local')->delete($paths);
            throw $error;
        }
        return response()->json($doc, 201);
    }

    public function download(Request $request, StudentDocument $document)
    {
        $user = $request->user();
        $allowed = $user->isAdmin() || (int) $document->studentProfile?->user_id === (int) $user->id
            || ($user->role === 'GUIDE' && StudentDocument::whereKey($document->id)->assignedToGuide($user->id)->exists());
        abort_unless($allowed && $document->storage_path && Storage::disk('local')->exists($document->storage_path), 404);
        return Storage::disk('local')->download($document->storage_path, $document->name, ['Cache-Control' => 'private, no-store']);
    }

    public function destroy(Request $request, int $id)
    {
        $document = $request->user()->studentProfile()->firstOrFail()->documents()->findOrFail($id);
        abort_if($document->internship_id, 409, 'Submitted internship evidence is retained with the review.');
        $document->delete();
        if ($document->storage_path) Storage::disk('local')->delete($document->storage_path);
        return response()->json(['deleted' => true]);
    }
}
