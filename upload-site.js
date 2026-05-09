// Upload built files to Supabase Storage for static hosting
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = 'https://ykoipcgzyhekrfeccuoj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb2lwY2d6eWhla3JmZWNjdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzk4NTgsImV4cCI6MjA5MzkxNTg1OH0.NhpiRy0vwEtUt9ZmZIwyIny47gljoeCnEFi0lZ7pbXw'

const supabase = createClient(supabaseUrl, supabaseKey)

const distDir = join(__dirname, 'dist')

function walkDir(dir) {
  const results = []
  const files = readdirSync(dir)
  for (const file of files) {
    const fullPath = join(dir, file)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

async function uploadFile(localPath, remotePath) {
  const ext = localPath.substring(localPath.lastIndexOf('.'))
  const contentType = contentTypes[ext] || 'application/octet-stream'
  const content = readFileSync(localPath)

  const { error } = await supabase.storage
    .from('site')
    .upload(remotePath, content, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error(`  FAIL: ${remotePath} - ${error.message}`)
  } else {
    console.log(`  OK: ${remotePath}`)
  }
  return !error
}

async function main() {
  if (!existsSync(distDir)) {
    console.error('dist/ directory not found. Run "npm run build" first.')
    process.exit(1)
  }

  console.log('Uploading site files to Supabase Storage...\n')

  const files = walkDir(distDir)
  let success = 0
  let failed = 0

  for (const file of files) {
    const remotePath = relative(distDir, file).replace(/\\/g, '/')
    const ok = await uploadFile(file, remotePath)
    if (ok) success++
    else failed++
  }

  console.log(`\nDone: ${success} uploaded, ${failed} failed`)
  console.log(`\nSite URL: https://ykoipcgzyhekrfeccuoj.supabase.co/storage/v1/object/public/site/index.html`)
}

main()
