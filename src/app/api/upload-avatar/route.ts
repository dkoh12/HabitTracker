import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const userId = (session.user as any).id
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    await writeFile(filePath, buffer)

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        avatar: avatarUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            habits: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Update user to remove avatar
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        avatar: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            habits: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Avatar removed successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Remove avatar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
