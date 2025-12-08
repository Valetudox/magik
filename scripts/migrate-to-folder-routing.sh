#!/usr/bin/env bash
# Script to migrate backend-decision actions to folder-based routing

set -euo pipefail

SERVICE_DIR="apps/backend-decision/src/actions/decisions"

echo "Migrating backend-decision to folder-based routing..."

# Create [id] base folder
mkdir -p "$SERVICE_DIR/[id]"

# Migrate simple [id] actions
mv "$SERVICE_DIR/get_id.action.ts" "$SERVICE_DIR/[id]/get.action.ts"
mv "$SERVICE_DIR/patch_id.action.ts" "$SERVICE_DIR/[id]/patch.action.ts"
mv "$SERVICE_DIR/delete_id.action.ts" "$SERVICE_DIR/[id]/delete.action.ts"

# Create and migrate [id]/push-to-confluence
mkdir -p "$SERVICE_DIR/[id]/push-to-confluence"
mv "$SERVICE_DIR/post_id_push-to-confluence.action.ts" "$SERVICE_DIR/[id]/push-to-confluence/post.action.ts"

# Create and migrate [id]/evaluations
mkdir -p "$SERVICE_DIR/[id]/evaluations"
mv "$SERVICE_DIR/patch_id_evaluations.action.ts" "$SERVICE_DIR/[id]/evaluations/patch.action.ts"

# Create and migrate [id]/evaluations/details
mkdir -p "$SERVICE_DIR/[id]/evaluations/details"
mv "$SERVICE_DIR/evaluations/patch_id_details.action.ts" "$SERVICE_DIR/[id]/evaluations/details/patch.action.ts"

# Create and migrate [id]/selected-option
mkdir -p "$SERVICE_DIR/[id]/selected-option"
mv "$SERVICE_DIR/patch_id_selected-option.action.ts" "$SERVICE_DIR/[id]/selected-option/patch.action.ts"

# Create and migrate [id]/options
mkdir -p "$SERVICE_DIR/[id]/options"
mv "$SERVICE_DIR/post_id_options.action.ts" "$SERVICE_DIR/[id]/options/post.action.ts"

# Create and migrate [id]/options/[optionId]
mkdir -p "$SERVICE_DIR/[id]/options/[optionId]"
mv "$SERVICE_DIR/options/patch_id_optionId.action.ts" "$SERVICE_DIR/[id]/options/[optionId]/patch.action.ts"
mv "$SERVICE_DIR/options/delete_id_optionId.action.ts" "$SERVICE_DIR/[id]/options/[optionId]/delete.action.ts"

# Create and migrate [id]/drivers
mkdir -p "$SERVICE_DIR/[id]/drivers"
mv "$SERVICE_DIR/post_id_drivers.action.ts" "$SERVICE_DIR/[id]/drivers/post.action.ts"

# Create and migrate [id]/drivers/[driverId]
mkdir -p "$SERVICE_DIR/[id]/drivers/[driverId]"
mv "$SERVICE_DIR/drivers/patch_id_driverId.action.ts" "$SERVICE_DIR/[id]/drivers/[driverId]/patch.action.ts"
mv "$SERVICE_DIR/drivers/delete_id_driverId.action.ts" "$SERVICE_DIR/[id]/drivers/[driverId]/delete.action.ts"

# Create and migrate [id]/components
mkdir -p "$SERVICE_DIR/[id]/components"
mv "$SERVICE_DIR/post_id_components.action.ts" "$SERVICE_DIR/[id]/components/post.action.ts"

# Create and migrate [id]/components/[componentId]
mkdir -p "$SERVICE_DIR/[id]/components/[componentId]"
mv "$SERVICE_DIR/components/patch_id_componentId.action.ts" "$SERVICE_DIR/[id]/components/[componentId]/patch.action.ts"
mv "$SERVICE_DIR/components/delete_id_componentId.action.ts" "$SERVICE_DIR/[id]/components/[componentId]/delete.action.ts"

# Create and migrate [id]/use-cases
mkdir -p "$SERVICE_DIR/[id]/use-cases"
mv "$SERVICE_DIR/post_id_use-cases.action.ts" "$SERVICE_DIR/[id]/use-cases/post.action.ts"

# Create and migrate [id]/use-cases/[useCaseId]
mkdir -p "$SERVICE_DIR/[id]/use-cases/[useCaseId]"
mv "$SERVICE_DIR/use-cases/patch_id_useCaseId.action.ts" "$SERVICE_DIR/[id]/use-cases/[useCaseId]/patch.action.ts"
mv "$SERVICE_DIR/use-cases/delete_id_useCaseId.action.ts" "$SERVICE_DIR/[id]/use-cases/[useCaseId]/delete.action.ts"

# Create and migrate [id]/agent
mkdir -p "$SERVICE_DIR/[id]/agent"
mv "$SERVICE_DIR/post_id_agent.action.ts" "$SERVICE_DIR/[id]/agent/post.action.ts"

# Remove empty old folders
rmdir "$SERVICE_DIR/evaluations" 2>/dev/null || true
rmdir "$SERVICE_DIR/options" 2>/dev/null || true
rmdir "$SERVICE_DIR/drivers" 2>/dev/null || true
rmdir "$SERVICE_DIR/components" 2>/dev/null || true
rmdir "$SERVICE_DIR/use-cases" 2>/dev/null || true

echo "✓ File migration complete!"
echo "Note: You still need to update import paths in the moved files and routes.ts"
