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

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = getDatabase()

    // Root endpoint - GET /api/
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Monkey Registry API" }))
    }

    // Monkeys CRUD endpoints
    
    // GET /api/monkeys - Get all monkeys
    if (route === '/monkeys' && method === 'GET') {
      const stmt = db.prepare(`
        SELECT * FROM monkeys 
        ORDER BY created_at DESC
      `)
      const monkeys = stmt.all()
      return handleCORS(NextResponse.json(monkeys))
    }

    // POST /api/monkeys - Create new monkey
    if (route === '/monkeys' && method === 'POST') {
      const body = await request.json()
      
      const errors = validateMonkeyData(body)
      if (Object.keys(errors).length > 0) {
        return handleCORS(NextResponse.json({ errors }, { status: 400 }))
      }

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
    }

    // GET /api/monkeys/[id] - Get specific monkey
    if (route.startsWith('/monkeys/') && method === 'GET') {
      const monkeyId = path[1]
      const stmt = db.prepare('SELECT * FROM monkeys WHERE monkey_id = ?')
      const monkey = stmt.get(monkeyId)
      
      if (!monkey) {
        return handleCORS(NextResponse.json(
          { error: 'Monkey not found' }, 
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json(monkey))
    }

    // PUT /api/monkeys/[id] - Update specific monkey
    if (route.startsWith('/monkeys/') && method === 'PUT') {
      const monkeyId = path[1]
      const body = await request.json()
      
      // Check if monkey exists
      const checkStmt = db.prepare('SELECT monkey_id FROM monkeys WHERE monkey_id = ?')
      const existingMonkey = checkStmt.get(monkeyId)
      
      if (!existingMonkey) {
        return handleCORS(NextResponse.json(
          { error: 'Monkey not found' }, 
          { status: 404 }
        ))
      }
      
      const errors = validateMonkeyData(body, true)
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
        new Date().toISOString(), monkeyId
      )
      
      // Return updated monkey
      const getStmt = db.prepare('SELECT * FROM monkeys WHERE monkey_id = ?')
      const updatedMonkey = getStmt.get(monkeyId)
      
      return handleCORS(NextResponse.json(updatedMonkey))
    }

    // DELETE /api/monkeys/[id] - Delete specific monkey
    if (route.startsWith('/monkeys/') && method === 'DELETE') {
      const monkeyId = path[1]
      
      // Check if monkey exists
      const checkStmt = db.prepare('SELECT monkey_id FROM monkeys WHERE monkey_id = ?')
      const existingMonkey = checkStmt.get(monkeyId)
      
      if (!existingMonkey) {
        return handleCORS(NextResponse.json(
          { error: 'Monkey not found' }, 
          { status: 404 }
        ))
      }
      
      const stmt = db.prepare('DELETE FROM monkeys WHERE monkey_id = ?')
      stmt.run(monkeyId)
      
      return handleCORS(NextResponse.json({ message: 'Monkey deleted successfully' }))
    }

    // AI Description Generation endpoint
    if (route === '/generate-description' && method === 'POST') {
      const body = await request.json()
      
      if (!body.species) {
        return handleCORS(NextResponse.json(
          { error: 'Species is required for description generation' },
          { status: 400 }
        ))
      }

      try {
        // For now, we'll generate a mock description since emergentintegrations is not available
        // This will be replaced with actual AI integration once the library is properly installed
        const mockDescription = `${body.name || 'This monkey'} is a fascinating ${body.species} specimen. 
        
**Physical Characteristics**: As a ${body.species}, this primate exhibits the distinctive features of their species, including their characteristic body structure and adaptive traits.

**Behavioral Notes**: At ${body.age_years || 'an estimated'} years old, this individual shows typical behaviors for their species. Their preference for ${body.favourite_fruit || 'various fruits'} indicates a healthy diet and natural foraging instincts.

**Care Information**: Regular checkups are essential for monitoring health and wellbeing. The most recent checkup was ${body.last_checkup_at ? `on ${new Date(body.last_checkup_at).toLocaleDateString()}` : 'recorded in the system'}.

**Conservation Status**: ${body.species} monkeys play an important role in their ecosystem and deserve our continued protection and study.

*This description was generated based on the provided characteristics and general knowledge about ${body.species} monkeys.*`

        return handleCORS(NextResponse.json({ 
          description: mockDescription,
          generated_at: new Date().toISOString()
        }))
        
      } catch (error) {
        console.error('Error generating description:', error)
        return handleCORS(NextResponse.json(
          { error: 'Failed to generate description' },
          { status: 500 }
        ))
      }
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute