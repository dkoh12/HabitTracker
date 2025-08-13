'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Calendar, TrendingUp, Edit3, Save, X, Camera, Trash2, Grid, Upload, Lock, AlertTriangle } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string | null
  createdAt: string
  _count: {
    habits: number
  }
}

interface DefaultAvatar {
  id: string
  filename: string
  url: string
}

export default function Profile() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false) // Start with false - no loading screen
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDefaultAvatars, setShowDefaultAvatars] = useState(false)
  const [defaultAvatars, setDefaultAvatars] = useState<DefaultAvatar[]>([])
  const [loadingAvatars, setLoadingAvatars] = useState(false)
  
  // Password reset states
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [resettingPassword, setResettingPassword] = useState(false)
  
  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditName(data.name)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
    // No finally block needed - we don't use loading state anymore
  }

  const handleSave = async () => {
    if (!editName.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editName.trim() })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditing(false)
        // Update the session with new name
        try {
          await update({ name: updatedProfile.name })
          // Refresh the router to ensure navigation updates
          router.refresh()
        } catch (sessionError) {
          console.error('Error updating session:', sessionError)
          // Session update failed, but profile was saved successfully
          // The page will still show the updated name
          router.refresh()
          // As a fallback, we could reload the page to ensure everything updates
          // window.location.reload()
        }
      } else {
        const errorData = await response.json()
        console.error('Error updating profile:', errorData)
        alert(`Failed to update profile: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(profile?.name || '')
    setEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        
        // Update the session to reflect the new avatar
        await update({ avatar: data.user.avatar })
        
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(`Failed to upload avatar: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
      // Reset the input
      event.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
      return
    }

    setUploadingAvatar(true)
    try {
      const response = await fetch('/api/upload-avatar', {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        
        // Update the session to reflect the removed avatar
        await update({ avatar: null })
        
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(`Failed to remove avatar: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error removing avatar:', error)
      alert('Failed to remove avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const loadDefaultAvatars = async () => {
    if (defaultAvatars.length > 0) {
      setShowDefaultAvatars(true)
      return
    }

    setLoadingAvatars(true)
    try {
      const response = await fetch('/api/default-avatars')
      if (response.ok) {
        const data = await response.json()
        setDefaultAvatars(data.avatars)
        setShowDefaultAvatars(true)
      } else {
        alert('Failed to load default avatars')
      }
    } catch (error) {
      console.error('Error loading default avatars:', error)
      alert('Failed to load default avatars')
    } finally {
      setLoadingAvatars(false)
    }
  }

  const handleSelectDefaultAvatar = async (avatarUrl: string) => {
    setUploadingAvatar(true)
    try {
      const response = await fetch('/api/set-default-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatarUrl })
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setShowDefaultAvatars(false)
        
        // Update the session to reflect the new avatar
        await update({ avatar: data.user.avatar })
        
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(`Failed to set avatar: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error setting default avatar:', error)
      alert('Failed to set avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long')
      return
    }

    setResettingPassword(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        alert('Password updated successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordReset(false)
      } else {
        const errorData = await response.json()
        alert(`Failed to update password: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password. Please try again.')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type "DELETE" to confirm account deletion')
      return
    }

    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your habits, groups, and data.')) {
      return
    }

    setDeletingAccount(true)
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Account deleted successfully. You will be signed out.')
        // Sign out and redirect to home
        window.location.href = '/auth/signin'
      } else {
        const errorData = await response.json()
        alert(`Failed to delete account: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    } finally {
      setDeletingAccount(false)
    }
  }

  if (!session) return null

  // Show page immediately, even if profile is still loading
  if (!profile) {
    // Profile is loading - show page with skeleton/placeholder content
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Navigation />
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '1rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#e5e7eb',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
            <div>
              <div style={{
                width: '200px',
                height: '32px',
                background: '#e5e7eb',
                borderRadius: '8px',
                marginBottom: '8px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
              <div style={{
                width: '300px',
                height: '16px',
                background: '#e5e7eb',
                borderRadius: '8px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
            </div>
          </div>
          <div style={{
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: '1fr',
            maxWidth: '600px'
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}>
                <div style={{
                  width: '150px',
                  height: '20px',
                  background: '#e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }} />
                <div style={{
                  width: '100%',
                  height: '60px',
                  background: '#f3f4f6',
                  borderRadius: '8px'
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation />
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: profile.avatar 
                ? `url(${profile.avatar})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: '600',
              border: '4px solid white',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              {!profile.avatar && profile.name.charAt(0).toUpperCase()}
              
              {/* Upload Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className="w-6 h-6" style={{ color: 'white' }} />
              </div>
            </div>
            
            {/* Remove Avatar Button */}
            {profile.avatar && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#dc2626',
                  border: '2px solid white',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            
            {/* Hidden File Input */}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              style={{ display: 'none' }}
            />
          </div>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              My Profile
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: 0
            }}>
              Manage your account settings and preferences
            </p>
            {uploadingAvatar && (
              <p style={{
                fontSize: '0.875rem',
                color: '#667eea',
                margin: '0.5rem 0 0 0',
                fontWeight: '500'
              }}>
                {profile.avatar ? 'Removing...' : 'Uploading...'} ⏳
              </p>
            )}
          </div>
        </div>

        {/* Avatar Selection Options */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => document.getElementById('avatar-upload')?.click()}
            disabled={uploadingAvatar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
              opacity: uploadingAvatar ? 0.6 : 1,
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => !uploadingAvatar && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => !uploadingAvatar && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
          
          <button
            onClick={loadDefaultAvatars}
            disabled={uploadingAvatar || loadingAvatars}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: (uploadingAvatar || loadingAvatars) ? 'not-allowed' : 'pointer',
              opacity: (uploadingAvatar || loadingAvatars) ? 0.6 : 1,
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => !uploadingAvatar && !loadingAvatars && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => !uploadingAvatar && !loadingAvatars && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Grid className="w-4 h-4" />
            {loadingAvatars ? 'Loading...' : 'Choose Default Avatar'}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gap: '2rem',
          gridTemplateColumns: '1fr',
          maxWidth: '600px'
        }}>
          {/* Profile Information */}
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <CardHeader style={{
              padding: '0.75rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
            }}>
              <CardTitle style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User className="w-5 h-5" style={{ color: '#667eea' }} />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                {/* Name Field */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Name
                  </label>
                  {editing ? (
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave()
                          if (e.key === 'Escape') handleCancel()
                        }}
                        autoFocus
                      />
                      <Button
                        onClick={handleSave}
                        disabled={saving || !editName.trim()}
                        style={{
                          padding: '0.75rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        style={{
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          background: 'white',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span style={{
                        fontSize: '1rem',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {profile.name}
                      </span>
                      <Button
                        onClick={() => setEditing(true)}
                        variant="ghost"
                        size="sm"
                        style={{
                          padding: '0.5rem',
                          color: '#6b7280',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Email
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '1rem',
                    color: '#374151'
                  }}>
                    {profile.email}
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Email cannot be changed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Reset Section */}
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <CardHeader style={{
              padding: '0.75rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
            }}>
              <CardTitle style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Lock className="w-5 h-5" style={{ color: '#667eea' }} />
                Password & Security
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: showPasswordReset ? '1.5rem' : '0'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#374151',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Change Password
                  </h4>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Update your account password for better security
                  </p>
                </div>
                <Button
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: showPasswordReset ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: showPasswordReset ? '#374151' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {showPasswordReset ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {showPasswordReset && (
                <div style={{
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter your current password"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter your new password (min. 6 characters)"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm your new password"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={resettingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: resettingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword
                          ? '#d1d5db' 
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: resettingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword 
                          ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        alignSelf: 'flex-start'
                      }}
                    >
                      {resettingPassword ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <CardHeader style={{
              padding: '0.75rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
            }}>
              <CardTitle style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '12px',
                  border: '1px solid #93c5fd'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1d4ed8',
                    marginBottom: '0.25rem'
                  }}>
                    {profile._count?.habits || 0}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    Active Habits
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  borderRadius: '12px',
                  border: '1px solid #86efac'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#059669',
                    marginBottom: '0.25rem'
                  }}>
                    <Calendar className="w-8 h-8 mx-auto" />
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    Member Since
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    {memberSince}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account Section */}
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #fecaca',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.1)',
            overflow: 'hidden'
          }}>
            <CardHeader style={{
              padding: '0.75rem 1.5rem',
              borderBottom: '1px solid #fee2e2',
              background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
            }}>
              <CardTitle style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: showDeleteConfirm ? '1.5rem' : '0'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#dc2626',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Delete Account
                  </h4>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: showDeleteConfirm ? '#e5e7eb' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: showDeleteConfirm ? '#374151' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {showDeleteConfirm ? 'Cancel' : 'Delete Account'}
                </Button>
              </div>

              {showDeleteConfirm && (
                <div style={{
                  padding: '1.5rem',
                  background: '#fef2f2',
                  borderRadius: '12px',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#fee2e2',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5'
                  }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626', flexShrink: 0 }} />
                    <div>
                      <h5 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#dc2626',
                        margin: 0,
                        marginBottom: '0.25rem'
                      }}>
                        Warning: This action cannot be undone!
                      </h5>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#7f1d1d',
                        margin: 0
                      }}>
                        Deleting your account will permanently remove all your habits, group memberships, progress data, and profile information.
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Type &quot;DELETE&quot; to confirm
                      </label>
                      <Input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE here"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #fca5a5',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: deletingAccount || deleteConfirmText !== 'DELETE'
                          ? '#d1d5db' 
                          : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: deletingAccount || deleteConfirmText !== 'DELETE' 
                          ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingAccount ? 'Deleting Account...' : 'Delete My Account'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Default Avatar Selection Modal */}
      {showDefaultAvatars && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '800px',
            maxHeight: '80vh',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Choose Default Avatar
              </h3>
              <button
                onClick={() => setShowDefaultAvatars(false)}
                disabled={uploadingAvatar}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{
              padding: '1.5rem',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '1rem'
              }}>
                {defaultAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectDefaultAvatar(avatar.url)}
                    disabled={uploadingAvatar}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '3px solid transparent',
                      cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                      opacity: uploadingAvatar ? 0.6 : 1,
                      background: `url(${avatar.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingAvatar) {
                        e.currentTarget.style.border = '3px solid #667eea'
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!uploadingAvatar) {
                        e.currentTarget.style.border = '3px solid transparent'
                        e.currentTarget.style.transform = 'scale(1)'
                      }
                    }}
                  />
                ))}
              </div>
              
              {defaultAvatars.length === 0 && !loadingAvatars && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  No default avatars available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
