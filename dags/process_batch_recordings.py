"""
Airflow DAG for processing audio recordings.

This DAG watches for new metadata files created by the record command,
then orchestrates the complete processing pipeline:
1. Create Obsidian meeting note
2. Convert WAV to MP3
3. Update Obsidian with audio link
4. Transcribe audio with Speechmatics
5. Format transcript to markdown
6. Update Obsidian with transcript link
7. Upload transcript to Gemini knowledge base
8. Cleanup metadata file
"""

from datetime import datetime, timedelta
from pathlib import Path
import json
import os

from airflow import DAG
from airflow.providers.standard.operators.python import PythonOperator, ShortCircuitOperator
from airflow.providers.standard.operators.bash import BashOperator
from airflow.models import Variable

# Configuration
RECORDINGS_DIR = str(Path.home() / "Documents" / "recordings")
PACKAGES_DIR = str(Path.home() / "repositories" / "magik" / "packages")
OBSIDIAN_DIR = str(Path.home() / "Obsidian" / "magic")

# Default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}


def check_for_metadata(**context):
    """Check if there's a metadata file to process. Returns False to skip if none found."""
    metadata_files = list(Path(RECORDINGS_DIR).glob("*.meta.json"))

    if not metadata_files:
        print("No metadata files found. Skipping this run.")
        return False  # Short-circuit: skip all downstream tasks

    # Find the oldest unprocessed metadata file
    file_path = Path(min(metadata_files, key=lambda p: p.stat().st_mtime))

    with open(file_path, 'r') as f:
        metadata = json.load(f)

    # IMMEDIATELY rename file to .processing to prevent other runs from picking it up
    processing_path = file_path.with_suffix('.processing')
    file_path.rename(processing_path)
    print(f"Renamed {file_path} -> {processing_path} (claimed for processing)")

    # Push metadata to XCom for downstream tasks
    context['task_instance'].xcom_push(key='meeting_name', value=metadata['meeting_name'])
    context['task_instance'].xcom_push(key='language', value=metadata['language'])
    context['task_instance'].xcom_push(key='wav_path', value=metadata['wav_path'])
    context['task_instance'].xcom_push(key='metadata_path', value=str(processing_path))

    print(f"Found recording to process: {metadata['meeting_name']}")
    print(f"Language: {metadata['language']}")
    print(f"WAV path: {metadata['wav_path']}")
    print(f"Processing file: {processing_path}")

    return True  # Continue with processing


# Create the DAG
with DAG(
    'process_batch_recordings',
    default_args=default_args,
    description='Process audio recordings: convert, transcribe, and upload',
    schedule=timedelta(seconds=5),  # Run every 5 seconds to check for new files
    catchup=False,
    tags=['recording', 'transcription'],
) as dag:

    # Task 1: Check for metadata file and parse it (skips downstream if none found)
    check_metadata = ShortCircuitOperator(
        task_id='check_for_metadata',
        python_callable=check_for_metadata,
    )

    # Task 2: Create Obsidian meeting note
    create_meeting_note = BashOperator(
        task_id='create_meeting_note',
        bash_command=(
            f"bash {PACKAGES_DIR}/obsidian/scripts/createMeetingNote.sh "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}\" "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='language') }}\" "
        ),
        env={
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 3: Convert WAV to MP3
    convert_to_mp3 = BashOperator(
        task_id='convert_to_mp3',
        bash_command=f"bash {PACKAGES_DIR}/audio/scripts/convertToMp3.sh \"{{{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='wav_path') }}}}\" ",
        env={
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 4: Update Obsidian with audio link
    update_audio_link = BashOperator(
        task_id='update_audio_link',
        bash_command=(
            f"bash {PACKAGES_DIR}/obsidian/scripts/createMeetingNote.sh "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}\" "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='language') }}\" "
            "\"$RECORDINGS_DIR/{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}.mp3\" "
        ),
        env={
            'RECORDINGS_DIR': RECORDINGS_DIR,
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 5: Transcribe audio with Speechmatics
    transcribe_audio = BashOperator(
        task_id='transcribe_audio',
        bash_command=(
            f"bash {PACKAGES_DIR}/transcription/scripts/transcribeAudio.sh "
            "\"$RECORDINGS_DIR/{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}.mp3\" "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='language') }}\" "
        ),
        env={
            'RECORDINGS_DIR': RECORDINGS_DIR,
            'SPEECHMATICS_API_KEY': os.environ.get('SPEECHMATICS_API_KEY', ''),
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 6: Format transcript to markdown
    format_transcript = BashOperator(
        task_id='format_transcript',
        bash_command=(
            f"bash {PACKAGES_DIR}/transcription/scripts/formatTranscript.sh "
            "\"$RECORDINGS_DIR/{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}_transcript.json\" "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}\" "
        ),
        env={
            'RECORDINGS_DIR': RECORDINGS_DIR,
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 7: Update Obsidian with transcript link
    update_transcript_link = BashOperator(
        task_id='update_transcript_link',
        bash_command=(
            f"bash {PACKAGES_DIR}/obsidian/scripts/createMeetingNote.sh "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}\" "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='language') }}\" "
            "\"\" "  # audio_path (empty, already added)
            "\"$OBSIDIAN_DIR/Transcriptions/{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}.md\" "
        ),
        env={
            'OBSIDIAN_DIR': OBSIDIAN_DIR,
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 8: Upload transcript to Gemini knowledge base
    upload_to_gemini = BashOperator(
        task_id='upload_to_gemini',
        bash_command=(
            f"bash {PACKAGES_DIR}/gemini/scripts/uploadTranscript.sh "
            "\"$OBSIDIAN_DIR/Transcriptions/{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}.md\" "
            "\"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='meeting_name') }}\" "
        ),
        env={
            'OBSIDIAN_DIR': OBSIDIAN_DIR,
            'GOOGLE_API_KEY': os.environ.get('GOOGLE_API_KEY', ''),
            'PATH': os.environ.get('PATH', ''),
            'HOME': os.environ.get('HOME', ''),
        },
    )

    # Task 9: Cleanup metadata file
    cleanup_metadata = BashOperator(
        task_id='cleanup_metadata',
        bash_command="rm -f \"{{ task_instance.xcom_pull(task_ids='check_for_metadata', key='metadata_path') }}\" ",
        env={
            'PATH': os.environ.get('PATH', ''),
        },
    )

    # Define task dependencies (linear pipeline)
    check_metadata >> create_meeting_note >> convert_to_mp3 >> update_audio_link >> transcribe_audio >> format_transcript >> update_transcript_link >> upload_to_gemini >> cleanup_metadata
