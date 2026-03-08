import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

// GET /api/users — Fetch all users + factory assignments via admin (bypasses RLS)
export async function GET() {
  try {
    const [{ data: users, error: usersError }, { data: pfRows }, { data: factories }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').order('role').order('full_name'),
      supabaseAdmin.from('profile_factories').select('profile_id, factory_id'),
      supabaseAdmin.from('factories').select('*').eq('is_active', true).order('name'),
    ])
    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 })
    const pfMap: Record<string, string[]> = {}
    ;(pfRows ?? []).forEach((r: any) => {
      if (!pfMap[r.profile_id]) pfMap[r.profile_id] = []
      pfMap[r.profile_id].push(r.factory_id)
    })
    return NextResponse.json({ users: users ?? [], factories: factories ?? [], pfMap })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


// POST /api/users — Create new user
export async function POST(request: Request) {
  try {
    const { email, password, full_name, role, phone, factory_ids } = await request.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY missing from .env.local — add it and restart the server'
      }, { status: 500 })
    }

    // Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Upsert profile — works whether trigger fired or not
    await supabaseAdmin.from('profiles').upsert({
      id:        data.user.id,
      full_name,
      email,
      role,
      phone:     phone || null,
      is_active: true,
    }, { onConflict: 'id' })

    // Assign factories if provided
    if (Array.isArray(factory_ids) && factory_ids.length > 0) {
      const rows = factory_ids.map((factory_id: string) => ({
        profile_id: data.user.id,
        factory_id,
      }))
      await supabaseAdmin.from('profile_factories').insert(rows)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/users — Update user profile + factory assignments
export async function PATCH(request: Request) {
  try {
    const { id, full_name, phone, role, is_active, factory_ids } = await request.json()
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    // Update profile fields
    const updates: any = {}
    if (full_name  !== undefined) updates.full_name  = full_name
    if (phone      !== undefined) updates.phone      = phone
    if (role       !== undefined) updates.role       = role
    if (is_active  !== undefined) updates.is_active  = is_active

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Replace factory assignments if factory_ids is provided
    if (Array.isArray(factory_ids)) {
      await supabaseAdmin.from('profile_factories').delete().eq('profile_id', id)
      if (factory_ids.length > 0) {
        const rows = factory_ids.map((factory_id: string) => ({ profile_id: id, factory_id }))
        await supabaseAdmin.from('profile_factories').insert(rows)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/users
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
