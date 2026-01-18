# Implementation Plan: Organizational Email Routing

## Overview

This implementation plan breaks down the organizational email routing feature into discrete, manageable tasks. The approach follows a bottom-up strategy: database changes first, then backend services, API endpoints, and finally frontend components. Each task builds incrementally on previous work, with testing integrated throughout.

## Tasks

- [x] 1. Database Migration and Model Updates
  - Create migration to add email columns to directions and sections tables
  - Add email validation constraints and indexes
  - Update Direction and Section Sequelize models with email field
  - _Requirements: 1.1, 2.1, 6.1, 6.2, 6.3, 6.4_

- [x] 1.1 Write property test for email field validation
  - **Property 1: Email Format Validation**
  - **Validates: Requirements 1.1, 1.4, 2.1, 2.4**

- [x] 1.2 Write property test for null email handling
  - **Property 4: Null Email Acceptance**
  - **Validates: Requirements 1.5, 2.5, 3.4**

- [x] 1.3 Write property test for migration data preservation
  - **Property 10: Backward Compatibility (partial)**
  - **Validates: Requirements 6.5**

- [x] 2. Email Validation Service
  - [x] 2.1 Create emailValidationService.js
    - Implement validateEmailUniqueness method
    - Query Directions, Departments, and Sections for duplicate emails
    - Handle case-insensitive comparison
    - Support exclude parameter for updates
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.2 Write property test for email uniqueness validation
  - **Property 2: Email Uniqueness Across Organization**
  - **Validates: Requirements 3.1, 3.2**

- [x] 2.3 Write property test for case insensitivity
  - **Property 3: Email Case Insensitivity**
  - **Validates: Requirements 3.1**

- [x] 2.4 Write property test for update idempotence
  - **Property 7: Email Update Idempotence**
  - **Validates: Requirements 3.3**

- [x] 3. Email Router Service
  - [x] 3.1 Create emailRouterService.js
    - Implement findOrganizationalUnitByEmail method
    - Search Sections, Departments, and Directions in order
    - Return unit type and object
    - Handle no match scenario
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 3.2 Write property test for routing determinism
  - **Property 5: Email Routing Determinism**
  - **Validates: Requirements 5.1, 5.2**

- [x] 3.3 Write unit tests for email router edge cases
  - Test no match found scenario
  - Test multiple matches scenario (error case)
  - _Requirements: 5.2, 5.3_

- [x] 4. Update Email Inbox Service
  - [x] 4.1 Modify createTicketFromEmail method
    - Extract destination email from emailData.to
    - Use emailRouterService to find organizational unit
    - Set directionId, departmentId, or sectionId based on match
    - Handle no match scenario (unassigned or default queue)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.4_

- [x] 4.2 Write property test for ticket assignment consistency
  - **Property 6: Ticket Assignment Consistency**
  - **Validates: Requirements 4.1, 4.2, 4.3, 5.4**

- [x] 4.3 Write property tests for email parsing
  - Test sender extraction (Property 4.4)
  - Test subject extraction (Property 4.5)
  - Test body extraction (Property 4.6)
  - Test attachment preservation (Property 4.7)
  - **Validates: Requirements 4.4, 4.5, 4.6, 4.7**

- [x] 5. Checkpoint - Backend Core Complete
  - Ensure all backend tests pass
  - Verify email validation service works correctly
  - Verify email router service finds organizational units
  - Verify email inbox service creates tickets with correct assignments
  - Ask the user if questions arise

- [x] 6. Update Direction API Controller
  - [x] 6.1 Modify directionController.js create method
    - Accept email parameter from request body
    - Validate email uniqueness using emailValidationService
    - Return appropriate error if duplicate
    - Save Direction with email
    - _Requirements: 7.2_

  - [x] 6.2 Modify directionController.js update method
    - Accept email parameter from request body
    - Validate email uniqueness (exclude current direction)
    - Return appropriate error if duplicate
    - Update Direction with email
    - _Requirements: 7.3_

  - [x] 6.3 Modify directionController.js list/get methods
    - Include email field in response
    - _Requirements: 7.1_

- [x] 6.4 Write property test for API response completeness
  - **Property 8: API Response Completeness (Directions)**
  - **Validates: Requirements 7.1**

- [x] 6.5 Write integration tests for Direction API
  - Test create with valid email
  - Test create with duplicate email (should fail)
  - Test update with valid email
  - Test update with duplicate email (should fail)
  - Test update with same email (should succeed)
  - _Requirements: 7.2, 7.3_

