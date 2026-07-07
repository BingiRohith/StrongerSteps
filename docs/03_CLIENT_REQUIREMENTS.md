# 03. CLIENT REQUIREMENTS SPECIFICATION (CRS)

Project: Stronger Steps
Version: 1.0
Status: VERIFIED
Last Updated: 07 July 2026

---

# 1. PROJECT OVERVIEW

Stronger Steps is a community platform designed for healthy ageing.

It is NOT just a marketing website.

It is intended to become a complete community management platform where the client manages everything from a custom Admin Dashboard.

The website must eventually allow the client to manage:

• Website content
• Programs
• Memberships
• Products
• Team
• Blogs
• Infographics
• Recipes
• Events
• Discounts
• Pricing
• Media
• Future payment workflows

The client must never need a developer for normal content updates.

Everything possible should be editable through the Admin Panel.

---

# 2. CORE ADMIN PRINCIPLE

This is the single most important project rule.

If the client should be able to change it,

IT BELONGS IN THE ADMIN PANEL.

Avoid hardcoded content wherever practical.

---

# 3. CURRENT COMPLETED MODULES

Completed

✓ Authentication
✓ Protected Admin Dashboard
✓ Blogs CMS
✓ Infographics CMS
✓ Team CMS
✓ Product CMS
✓ Product Categories
✓ Image Upload
✓ Dynamic Public Products
✓ Pricing Engine
✓ Search
✓ Filtering
✓ MongoDB Integration

---

# 4. HOMEPAGE REQUIREMENTS

Header

Replace

Join Our Community

with

Take Your First Step

The button redirects to

Membership Packages

which is fully editable from Admin.

---

Recipes

Add a new

Recipes

page to the main navigation.

Recipes will eventually become a CMS managed by Admin.

Future support:

• Categories
• Images
• Ingredients
• Instructions
• Search
• Filtering

---

Join Us

Remove the current

Join Community

content.

Replace with

Membership Packages.

---

Membership CTA

All homepage membership buttons should redirect to

Membership Details

instead of the old Join Community page.

---

# 5. WHY IT MATTERS

Current section remains conceptually the same.

Replace the current visual layout.

Create a hand illustration.

The palm represents the root.

Each finger represents one benefit.

Exactly five fingers.

Exactly five existing Why It Matters points.

The five existing content blocks should be reused.

Only the illustration changes.

---

# 6. OUR VISION

Rename

"What Stronger Years Actually Look Like"

to

"What Stronger Steps Actually Look Like"

Replace the existing cards.

Use a house illustration.

Roof:

Stronger Steps

Four pillars:

Use the existing four vision statements.

Example structure

          Roof
      Stronger Steps

 Pillar 1
 Pillar 2
 Pillar 3
 Pillar 4

Each pillar equals one existing point.

---

# 7. WHAT WE DO

Rename

Four Ways We Support Your Stronger Years

to

Four Ways We Support Your Stronger Steps

Layout becomes four equal blocks.

Use real photographs.

Each block represents

External CSR Programs

Personal Care

Social Activities

Following Our Loved Ones

Each card uses real imagery.

No illustrations.

---

# 8. MEMBERSHIP MODULE

Membership becomes a completely dynamic CMS.

Admin manages:

Membership Name

Description

Price

Discount

Duration

Benefits

Image

Display Order

Status

Featured

CTA Button

External URL

Example placeholder

https://kit.com/pricing

Public users can

Browse plans

Compare plans

Read benefits

Click Join

Future payment integration.

---

# 9. PRODUCTS MODULE

Already implemented.

Features include

Admin CRUD

Categories

Images

Pricing

Original Price

Selling Price

Discount %

Automatic calculations

Featured

Published/Draft

Search

Filters

Dynamic Public Products

Future roadmap

Inventory

Checkout

Coupons

Shipping

Orders

Payments

Stock Management

---

# 10. PROGRAMS MODULE

The current Programs page will be completely replaced.

Current content is removed.

Replace with

Monthly Event Calendar.

---

Calendar

Monthly view.

Clicking a date displays

Events for that day.

Each event contains

Title

Description

Date

Time

Location

Host

Price

Available Seats

Member Discount

Booking Button

---

Admin can manage

Create Event

Edit Event

Delete Event

Publish

Draft

Seats

Price

Discount

Host

Location

Time

Date

Status

---

User Booking Flow

User selects date.

↓

User views events.

↓

User clicks

Book Your Seat

↓

Booking Form

Name

Mobile

Email

Member?

↓

If Member

Apply membership discount configured by Admin.

↓

Payment

Card

UPI

QR

↓

Booking Success

↓

Email Confirmation

↓

SMS/Mobile Confirmation

↓

Seat Reserved

Future support

Booking history

Cancellation

Capacity tracking

Attendance

QR Check-in

---

# 11. TEAM PAGE

Current list layout replaced.

Use an organizational tree.

Reference approved by client.

Tree Structure

Roots

Founders

↓

Branches

Departments

↓

Leaves

Team Members

Team Members continue using existing CMS.

Admin can

Add

Edit

Delete

Images

Designation

Department

Display Order

Tree updates automatically.

---

# 12. KNOWLEDGE CENTER

Already implemented.

Includes

Blogs

Infographics

Search

Categories

Downloads

Preview

Future

Recipes integration.

---

# 13. WORK WITH US

Remove

Partnership Section.

Remaining careers content stays.

---

# 14. RECIPES MODULE

New CMS.

Future Admin Management

Recipe Name

Description

Category

Ingredients

Instructions

Images

Preparation Time

Cooking Time

Tags

Featured

Status

Search

Filters

Public users

Browse

Search

Filter

Read recipes.

---

# 15. ADMIN DASHBOARD

Single control center.

Client logs in using verified Admin account.

Client manages

Blogs

Infographics

Products

Team

Memberships

Programs

Recipes

Events

Pricing

Categories

Media

Dashboard should remain simple and non-technical.

---

# 16. PAYMENT ROADMAP

Future integrations

UPI

Cards

QR Payments

Payment Gateway

Invoices

Receipts

Refunds

Booking confirmation

Membership payments

Product checkout

---

# 17. COMMUNICATION

Future integrations

Email

SMS

WhatsApp

Booking confirmations

Membership confirmations

Purchase confirmations

Event reminders

---

# 18. MEDIA MANAGEMENT

Images uploaded once.

Stored in uploads.

Reusable.

Future support

Videos

Documents

PDFs

Downloads

---

# 19. AUTHENTICATION

Current

Admin Login

Protected Routes

JWT Authentication

Future

Role Based Access

Editor

Admin

Super Admin

---

# 20. DESIGN PRINCIPLES

Maintain Stronger Steps branding.

Green + Terracotta palette.

Minimal.

Premium.

Senior-friendly.

Large typography.

High accessibility.

Responsive.

Fast loading.

---

# 21. CLIENT BUSINESS RULES

Client is the verified administrator.

No hardcoded content unless absolutely necessary.

Every major content section should become editable from Admin.

Future modules should integrate naturally with existing CMS.

All new development should follow existing architecture.

---

# 22. FUTURE ROADMAP

Phase 2

Membership CMS

Programs CMS

Calendar

Payments

Recipes

Event Booking

Notifications

Phase 3

Orders

Checkout

Inventory

Coupons

Reports

Analytics

Attendance

Role Management

Phase 4

Mobile App

Community Features

Volunteer Management

Donations

CRM

Dashboards

Advanced Analytics

---

END OF CLIENT REQUIREMENTS SPECIFICATION