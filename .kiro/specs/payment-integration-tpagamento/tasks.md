# Implementation Plan: Integração TPagamento

## Overview

Este plano implementa a integração completa do gateway de pagamento TPagamento, incluindo onboarding com pagamento, gestão de subscrições e processamento de webhooks.

## Tasks

- [ ] 1. Setup environment and database
  - [ ] 1.1 Add TPagamento environment variables
    - Add TPAGAMENTO_API_URL, TPAGAMENTO_API_KEY, TPAGAMENTO_WEBHOOK_SECRET to backend/.env
    - _Requirements: 1.1_
  
  - [ ] 1.2 Create payment_transactions table migration
    - Create migration for payment_transactions with all fields
    - Add indexes for organizationId, subscriptionId, status, createdAt
    - _Requirements: 9.1, 9.4_
  
  - [ ] 1.3 Create payment_receipts table migration
    - Create migration for payment_receipts with all fields
    - Add index for transactionId
    - _Requirements: 9.2, 9.4_
  
  - [ ] 1.4 Create Sequelize models
    - Create PaymentTransaction model
    - Create PaymentReceipt model
    - Define associations with Organization and Subscription
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 2. Implement TPagamento Service
  - [ ] 2.1 Create TPagamento service class
    - Create backend/src/services/tpagamentoService.js
    - Implement axios client with API key authentication
    - Implement generateReferenceCode() method
    - _Requirements: 1.2, 1.3_
  
  - [ ] 2.2 Implement E-Kwanza payment methods
    - Implement createEKwanzaPayment() method
    - Implement checkEKwanzaStatus() method
    - Add error handling and logging
    - _Requirements: 1.3, 1.5_
  
  - [ ] 2.3 Implement Multicaixa Express (GPO) payment methods
    - Implement createMulticaixaExpressPayment() method
    - Add error handling and logging
    - _Requirements: 1.3, 1.5_
  
  - [ ] 2.4 Implement Referência Multicaixa (REF) payment methods
    - Implement createReferenciaMulticaixaPayment() method
    - Add error handling and logging
    - _Requirements: 1.3, 1.5_
  
  - [ ] 2.5 Implement unified payment methods
    - Implement createPayment() method (unified interface)
    - Implement getPaymentStatus() method (unified interface)
    - Implement checkPaymentStatus() for GPO/REF
    - _Requirements: 1.3, 1.5_

- [ ] 3. Implement Payment Service
  - [ ] 3.1 Create Payment service class
    - Create backend/src/services/paymentService.js
    - Implement createPaymentTransaction() method
    - Store transaction in database with TPagamento response
    - _Requirements: 2.6, 9.1, 9.5_
  
  - [ ] 3.2 Implement payment status checking
    - Implement checkAndUpdatePaymentStatus() method
    - Query TPagamento API for status
    - Update transaction status in database
    - _Requirements: 2.7, 9.1_
  
  - [ ] 3.3 Implement payment processing
    - Implement processSuccessfulPayment() method
    - Activate or renew subscription when payment is confirmed
    - Send confirmation email
    - _Requirements: 2.8, 6.5_
  
  - [ ] 3.4 Implement receipt generation
    - Implement generateReceipt() method
    - Generate PDF with transaction details
    - Store receipt in database and file system
    - _Requirements: 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 3.5 Implement payment history
    - Implement getPaymentHistory() method
    - Support filtering by date, status, method
    - Support pagination
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 3.6 Implement prorated calculation
    - Implement calculateProratedAmount() method
    - Calculate amount for plan upgrades
    - _Requirements: 5.3_
  
  - [ ] 3.7 Implement payment reminders
    - Implement sendPaymentReminders() method
    - Send emails 7, 3, and 1 days before expiration
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Implement Payment Controller
  - [ ] 4.1 Create payment controller
    - Create backend/src/modules/payments/paymentController.js
    - Implement POST /api/payments/create endpoint
    - Validate request data
    - Call PaymentService to create transaction
    - Return payment instructions
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ] 4.2 Implement payment status endpoint
    - Implement GET /api/payments/:id/status endpoint
    - Call PaymentService to check status
    - Return current status
    - _Requirements: 2.7_
  
  - [ ] 4.3 Implement receipt endpoint
    - Implement GET /api/payments/:id/receipt endpoint
    - Call PaymentService to get or generate receipt
    - Return PDF URL
    - _Requirements: 4.4, 4.5_
  
  - [ ] 4.4 Implement payment history endpoint
    - Implement GET /api/payments/history endpoint
    - Call PaymentService with filters
    - Return paginated results
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 4.5 Create payment routes
    - Create backend/src/modules/payments/paymentRoutes.js
    - Add all payment endpoints
    - Apply authentication middleware
    - Apply authorization middleware (org admin only)
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 4.1, 4.4_

