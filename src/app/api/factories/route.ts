import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

// GET /api/factories — Fetch all factories + their assigned users (bypasses RLS)
export async function GET() {
  try {
    const [{ data: factories, error }, { data: pfRows }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from('factories').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.from('profile_factories').select('profile_id, factory_id'),
      supabaseAdmin.from('profiles').select('id, full_name, role, is_active').order('full_name'),
    ])

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Build map: factory_id -> [profile_id, ...]
    const factoryUsersMap: Record<string, string[]> = {}
    ;(pfRows ?? []).forEach((r: any) => {
      if (!factoryUsersMap[r.factory_id]) factoryUsersMap[r.factory_id] = []
      factoryUsersMap[r.factory_id].push(r.profile_id)
    })

    return NextResponse.json({ factories: factories ?? [], profiles: profiles ?? [], factoryUsersMap })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


// POST /api/factories — Create new factory
export async function POST(request: Request) {
  try {
    const { name, location } = await request.json()

    if (!name) return NextResponse.json({ error: 'Factory name is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('factories')
      .insert({ name, location: location || null })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, factory: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/factories — Update factory
export async function PATCH(request: Request) {
  try {
    const { id, name, location, is_active } = await request.json()

    if (!id) return NextResponse.json({ error: 'Factory ID required' }, { status: 400 })

    const updates: any = {}
    if (name      !== undefined) updates.name      = name
    if (location  !== undefined) updates.location  = location || null
    if (is_active !== undefined) updates.is_active = is_active

    const { error } = await supabaseAdmin
      .from('factories')
      .update(updates)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/factories — Delete factory
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Factory ID required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('factories')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
