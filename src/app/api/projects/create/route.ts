import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createProjectSchema = z.object({
  title: z.string().min(1).max(200).transform(v => v.trim()),
  description: z.string().max(2000).optional().transform(v => v?.trim() || null),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }

  const { title, description } = parsed.data

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      description,
      user_id: user.id,
      status: 'PLANNING',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  return NextResponse.json({ success: true, project: data })
}
