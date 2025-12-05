"""
Airflow DAG for daily deployment.

This DAG runs the deploy.sh script from MultiRegionAIzd repository
every day at 6am.
"""

from datetime import datetime, timedelta
import os

from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator

# Configuration
DEPLOY_SCRIPT = "/home/magic/repositories/MultiRegionAIzd/deploy.sh"
DEPLOY_DIR = "/home/magic/repositories/MultiRegionAIzd"

# Default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email': ['somodi.viktor@gmail.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}


# Create the DAG
with DAG(
    'deploy_multi_AI',
    default_args=default_args,
    description='Run daily deployment at 6am',
    schedule='0 6 * * *',  # Daily at 6am
    catchup=False,
    tags=['deployment'],
) as dag:

    # Task: Run deploy script
    run_deploy = BashOperator(
        task_id='run_deploy',
        bash_command=f"bash {DEPLOY_SCRIPT} ",
        cwd=DEPLOY_DIR,
        env={
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )
