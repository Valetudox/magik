#!/usr/bin/env python3
"""
BMW Work Visualization

Reads BMW work data and creates multiple visualizations:
1. Estimation by Domain
2. Estimation by Domain stacked by Expertise
3. Estimation by Deliverable
"""

import csv
import matplotlib.pyplot as plt
from pathlib import Path
from collections import defaultdict
import numpy as np

# Paths
REPO_ROOT = Path(__file__).parent.parent.parent.parent
CSV_PATH = REPO_ROOT / "documents" / "charts" / "bmw-work.csv"
OUTPUT_PATH_DOMAIN = REPO_ROOT / "documents" / "charts" / "bmw-work-by-domain.png"
OUTPUT_PATH_DOMAIN_EXPERTISE = REPO_ROOT / "documents" / "charts" / "bmw-work-by-domain-expertise.png"
OUTPUT_PATH_DELIVERABLE = REPO_ROOT / "documents" / "charts" / "bmw-work-by-deliverable.png"
OUTPUT_PATH_DELIVERABLE_DOMAIN = REPO_ROOT / "documents" / "charts" / "bmw-work-by-deliverable-domain.png"

# Expertise colors and descriptions
EXPERTISE_CONFIG = {
    'HARD': {'color': '#ef4444', 'label': 'HARD – Only Domain experts'},
    'MEDIUM': {'color': '#f59e0b', 'label': 'MEDIUM – One domain expert with a team'},
    'LIGHT': {'color': '#22c55e', 'label': 'LIGHT – Sync needed'},
    'UNKNOWN': {'color': '#6b7280', 'label': 'UNKNOWN – Unknown'}
}

# Order for stacking (bottom to top)
EXPERTISE_ORDER = ['HARD', 'MEDIUM', 'LIGHT', 'UNKNOWN']

# Domain colors
DOMAIN_COLORS = {
    'Editor': '#3b82f6',
    'BehaviorTracking': '#8b5cf6',
    'EmailCore': '#ef4444',
    'Personalization': '#f59e0b',
    'Reporting': '#22c55e',
}


def read_work_data():
    """Read work data from CSV file."""
    work_items = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['Estimation'] = int(row['Estimation'])
            work_items.append(row)
    return work_items


def group_by_domain(work_items):
    """Group estimation by domain."""
    domain_totals = defaultdict(int)
    for item in work_items:
        domain_totals[item['Domain']] += item['Estimation']
    return dict(sorted(domain_totals.items(), key=lambda x: x[1], reverse=True))


def group_by_domain_and_expertise(work_items):
    """Group estimation by domain and expertise."""
    # Structure: {domain: {expertise: total}}
    domain_expertise = defaultdict(lambda: defaultdict(int))
    for item in work_items:
        domain_expertise[item['Domain']][item['Expertise']] += item['Estimation']
    return domain_expertise


def group_by_deliverable(work_items):
    """Group estimation by deliverable."""
    deliverable_totals = defaultdict(int)
    for item in work_items:
        deliverable_totals[item['Deliverable']] += item['Estimation']
    return dict(sorted(deliverable_totals.items(), key=lambda x: x[1], reverse=True))


def group_by_deliverable_and_domain(work_items):
    """Group estimation by deliverable and domain."""
    # Structure: {deliverable: {domain: total}}
    deliverable_domain = defaultdict(lambda: defaultdict(int))
    for item in work_items:
        deliverable_domain[item['Deliverable']][item['Domain']] += item['Estimation']
    return deliverable_domain


def create_domain_chart(domain_totals):
    """Create and save the estimation by domain chart."""
    domains = list(domain_totals.keys())
    estimations = list(domain_totals.values())

    fig, ax = plt.subplots(figsize=(12, 7))

    x = np.arange(len(domains))
    width = 0.6

    bars = ax.bar(x, estimations, width, color='#3b82f6', alpha=0.9)

    ax.set_xlabel('Domain', fontsize=12, fontweight='bold')
    ax.set_ylabel('Estimation (team weeks)', fontsize=12, fontweight='bold')
    ax.set_title('BMW Work: Estimation by Domain', fontsize=16, fontweight='bold', pad=20)

    ax.set_xticks(x)
    ax.set_xticklabels(domains, rotation=45, ha='right')

    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add value labels on top of bars
    for i, v in enumerate(estimations):
        ax.text(i, v + 0.3, str(v), ha='center', va='bottom', fontsize=10, fontweight='bold')

    max_val = max(estimations)
    ax.set_ylim(0, max_val + max_val * 0.1)

    plt.tight_layout()
    plt.savefig(OUTPUT_PATH_DOMAIN, dpi=300, bbox_inches='tight')
    print(f"✓ Domain chart saved to: {OUTPUT_PATH_DOMAIN}")

    # Statistics
    total = sum(estimations)
    print(f"\n📊 Domain Statistics:")
    print(f"   Total estimation: {total} team weeks")
    for domain, est in domain_totals.items():
        print(f"   {domain}: {est} team weeks ({est/total*100:.1f}%)")


