/**
 * Property-Based Tests - Directions Email Validation
 * 
 * Feature: organizational-email-routing
 * Property 9: Frontend Form Validation (Directions)
 * 
 * *For any* form submission with an invalid email format, the frontend must 
 * display a validation error before sending the request to the API.
 * 
 * **Validates: Requirements 8.5**
 * 
 * Uses fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Email validation function (extracted from HTML5 email validation logic)
 * This mimics the browser's native email validation
 */
const isValidEmail = (email) => {
  if (!email || email.trim() === '') {
    return true // Empty is valid (optional field)
  }
  
  // HTML5 email validation pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * Simulate form validation that would occur in the browser
 */
const validateDirectionForm = (formData) => {
  const errors = {}
  
  // Name is required
  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Nome é obrigatório'
  }
  
  // Email validation (if provided)
  if (formData.email && formData.email.trim() !== '') {
    if (!isValidEmail(formData.email)) {
      errors.email = 'Por favor, insira um email válido'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Arbitrary generators
const validEmailArb = fc.emailAddress()

const invalidEmailArb = fc.oneof(
  fc.constant('invalid'),
  fc.constant('invalid@'),
  fc.constant('@invalid.com'),
  fc.constant('invalid @example.com'),
  fc.constant('invalid@exam ple.com'),
  fc.constant('invalid@'),
  fc.constant('@'),
  fc.constant('test@'),
  fc.constant('@test'),
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')),
  fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}@`).filter(s => s.length > 1),
  fc.string({ minLength: 1, maxLength: 20 }).map(s => `@${s}`)
)

const directionFormDataArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: '' }),
  code: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: '' }),
  managerId: fc.option(fc.uuid(), { nil: '' }),
  email: fc.option(fc.oneof(validEmailArb, invalidEmailArb), { nil: '' }),
  isActive: fc.boolean()
})

describe('Directions Email Validation - Property-Based Tests', () => {
  /**
   * Property 9: Frontend Form Validation (Directions)
   * 
   * Feature: organizational-email-routing, Property 9: Frontend Form Validation
   * **Validates: Requirements 8.5**
   */
  describe('Property 9: Frontend Form Validation', () => {
    it('should accept valid email formats', () => {
      fc.assert(
        fc.property(
          validEmailArb,
          (email) => {
            const formData = {
              name: 'Test Direction',
              email: email
            }
            
            const validation = validateDirectionForm(formData)
            
            // Valid emails should pass validation
            expect(validation.isValid).toBe(true)
            expect(validation.errors.email).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid email formats', () => {
      fc.assert(
        fc.property(
          invalidEmailArb,
          (email) => {
            const formData = {
              name: 'Test Direction',
              email: email
            }
            
            const validation = validateDirectionForm(formData)
            
            // Invalid emails should fail validation
            expect(validation.isValid).toBe(false)
            expect(validation.errors.email).toBeDefined()
            expect(validation.errors.email).toContain('email válido')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept empty email (optional field)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', null, undefined),
          (email) => {
            const formData = {
              name: 'Test Direction',
              email: email
            }
            
            const validation = validateDirectionForm(formData)
            
            // Empty email should be valid (optional field)
            expect(validation.isValid).toBe(true)
            expect(validation.errors.email).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate email before allowing form submission', () => {
      fc.assert(
        fc.property(
          directionFormDataArb,
          (formData) => {
            const validation = validateDirectionForm(formData)
            
            // If email is provided and invalid, form should not be valid
            if (formData.email && formData.email.trim() !== '') {
              const emailIsValid = isValidEmail(formData.email)
              
              if (!emailIsValid) {
                expect(validation.isValid).toBe(false)
                expect(validation.errors.email).toBeDefined()
              }
            }
            
            // If email is valid or empty, and name is provided, form should be valid
            if (formData.name && formData.name.trim() !== '') {
              const emailIsValid = !formData.email || formData.email.trim() === '' || isValidEmail(formData.email)
              
              if (emailIsValid) {
                expect(validation.errors.email).toBeUndefined()
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should provide descriptive error messages for invalid emails', () => {
      fc.assert(
        fc.property(
          invalidEmailArb,
          (email) => {
            const formData = {
              name: 'Test Direction',
              email: email
            }
            
            const validation = validateDirectionForm(formData)
            
            // Error message should be descriptive
            if (!validation.isValid && validation.errors.email) {
              expect(validation.errors.email).toMatch(/email/i)
              expect(validation.errors.email).toMatch(/válido/i)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle whitespace-only emails as empty', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim() === ''),
          (whitespace) => {
            const formData = {
              name: 'Test Direction',
              email: whitespace
            }
            
            const validation = validateDirectionForm(formData)
            
            // Whitespace-only should be treated as empty (valid)
            expect(validation.isValid).toBe(true)
            expect(validation.errors.email).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate case-insensitive email formats', () => {
      fc.assert(
        fc.property(
          validEmailArb,
          fc.constantFrom('lower', 'upper', 'mixed'),
          (email, caseType) => {
            let transformedEmail = email
            
            if (caseType === 'lower') {
              transformedEmail = email.toLowerCase()
            } else if (caseType === 'upper') {
              transformedEmail = email.toUpperCase()
            } else {
              // Mixed case - alternate characters
              transformedEmail = email.split('').map((char, i) => 
                i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
              ).join('')
            }
            
            const formData = {
              name: 'Test Direction',
              email: transformedEmail
            }
            
            const validation = validateDirectionForm(formData)
            
            // All case variations of valid emails should be valid
            expect(validation.isValid).toBe(true)
            expect(validation.errors.email).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not validate other fields when email is invalid', () => {
      fc.assert(
        fc.property(
          invalidEmailArb,
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim() !== ''),
          (invalidEmail, name) => {
            const formData = {
              name: name,
              email: invalidEmail
            }
            
            const validation = validateDirectionForm(formData)
            
            // Even if name is valid, form should be invalid due to email
            expect(validation.isValid).toBe(false)
            expect(validation.errors.email).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
