# Driver Offers Feature Implementation

## Overview
This document describes the implementation of the Driver Offers feature (Sprint 2) for the UbexGo platform. This feature allows drivers to create ride offers that passengers can view and book.

## Database Schema

### Tables Created

#### 1. `driver_offers`
Main table for storing driver ride offers.

**Columns:**
- `id` (UUID, PK) - Unique offer identifier
- `user_id` (INTEGER, FK → users) - Driver who created the offer
- `vehicle_id` (UUID, FK → driver_vehicles) - Vehicle for the ride
- `from_text` (TEXT) - Starting location (text)
- `from_lat` (DECIMAL) - Starting latitude (optional)
- `from_lng` (DECIMAL) - Starting longitude (optional)
- `to_text` (TEXT) - Destination location (text)
- `to_lat` (DECIMAL) - Destination latitude (optional)
- `to_lng` (DECIMAL) - Destination longitude (optional)
- `start_at` (TIMESTAMPTZ) - Departure time
- `seats_total` (INTEGER) - Total available seats (1-8)
- `seats_free` (INTEGER) - Currently available seats
- `price_per_seat` (DECIMAL(10,2)) - Price per seat
- `currency` (CHAR(3)) - Currency code (default: UZS)
- `note` (TEXT) - Optional driver note
- `status` (ENUM) - Offer status (see below)
- `rejection_reason` (TEXT) - Reason if rejected
- `reviewed_by` (UUID, FK → admin_users) - Admin who reviewed
- `reviewed_at` (TIMESTAMPTZ) - Review timestamp
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Status Values:**
- `draft` - Initial state, not submitted
- `pending_review` - Submitted for admin review
- `approved` - Approved by admin, ready to publish
- `published` - Live and visible to passengers
- `rejected` - Rejected by admin
- `archived` - Archived by driver

**Indexes:**
- `(user_id, status, start_at)` - Main query index
- `(vehicle_id)` - Vehicle lookup
- `(status)` - Status filtering
- `(start_at)` - Time-based queries
- `(from_text)` - Origin search
- `(to_text)` - Destination search

#### 2. `driver_offer_stops`
Optional table for intermediate stops (future feature).

**Columns:**
- `id` (UUID, PK)
- `offer_id` (UUID, FK → driver_offers)
- `order_no` (INTEGER) - Stop sequence number
- `label_text` (TEXT) - Stop description
- `lat` (DECIMAL) - Latitude (optional)
- `lng` (DECIMAL) - Longitude (optional)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `(offer_id, order_no)` - Unique constraint

## API Endpoints

### Driver API (`/api/driver/offers`)

#### GET `/api/driver/offers`
Get driver's own offers with filters.

**Query Parameters:**
- `status` - Filter by status (comma-separated)
- `from` - Start date filter
- `to` - End date filter

**Response:**
```json
{
  "success": true,
  "offers": [...]
}
```

#### GET `/api/driver/offers/:id`
Get specific offer details (owner only).

#### POST `/api/driver/offers`
Create new offer (draft status).

**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "from_text": "Farg'ona, Marg'ilon ko'ch.",
  "to_text": "Toshkent, Yakkasaroy",
  "start_at": "2025-12-03T09:30:00Z",
  "seats_total": 3,
  "price_per_seat": 60000,
  "currency": "UZS",
  "note": "Chekmayman, 1 ta kichik sumka."
}
```

**Validations:**
- `start_at` must be at least 30 minutes in the future
- `seats_total` must be between 1 and 8
- `price_per_seat` must be ≥ 5000 UZS
- `vehicle_id` must belong to the driver

#### PATCH `/api/driver/offers/:id`
Update offer.

**Edit Restrictions:**
- Draft/Rejected/Archived: Full edit allowed
- Approved/Published: Only `price_per_seat` (decrease only), `note`, and `seats_total` allowed

#### POST `/api/driver/offers/:id/submit`
Submit offer for review (draft → pending_review).

#### POST `/api/driver/offers/:id/publish`
Publish approved offer (approved → published).

#### POST `/api/driver/offers/:id/archive`
Archive offer.

#### DELETE `/api/driver/offers/:id`
Delete offer (only draft, rejected, or archived).

**Rate Limiting:** 20 requests per 15 minutes for create/submit/publish actions.

### Admin API (`/api/admin/driver-offers`)

#### GET `/api/admin/driver-offers`
Get all offers with filters (admin view).

**Query Parameters:**
- `status` - Filter by status
- `from` - Start date
- `to` - End date
- `search` - Search in from_text/to_text
- `limit` - Pagination limit (default: 50)
- `offset` - Pagination offset

#### GET `/api/admin/driver-offers/statistics`
Get moderation statistics.

**Response:**
```json
{
  "statistics": {
    "total": 100,
    "pending_review": 5,
    "approved": 10,
    "published": 50,
    "rejected": 20,
    "archived": 15
  }
}
```

#### GET `/api/admin/driver-offers/:id`
Get offer details with full driver/vehicle information.

#### PATCH `/api/admin/driver-offers/:id/approve`
Approve offer (pending_review → approved or published).

**Request Body:**
```json
{
  "auto_publish": true  // Optional: auto-publish after approval
}
```

#### PATCH `/api/admin/driver-offers/:id/reject`
Reject offer (pending_review → rejected).

**Request Body:**
```json
{
  "reason": "Rejection reason (required)"
}
```

### Public API (`/api/public/driver-offers`)

#### GET `/api/public/driver-offers`
Get published offers (passenger view).

**Query Parameters:**
- `from_text` - Search origin
- `to_text` - Search destination
- `date` - Filter by date (YYYY-MM-DD)
- `limit` - Results limit (default: 20)
- `offset` - Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "from_text": "Farg'ona",
      "to_text": "Toshkent",
      "start_at": "2025-12-03T09:30:00Z",
      "price_per_seat": 60000,
      "currency": "UZS",
      "seats_free": 3,
      "driver": {
        "name": "Jahongir",
        "rating": 0
      },
      "vehicle": {
        "make": "Chevrolet",
        "model": "Nexia",
        "color": "White",
        "license_plate": "01A123BC",
        "year": 2020
      }
    }
  ],
  "total": 1
}
```

