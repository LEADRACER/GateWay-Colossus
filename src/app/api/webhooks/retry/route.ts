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

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  const { delivery_id } = body as { delivery_id?: string }

  if (!delivery_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(delivery_id)) {
    return NextResponse.json({ error: 'Valid delivery_id (uuid) is required' }, { status: 400 })
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

  // Log delivery + bump webhook counters. Direct inserts/updates here hit
  // RLS (admins aren't owners by default), so use the SECURITY DEFINER rpc.
  const { error: logErr } = await supabase.rpc('log_webhook_delivery', {
    p_webhook_id: delivery.webhook_id,
    p_event: delivery.event,
    p_payload: delivery.payload,
    p_status_code: result.statusCode,
    p_response_body: result.responseBody,
    p_duration_ms: result.durationMs,
    p_success: result.success,
  })
  if (logErr) {
    return NextResponse.json({ error: logErr.message }, { status: 500 })
  }

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
