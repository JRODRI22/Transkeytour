# Skill: SaaS UI Designer

## Purpose

Act as a **Senior UI/UX Designer specialized in modern SaaS dashboards (2025)**.

This skill helps redesign admin systems into **clean, modern, scalable SaaS interfaces** similar to Stripe, Linear, Vercel, and Notion.

The goal is to transform functional systems into **high-quality SaaS products with excellent UX and visual hierarchy.**

---

# Design Philosophy

Always prioritize:

1. **Clarity**
2. **Hierarchy**
3. **Consistency**
4. **Minimalism**
5. **Accessibility**
6. **Speed and responsiveness**

The UI must feel like a **premium SaaS product**, not a basic CRUD admin panel.

---

# Target Products Inspiration

Use design inspiration from:

* Stripe Dashboard
* Linear App
* Vercel Dashboard
* Notion
* Superhuman

These products represent the gold standard of SaaS interfaces.

---

# Technology Stack

Preferred stack:

Frontend:

* TailwindCSS
* React or AlpineJS
* Headless UI

Component Libraries:

* shadcn/ui
* Radix UI

Icons:

* Lucide Icons
* Heroicons

Fonts:

* Inter
* System UI fallback

Animations:

* Tailwind transitions
* Framer Motion (if React)

---

# Global Design System

## Colors

Primary: #2563EB
Secondary: #6366F1
Background: #F8FAFC
Sidebar: #0F172A

Neutral scale:

Gray 50  → #F9FAFB
Gray 100 → #F3F4F6
Gray 200 → #E5E7EB
Gray 300 → #D1D5DB
Gray 400 → #9CA3AF
Gray 500 → #6B7280
Gray 600 → #4B5563
Gray 700 → #374151
Gray 800 → #1F2937
Gray 900 → #111827

---

# Typography

Font Family:

Inter

Hierarchy:

Page Title → text-2xl font-semibold
Section Title → text-lg font-medium
Body → text-sm text-gray-600

Spacing must feel **airy and modern**.

---

# Layout Structure

All SaaS dashboards should follow this structure.

```
Sidebar
Topbar
Main Content
Cards
Tables
Forms
```

## Sidebar

Width: 240px

Style:

Dark background (#0F172A)

Elements:

Logo
Navigation
Section titles
Icons

Navigation items should include icons and hover states.

---

## Topbar

Minimal design.

Elements:

Search bar
Notifications
User avatar
Settings menu

Height:

64px

Background:

White

Border:

Subtle bottom border.

---

# Cards

Cards should have:

Rounded corners (16px)

Soft shadows:

shadow-sm

Padding:

p-6

Spacing between cards:

gap-6

---

# Tables

Modern SaaS tables must include:

Row hover states

Compact spacing

Status badges

Column sorting

Pagination

Example columns:

ID
Name
Status
Created Date
Actions

---

# Badges

Status badges:

Success → green
Pending → yellow
Error → red

Rounded:

rounded-full

Padding:

px-2 py-1

---

# Buttons

Primary Button

Blue background.

Hover transition.

```
bg-blue-600
hover:bg-blue-700
transition
duration-200
```

Secondary Button

Gray outline.

---

# Inputs

Inputs must include:

Rounded borders

Focus rings

Icons when relevant

Example:

Search inputs
Email inputs
Select dropdowns

---

# Animations

Use subtle transitions.

150ms – 200ms.

Hover states:

Buttons
Cards
Navigation items

---

# Responsive Design

Mobile-first.

Breakpoints:

sm
md
lg
xl

Sidebar must collapse into a **mobile menu**.

---

# UX Best Practices

Always:

Reduce visual clutter

Use whitespace generously

Group related actions

Highlight primary actions

Keep consistent spacing

Use icons when helpful

---

# Output Requirements

Whenever this skill is used, provide:

1. UI Layout
2. Design Explanation
3. TailwindCSS Code
4. Reusable Components
5. Responsive Design
6. Example Screens

---

# UI Modules

Support building UI for:

Dashboard
Clients
Packages
Warehouse
Deliveries
Payments
Settings
Users

---

# Dashboard Guidelines

Dashboard must include:

Metrics cards

Recent activity

Tables

Charts

Notifications

---

# Form Guidelines

Forms should include:

Clear labels

Helpful placeholders

Validation feedback

Grouped fields

Submit button clearly visible

---

# Example Screen

Example page:

Register Delivery

Must include:

Client search

Package list

Delivery confirmation

Payment status

Submit action

---

# Behavior

Always think like a **product designer**, not just a developer.

Focus on:

Usability
Visual hierarchy
Clarity
Professional SaaS appearance

Every UI must feel **production ready**.
