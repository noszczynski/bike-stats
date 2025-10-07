import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

interface RouteParams {
  params: {
    training_id: string;
    tag_id: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { training_id, tag_id } = params;

    // Check if activity belongs to user
    const activity = await prisma.activity.findUnique({
      where: { 
        id: training_id,
        user_id: user.id
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Check if the activity tag relationship exists
    const activityTag = await prisma.activityTag.findUnique({
      where: {
        activity_id_tag_id: {
          activity_id: training_id,
          tag_id: tag_id,
        },
      },
    });

    if (!activityTag) {
      return NextResponse.json(
        { error: 'Tag not found on this activity' },
        { status: 404 }
      );
    }

    await prisma.activityTag.delete({
      where: {
        activity_id_tag_id: {
          activity_id: training_id,
          tag_id: tag_id,
        },
      },
    });

    return NextResponse.json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Error removing tag from activity:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag from activity' },
      { status: 500 }
    );
  }
} 