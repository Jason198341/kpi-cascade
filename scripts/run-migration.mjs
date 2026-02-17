import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.VITE_SUPABASE_URL || 'https://uontkkpxsqydncobxlqp.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!key) {
  // Try reading from .env
  const envPath = join(__dirname, '..', '.env')
  const env = readFileSync(envPath, 'utf-8')
  const match = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)
  if (!match) { console.error('No service role key found'); process.exit(1) }
  var serviceKey = match[1].trim()
} else {
  var serviceKey = key
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Split SQL into statements and run each
const sql = readFileSync(join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'), 'utf-8')

// Execute via Supabase RPC (using the SQL editor endpoint)
const statements = sql
  .split(/;\s*$/m)
  .map(s => s.trim())
  .filter(s => s.length > 0)

console.log(`Found ${statements.length} SQL statements`)

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i]
  const preview = stmt.slice(0, 60).replace(/\n/g, ' ')

  const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' }).maybeSingle()

  if (error) {
    // Try direct REST approach
    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: stmt + ';' }),
    })

    if (!res.ok) {
      console.log(`  [${i+1}] SKIP: ${preview}... (may already exist)`)
    } else {
      console.log(`  [${i+1}] OK: ${preview}...`)
    }
  } else {
    console.log(`  [${i+1}] OK: ${preview}...`)
  }
}

console.log('\nDone!')
