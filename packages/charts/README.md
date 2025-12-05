# @magik/charts

Data visualization and chart generation package.

## Scripts

### Segmentation Incidents Timeline

Generates a line chart showing the number of segmentation incidents per month.

**Usage:**

```bash
# From the charts package directory
npm run segmentation-incidents

# Or directly with Python
python3 scripts/segmentation-incidents.py
```

**Requirements:**

```bash
# Install Python dependencies with uv
uv sync
```

**Output:**

- Chart saved to: `documents/charts/segmentation-incidents-timeline.png`
- Shows monthly incident counts from June 2024 to November 2025
- Includes statistics: total incidents, peak month, average per month

**Features:**

- Line chart with markers for each month
- Filled area under the line for better visibility
- Data labels showing count on each point
- Grid for easier reading
- Statistics output to console
