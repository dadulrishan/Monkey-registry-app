import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

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
function validateMonkeyData(data) {
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

// GET /api/monkeys/[id] - Get specific monkey
export async function GET(request, { params }) {
  try {
    const { id } = params
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM monkeys WHERE monkey_id = ?')
    const monkey = stmt.get(id)
    
    if (!monkey) {
      return handleCORS(NextResponse.json(
        { error: 'Monkey not found' }, 
        { status: 404 }
      ))
    }
    
    return handleCORS(NextResponse.json(monkey))
  } catch (error) {
    console.error('GET /api/monkeys/[id] Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// PUT /api/monkeys/[id] - Update specific monkey
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Check if monkey exists
    const db = getDatabase()
    const checkStmt = db.prepare('SELECT monkey_id FROM monkeys WHERE monkey_id = ?')
    const existingMonkey = checkStmt.get(id)
    
    if (!existingMonkey) {
      return handleCORS(NextResponse.json(
        { error: 'Monkey not found' }, 
        { status: 404 }
      ))
    }
    
    const errors = validateMonkeyData(body)
    if (Object.keys(errors).length > 0) {
      return handleCORS(NextResponse.json({ errors }, { status: 400 }))
    }

    const stmt = db.prepare(`
      UPDATE monkeys SET 
        name = ?, species = ?, age_years = ?, favourite_fruit = ?,
        last_checkup_at = ?, description = ?, updated_at = ?
      WHERE monkey_id = ?
    `)
    
    stmt.run(
      body.name.trim(), body.species.trim(), parseInt(body.age_years),
      body.favourite_fruit.trim(), body.last_checkup_at, body.description || null,
      new Date().toISOString(), id
    )
    
    // Return updated monkey
    const getStmt = db.prepare('SELECT * FROM monkeys WHERE monkey_id = ?')
    const updatedMonkey = getStmt.get(id)
    
    return handleCORS(NextResponse.json(updatedMonkey))
  } catch (error) {
    console.error('PUT /api/monkeys/[id] Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// DELETE /api/monkeys/[id] - Delete specific monkey
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    // Check if monkey exists
    const db = getDatabase()
    const checkStmt = db.prepare('SELECT monkey_id FROM monkeys WHERE monkey_id = ?')
    const existingMonkey = checkStmt.get(id)
    
    if (!existingMonkey) {
      return handleCORS(NextResponse.json(
        { error: 'Monkey not found' }, 
        { status: 404 }
      ))
    }
    
    const stmt = db.prepare('DELETE FROM monkeys WHERE monkey_id = ?')
    stmt.run(id)
    
    return handleCORS(NextResponse.json({ message: 'Monkey deleted successfully' }))
  } catch (error) {
    console.error('DELETE /api/monkeys/[id] Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}