#### GET `/api/public/driver-offers/:id`
Get offer details (published only).

## Backend Services

### DriverOfferService
Main service for driver offer operations.

**Key Methods:**
- `getUserOffers()` - Get driver's offers with filters
- `getOfferById()` - Get offer by ID with ownership check
- `createOffer()` - Create new offer with validations
- `updateOffer()` - Update offer with edit restrictions
- `submitOffer()` - Submit for review
- `publishOffer()` - Publish approved offer
- `archiveOffer()` - Archive offer
- `deleteOffer()` - Delete offer (with status check)
- `getPublicOffers()` - Get published offers for passengers

**Validations:**
- Minimum advance time: 30 minutes
- Seats range: 1-8
- Minimum price: 5000 UZS
- Vehicle ownership verification

### AdminDriverOfferService
Service for admin moderation.

**Key Methods:**
- `getOffers()` - Get all offers with filters
- `getOfferById()` - Get offer with full details
- `approveOffer()` - Approve offer (with optional auto-publish)
- `rejectOffer()` - Reject offer with reason
- `getStatistics()` - Get moderation statistics

## Security & Audit

### Security Features
1. **Ownership Verification**: All driver operations verify `user_id` matches authenticated user
2. **RBAC**: Admin endpoints require admin authentication
3. **Rate Limiting**: 20 requests per 15 minutes for offer creation/status changes
4. **PII Masking**: Sensitive data masked in audit logs
5. **Status Machine**: Strict status transitions enforced

### Audit Logging
All operations are logged with the following actions:
- `driver.offer.create`
- `driver.offer.update`
- `driver.offer.submit`
- `driver.offer.publish`
- `driver.offer.archive`
- `driver.offer.delete`
- `admin.offer.approve`
- `admin.offer.reject`

## Admin UI

### Pages Created

#### 1. Driver Offers List Page (`/driver-offers`)
**Features:**
- Statistics cards (total, pending, approved, published, rejected)
- Status filter dropdown
- Search by location
- Paginated table view
- Quick actions (View)
- Status badges with color coding

**Location:** `apps/admin/src/pages/driverOffers/DriverOffersListPage.tsx`

#### 2. Driver Offer Detail Page (`/driver-offers/:id`)
**Features:**
- Full offer details display
- Driver and vehicle information
- Approve/Reject actions (for pending_review status)
- Auto-publish toggle for approval
- Rejection modal with required reason field
- Status badge
- Rejection reason display (if rejected)
- Reviewer information

**Location:** `apps/admin/src/pages/driverOffers/DriverOfferDetailPage.tsx`

### API Client
**Location:** `apps/admin/src/api/driverOffers.ts`

**Methods:**
- `getOffers(params)` - List offers with filters
- `getStatistics()` - Get statistics
- `getOfferById(id)` - Get offer details
- `approveOffer(id, autoPublish)` - Approve offer
- `rejectOffer(id, reason)` - Reject offer

## Translations

### Uzbek Translations Added
**Location:** `driver-app-standalone/translations/uz.ts`

**Sections:**
1. `driverOffers` - Driver offers list and actions
2. `offerWizard` - Offer creation wizard (4 steps)
3. `publicOffers` - Public offers for passengers
4. `menu.myOffers` - Menu item

**Key Translations:**
- Status labels (draft, pending_review, approved, published, rejected, archived)
- Form labels and placeholders
- Action buttons
- Error messages
- Success messages

## Status Machine