def create_domain_expertise_chart(domain_expertise):
    """Create and save the estimation by domain stacked by expertise chart."""
    # Sort domains by total estimation
    domain_totals = {
        domain: sum(expertise.values())
        for domain, expertise in domain_expertise.items()
    }
    domains = sorted(domain_totals.keys(), key=lambda x: domain_totals[x], reverse=True)

    fig, ax = plt.subplots(figsize=(12, 7))

    x = np.arange(len(domains))
    width = 0.6

    # Create stacked bars
    bottom = np.zeros(len(domains))
    bars_dict = {}

    for expertise in EXPERTISE_ORDER:
        values = [domain_expertise[domain].get(expertise, 0) for domain in domains]
        config = EXPERTISE_CONFIG[expertise]
        bars_dict[expertise] = ax.bar(x, values, width, bottom=bottom,
                                       label=config['label'], color=config['color'], alpha=0.9)
        bottom += np.array(values)

    ax.set_xlabel('Domain', fontsize=12, fontweight='bold')
    ax.set_ylabel('Estimation (team weeks)', fontsize=12, fontweight='bold')
    ax.set_title('BMW Work: Estimation by Domain (Stacked by Expertise)', fontsize=16, fontweight='bold', pad=20)

    ax.set_xticks(x)
    ax.set_xticklabels(domains, rotation=45, ha='right')

    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add legend
    ax.legend(loc='upper right', fontsize=9, framealpha=0.95)

    # Add total labels on top of bars
    totals = [domain_totals[domain] for domain in domains]
    for i, total in enumerate(totals):
        ax.text(i, total + 0.3, str(total), ha='center', va='bottom', fontsize=10, fontweight='bold')

    max_val = max(totals)
    ax.set_ylim(0, max_val + max_val * 0.1)

    plt.tight_layout()
    plt.savefig(OUTPUT_PATH_DOMAIN_EXPERTISE, dpi=300, bbox_inches='tight')
    print(f"✓ Domain/Expertise chart saved to: {OUTPUT_PATH_DOMAIN_EXPERTISE}")

    # Statistics
    print(f"\n📊 Domain/Expertise Statistics:")
    total = sum(totals)
    print(f"   Total estimation: {total} team weeks")
    for expertise in EXPERTISE_ORDER:
        exp_total = sum(domain_expertise[d].get(expertise, 0) for d in domains)
        if exp_total > 0:
            print(f"   {expertise}: {exp_total} team weeks ({exp_total/total*100:.1f}%)")


def create_deliverable_chart(deliverable_totals):
    """Create and save the estimation by deliverable chart."""
    deliverables = list(deliverable_totals.keys())
    estimations = list(deliverable_totals.values())

    fig, ax = plt.subplots(figsize=(14, 7))

    x = np.arange(len(deliverables))
    width = 0.6

    bars = ax.bar(x, estimations, width, color='#8b5cf6', alpha=0.9)

    ax.set_xlabel('Deliverable', fontsize=12, fontweight='bold')
    ax.set_ylabel('Estimation (team weeks)', fontsize=12, fontweight='bold')
    ax.set_title('BMW Work: Estimation by Deliverable', fontsize=16, fontweight='bold', pad=20)

    ax.set_xticks(x)
    ax.set_xticklabels(deliverables, rotation=45, ha='right')

    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add value labels on top of bars
    for i, v in enumerate(estimations):
        ax.text(i, v + 0.3, str(v), ha='center', va='bottom', fontsize=10, fontweight='bold')

    max_val = max(estimations)
    ax.set_ylim(0, max_val + max_val * 0.1)

    plt.tight_layout()
    plt.savefig(OUTPUT_PATH_DELIVERABLE, dpi=300, bbox_inches='tight')
    print(f"✓ Deliverable chart saved to: {OUTPUT_PATH_DELIVERABLE}")

    # Statistics
    total = sum(estimations)
    print(f"\n📊 Deliverable Statistics:")
    print(f"   Total estimation: {total} team weeks")
    for deliverable, est in deliverable_totals.items():
        print(f"   {deliverable}: {est} team weeks ({est/total*100:.1f}%)")


