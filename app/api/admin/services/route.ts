import { NextResponse } from 'next/server';
import { createServiceSchema, updateServiceSchema } from '@/lib/validations/services';
import { 
  getServices, 
  createService, 
  updateService, 
  deleteService,
  toggleServiceStatus 
} from '@/lib/queries/services';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const services = await getServices();
    return NextResponse.json(services);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = createServiceSchema.parse(json);
    
    const service = await createService(body);
    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create service' },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const json = await req.json();
    const body = updateServiceSchema.parse(json);
    
    const service = await updateService(body);
    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update service' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    await deleteService(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete service' },
      { status: 500 }
    );
  }
}