```
draft
  ↓ submit
pending_review
  ↓ approve          ↓ reject
approved          rejected
  ↓ publish
published

(any status) → archived (by driver)
```

**Delete Rules:**
- Can only delete: draft, rejected, archived

**Edit Rules:**
- Draft/Rejected/Archived: Full edit
- Approved/Published: Limited edit (price decrease, note, seats)

## Migration Files

1. **20250303000001-create-driver-offers.cjs**
   - Creates `driver_offers` table
   - Creates status enum
   - Creates indexes

2. **20250303000002-create-driver-offer-stops.cjs**
   - Creates `driver_offer_stops` table
   - Creates indexes

**Location:** `apps/api/src/database/migrations/`

## Models

1. **DriverOffer.ts**
   - Sequelize model for driver_offers
   - Type definitions
   - Associations

2. **DriverOfferStop.ts**
   - Sequelize model for driver_offer_stops
   - Type definitions
   - Associations

**Location:** `apps/api/src/database/models/`

**Associations:**
- User hasMany DriverOffer
- DriverVehicle hasMany DriverOffer
- DriverOffer hasMany DriverOfferStop
- AdminUser hasMany DriverOffer (as reviewer)

## Next Steps (Future Sprints)

### Sprint 3 - Mobile UI Implementation
1. Create `OffersListScreen` for drivers
2. Create `OfferWizardScreen` (4 steps) for offer creation
3. Create `PublicOffersScreen` for passengers
4. Implement map integration for location selection
5. Add geocoding support

### Sprint 4 - Booking System
1. Create booking endpoints
2. Implement seat reservation
3. Add payment integration
4. Create booking management UI

### Sprint 5 - Advanced Features
1. Add GiST/Geo indexes for location-based search
2. Implement real-time updates (WebSocket)
3. Add rating system
4. Implement driver-passenger chat
5. Add push notifications for offer status changes

## Testing Checklist

### Backend Tests
- [ ] Create offer with valid data
- [ ] Create offer with invalid data (validations)
- [ ] Update offer (full edit for draft)
- [ ] Update offer (limited edit for published)
- [ ] Submit offer (draft → pending_review)
- [ ] Publish offer (approved → published)
- [ ] Archive offer
- [ ] Delete offer (allowed statuses)
- [ ] Delete offer (forbidden statuses) - should fail
- [ ] Admin approve offer
- [ ] Admin reject offer (with reason)
- [ ] Admin reject offer (without reason) - should fail
- [ ] Vehicle ownership check
- [ ] Status machine transitions
- [ ] Rate limiting
- [ ] Audit logging

### Admin UI Tests
- [ ] List offers with filters
- [ ] View offer details
- [ ] Approve offer
- [ ] Approve and auto-publish offer
- [ ] Reject offer with reason
- [ ] Statistics display
- [ ] Pagination
- [ ] Search functionality

### Integration Tests
- [ ] End-to-end: Create → Submit → Approve → Publish → Public List
- [ ] End-to-end: Create → Submit → Reject → Edit → Resubmit

## Performance Targets
- API response time (p95): < 400ms
- Database query time: < 100ms
- Admin UI load time: < 2s

## Monitoring Metrics
- `driver_offer_create_total` - Total offers created
- `offer_submit_total` - Total submissions
- `offer_publish_total` - Total published
- `offer_approve_total` - Total approvals
- `offer_reject_total` - Total rejections
- `4xx_errors` - Client errors
- `5xx_errors` - Server errors

## Database Migration Commands

```bash
# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:undo

# Reset database (development only)
npm run db:reset
```

## API Testing (Postman/curl)

### Create Offer
```bash
curl -X POST http://localhost:3000/api/driver/offers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "uuid",
    "from_text": "Farg'\''ona",
    "to_text": "Toshkent",
    "start_at": "2025-12-03T09:30:00Z",
    "seats_total": 3,
    "price_per_seat": 60000,
    "currency": "UZS"
  }'
```

### Submit for Review
```bash
curl -X POST http://localhost:3000/api/driver/offers/{id}/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Approve
```bash
curl -X PATCH http://localhost:3000/api/admin/driver-offers/{id}/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"auto_publish": true}'
```

### Get Public Offers
```bash
curl "http://localhost:3000/api/public/driver-offers?from_text=Farg'ona&to_text=Toshkent&date=2025-12-03"
```

## Conclusion

The Driver Offers feature has been successfully implemented with:
- ✅ Complete database schema with migrations
- ✅ Full CRUD API with validations
- ✅ Status machine with proper transitions
- ✅ Admin moderation system
- ✅ Public listing API
- ✅ Admin UI for moderation
- ✅ Security and rate limiting
- ✅ Audit logging
- ✅ Translations (Uzbek)

**Ready for:** Database migration, API testing, and admin UI deployment.

**Pending:** Mobile UI implementation (Sprint 3).

