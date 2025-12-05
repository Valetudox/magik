#!/usr/bin/env python3
"""
Segmentation Incidents Visualization

Reads segmentation incidents data and creates a stacked bar chart showing
the number of incidents per quarter from Q2 2024 to Q4 2025,
separated by impact level (H, M, L).
"""

import csv
import matplotlib.pyplot as plt
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import numpy as np

# Paths
REPO_ROOT = Path(__file__).parent.parent.parent.parent
CSV_PATH = REPO_ROOT / "documents" / "charts" / "segmentation-incidents.csv"
OUTPUT_PATH_TIMELINE = REPO_ROOT / "documents" / "charts" / "segmentation-incidents-timeline.png"
OUTPUT_PATH_PRIORITY = REPO_ROOT / "documents" / "charts" / "segmentation-incidents-priority.png"

def read_incidents():
    """Read incidents from CSV file."""
    incidents = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            incidents.append(row)
    return incidents

def get_max_impact(incident):
    """Get the maximum impact level from CL and SeSe impacts."""
    cl_impact = incident.get('CL impact', '-').strip()
    sese_impact = incident.get('SeSe impact', '-').strip()

    # Priority: H > M > L
    impacts = [cl_impact, sese_impact]
    if 'H' in impacts:
        return 'H'
    elif 'M' in impacts:
        return 'M'
    elif 'L' in impacts:
        return 'L'
    return None

def get_quarter(date):
    """Get quarter string from date (e.g., '2024-Q3')."""
    quarter = (date.month - 1) // 3 + 1
    return f"{date.year}-Q{quarter}"

def group_by_quarter_and_impact(incidents):
    """Group incidents by quarter and impact level."""
    # Structure: {quarter: {impact_level: count}}
    quarterly_impact_counts = defaultdict(lambda: {'H': 0, 'M': 0, 'L': 0})

    for incident in incidents:
        # Parse the timestamp
        timestamp = datetime.fromisoformat(incident['time'].replace('Z', '+00:00'))
        # Get quarter
        quarter = get_quarter(timestamp)

        # Get maximum impact
        max_impact = get_max_impact(incident)
        if max_impact:
            quarterly_impact_counts[quarter][max_impact] += 1

    return quarterly_impact_counts

def group_by_priority_and_impact(incidents):
    """Group incidents by priority and impact level."""
    # Structure: {priority: {impact_level: count}}
    priority_impact_counts = defaultdict(lambda: {'H': 0, 'M': 0, 'L': 0})

    for incident in incidents:
        priority = incident.get('Priority', '-').strip()
        max_impact = get_max_impact(incident)
        if max_impact and priority != '-':
            priority_impact_counts[priority][max_impact] += 1

    return priority_impact_counts

def create_timeline_chart(quarterly_impact_counts):
    """Create and save the timeline stacked bar chart."""
    # Generate all quarters from Q2 2024 to Q4 2025
    quarters = []
    for year in [2024, 2025]:
        start_q = 2 if year == 2024 else 1
        end_q = 4
        for q in range(start_q, end_q + 1):
            quarters.append(f"{year}-Q{q}")

    high_counts = []
    medium_counts = []
    low_counts = []

    for quarter in quarters:
        counts = quarterly_impact_counts.get(quarter, {'H': 0, 'M': 0, 'L': 0})
        high_counts.append(counts['H'])
        medium_counts.append(counts['M'])
        low_counts.append(counts['L'])

    # Create the plot
    fig, ax = plt.subplots(figsize=(14, 7))

    # X positions for bars
    x = np.arange(len(quarters))
    width = 0.6

    # Create stacked bar chart
    bar1 = ax.bar(x, high_counts, width, label='High', color='#ef4444', alpha=0.9)
    bar2 = ax.bar(x, medium_counts, width, bottom=high_counts, label='Medium', color='#f59e0b', alpha=0.9)

    # Calculate bottom for low bars (high + medium)
    low_bottom = [h + m for h, m in zip(high_counts, medium_counts)]
    bar3 = ax.bar(x, low_counts, width, bottom=low_bottom, label='Low', color='#22c55e', alpha=0.9)

    # Customize the plot
    ax.set_xlabel('Quarter', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Incidents', fontsize=12, fontweight='bold')
    ax.set_title('Segmentation Service Incidents by Impact Level', fontsize=16, fontweight='bold', pad=20)

    # Set x-axis ticks and labels
    ax.set_xticks(x)
    ax.set_xticklabels(quarters, rotation=0, ha='center')

    # Set y-axis to show only integers and add padding at top
    max_total = max([h + m + l for h, m, l in zip(high_counts, medium_counts, low_counts)])
    ax.set_ylim(0, max_total + 1)  # Add padding of 1 unit at top
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

    # Add grid
    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add legend with detailed descriptions
    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor='#ef4444', alpha=0.9, label='H – High impact: Without this component, the incident most likely would not occur.'),
        Patch(facecolor='#f59e0b', alpha=0.9, label='M – Medium impact: Without this component, the incident would likely have less impact.'),
        Patch(facecolor='#22c55e', alpha=0.9, label='L – Low impact: Without this component, the incident would probably have a slightly smaller impact.')
    ]
    ax.legend(handles=legend_elements, loc='upper left', fontsize=8, framealpha=0.95,
              bbox_to_anchor=(0.01, 0.99))

    # Add total count labels on top of bars
    for i, (h, m, l) in enumerate(zip(high_counts, medium_counts, low_counts)):
        total = h + m + l
        if total > 0:
            ax.text(i, total + 0.15, str(total), ha='center', va='bottom',
                   fontsize=10, fontweight='bold')

    # Tight layout
    plt.tight_layout()

    # Save the chart
    plt.savefig(OUTPUT_PATH_TIMELINE, dpi=300, bbox_inches='tight')
    print(f"✓ Timeline chart saved to: {OUTPUT_PATH_TIMELINE}")

    # Show statistics
    total_high = sum(high_counts)
    total_medium = sum(medium_counts)
    total_low = sum(low_counts)
    total_incidents = total_high + total_medium + total_low
    quarters_with_incidents = sum(1 for h, m, l in zip(high_counts, medium_counts, low_counts) if h + m + l > 0)

    print(f"\n📊 Statistics:")
    print(f"   Total incidents: {total_incidents}")
    print(f"   High impact: {total_high} ({total_high/total_incidents*100:.1f}%)")
    print(f"   Medium impact: {total_medium} ({total_medium/total_incidents*100:.1f}%)")
    print(f"   Low impact: {total_low} ({total_low/total_incidents*100:.1f}%)")
    print(f"   Quarters with incidents: {quarters_with_incidents}/{len(quarters)}")

    # Find peak quarter
    totals = [h + m + l for h, m, l in zip(high_counts, medium_counts, low_counts)]
    if max(totals) > 0:
        peak_idx = totals.index(max(totals))
        print(f"   Peak quarter: {quarters[peak_idx]} ({max(totals)} incidents)")

