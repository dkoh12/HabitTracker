'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (success) setSuccess(false)
    if (error) setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        width: '100%',
        overflowX: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>Contact Us</h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Have a question, suggestion, or need help? We&apos;d love to hear from you. 
            Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Contact Form */}
          <Card style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <CardHeader style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <CardTitle style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              {success && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  color: '#166534'
                }}>
                  <CheckCircle style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    Message sent successfully! We&apos;ll get back to you soon.
                  </span>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  color: '#dc2626',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form-container" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Subject *
                  </label>
                  <Input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="What is this about?"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                      minHeight: '120px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Tell us more about your question or feedback..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.name || !formData.email || !formData.subject || !formData.message}
                  style={{
                    background: loading ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.875rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send style={{ width: '16px', height: '16px' }} />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <Card style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <CardHeader style={{
                padding: '1.5rem',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <CardTitle style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Mail style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Email</div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#6b7280'
                      }}>support@habittracker.com</div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Phone style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Phone</div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#6b7280'
                      }}>+1 (555) 123-4567</div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MapPin style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Address</div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        123 Habit Street<br />
                        Productivity City, PC 12345
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
              color: 'white'
            }}>
              <CardContent style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>Response Time</h3>
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  opacity: 0.9
                }}>
                  We typically respond to all inquiries within 24 hours during business days. 
                  For urgent matters, please include &quot;URGENT&quot; in your subject line.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        form {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }
        
        input, textarea {
          box-sizing: border-box !important;
          max-width: 100%;
        }
        
        .contact-form-container {
          width: 100%;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  )
}
