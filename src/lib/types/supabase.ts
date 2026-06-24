// Run: npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/types/supabase.ts
// This generates typed helpers for the Supabase client.
// For GateWay:Colossus, the manual Database type mirrors our migration SQL.
//
// To regenerate:
//   1. Install Supabase CLI
//   2. Run: supabase gen types typescript --project-id "$NEXT_PUBLIC_SUPABASE_PROJECT_ID" > src/lib/types/supabase.ts
//   3. Update the Supabase client to use Database['public']['Tables'] types

export {}
