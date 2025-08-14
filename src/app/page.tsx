'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  BookOpen,
  Dumbbell,
  Brain,
  Award,
  ArrowRight
} from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const [randomAvatar, setRandomAvatar] = useState<string>('')

  useEffect(() => {
    const avatarFiles = [
      'avatar_1826783377633780368.jpg',
      'avatar_1826783377633780374.jpg',
      'avatar_1826783377633780381.jpg',
      'avatar_1826783377633780386.jpg',
      'avatar_1826783377633780393.jpg',
      'avatar_1826783377633780401.jpg',
      'avatar_1826783377633780406.jpg',
      'avatar_1826783377633780411.jpg',
      'avatar_1826783377633780417.jpg',
      'avatar_1826783377633780422.jpg',
      'avatar_1826783377633780427.jpg',
      'avatar_1826783377633780434.jpg',
      'avatar_1826783377633780439.jpg',
      'avatar_1826783377633780444.jpg',
      'avatar_1826783377633780449.jpg',
      'avatar_1826783377633780454.jpg',
      'avatar_1826783377633780460.jpg',
      'avatar_1826783377633780465.jpg',
      'avatar_1826783377633780468.jpg',
      'avatar_1826783377633780473.jpg',
      'avatar_1826783377633780476.jpg',
      'avatar_1826783377633780484.jpg',
      'avatar_1826783377633780490.jpg',
      'avatar_1826783377633780493.jpg',
      'avatar_1826783377633780499.jpg',
      'avatar_1826783377633780506.jpg'
    ]

    const randomIndex = Math.floor(Math.random() * avatarFiles.length)
    const selectedAvatar = avatarFiles[randomIndex]
    setRandomAvatar(`/uploads/default_avatar/${selectedAvatar}`)
  }, [])

  return (
    <div>
      <Navigation />
      
      {/* Main Visual Hub Section - Light Background */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem 1rem',
      }}>
        <div style={{
          position: 'relative',
          width: '800px',
          height: '800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Connection lines from center to each image */}
          {[
            { src: '/images/studying.avif', alt: 'Studying', angle: 0 },
            { src: '/images/reading.avif', alt: 'Reading', angle: 45 },
            { src: '/images/exercising.avif', alt: 'Exercising', angle: 90 },
            { src: '/images/exercising.jpg', alt: 'Exercise Training', angle: 135 },
            { src: '/images/running.jpg', alt: 'Running', angle: 180 },
            { src: '/images/cooking.jpg', alt: 'Cooking', angle: 225 },
            { src: '/images/painting.jpg', alt: 'Painting', angle: 270 },
            { src: '/images/instrument.jpg', alt: 'Playing Instrument', angle: 315 }
          ].map((img, idx) => {
            const centerToCenterDistance = 300;
            const imageSize = 200;
            const rad = (img.angle * Math.PI) / 180;
            const x = centerToCenterDistance * Math.cos(rad);
            const y = centerToCenterDistance * Math.sin(rad);
            
            return (
              <div key={`line-${img.alt}`}>
                {/* Connection line */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${centerToCenterDistance}px`,
                  height: '4px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, rgba(59, 130, 246, 0.3) 100%)',
                  transformOrigin: '0 50%',
                  transform: `rotate(${img.angle}deg)`,
                  zIndex: 1,
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }} />
                
                {/* Outer image circle */}
                <div style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}px - ${imageSize / 2}px)`,
                  top: `calc(50% + ${y}px - ${imageSize / 2}px)`,
                  width: `${imageSize}px`,
                  height: `${imageSize}px`,
                  borderRadius: '50%',
                  boxShadow: '0 12px 32px rgba(59,130,246,0.2)',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '6px solid #3b82f6',
                  zIndex: 3,
                }}>
                  <img
                    src={img.src}
                    alt={img.alt}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '50%',
                      objectPosition: img.src === '/images/studying.avif' ? 'center 20%' : 'center center'
                    }}
                  />
                </div>
              </div>
            );
          })}
          
          {/* Center HabitTracker logo/text */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            boxShadow: '0 16px 40px rgba(59,130,246,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '900',
            fontSize: '2.2rem',
            textAlign: 'center',
            border: '8px solid white',
            zIndex: 4,
            padding: '1rem'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>HabitTracker</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e0f2fe' }}>Achieve Every Habit</div>
          </div>
        </div>
      </div>

      {/* Headline, Description, Buttons, Stats Section - Dark Background */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Headline, Description, Buttons, Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          color: 'white',
          padding: '2rem 1rem 4rem 1rem',
        }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 7vw, 5.5rem)',
          fontWeight: '900',
          marginBottom: '1.5rem',
          lineHeight: '1.1',
          background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}>
          Build Better Habits with HabitTracker<br />
          <span style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Transform Your Life
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          color: '#cbd5e1',
          marginBottom: '1.5rem',
          lineHeight: '1.6',
          fontWeight: '500',
          textAlign: 'center',
        }}>
          Create lasting positive change through consistent daily habits. 
          <strong style={{ color: 'white' }}> Reading, exercising, learning, growing</strong>.
        </p>

        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          color: '#94a3b8',
          marginBottom: '3rem',
          lineHeight: '1.6',
          fontWeight: '400',
          textAlign: 'center',
        }}>
          Start small, stay consistent, and watch as your habits shape the person you want to become.
        </p>

        <div style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem',
        }}>
          {session ? (
            <Link href="/dashboard">
              <Button style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '1.5rem 3rem',
                borderRadius: '12px',
                fontSize: '1.2rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Continue Your Journey
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/signup">
                <Button style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1.5rem 3rem',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  Start Building Excellence
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '1.5rem 3rem',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  backdropFilter: 'blur(10px)'
                }}>
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Achievement Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          maxWidth: '600px',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            minWidth: '140px',
            flex: '1',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>21</div>
            <div style={{
              fontSize: '0.9rem',
              color: '#cbd5e1',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Days to Excellence</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            minWidth: '140px',
            flex: '1',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              color: '#06b6d4',
              marginBottom: '0.5rem'
            }}>10k+</div>
            <div style={{
              fontSize: '0.9rem',
              color: '#cbd5e1',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Elite Members</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            minWidth: '140px',
            flex: '1',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>94%</div>
            <div style={{
              fontSize: '0.9rem',
              color: '#cbd5e1',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Success Rate</div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Challenge Categories Section */}
      <div style={{
        padding: '6rem 1rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '900',
              color: '#1e293b',
              marginBottom: '1.5rem',
              lineHeight: '1.2'
            }}>
              Master the Habits That<br />
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Separate Champions from Everyone Else</span>
            </h2>
            <p style={{
              fontSize: '1.4rem',
              color: '#475569',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              These aren't your typical habits. These are the challenging, transformative 
              practices that build mental strength, physical excellence, and intellectual power.
            </p>
          </div>

          {/* Challenge Categories */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}>
            {/* Intellectual Mastery */}
            <Card style={{
              padding: '0',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              background: 'white',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'relative',
                height: '200px',
                overflow: 'hidden'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Person reading and studying"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                }}>
                  <BookOpen style={{ width: '30px', height: '30px', color: 'white' }} />
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  marginBottom: '1rem'
                }}>Intellectual Mastery</h3>
                <p style={{
                  color: '#64748b',
                  lineHeight: '1.6',
                  fontSize: '1.1rem'
                }}>
                  Daily reading, deep study sessions, skill acquisition. Build the habits 
                  that expand your mind and create lasting knowledge.
                </p>
              </div>
            </Card>

            {/* Physical Excellence */}
            <Card style={{
              padding: '0',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              background: 'white',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'relative',
                height: '200px',
                overflow: 'hidden'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Person exercising and staying fit"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                }}>
                  <Dumbbell style={{ width: '30px', height: '30px', color: 'white' }} />
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  marginBottom: '1rem'
                }}>Physical Excellence</h3>
                <p style={{
                  color: '#64748b',
                  lineHeight: '1.6',
                  fontSize: '1.1rem'
                }}>
                  Consistent workouts, athletic training, physical challenges. 
                  Build the discipline that creates both mental and physical strength.
                </p>
              </div>
            </Card>

            {/* Mental Discipline */}
            <Card style={{
              padding: '0',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              background: 'white',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'relative',
                height: '200px',
                overflow: 'hidden'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Person meditating and practicing mindfulness"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
                }}>
                  <Brain style={{ width: '30px', height: '30px', color: 'white' }} />
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  marginBottom: '1rem'
                }}>Mental Discipline</h3>
                <p style={{
                  color: '#64748b',
                  lineHeight: '1.6',
                  fontSize: '1.1rem'
                }}>
                  Meditation, journaling, focused work sessions. Develop the mental 
                  clarity and emotional control that drives success.
                </p>
              </div>
            </Card>
          </div>

          {/* Success Stories Section with More Images */}
          <div style={{
            marginBottom: '4rem'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '3rem',
              textAlign: 'center'
            }}>
              Real People, Real Transformations
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}>
              {/* Success Story 1 */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Person learning new skills"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>Learning & Growth</h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    "30 minutes of daily learning transformed my career in just 6 months."
                  </p>
                </div>
              </div>

              {/* Success Story 2 */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Person running and staying healthy"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>Health & Fitness</h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    "Daily exercise habit gave me energy I never thought possible."
                  </p>
                </div>
              </div>

              {/* Success Story 3 */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Person reading and developing knowledge"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>Personal Development</h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    "Reading daily opened my mind to new possibilities and opportunities."
                  </p>
                </div>
              </div>

              {/* Success Story 4 */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Team working together and growing"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>Collaboration & Success</h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    "Building habits with others created accountability and lasting change."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
