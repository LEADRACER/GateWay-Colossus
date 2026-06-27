import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deliverWebhook } from '@/services/integrations'
import type { Webhook } from '@/services/integrations'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { delivery_id } = body

  if (!delivery_id) {
    return NextResponse.json({ error: 'delivery_id is required' }, { status: 400 })
  }

  // Get the failed delivery
  const { data: delivery, error: delErr } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('id', delivery_id)
    .single()

  if (delErr || !delivery) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }

  // Get the associated webhook
  const { data: webhook, error: whErr } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', delivery.webhook_id)
    .single()

  if (whErr || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  if (!webhook.is_active) {
    return NextResponse.json({ error: 'Webhook is disabled' }, { status: 400 })
  }

  // Re-deliver
  const result = await deliverWebhook(webhook as Webhook, delivery.event, delivery.payload)

  // Log the new delivery
  await supabase.from('webhook_deliveries').insert({
    webhook_id: delivery.webhook_id,
    event: delivery.event,
    payload: delivery.payload,
    status_code: result.statusCode,
    response_body: result.responseBody,
    duration_ms: result.durationMs,
    success: result.success,
  })

  // Update webhook status
  const newFailureCount = result.success ? 0 : webhook.failure_count + 1
  await supabase
    .from('webhooks')
    .update({
      last_triggered_at: new Date().toISOString(),
      last_status: result.statusCode,
      failure_count: newFailureCount,
    })
    .eq('id', delivery.webhook_id)

  return NextResponse.json({
    success: result.success,
    status_code: result.statusCode,
    delivery: {
      webhook_id: delivery.webhook_id,
      event: delivery.event,
      status_code: result.statusCode,
      duration_ms: result.durationMs,
      success: result.success,
    },
  })
}
