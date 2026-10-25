import { NextResponse } from 'next/server';
import { getReelById, updateReel, deleteReel } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reel = await getReelById(params.id);
    if (!reel) {
      return NextResponse.json({ success: false, error: 'Reel not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: reel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateReel(params.id, body, body.user || 'Admin');
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Reel not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteReel(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Reel not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Reel deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
