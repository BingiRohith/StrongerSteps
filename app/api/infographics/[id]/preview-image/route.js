import { NextResponse } from 'next/server';
import { fail, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedInfographicById } from '@/lib/publicInfographics';
import { readProtectedFile } from '@/lib/privateUpload';
import { mimeFromFilename } from '@/lib/fileMime';

export const dynamic = 'force-dynamic';

/**
 * GET /api/infographics/[id]/preview-image — public, no token required.
 * Viewing an infographic's full-size image in the modal was never part of
 * the Sprint 12.5 download gate (only downloading is gated) — this route
 * streams `fullImage` inline from private storage so the modal preview
 * keeps working without exposing a permanent public path to it. Falls back
 * to the (already-public) thumbnailImage if no full image was uploaded.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const infographic = await getPublishedInfographicById(params.id);
  if (!infographic) {
    return fail('Infographic not found', 404);
  }

  if (infographic.fullImage?.url) {
    let buffer;
    try {
      buffer = await readProtectedFile('infographics-full', infographic.fullImage.url);
    } catch (err) {
      return fail('Image not found', 404);
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeFromFilename(infographic.fullImage.url),
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    });
  }

  if (infographic.thumbnailImage?.url) {
    return NextResponse.redirect(new URL(infographic.thumbnailImage.url, request.url));
  }

  return fail('No image available', 404);
});