- [ ] 5. Implement Webhook Handler
  - [ ] 5.1 Create webhook controller
    - Create webhook endpoint POST /api/webhooks/tpagamento
    - Validate webhook signature using TPAGAMENTO_WEBHOOK_SECRET
    - Parse webhook payload
    - _Requirements: 7.1, 7.2, 7.6_
  
  - [ ] 5.2 Implement webhook processing
    - Handle payment.completed event
    - Handle payment.failed event
    - Update transaction status
    - Activate/renew subscription
    - Send confirmation email
    - _Requirements: 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 5.3 Add webhook routes
    - Add webhook route to backend/src/app.js
    - Ensure webhook endpoint is public (no auth)
    - _Requirements: 7.1, 7.7_

- [ ] 6. Implement Subscription Management Endpoints
  - [ ] 6.1 Implement subscription renewal endpoint
    - Create POST /api/subscriptions/renew endpoint
    - Calculate renewal amount
    - Create payment transaction
    - Return payment instructions
    - _Requirements: 3.4, 6.1, 6.2, 6.3_
  
  - [ ] 6.2 Implement plan upgrade endpoint
    - Create POST /api/subscriptions/upgrade endpoint
    - Calculate prorated amount
    - Create payment transaction
    - Return payment instructions
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 6.3 Implement plan downgrade endpoint
    - Create POST /api/subscriptions/downgrade endpoint
    - Schedule downgrade for end of billing period
    - Send confirmation email
    - _Requirements: 5.7_

- [ ] 7. Implement Frontend - Payment Step (Portal SaaS)
  - [ ] 7.1 Create PaymentMethodSelector component
    - Create portalSaaS/src/components/payments/PaymentMethodSelector.jsx
    - Display three payment methods with icons
    - Handle method selection
    - _Requirements: 2.4_
  
  - [ ] 7.2 Create PaymentInstructions component
    - Create portalSaaS/src/components/payments/PaymentInstructions.jsx
    - Display method-specific instructions
    - Show payment code/reference
    - Display expiration countdown
    - Poll payment status every 10 seconds
    - _Requirements: 2.6, 2.7_
  
  - [ ] 7.3 Create PaymentStep component
    - Create portalSaaS/src/components/onboarding/PaymentStep.jsx
    - Display plan details and amount
    - Show "Skip Payment" button if plan has trial
    - Integrate PaymentMethodSelector
    - Integrate PaymentInstructions
    - Handle payment confirmation
    - Handle payment failure/expiration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [ ] 7.4 Integrate PaymentStep into onboarding flow
    - Add PaymentStep to onboarding wizard
    - Add logic to check if plan has trial
    - Handle skip payment flow
    - Handle payment completion flow
    - _Requirements: 2.1, 2.2, 2.3, 2.8_

