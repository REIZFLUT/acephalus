<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ResourceLockedException extends Exception
{
    /**
     * The lock information.
     *
     * @var array<string, mixed>|null
     */
    protected ?array $lockInfo;

    /**
     * Create a new exception instance.
     *
     * @param  array<string, mixed>|null  $lockInfo
     */
    public function __construct(string $message = 'Resource is locked.', ?array $lockInfo = null, int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->lockInfo = $lockInfo;
    }

    /**
     * Get the lock information.
     *
     * @return array<string, mixed>|null
     */
    public function getLockInfo(): ?array
    {
        return $this->lockInfo;
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(Request $request): JsonResponse|Response
    {
        $data = [
            'message' => $this->getMessage(),
            'lock_info' => $this->lockInfo,
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($data, 423);
        }

        // For web requests, redirect back with error
        return back()->withErrors([
            'locked' => $this->getMessage(),
        ])->with('lock_info', $this->lockInfo);
    }

    /**
     * Report the exception.
     */
    public function report(): bool
    {
        // Don't log this exception as it's expected behavior
        return false;
    }
}
