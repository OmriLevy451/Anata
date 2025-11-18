import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for creating a user
const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(1, { message: "Name is required" }).optional(),
});

/**
 * @swagger
 * /api/users:
 * get:
 * summary: Retrieve a list of users
 * description: Retrieves a paginated list of users, with optional includes for relations.
 * tags: [Users]
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: The page number for pagination.
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 10
 * description: The number of users per page.
 * - in: query
 * name: include
 * schema:
 * type: string
 * description: Comma-separated list of relations to include (e.g., "boardsOwned,collaborations").
 * responses:
 * 200:
 * description: A list of users.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * data:
 * type: array
 * items:
 * $ref: '#/components/schemas/User'
 * pagination:
 * type: object
 * properties:
 * page:
 * type: integer
 * limit:
 * type: integer
 * totalUsers:
 * type: integer
 * totalPages:
 * type: integer
 * 500:
 * description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const include = searchParams.get('include')?.split(',');

    const skip = (page - 1) * limit;

    let includeOptions: any = {};
    if (include) {
      if (include.includes('boardsOwned')) includeOptions.boardsOwned = true;
      if (include.includes('collaborations')) includeOptions.collaborations = true;
      if (include.includes('operations')) includeOptions.operations = true;
    }

    const [users, totalUsers] = await prisma.$transaction([
      prisma.user.findMany({
        skip: skip,
        take: limit,
        include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/users Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users:
 * post:
 * summary: Create a new user
 * description: Creates a new user with a unique email.
 * tags: [Users]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * email:
 * type: string
 * format: email
 * name:
 * type: string
 * example:
 * email: "jane.doe@example.com"
 * name: "Jane Doe"
 * responses:
 * 201:
 * description: User created successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/User'
 * 400:
 * description: Invalid input.
 * 409:
 * description: User with this email already exists.
 * 500:
 * description: Internal server error.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validate input
    const validation = userCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.format() }, { status: 400 });
    }

    const { email, name } = validation.data;

    // 2. Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // 3. Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}