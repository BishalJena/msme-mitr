#!/bin/bash

# Apply RLS Fix Migration
# This script applies the JWT-based RLS policies to fix the timeout issue

echo "🔧 Applying RLS fix migration..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Apply the migration
echo "📝 Applying migration: 20250118_fix_admin_rls_with_jwt.sql"
supabase db push

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "🔄 Please log out and log back in for the changes to take effect."
echo "   This ensures your JWT token is refreshed with the correct claims."