def create_deliverable_domain_chart(deliverable_domain):
    """Create and save the estimation by deliverable stacked by domain chart."""
    # Sort deliverables by total estimation
    deliverable_totals = {
        deliverable: sum(domains.values())
        for deliverable, domains in deliverable_domain.items()
    }
    deliverables = sorted(deliverable_totals.keys(), key=lambda x: deliverable_totals[x], reverse=True)

    # Get all unique domains
    all_domains = set()
    for domains in deliverable_domain.values():
        all_domains.update(domains.keys())
    # Sort domains by total contribution (descending)
    domain_totals = defaultdict(int)
    for deliverable, domains in deliverable_domain.items():
        for domain, est in domains.items():
            domain_totals[domain] += est
    domain_order = sorted(all_domains, key=lambda x: domain_totals[x], reverse=True)

    fig, ax = plt.subplots(figsize=(14, 7))

    x = np.arange(len(deliverables))
    width = 0.6

    # Create stacked bars
    bottom = np.zeros(len(deliverables))

    for domain in domain_order:
        values = [deliverable_domain[deliverable].get(domain, 0) for deliverable in deliverables]
        color = DOMAIN_COLORS.get(domain, '#6b7280')
        ax.bar(x, values, width, bottom=bottom, label=domain, color=color, alpha=0.9)
        bottom += np.array(values)

    ax.set_xlabel('Deliverable', fontsize=12, fontweight='bold')
    ax.set_ylabel('Estimation (team weeks)', fontsize=12, fontweight='bold')
    ax.set_title('BMW Work: Estimation by Deliverable (Stacked by Domain)', fontsize=16, fontweight='bold', pad=20)

    ax.set_xticks(x)
    ax.set_xticklabels(deliverables, rotation=45, ha='right')

    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add legend
    ax.legend(loc='upper right', fontsize=9, framealpha=0.95)

    # Add total labels on top of bars
    totals = [deliverable_totals[deliverable] for deliverable in deliverables]
    for i, total in enumerate(totals):
        ax.text(i, total + 0.3, str(total), ha='center', va='bottom', fontsize=10, fontweight='bold')

    max_val = max(totals)
    ax.set_ylim(0, max_val + max_val * 0.1)

    plt.tight_layout()
    plt.savefig(OUTPUT_PATH_DELIVERABLE_DOMAIN, dpi=300, bbox_inches='tight')
    print(f"✓ Deliverable/Domain chart saved to: {OUTPUT_PATH_DELIVERABLE_DOMAIN}")

    # Statistics
    print(f"\n📊 Deliverable/Domain Statistics:")
    total = sum(totals)
    print(f"   Total estimation: {total} team weeks")
    for domain in domain_order:
        dom_total = domain_totals[domain]
        print(f"   {domain}: {dom_total} team weeks ({dom_total/total*100:.1f}%)")


def main():
    print("📊 Generating BMW Work Charts...\n")

    # Read data
    work_items = read_work_data()
    print(f"✓ Read {len(work_items)} work items from CSV")

    # Group data
    domain_totals = group_by_domain(work_items)
    domain_expertise = group_by_domain_and_expertise(work_items)
    deliverable_totals = group_by_deliverable(work_items)
    deliverable_domain = group_by_deliverable_and_domain(work_items)

    print(f"✓ Grouped data by domain, expertise, and deliverable\n")

    # Create charts
    print("📈 Creating domain chart...")
    create_domain_chart(domain_totals)

    print("\n📊 Creating domain/expertise stacked chart...")
    create_domain_expertise_chart(domain_expertise)

    print("\n📊 Creating deliverable chart...")
    create_deliverable_chart(deliverable_totals)

    print("\n📊 Creating deliverable/domain stacked chart...")
    create_deliverable_domain_chart(deliverable_domain)

    print("\n✅ All charts generated successfully!")


if __name__ == '__main__':
    main()
