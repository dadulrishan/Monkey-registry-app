import { NextResponse } from 'next/server'

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

// POST /api/generate-description - Generate AI description for a monkey
export async function POST(request) {
  try {
    const body = await request.json()
    
    if (!body.species) {
      return handleCORS(NextResponse.json(
        { error: 'Species is required for description generation' },
        { status: 400 }
      ))
    }

    // Generate comprehensive mock description
    const mockDescription = `${body.name || 'This monkey'} is a fascinating ${body.species} specimen. 

**Physical Characteristics**: As a ${body.species}, this primate exhibits the distinctive features of their species, including their characteristic body structure and adaptive traits. ${body.species} monkeys are known for their remarkable physical adaptations that help them thrive in their natural habitats.

**Behavioral Notes**: At ${body.age_years || 'an estimated'} years old, this individual shows typical behaviors for their species. Their preference for ${body.favourite_fruit || 'various fruits'} indicates a healthy diet and natural foraging instincts. ${body.species} monkeys are highly social creatures with complex communication patterns and intelligent problem-solving abilities.

**Diet and Nutrition**: The preference for ${body.favourite_fruit || 'fruits'} is typical of ${body.species} monkeys, who are primarily frugivorous but also consume leaves, insects, and other plant materials. Their dietary choices play a crucial role in seed dispersal within their ecosystem.

**Care Information**: Regular checkups are essential for monitoring health and wellbeing. The most recent checkup was ${body.last_checkup_at ? `on ${new Date(body.last_checkup_at).toLocaleDateString()}` : 'recorded in the system'}. Proper veterinary care ensures optimal health and early detection of any potential issues.

**Conservation Status**: ${body.species} monkeys play an important role in their ecosystem and deserve our continued protection and study. They serve as crucial pollinators and seed dispersers, making them keystone species in their natural habitats.

**Habitat Requirements**: ${body.species} monkeys require spacious environments with adequate climbing structures, social interaction opportunities, and environmental enrichment to maintain their physical and psychological well-being.

*This comprehensive description was generated based on the provided characteristics and general knowledge about ${body.species} monkeys. Each individual monkey has unique personality traits and behaviors that make them special.*`

    return handleCORS(NextResponse.json({ 
      description: mockDescription,
      generated_at: new Date().toISOString(),
      species: body.species,
      monkey_name: body.name
    }))
    
  } catch (error) {
    console.error('POST /api/generate-description Error:', error)
    return handleCORS(NextResponse.json(
      { error: 'Failed to generate description', details: error.message },
      { status: 500 }
    ))
  }
}