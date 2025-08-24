import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, getDatabase } from '@/lib/database'

// Initialize database on startup
initDatabase()

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Validation function for monkey data
function validateMonkeyData(data, isUpdate = false) {
  const errors = {}
  
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Name is required and must be a non-empty string'
  }
  
  if (!data.species || typeof data.species !== 'string' || !data.species.trim()) {
    errors.species = 'Species is required and must be a non-empty string'
  }
  
  if (data.age_years === undefined || data.age_years === null || 
      typeof data.age_years !== 'number' || data.age_years < 0 || data.age_years > 100) {
    errors.age_years = 'Age must be a number between 0 and 100'
  }
  
  if (!data.favourite_fruit || typeof data.favourite_fruit !== 'string' || !data.favourite_fruit.trim()) {
    errors.favourite_fruit = 'Favourite fruit is required and must be a non-empty string'
  }
  
  if (!data.last_checkup_at || typeof data.last_checkup_at !== 'string') {
    errors.last_checkup_at = 'Last checkup date is required and must be a valid date string'
  }
  
  return errors
}

// GET /api/monkeys - Get all monkeys
export async function GET() {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM monkeys 
      ORDER BY created_at DESC
    `)
    const monkeys = stmt.all()
    return handleCORS(NextResponse.json(monkeys))
  } catch (error) {
    console.error('GET /api/monkeys Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// POST /api/monkeys - Create new monkey
export async function POST(request) {
  try {
    const body = await request.json()
    
    const errors = validateMonkeyData(body)
    if (Object.keys(errors).length > 0) {
      return handleCORS(NextResponse.json({ errors }, { status: 400 }))
    }

    const db = getDatabase()
    const monkey = {
      monkey_id: uuidv4(),
      name: body.name.trim(),
      species: body.species.trim(),
      age_years: parseInt(body.age_years),
      favourite_fruit: body.favourite_fruit.trim(),
      last_checkup_at: body.last_checkup_at,
      description: body.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const stmt = db.prepare(`
      INSERT INTO monkeys (
        monkey_id, name, species, age_years, favourite_fruit, 
        last_checkup_at, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      monkey.monkey_id, monkey.name, monkey.species, monkey.age_years,
      monkey.favourite_fruit, monkey.last_checkup_at, monkey.description,
      monkey.created_at, monkey.updated_at
    )
    
    return handleCORS(NextResponse.json(monkey, { status: 201 }))
  } catch (error) {
    console.error('POST /api/monkeys Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}