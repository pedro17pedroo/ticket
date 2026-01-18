# Implementation Plan: Database Recovery System

## Overview

Este plano implementa um sistema completo de recuperação e proteção da base de dados de desenvolvimento. O sistema fornece ferramentas CLI para backup, restauração, análise de migrações e proteção contra perda de dados.

## Tasks

- [ ] 1. Setup project structure and core utilities
  - Create directory `backend/src/recovery/` for recovery system
  - Create configuration file `backend/src/config/recovery.js`
  - Setup CLI framework using Commander.js
  - Create utility functions for database connection
  - _Requirements: All_

- [ ] 2. Implement Database Analyzer
  - [ ] 2.1 Create DatabaseAnalyzer class
    - Implement `listTables()` method to query PostgreSQL tables
    - Implement `listExecutedMigrations()` to query SequelizeMeta
    - Implement `listAvailableMigrations()` to scan migration directories
    - Implement `findPendingMigrations()` to compute set difference
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.2 Write property test for missing table detection
    - **Property 1: Missing Table Detection**
    - **Validates: Requirements 1.1**

  - [ ] 2.3 Write property test for pending migration detection
    - **Property 12: Pending Migration Detection**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ] 2.4 Implement `analyzeDatabaseState()` method
    - Combine all analysis methods
    - Detect missing tables and inconsistencies
    - Return comprehensive DatabaseState object
    - _Requirements: 1.1, 2.4_

  - [ ] 2.5 Implement `generateStatusReport()` method
    - Format analysis results into readable report
    - Highlight issues with severity levels
    - Include table count, migration status
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 2.6 Write property test for status report completeness
    - **Property 11: Status Report Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 3. Implement Backup Service
  - [ ] 3.1 Create BackupService class
    - Implement `createBackup(reason)` using pg_dump
    - Generate backup filename with timestamp
    - Save to `backend/backups/` directory
    - _Requirements: 5.1_

  - [ ] 3.2 Write property test for backup timestamp uniqueness
    - **Property 9: Backup Timestamp Uniqueness**
    - **Validates: Requirements 5.1**

  - [ ] 3.3 Implement `verifyBackup(backupPath)` method
    - Check if backup file exists and is readable
    - Verify backup file is not corrupted
    - Return validation result
    - _Requirements: 5.2_

  - [ ] 3.4 Write property test for backup and restore round trip
    - **Property 2: Backup and Restore Round Trip**
    - **Validates: Requirements 1.2, 5.2**

  - [ ] 3.5 Implement `restoreBackup(backupPath)` method
    - Validate backup file before restoration
    - Use pg_restore or psql to restore
    - Verify restoration success
    - _Requirements: 1.2, 1.3_

  - [ ] 3.6 Implement `listBackups()` method
    - Scan backup directory
    - Parse backup filenames for metadata
    - Sort by creation date
    - _Requirements: 5.3_

  - [ ] 3.7 Implement `cleanOldBackups()` method
    - Keep only 5 most recent backups
    - Remove older backups automatically
    - _Requirements: 5.3_

  - [ ] 3.8 Write property test for backup rotation
    - **Property 7: Backup Rotation**
    - **Validates: Requirements 5.3**

  - [ ] 3.9 Write unit tests for backup service
    - Test backup creation with valid database
    - Test backup verification with corrupted file
    - Test restoration with valid backup
    - Test error handling for missing backup file
    - _Requirements: 1.2, 1.4, 5.2, 5.4_