- [ ] 8. Implement Frontend - Subscription Management (Portal Organização)
  - [ ] 8.1 Create Subscription page
    - Create portalOrganizaçãoTenant/src/pages/Subscription.jsx
    - Display current subscription details
    - Show next billing date and amount
    - Display available plans
    - Add "Renovar" button
    - Add "Upgrade/Downgrade" buttons
    - _Requirements: 3.1, 3.2, 5.1_
  
  - [ ] 8.2 Create PaymentHistory component
    - Create portalOrganizaçãoTenant/src/components/PaymentHistory.jsx
    - Display payment transactions table
    - Implement filters (date, status, method)
    - Add pagination
    - Add "Download Recibo" button for each payment
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 8.3 Create ReceiptViewer component
    - Create portalOrganizaçãoTenant/src/components/ReceiptViewer.jsx
    - Display receipt details
    - Add download PDF button
    - Add print button
    - Add email receipt button
    - _Requirements: 4.4, 4.5_
  
  - [ ] 8.4 Integrate payment flow into Subscription page
    - Add payment modal for renewal
    - Add payment modal for upgrade
    - Integrate PaymentMethodSelector
    - Integrate PaymentInstructions
    - Handle payment confirmation
    - _Requirements: 3.4, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Implement Error Handling and Notifications
  - [ ] 9.1 Add error handling for payment failures
    - Display user-friendly error messages
    - Allow retry for failed payments
    - Handle API unavailability
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 9.2 Implement payment expiration handling
    - Notify user when payment expires
    - Offer to create new payment
    - _Requirements: 2.9, 8.3_
  
  - [ ] 9.3 Add email notifications
    - Send payment confirmation emails
    - Send payment reminder emails
    - Send payment failure alerts to admins
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.5_
  
  - [ ] 9.4 Implement logging and monitoring
    - Log all payment API calls
    - Log all webhook events
    - Log payment errors with context
    - _Requirements: 1.5, 7.6, 8.4_

- [ ] 10. Implement Subscription Lifecycle Management
  - [ ] 10.1 Implement subscription expiration check
    - Create scheduled job to check expiring subscriptions
    - Send reminder emails
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 10.2 Implement subscription suspension
    - Suspend organizations with expired subscriptions
    - Set to read-only mode
    - Allow 15-day grace period
    - _Requirements: 6.5, 6.6_
  
  - [ ] 10.3 Implement subscription reactivation
    - Reactivate subscription when payment is received
    - Send reactivation email
    - _Requirements: 6.7_
  
  - [ ] 10.4 Implement subscription deactivation
    - Deactivate organizations after grace period
    - Send final notification
    - _Requirements: 6.8_

- [ ] 11. Testing and Validation
  - [ ] 11.1 Test TPagamento service
    - Test E-Kwanza payment creation and status check
    - Test GPO payment creation and status check
    - Test REF payment creation and status check
    - Test error handling
  
  - [ ] 11.2 Test payment flow end-to-end
    - Test onboarding with payment
    - Test onboarding with trial (skip payment)
    - Test subscription renewal
    - Test plan upgrade
    - Test plan downgrade
  
  - [ ] 11.3 Test webhook processing
    - Test payment.completed webhook
    - Test payment.failed webhook
    - Test webhook signature validation
  
  - [ ] 11.4 Test receipt generation
    - Test PDF generation
    - Test receipt download
    - Test receipt email

- [ ] 12. Documentation and Deployment
  - [ ] 12.1 Update API documentation
    - Document all payment endpoints
    - Document webhook endpoint
    - Include request/response examples
  
  - [ ] 12.2 Create user documentation
    - Document payment process for users
    - Document subscription management
    - Create FAQ for common payment issues
  
  - [ ] 12.3 Deploy to production
    - Update environment variables
    - Run database migrations
    - Deploy backend changes
    - Deploy frontend changes
    - Configure webhook URL in TPagamento dashboard

## Notes

- All payment amounts are in AOA (Angolan Kwanza)
- Payment methods: E-Kwanza (mobile), GPO (instant), REF (bank reference)
- Trial period allows skipping payment during onboarding
- Receipts are generated as PDF and stored for 5 years
- Webhook signature validation is critical for security
- Payment status polling interval: 10 seconds
- Grace period for expired subscriptions: 15 days
- Payment reminders: 7, 3, and 1 days before expiration