- [x] 7. Update Section API Controller
  - [x] 7.1 Modify sectionController.js create method
    - Accept email parameter from request body
    - Validate email uniqueness using emailValidationService
    - Return appropriate error if duplicate
    - Save Section with email
    - _Requirements: 7.5_

  - [x] 7.2 Modify sectionController.js update method
    - Accept email parameter from request body
    - Validate email uniqueness (exclude current section)
    - Return appropriate error if duplicate
    - Update Section with email
    - _Requirements: 7.6_

  - [x] 7.3 Modify sectionController.js list/get methods
    - Include email field in response
    - _Requirements: 7.4_

- [x] 7.4 Write property test for API response completeness
  - **Property 8: API Response Completeness (Sections)**
  - **Validates: Requirements 7.4**

- [x] 7.5 Write integration tests for Section API
  - Test create with valid email
  - Test create with duplicate email (should fail)
  - Test update with valid email
  - Test update with duplicate email (should fail)
  - Test update with same email (should succeed)
  - _Requirements: 7.5, 7.6_

- [x] 8. Checkpoint - Backend APIs Complete
  - Ensure all API tests pass
  - Verify Direction API handles email correctly
  - Verify Section API handles email correctly
  - Verify uniqueness validation works across all entity types
  - Ask the user if questions arise

- [x] 9. Update Direction Frontend Forms
  - [x] 9.1 Modify Directions.jsx create form
    - Add email Form.Item with validation rules
    - Add email icon and placeholder text
    - Handle validation errors from API
    - _Requirements: 8.1, 8.5, 8.6_

  - [x] 9.2 Modify Directions.jsx edit form
    - Display current email value in form
    - Allow modification of email
    - Handle validation errors from API
    - _Requirements: 8.2, 8.5, 8.6_

  - [x] 9.3 Modify Directions.jsx list table
    - Add email column to table
    - Display email or placeholder for null values
    - _Requirements: 9.1, 9.3, 9.4_

- [x] 9.4 Write property test for frontend validation
  - **Property 9: Frontend Form Validation (Directions)**
  - **Validates: Requirements 8.5**

- [x] 10. Update Section Frontend Forms
  - [x] 10.1 Modify Sections.jsx create form
    - Add email Form.Item with validation rules
    - Add email icon and placeholder text
    - Handle validation errors from API
    - _Requirements: 8.3, 8.5, 8.6_

  - [x] 10.2 Modify Sections.jsx edit form
    - Display current email value in form
    - Allow modification of email
    - Handle validation errors from API
    - _Requirements: 8.4, 8.5, 8.6_

  - [x] 10.3 Modify Sections.jsx list table
    - Add email column to table
    - Display email or placeholder for null values
    - _Requirements: 9.2, 9.3, 9.4_

- [x] 10.4 Write property test for frontend validation
  - **Property 9: Frontend Form Validation (Sections)**
  - **Validates: Requirements 8.5**

- [x] 11. Checkpoint - Frontend Complete
  - Ensure all frontend components render correctly
  - Verify forms display email fields
  - Verify validation works on frontend
  - Verify lists display email column
  - Ask the user if questions arise

- [x] 12. End-to-End Integration Testing
  - [x] 12.1 Write integration test for Direction email-to-ticket flow
    - Create Direction with email
    - Simulate email received at that address
    - Verify ticket created with directionId
    - **Validates: Requirements 4.1, 10.1, 10.2**

  - [x] 12.2 Write integration test for Department email-to-ticket flow
    - Verify existing Department email functionality still works
    - **Property 10: Backward Compatibility**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [x] 12.3 Write integration test for Section email-to-ticket flow
    - Create Section with email
    - Simulate email received at that address
    - Verify ticket created with sectionId
    - **Validates: Requirements 4.3, 10.1, 10.2**

  - [x] 12.4 Write integration test for cross-entity uniqueness
    - Create Direction with email
    - Attempt to create Department with same email (should fail)
    - Attempt to create Section with same email (should fail)
    - **Validates: Requirements 3.1, 10.4**

- [x] 13. Final Checkpoint - Complete System Verification
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Verify migration can be run safely
  - Verify backward compatibility with existing Department emails
  - Ask the user if ready for deployment

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Backend tasks completed before frontend to ensure API stability
- Migration should be tested in staging environment before production deployment