- [ ] 4. Checkpoint - Verify backup and analysis functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Migration Manager
  - [ ] 5.1 Create MigrationManager class
    - Implement `executeMigration(migration)` method
    - Check if migration already executed (SequelizeMeta)
    - Execute SQL or JavaScript migration file
    - Handle both .sql, .js, and .cjs files
    - _Requirements: 3.2, 3.4_

  - [ ] 5.2 Write property test for migration registration
    - **Property 4: Migration Registration**
    - **Validates: Requirements 3.4**

  - [ ] 5.3 Implement backup-before-migration logic
    - Call BackupService.createBackup() before migration
    - Store backup path in migration result
    - _Requirements: 3.1_

  - [ ] 5.4 Implement automatic rollback on failure
    - Catch migration errors
    - Restore from pre-migration backup
    - Report error with details
    - _Requirements: 3.3_

  - [ ] 5.5 Write property test for backup before migration
    - **Property 3: Backup Before Migration**
    - **Validates: Requirements 3.1, 3.3**

  - [ ] 5.6 Implement `recordMigration(migrationName)` method
    - Insert migration name into SequelizeMeta
    - Handle duplicate entries gracefully
    - _Requirements: 3.4_

  - [ ] 5.7 Implement `executePendingMigrations(dryRun)` method
    - Get pending migrations from DatabaseAnalyzer
    - Sort by timestamp (chronological order)
    - Execute each migration with backup
    - Support dry-run mode for testing
    - _Requirements: 2.4, 3.5_

  - [ ] 5.8 Write property test for migration order consistency
    - **Property 6: Migration Order Consistency**
    - **Validates: Requirements 2.4**

  - [ ] 5.9 Implement `validateMigrationOrder()` method
    - Check for timestamp conflicts
    - Detect dependency issues
    - Return validation result with warnings
    - _Requirements: 2.4_

  - [ ] 5.10 Write property test for failed backup blocks operation
    - **Property 10: Failed Backup Blocks Operation**
    - **Validates: Requirements 5.4**

  - [ ] 5.11 Write unit tests for migration manager
    - Test migration execution with valid SQL
    - Test migration execution with valid JavaScript
    - Test rollback on migration failure
    - Test duplicate migration handling
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 6. Implement Safety Guard
  - [ ] 6.1 Create SafetyGuard class
    - Implement `isTestEnvironment()` method
    - Check NODE_ENV and other indicators
    - _Requirements: 4.2, 4.3_

  - [ ] 6.2 Implement `checkOperation(operation, context)` method
    - Define dangerous operations list
    - Check if operation requires confirmation
    - Check if operation should be blocked
    - Return SafetyCheck result
    - _Requirements: 4.1, 4.4_

  - [ ] 6.3 Write property test for test environment isolation
    - **Property 5: Test Environment Isolation**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ] 6.4 Implement `requestConfirmation(message)` method
    - Display warning message to user
    - Prompt for yes/no confirmation
    - Return user's choice
    - _Requirements: 4.1_

  - [ ] 6.5 Write property test for dangerous operation confirmation
    - **Property 8: Dangerous Operation Confirmation**
    - **Validates: Requirements 4.1**

  - [ ] 6.6 Implement `blockOperation(reason)` method
    - Throw SafetyError with reason
    - Log blocked operation attempt
    - _Requirements: 4.4_

  - [ ] 6.7 Write unit tests for safety guard
    - Test test environment detection
    - Test dangerous operation blocking
    - Test confirmation prompts
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Checkpoint - Verify migration and safety functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement CLI commands
  - [ ] 8.1 Create main CLI entry point `backend/src/recovery/cli.js`
    - Setup Commander.js program
    - Define command structure
    - Add global options (--verbose, --dry-run)
    - _Requirements: All_

  - [ ] 8.2 Implement `db:status` command
    - Call DatabaseAnalyzer.generateStatusReport()
    - Display formatted report to console
    - Exit with appropriate code
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 8.3 Implement `db:backup` command
    - Accept optional reason parameter
    - Call BackupService.createBackup()
    - Display backup path and size
    - _Requirements: 5.1, 5.2_

  - [ ] 8.4 Implement `db:restore` command
    - Accept backup file path parameter
    - Request confirmation from user
    - Call BackupService.restoreBackup()
    - Display restoration result
    - _Requirements: 1.2, 1.3, 1.4, 4.1_

  - [ ] 8.5 Implement `db:migrate` command
    - Support --dry-run flag
    - Call MigrationManager.executePendingMigrations()
    - Display migration progress
    - Show summary of executed migrations
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 8.6 Implement `db:recover` command
    - Combine restore + migrate operations
    - Accept optional backup file parameter
    - Use most recent backup if not specified
    - Display full recovery progress
    - _Requirements: 1.1, 1.2, 1.3, 2.3, 3.5_

  - [ ] 8.7 Write integration tests for CLI commands
    - Test db:status command output
    - Test db:backup creates valid backup
    - Test db:restore with valid backup
    - Test db:migrate executes pending migrations
    - Test db:recover full workflow
    - _Requirements: All_

- [ ] 9. Add npm scripts to package.json
  - Add `"db:status": "node backend/src/recovery/cli.js status"`
  - Add `"db:backup": "node backend/src/recovery/cli.js backup"`
  - Add `"db:restore": "node backend/src/recovery/cli.js restore"`
  - Add `"db:migrate": "node backend/src/recovery/cli.js migrate"`
  - Add `"db:recover": "node backend/src/recovery/cli.js recover"`
  - _Requirements: All_

- [ ] 10. Update test configuration to prevent development database access
  - [ ] 10.1 Modify test setup files
    - Add SafetyGuard check in test setup
    - Block access to development database
    - Ensure tests use SQLite or separate test database
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ] 10.2 Update `.env.test` configuration
    - Verify test database configuration
    - Add safety checks for database name
    - Document test database setup
    - _Requirements: 4.2_

  - [ ] 10.3 Write tests to verify test isolation
    - Test that tests cannot access development database
    - Test that SafetyGuard blocks dangerous operations in tests
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 11. Create documentation
  - [ ] 11.1 Create `backend/docs/database-recovery.md`
    - Document all CLI commands with examples
    - Explain backup and restore procedures
    - Document migration workflow
    - Include troubleshooting guide
    - _Requirements: All_

  - [ ] 11.2 Update main README.md
    - Add section on database recovery
    - Link to detailed documentation
    - Add quick start examples
    - _Requirements: All_

- [ ] 12. Final checkpoint - Complete system verification
  - Run all tests (unit + property + integration)
  - Test full recovery workflow manually
  - Verify backup rotation works correctly
  - Verify safety guards prevent dangerous operations
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The system uses JavaScript (Node.js) as the implementation language
- All database operations use PostgreSQL via Sequelize
- Backups use native PostgreSQL tools (pg_dump/pg_restore)
