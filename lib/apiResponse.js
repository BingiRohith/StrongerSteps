/**
 * Small helpers to keep API responses consistent across every route
 * as the backend grows (auth now, blog/admin/media later).
 */

import { NextResponse } from "next/server";

export function ok(data = {}, status = 200) {
    return NextResponse.json(
        {
            success: true,
            ...data,
        },
        { status }
    );
}

export function fail(error = "Something went wrong", status = 400, extra = {}) {
    return NextResponse.json(
        {
            success: false,
            error,
            ...extra,
        },
        { status }
    );
}

/**
 * Wraps a route handler with a try/catch that logs the error server-side
 * and returns a safe generic JSON error to the client.
 */
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      // Let Next.js's own internal control-flow errors (e.g. the static
      // generation bailout for routes using cookies/headers) pass through
      // untouched instead of being converted into a JSON error response.
      if (err?.digest?.startsWith?.('DYNAMIC_SERVER_USAGE') || err?.code === 'NEXT_STATIC_GEN_BAILOUT') {
        throw err;
      }

      console.error('[API_ERROR]', err);

      // Mongoose validation errors -> 400 with field messages
      if (err?.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return fail(messages.join(', '), 400);
      }

      // Duplicate key error (e.g. email already exists)
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return fail(`This ${field} is already in use`, 409);
      }

      return fail('Internal server error', 500);
    }
  };
}