def create_priority_chart(priority_impact_counts):
    """Create and save the priority-based stacked bar chart."""
    # Sort priorities (P1, P2, P3, etc.)
    priorities = sorted(priority_impact_counts.keys())

    high_counts = []
    medium_counts = []
    low_counts = []

    for priority in priorities:
        counts = priority_impact_counts.get(priority, {'H': 0, 'M': 0, 'L': 0})
        high_counts.append(counts['H'])
        medium_counts.append(counts['M'])
        low_counts.append(counts['L'])

    # Create the plot
    fig, ax = plt.subplots(figsize=(10, 7))

    # X positions for bars
    x = np.arange(len(priorities))
    width = 0.5

    # Create stacked bar chart
    bar1 = ax.bar(x, high_counts, width, label='High', color='#ef4444', alpha=0.9)
    bar2 = ax.bar(x, medium_counts, width, bottom=high_counts, label='Medium', color='#f59e0b', alpha=0.9)

    # Calculate bottom for low bars (high + medium)
    low_bottom = [h + m for h, m in zip(high_counts, medium_counts)]
    bar3 = ax.bar(x, low_counts, width, bottom=low_bottom, label='Low', color='#22c55e', alpha=0.9)

    # Customize the plot
    ax.set_xlabel('Priority', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Incidents', fontsize=12, fontweight='bold')
    ax.set_title('Segmentation Service Incidents by Priority', fontsize=16, fontweight='bold', pad=20)

    # Set x-axis ticks and labels
    ax.set_xticks(x)
    ax.set_xticklabels(priorities, rotation=0, ha='center')

    # Set y-axis to show only integers and add padding at top
    max_total = max([h + m + l for h, m, l in zip(high_counts, medium_counts, low_counts)])
    ax.set_ylim(0, max_total + 1)  # Add padding of 1 unit at top
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

    # Add grid
    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add simple legend
    ax.legend(loc='upper right', fontsize=10, framealpha=0.9)

    # Add total count labels on top of bars
    for i, (h, m, l) in enumerate(zip(high_counts, medium_counts, low_counts)):
        total = h + m + l
        if total > 0:
            ax.text(i, total + 0.15, str(total), ha='center', va='bottom',
                   fontsize=10, fontweight='bold')

    # Tight layout
    plt.tight_layout()

    # Save the chart
    plt.savefig(OUTPUT_PATH_PRIORITY, dpi=300, bbox_inches='tight')
    print(f"✓ Priority chart saved to: {OUTPUT_PATH_PRIORITY}")

    # Show statistics
    total_high = sum(high_counts)
    total_medium = sum(medium_counts)
    total_low = sum(low_counts)
    total_incidents = total_high + total_medium + total_low

    print(f"\n📊 Priority Statistics:")
    print(f"   Total incidents: {total_incidents}")
    for i, priority in enumerate(priorities):
        total = high_counts[i] + medium_counts[i] + low_counts[i]
        print(f"   {priority}: {total} incidents (H:{high_counts[i]}, M:{medium_counts[i]}, L:{low_counts[i]})")

def main():
    print("📊 Generating Segmentation Incidents Charts...\n")

    # Read data
    incidents = read_incidents()
    print(f"✓ Read {len(incidents)} incidents from CSV")

    # Group by quarter and impact
    quarterly_impact_counts = group_by_quarter_and_impact(incidents)
    print(f"✓ Grouped incidents by quarter and impact level")

    # Group by priority and impact
    priority_impact_counts = group_by_priority_and_impact(incidents)
    print(f"✓ Grouped incidents by priority and impact level\n")

    # Create charts
    print("📈 Creating timeline chart...")
    create_timeline_chart(quarterly_impact_counts)

    print("\n📊 Creating priority chart...")
    create_priority_chart(priority_impact_counts)

if __name__ == '__main__':
    main()
