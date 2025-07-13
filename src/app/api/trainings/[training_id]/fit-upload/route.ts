import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  parseFitFile, 
  convertTrackpointsForDB, 
  convertLapsForDB, 
  validateFitFile 
} from '@/lib/fit-parser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ training_id: string }> }
) {
  try {
    const { training_id } = await params;

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: training_id },
      select: { id: true, fit_processed: true }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    if (activity.fit_processed) {
      return NextResponse.json(
        { error: 'FIT file already processed for this activity' },
        { status: 409 }
      );
    }

    // Get uploaded file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.fit')) {
      return NextResponse.json(
        { error: 'File must be a .FIT file' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate FIT file format
    if (!validateFitFile(buffer)) {
      return NextResponse.json(
        { error: 'Invalid FIT file format' },
        { status: 400 }
      );
    }

    // Parse FIT file
    let parsedFit;
    try {
      parsedFit = await parseFitFile(buffer);
    } catch (error) {
      console.error('Error parsing FIT file:', error);
      
return NextResponse.json(
        { error: 'Failed to parse FIT file' },
        { status: 422 }
      );
    }

    // Start database transaction to save trackpoints and laps
    await prisma.$transaction(async (tx) => {
      // Convert and insert trackpoints
      const trackpoints = convertTrackpointsForDB(
        parsedFit.activity.trackpoints,
        training_id
      );

      if (trackpoints.length > 0) {
        // Insert trackpoints in batches (1000 at a time to avoid memory issues)
        const batchSize = 1000;
        for (let i = 0; i < trackpoints.length; i += batchSize) {
          const batch = trackpoints.slice(i, i + batchSize);
          await tx.trackpoint.createMany({
            data: batch,
            skipDuplicates: true
          });
        }
      }

      // Convert and insert laps
      const laps = convertLapsForDB(parsedFit.activity.laps, training_id);
      
      if (laps.length > 0) {
        await tx.lap.createMany({
          data: laps,
          skipDuplicates: true
        });
      }

      // Mark activity as FIT processed
      await tx.activity.update({
        where: { id: training_id },
        data: { fit_processed: true }
      });
    });

    // Return success response with summary
    return NextResponse.json({
      success: true,
      message: 'FIT file processed successfully',
      data: {
        trackpoints_count: parsedFit.activity.trackpoints.length,
        laps_count: parsedFit.activity.laps.length,
        activity_duration: parsedFit.activity.total_time,
        activity_distance: parsedFit.activity.distance,
        sport: parsedFit.sport,
        device: parsedFit.device
      }
    });

  } catch (error) {
    console.error('Error processing FIT file:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ training_id: string }> }
) {
  try {
    const { training_id } = await params;

    // Get activity with FIT processing status
    const activity = await prisma.activity.findUnique({
      where: { id: training_id },
      select: {
        id: true,
        fit_processed: true,
        _count: {
          select: {
            trackpoints: true,
            laps: true
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fit_processed: activity.fit_processed,
      trackpoints_count: activity._count.trackpoints,
      laps_count: activity._count.laps
    });

  } catch (error) {
    console.error('Error getting FIT status:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 